package com.booklens.service;

import com.booklens.books.BookApiService;
import com.booklens.dto.book.BookDto;
import com.booklens.entity.User;
import com.booklens.entity.UserRecommendation;
import com.booklens.repository.BookLogRepository;
import com.booklens.repository.UserRecommendationRepository;
import com.booklens.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * RecommendationService
 *
 * Manages a persistent, ordered recommendation pool per user.
 *
 * Pool behaviour (Netflix-style):
 *   - Pool holds at most POOL_MAX (15) items.
 *   - On every new signal (log / rating), fresh candidates are computed
 *     from the NEW seed (the book just logged/rated) only.
 *   - Those fresh items are injected at position 0..N-1 (front of list).
 *   - Existing items are shifted down by N positions.
 *   - Anything that falls beyond POOL_MAX is dropped.
 *   - If a fresh candidate is already in the pool, it is moved to the front
 *     (position updated) rather than duplicated.
 *
 * Collaborative filtering:
 *   - When seeding the pool, also checks what books are highly rated by
 *     the users this person follows.
 *   - Injects those as "Loved by @username" recommendations.
 *
 * On first call (empty pool), seeds all highly-rated books to fill the pool.
 *
 * Reading the pool:
 *   - Returns items ordered by position (0 = freshest).
 *   - Does NOT recompute on read — reads are pure DB lookups.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendationService {

    private final UserRecommendationRepository recRepo;
    private final BookLogRepository            bookLogRepo;
    private final BookApiService               bookApiService;
    private final UserRepository               userRepository;

    // ── Public API ────────────────────────────────────────────────────────

    /**
     * Returns the current recommendation pool for a user, ordered by position.
     * If the pool is empty and the user has rated books, seeds it first.
     */
    @Transactional
    public List<Map<String, Object>> getRecommendations(Long userId) {
        List<UserRecommendation> pool = recRepo.findByUserIdOrderByPositionAsc(userId);

        // Bootstrap: pool is empty but user has signals — seed from all rated books
        if (pool.isEmpty()) {
            List<String> seeds = bookLogRepo.findHighlyRatedExternalBookIdsByUserId(userId);
            if (seeds.isEmpty()) seeds = bookLogRepo.findAnyRatedExternalBookIdsByUserId(userId);
            if (seeds.isEmpty()) return List.of();

            // Seed pool from up to 3 highly-rated books (content-based)
            for (String seedId : seeds.stream().limit(3).collect(Collectors.toList())) {
                injectCandidatesFromSeed(userId, seedId, 5);
            }

            // Also seed from collaborative filtering (what followed users love)
            injectCollaborativeCandidates(userId, 5);

            pool = recRepo.findByUserIdOrderByPositionAsc(userId);
        }

        return pool.stream().map(this::toMap).collect(Collectors.toList());
    }

    /**
     * Called after a new book is logged or rated.
     * Injects fresh recommendations derived from that specific book,
     * pushing existing entries down. Old ones stay but move toward the back.
     *
     * @param userId         the user who acted
     * @param triggerBookId  the book that was just logged / rated
     */
    @Transactional
    public void onNewSignal(Long userId, String triggerBookId) {
        List<String> allLogged = bookLogRepo.findExternalBookIdsByUserId(userId);
        if (allLogged.isEmpty()) return;

        try {
            injectCandidatesFromSeed(userId, triggerBookId, 3);
            // Also inject a collaborative pick when user rates something
            injectCollaborativeCandidates(userId, 2);
        } catch (Exception e) {
            log.warn("Could not update recommendations for user {} from seed {}: {}",
                    userId, triggerBookId, e.getMessage());
        }
    }

    /**
     * Resets the pool entirely (e.g. on account actions). Rarely needed.
     */
    @Transactional
    public void clearPool(Long userId) {
        recRepo.deleteAllByUserId(userId);
    }

    // ── Core merge logic ──────────────────────────────────────────────────

    /**
     * Fetches candidate books from the given seed, filters out already-logged
     * books, and injects up to `maxNew` of them at the front of the pool.
     */
    private void injectCandidatesFromSeed(Long userId, String seedBookId, int maxNew) {
        List<String> allLogged  = bookLogRepo.findExternalBookIdsByUserId(userId);
        Set<String>  inPool     = recRepo.findExternalBookIdsByUserId(userId);

        BookDto seed;
        try {
            seed = bookApiService.getBookDetail(seedBookId);
        } catch (Exception e) {
            log.debug("Could not fetch seed book {}: {}", seedBookId, e.getMessage());
            return;
        }

        String seedTitle = seed.getTitle() != null ? seed.getTitle() : "a book you loved";
        List<BookDto> candidates = new ArrayList<>();

        // Search by primary genre
        if (seed.getGenres() != null && !seed.getGenres().isEmpty()) {
            candidates.addAll(searchCandidates(seed.getGenres().get(0), allLogged, 8));
        }
        // Search by author
        if (candidates.size() < maxNew && seed.getAuthor() != null
                && !seed.getAuthor().isBlank() && !seed.getAuthor().equals("Unknown Author")) {
            candidates.addAll(searchCandidates(seed.getAuthor(), allLogged, 5));
        }
        // Search by secondary genre for diversity
        if (candidates.size() < maxNew && seed.getGenres() != null && seed.getGenres().size() > 1) {
            candidates.addAll(searchCandidates(seed.getGenres().get(1), allLogged, 5));
        }

        // Deduplicate candidates themselves
        Map<String, BookDto> deduped = new LinkedHashMap<>();
        for (BookDto c : candidates) {
            if (c.getExternalId() != null && !deduped.containsKey(c.getExternalId())) {
                deduped.put(c.getExternalId(), c);
            }
        }

        // Take only the freshest maxNew items
        List<BookDto> toInject = deduped.values().stream()
                .limit(maxNew)
                .collect(Collectors.toList());

        if (toInject.isEmpty()) return;

        int newCount = toInject.size();

        // 1. Remove any of these books that are already in the pool
        //    (they'll be re-inserted at position 0)
        for (BookDto b : toInject) {
            if (inPool.contains(b.getExternalId())) {
                recRepo.deleteByUserIdAndBookId(userId, b.getExternalId());
            }
        }

        // 2. Shift everything currently in the pool down by newCount positions
        recRepo.shiftPositions(userId, newCount);

        // 3. Insert new items at positions 0..newCount-1
        String reason = "Similar to \u201c" + seedTitle + "\u201d";
        for (int i = 0; i < toInject.size(); i++) {
            BookDto b = toInject.get(i);
            UserRecommendation rec = UserRecommendation.builder()
                    .userId(userId)
                    .externalBookId(b.getExternalId())
                    .position(i)
                    .reason(buildReason(seed, b, reason))
                    .title(b.getTitle()         != null ? b.getTitle()         : "")
                    .author(b.getAuthor()        != null ? b.getAuthor()        : "")
                    .coverUrl(b.getCoverUrl()    != null ? b.getCoverUrl()      : "")
                    .coverUrlSmall(b.getCoverUrlSmall() != null ? b.getCoverUrlSmall() : "")
                    .averageRating(b.getAverageRating())
                    .ratingsCount(b.getRatingsCount())
                    .build();
            recRepo.save(rec);
        }

        // 4. Trim anything beyond POOL_MAX
        recRepo.deleteOverflow(userId, UserRecommendation.POOL_MAX);
    }

    // ── Collaborative filtering ──────────────────────────────────────────

    /**
     * Looks at what books the people this user follows have rated highly,
     * and injects the best candidates as collaborative recommendations.
     *
     * Reason: "Loved by @username"
     */
    private void injectCollaborativeCandidates(Long userId, int maxNew) {
        try {
            // Get who this user follows
            List<User> following = userRepository.findFollowingByUserId(userId);
            if (following.isEmpty()) return;

            List<String> allLogged = bookLogRepo.findExternalBookIdsByUserId(userId);
            Set<String>  inPool    = recRepo.findExternalBookIdsByUserId(userId);

            // Collect highly-rated books from followed users, excluding user's own logged books
            Map<String, String> bookToRecommender = new LinkedHashMap<>(); // bookId -> recommender username
            for (User followedUser : following) {
                List<String> theirHighlyRated = bookLogRepo.findHighlyRatedExternalBookIdsByUserId(followedUser.getId());
                for (String bookId : theirHighlyRated) {
                    if (!allLogged.contains(bookId) && !inPool.contains(bookId)
                            && !bookToRecommender.containsKey(bookId)) {
                        bookToRecommender.put(bookId, followedUser.getUsername());
                        if (bookToRecommender.size() >= maxNew * 3) break; // gather enough candidates
                    }
                }
                if (bookToRecommender.size() >= maxNew * 3) break;
            }

            if (bookToRecommender.isEmpty()) return;

            // Fetch book details and inject
            List<Map.Entry<String, String>> entries = bookToRecommender.entrySet().stream()
                    .limit(maxNew)
                    .collect(Collectors.toList());

            List<BookDto> toInject = new ArrayList<>();
            List<String> reasons = new ArrayList<>();
            for (Map.Entry<String, String> entry : entries) {
                try {
                    BookDto dto = bookApiService.getBookDetail(entry.getKey());
                    if (dto != null && dto.getExternalId() != null) {
                        toInject.add(dto);
                        reasons.add("Loved by @" + entry.getValue());
                    }
                } catch (Exception e) {
                    log.debug("Could not fetch collaborative candidate {}: {}", entry.getKey(), e.getMessage());
                }
            }

            if (toInject.isEmpty()) return;

            int newCount = toInject.size();

            // Shift existing pool down
            recRepo.shiftPositions(userId, newCount);

            // Insert collaborative picks at front
            for (int i = 0; i < toInject.size(); i++) {
                BookDto b = toInject.get(i);
                UserRecommendation rec = UserRecommendation.builder()
                        .userId(userId)
                        .externalBookId(b.getExternalId())
                        .position(i)
                        .reason(reasons.get(i))
                        .title(b.getTitle()         != null ? b.getTitle()         : "")
                        .author(b.getAuthor()        != null ? b.getAuthor()        : "")
                        .coverUrl(b.getCoverUrl()    != null ? b.getCoverUrl()      : "")
                        .coverUrlSmall(b.getCoverUrlSmall() != null ? b.getCoverUrlSmall() : "")
                        .averageRating(b.getAverageRating())
                        .ratingsCount(b.getRatingsCount())
                        .build();
                recRepo.save(rec);
            }

            // Trim overflow
            recRepo.deleteOverflow(userId, UserRecommendation.POOL_MAX);

        } catch (Exception e) {
            log.warn("Collaborative recommendation failed for user {}: {}", userId, e.getMessage());
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private String buildReason(BookDto seed, BookDto candidate, String defaultReason) {
        // If same author → "More by X"
        if (seed.getAuthor() != null && candidate.getAuthor() != null
                && seed.getAuthor().equalsIgnoreCase(candidate.getAuthor())) {
            return "More by " + seed.getAuthor();
        }
        return defaultReason;
    }

    private List<BookDto> searchCandidates(String query, List<String> exclude, int limit) {
        try {
            return bookApiService.search(query, 0, 15).getBooks().stream()
                    .filter(b -> b.getExternalId() != null && !exclude.contains(b.getExternalId()))
                    .limit(limit)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.debug("Candidate search failed for query '{}': {}", query, e.getMessage());
            return List.of();
        }
    }

    private Map<String, Object> toMap(UserRecommendation r) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("externalId",    r.getExternalBookId());
        m.put("title",         r.getTitle()         != null ? r.getTitle()         : "");
        m.put("author",        r.getAuthor()         != null ? r.getAuthor()        : "");
        m.put("coverUrl",      r.getCoverUrl()       != null ? r.getCoverUrl()      : "");
        m.put("coverUrlSmall", r.getCoverUrlSmall()  != null ? r.getCoverUrlSmall() : "");
        m.put("averageRating", r.getAverageRating()  != null ? r.getAverageRating() : 0.0);
        m.put("ratingsCount",  r.getRatingsCount()   != null ? r.getRatingsCount()  : 0);
        m.put("reason",        r.getReason()         != null ? r.getReason()        : "");
        return m;
    }
}