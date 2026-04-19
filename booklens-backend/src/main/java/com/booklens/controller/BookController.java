package com.booklens.controller;

import com.booklens.books.BookApiService;
import com.booklens.dto.book.BookDto;
import com.booklens.dto.book.BookSearchResponse;
import com.booklens.exception.BookLensException;
import com.booklens.repository.BookLogRepository;
import com.booklens.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * BookController
 *
 * All book data comes from the Open Library API — nothing is stored locally.
 * The controller passes requests to BookApiService which handles
 * caching, error handling, and stats enrichment.
 *
 * Endpoints:
 *   GET /api/v1/books/search?q=&page=&size=
 *   GET /api/v1/books/{externalId}
 *   GET /api/v1/books/{externalId}/rating-distribution
 */
@RestController
@RequestMapping("/api/v1/books")
@RequiredArgsConstructor
public class BookController {

    private final BookApiService    bookApiService;
    private final BookLogRepository bookLogRepository;
    private final UserRepository    userRepository;

    /**
     * GET /api/v1/books/search?q=dostoevsky&page=0&size=20
     *
     * Searches Open Library and returns paginated results.
     * Results are cached for 10 minutes.
     * Supports debounce-friendly usage — short queries (< 2 chars) return empty.
     *
     * Example response:
     * {
     *   "books": [ { "externalId": "OL45804W", "title": "...", ... } ],
     *   "page": 0,
     *   "size": 20,
     *   "totalResults": 142,
     *   "hasMore": true,
     *   "query": "dostoevsky"
     * }
     */
    @GetMapping("/search")
    public ResponseEntity<BookSearchResponse> search(
        @RequestParam String q,
        @RequestParam(defaultValue = "0")  int page,
        @RequestParam(defaultValue = "20") int size,
        @AuthenticationPrincipal UserDetails principal
    ) {
        if (q == null || q.trim().length() < 2) {
            return ResponseEntity.ok(BookSearchResponse.builder()
                .books(List.of()).page(0).size(size).totalResults(0).hasMore(false).query(q)
                .build());
        }

        BookSearchResponse response = bookApiService.search(q.trim(), page, Math.min(size, 40));

        // If user is authenticated, inject their personal status for each result
        if (principal != null) {
            Long userId = resolveUserId(principal);
            response.getBooks().forEach(book ->
                bookApiService.enrichWithDbStats(book, userId)
            );
        }

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/v1/books/OL45804W
     *
     * Returns full detail for a book from Open Library.
     * Enriched with our DB stats (ratings, reviews, logs).
     * If authenticated, also includes user's personal log status.
     *
     * Example response:
     * {
     *   "externalId": "OL45804W",
     *   "title": "The Brothers Karamazov",
     *   "author": "Fyodor Dostoyevsky",
     *   "coverUrl": "https://covers.openlibrary.org/b/id/8739161-L.jpg",
     *   "description": "...",
     *   "publishYear": 1880,
     *   "genres": ["Fiction", "Classics"],
     *   "averageRating": 4.7,
     *   "ratingsCount": 312,
     *   "reviewsCount": 28,
     *   "logsCount": 419,
     *   "userStatus": "READ",        <- only if authenticated
     *   "userRating": 5.0,           <- only if authenticated & rated
     *   "userHasReview": true        <- only if authenticated
     * }
     */
    @GetMapping("/{externalId}")
    public ResponseEntity<BookDto> getBook(
        @PathVariable String externalId,
        @AuthenticationPrincipal UserDetails principal
    ) {
        BookDto book = principal != null
            ? bookApiService.getBookDetailForUser(externalId, resolveUserId(principal))
            : bookApiService.getBookDetail(externalId);

        return ResponseEntity.ok(book);
    }

    /**
     * GET /api/v1/books/OL45804W/rating-distribution
     *
     * Returns how BookLens users have rated this book.
     *
     * Example response:
     * [
     *   { "stars": 5, "count": 142, "percentage": 48.0 },
     *   { "stars": 4, "count": 89,  "percentage": 30.1 },
     *   ...
     * ]
     */
    @GetMapping("/{externalId}/rating-distribution")
    public ResponseEntity<List<Map<String, Object>>> getRatingDistribution(
        @PathVariable String externalId
    ) {
        List<Object[]> raw = bookLogRepository.getRatingDistributionByExternalId(externalId);

        // Calculate total for percentage
        long total = raw.stream()
            .mapToLong(row -> ((Number) row[1]).longValue())
            .sum();

        List<Map<String, Object>> dist = raw.stream()
            .map(row -> {
                int  internalRating = ((Number) row[0]).intValue();
                long count          = ((Number) row[1]).longValue();
                double stars        = internalRating / 2.0;  // convert 2-10 → 1.0-5.0
                double pct          = total > 0 ? (count * 100.0 / total) : 0.0;

                return Map.<String, Object>of(
                    "stars",      stars,
                    "count",      count,
                    "percentage", Math.round(pct * 10) / 10.0
                );
            })
            .collect(Collectors.toList());

        return ResponseEntity.ok(dist);
    }

    /**
     * GET /api/v1/books/subjects/{subject}?limit=20&offset=0
     *
     * Browse books by genre/subject using Open Library's subjects API.
     * More reliable for genre browsing than the search endpoint.
     *
     * Example: GET /api/v1/books/subjects/science_fiction?limit=12
     */
    @GetMapping("/subjects/{subject}")
    public ResponseEntity<BookSearchResponse> browseBySubject(
        @PathVariable String subject,
        @RequestParam(defaultValue = "20") int limit,
        @RequestParam(defaultValue = "0")  int offset
    ) {
        return ResponseEntity.ok(
            bookApiService.searchBySubject(subject, Math.min(limit, 50), offset)
        );
    }

    // ── Helper ────────────────────────────────────────────────────────────
    private Long resolveUserId(UserDetails principal) {
        return userRepository.findByUsername(principal.getUsername())
            .orElseThrow(() -> new BookLensException("User not found", HttpStatus.UNAUTHORIZED))
            .getId();
    }
}
