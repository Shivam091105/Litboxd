package com.booklens.books;

import com.booklens.dto.book.BookDto;
import com.booklens.dto.book.BookSearchResponse;
import com.booklens.entity.BookLog;
import com.booklens.exception.BookLensException;
import com.booklens.repository.BookLogRepository;
import com.booklens.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * BookApiService
 *
 * Orchestration layer between the Open Library client and the REST controllers.
 *
 * Responsibilities:
 *   1. Cache API responses (Redis) so we don't hammer Open Library
 *   2. Enrich BookDto with our own DB stats (ratings, review counts, log counts)
 *   3. Optionally inject the current user's status/rating for a book
 *
 * This is the "clean architecture" boundary — controllers never touch
 * OpenLibraryClient directly, and OpenLibraryClient never touches our DB.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BookApiService {

    private final OpenLibraryClient  openLibraryClient;
    private final BookLogRepository  bookLogRepository;
    private final ReviewRepository   reviewRepository;

    // ── Search ─────────────────────────────────────────────────────────────

    /**
     * Search for books. Results are cached by (query, page, size).
     * Cache TTL: 10 minutes (configured in CacheConfig).
     */
    @Cacheable(value = "book-search", key = "#query + '_' + #page + '_' + #size")
    public BookSearchResponse search(String query, int page, int size) {
        log.debug("Searching Open Library: '{}' page={} size={}", query, page, size);
        BookSearchResponse response = openLibraryClient.search(query, page, size);

        // Enrich each result with our DB stats in bulk
        // (single query is more efficient than N queries in the loop)
        response.getBooks().forEach(book ->
                enrichWithDbStats(book, null)
        );

        return response;
    }

    // ── Fetch single book ─────────────────────────────────────────────────

    /**
     * Get full detail for one book by its Open Library ID.
     * Cached by externalId for 30 minutes.
     */
    /**
     * Fetch and cache raw book metadata from Open Library.
     * Does NOT include DB stats (ratings, counts) — those are dynamic and must
     * not be baked into the cache. Stats are always added fresh by the controller.
     */
    @Cacheable(value = "book-detail", key = "#externalId")
    public BookDto getBookDetail(String externalId) {
        log.debug("Fetching book detail from Open Library: {}", externalId);

        BookDto dto = openLibraryClient.fetchWork(externalId)
                .orElseThrow(() -> new BookLensException(
                        "Book not found: " + externalId, HttpStatus.NOT_FOUND));

        // Do NOT call enrichWithDbStats here — DB stats are dynamic (change when
        // users log/rate/review) and must not be baked into the 30-min OL cache.
        // They are injected fresh in getBookDetailForUser / the controller.
        return dto;
    }

    /**
     * Get full book detail with fresh DB stats (ratings, counts).
     * Always re-fetches stats from DB; only the OL metadata is cached.
     */
    public BookDto getBookDetailWithStats(String externalId) {
        BookDto dto = getBookDetail(externalId);            // OL data from cache
        BookDto enriched = dto.toBuilder().build();         // clone so we don't mutate cache
        enrichWithDbStats(enriched, null);                  // inject fresh DB stats
        return enriched;
    }

    /**
     * Get book detail and also inject the current user's log/review status.
     * Not cached (user-specific data).
     */
    public BookDto getBookDetailForUser(String externalId, Long userId) {
        // Get base OL metadata + fresh DB stats (never mutates cache)
        BookDto base = getBookDetailWithStats(externalId);

        // Inject user-specific fields on top of the already-cloned object
        BookDto.BookDtoBuilder enriched = base.toBuilder();

        bookLogRepository.findByUserIdAndExternalBookId(userId, externalId)
                .ifPresent(log -> {
                    enriched.userStatus(log.getStatus().name());
                    enriched.userRating(log.getRatingAsStars());
                });

        enriched.userHasReview(
                reviewRepository.existsByUserIdAndExternalBookId(userId, externalId));

        return enriched.build();
    }

    // ── Stats enrichment ──────────────────────────────────────────────────

    /**
     * Inject aggregate stats from our database into a BookDto.
     * stats[0] = logCount, stats[1] = avgRating, stats[2] = ratingCount
     *
     * @param userId optional — if provided, also injects user's personal log status
     */
    public void enrichWithDbStats(BookDto dto, Long userId) {
        if (dto.getExternalId() == null) return;

        try {
            List<Object[]> statsList = bookLogRepository.getBookStats(dto.getExternalId());
            if (statsList != null && !statsList.isEmpty() && statsList.get(0) != null) {
                Object[] stats = statsList.get(0);
                dto.setLogsCount(stats[0] != null ? ((Number) stats[0]).intValue() : 0);
                dto.setAverageRating(stats[1] != null ? ((Number) stats[1]).doubleValue() : 0.0);
                dto.setRatingsCount(stats[2] != null ? ((Number) stats[2]).intValue() : 0);
            } else {
                dto.setLogsCount(0);
                dto.setAverageRating(0.0);
                dto.setRatingsCount(0);
            }

            long reviewCount = reviewRepository.countByExternalBookId(dto.getExternalId());
            dto.setReviewsCount((int) reviewCount);

        } catch (Exception e) {
            log.debug("Could not enrich stats for {}: {}", dto.getExternalId(), e.getMessage());
            dto.setLogsCount(0);
            dto.setAverageRating(0.0);
            dto.setRatingsCount(0);
            dto.setReviewsCount(0);
        }

        // User-specific
        if (userId != null) {
            bookLogRepository.findByUserIdAndExternalBookId(userId, dto.getExternalId())
                    .ifPresent(log -> {
                        dto.setUserStatus(log.getStatus().name());
                        dto.setUserRating(log.getRatingAsStars());
                    });
            dto.setUserHasReview(
                    reviewRepository.existsByUserIdAndExternalBookId(userId, dto.getExternalId()));
        }
    }

    // ── Browse by subject ─────────────────────────────────────────────────

    /**
     * Browse books by subject/genre using Open Library's subjects API.
     * Cached by subject + limit + offset for 10 minutes.
     */
    @Cacheable(value = "book-search", key = "'subject_' + #subject + '_' + #limit + '_' + #offset")
    public BookSearchResponse searchBySubject(String subject, int limit, int offset) {
        log.debug("Browsing Open Library subject: '{}' limit={} offset={}", subject, limit, offset);
        // Cache raw OL data only — do not bake in DB stats
        return openLibraryClient.searchBySubject(subject, limit, offset);
    }
}