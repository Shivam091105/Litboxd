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

import java.util.Optional;
import java.util.List;

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
    @Cacheable(value = "book-detail", key = "#externalId")
    public BookDto getBookDetail(String externalId) {
        log.debug("Fetching book detail from Open Library: {}", externalId);

        BookDto dto = openLibraryClient.fetchWork(externalId)
            .orElseThrow(() -> new BookLensException(
                "Book not found: " + externalId, HttpStatus.NOT_FOUND));

        enrichWithDbStats(dto, null);
        return dto;
    }

    /**
     * Get book detail and also inject the current user's log/review status.
     * Not cached (user-specific data).
     */
    public BookDto getBookDetailForUser(String externalId, Long userId) {
        // Fetch (possibly cached) base detail
        BookDto base = getBookDetail(externalId);

        // Clone and inject user-specific fields
        BookDto.BookDtoBuilder enriched = base.toBuilder();

        // Check user's log
        bookLogRepository.findByUserIdAndExternalBookId(userId, externalId)
            .ifPresent(log -> {
                enriched.userStatus(log.getStatus().name());
                enriched.userRating(log.getRatingAsStars());
            });

        // Check user's review
        boolean hasReview = reviewRepository.existsByUserIdAndExternalBookId(userId, externalId);
        enriched.userHasReview(hasReview);

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
            List<Object[]> results = bookLogRepository.getBookStats(dto.getExternalId());
            if (results != null && !results.isEmpty()) {
                Object[] stats = results.get(0);
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
        BookSearchResponse response = openLibraryClient.searchBySubject(subject, limit, offset);

        response.getBooks().forEach(book ->
            enrichWithDbStats(book, null)
        );

        return response;
    }
}
