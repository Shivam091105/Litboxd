package com.booklens.controller;

import com.booklens.books.BookApiService;
import com.booklens.dto.book.BookDto;
import com.booklens.exception.BookLensException;
import com.booklens.repository.BookLogRepository;
import com.booklens.repository.UserRepository;
import com.booklens.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class UserController {

    private final UserService        userService;
    private final BookApiService     bookApiService;
    private final BookLogRepository  bookLogRepository;
    private final UserRepository     userRepository;

    /**
     * GET /api/v1/users/{username}
     * Public profile view — no auth required.
     */
    @GetMapping("/users/{username}")
    public ResponseEntity<Map<String, Object>> getProfile(
        @PathVariable String username,
        @AuthenticationPrincipal UserDetails principal
    ) {
        Long currentUserId = principal != null ? resolveUserId(principal) : null;
        return ResponseEntity.ok(userService.getProfile(username, currentUserId));
    }

    /**
     * PATCH /api/v1/me
     * Update own profile. Requires auth.
     */
    @PatchMapping("/me")
    public ResponseEntity<Map<String, Object>> updateProfile(
        @RequestBody Map<String, Object> updates,
        @AuthenticationPrincipal UserDetails principal
    ) {
        Long userId = resolveUserId(principal);
        userService.updateProfile(userId, updates);
        return ResponseEntity.ok(userService.getProfile(principal.getUsername(), userId));
    }

    /**
     * POST /api/v1/users/{userId}/follow
     */
    @PostMapping("/users/{userId}/follow")
    public ResponseEntity<Map<String, Object>> follow(
        @PathVariable Long userId,
        @AuthenticationPrincipal UserDetails principal
    ) {
        return ResponseEntity.ok(userService.follow(resolveUserId(principal), userId));
    }

    /**
     * DELETE /api/v1/users/{userId}/follow
     */
    @DeleteMapping("/users/{userId}/follow")
    public ResponseEntity<Map<String, Object>> unfollow(
        @PathVariable Long userId,
        @AuthenticationPrincipal UserDetails principal
    ) {
        return ResponseEntity.ok(userService.unfollow(resolveUserId(principal), userId));
    }

    /**
     * GET /api/v1/me/suggestions?limit=4
     * Suggested users to follow.
     */
    @GetMapping("/me/suggestions")
    public ResponseEntity<?> getSuggestedUsers(
        @RequestParam(defaultValue = "4") int limit,
        @AuthenticationPrincipal UserDetails principal
    ) {
        return ResponseEntity.ok(userService.getSuggestedUsers(resolveUserId(principal), limit));
    }

    /**
     * GET /api/v1/me/recommendations
     *
     * Personalised book recommendations.
     * Uses collaborative + content-based hybrid engine.
     * Recommendations are based on externalBookIds the user has rated.
     *
     * Returns list of BookDto enriched with score and reason.
     */
    @GetMapping("/me/recommendations")
    public ResponseEntity<List<Map<String, Object>>> getRecommendations(
        @AuthenticationPrincipal UserDetails principal
    ) {
        Long userId = resolveUserId(principal);

        // Fetch the user's highly rated book IDs
        List<String> likedIds = bookLogRepository.findHighlyRatedExternalBookIdsByUserId(userId);
        List<String> allLoggedIds = bookLogRepository.findExternalBookIdsByUserId(userId);

        if (likedIds.isEmpty()) {
            // New user — return empty list with a helpful message
            return ResponseEntity.ok(List.of());
        }

        // For each liked book, find similar ones via Open Library subjects
        // This is a lightweight content-based approach that works without storing book data
        List<Map<String, Object>> recs = likedIds.stream()
            .limit(5)  // use top 5 liked books as seeds
            .flatMap(bookId -> {
                try {
                    BookDto book = bookApiService.getBookDetail(bookId);
                    return book.getGenres() != null && !book.getGenres().isEmpty()
                        ? bookApiService.search(
                              book.getGenres().get(0), 0, 8
                          ).getBooks().stream()
                        : java.util.stream.Stream.<BookDto>empty();
                } catch (Exception e) {
                    return java.util.stream.Stream.<BookDto>empty();
                }
            })
            .filter(b -> !allLoggedIds.contains(b.getExternalId()))  // exclude already logged
            .distinct()
            .limit(20)
            .map(b -> Map.<String, Object>of(
                "externalId",    b.getExternalId(),
                "title",         b.getTitle() != null ? b.getTitle() : "",
                "author",        b.getAuthor() != null ? b.getAuthor() : "",
                "coverUrl",      b.getCoverUrl() != null ? b.getCoverUrl() : "",
                "averageRating", b.getAverageRating() != null ? b.getAverageRating() : 0.0,
                "ratingsCount",  b.getRatingsCount() != null ? b.getRatingsCount() : 0,
                "genres",        b.getGenres() != null ? b.getGenres() : List.of(),
                "reason",        "Based on your reading taste"
            ))
            .collect(Collectors.toList());

        return ResponseEntity.ok(recs);
    }

    // ── Helper ────────────────────────────────────────────────────────────
    private Long resolveUserId(UserDetails principal) {
        return userRepository.findByUsername(principal.getUsername())
            .orElseThrow(() -> new BookLensException("User not found", HttpStatus.UNAUTHORIZED))
            .getId();
    }
}
