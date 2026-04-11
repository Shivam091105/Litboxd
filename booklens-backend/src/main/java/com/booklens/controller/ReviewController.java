package com.booklens.controller;

import com.booklens.dto.review.ReviewDto;
import com.booklens.exception.BookLensException;
import com.booklens.repository.UserRepository;
import com.booklens.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService  reviewService;
    private final UserRepository userRepository;

    /**
     * POST /api/v1/books/{externalBookId}/reviews
     * Body: { "content": "...", "hasSpoiler": false }
     */
    @PostMapping("/books/{externalBookId}/reviews")
    public ResponseEntity<ReviewDto> createReview(
        @PathVariable String externalBookId,
        @RequestBody Map<String, Object> body,
        @AuthenticationPrincipal UserDetails principal
    ) {
        Long userId = resolveUserId(principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(
            reviewService.createReview(
                userId, externalBookId,
                (String) body.get("content"),
                Boolean.TRUE.equals(body.get("hasSpoiler"))
            )
        );
    }

    /**
     * PUT /api/v1/reviews/{reviewId}
     * Body: { "content": "...", "hasSpoiler": false }
     */
    @PutMapping("/reviews/{reviewId}")
    public ResponseEntity<ReviewDto> updateReview(
        @PathVariable Long reviewId,
        @RequestBody Map<String, Object> body,
        @AuthenticationPrincipal UserDetails principal
    ) {
        return ResponseEntity.ok(reviewService.updateReview(
            resolveUserId(principal), reviewId,
            (String) body.get("content"),
            Boolean.TRUE.equals(body.get("hasSpoiler"))
        ));
    }

    /**
     * DELETE /api/v1/reviews/{reviewId}
     */
    @DeleteMapping("/reviews/{reviewId}")
    public ResponseEntity<Void> deleteReview(
        @PathVariable Long reviewId,
        @AuthenticationPrincipal UserDetails principal
    ) {
        reviewService.deleteReview(resolveUserId(principal), reviewId);
        return ResponseEntity.noContent().build();
    }

    /**
     * POST /api/v1/reviews/{reviewId}/like  — toggles like on/off
     */
    @PostMapping("/reviews/{reviewId}/like")
    public ResponseEntity<Map<String, Object>> toggleLike(
        @PathVariable Long reviewId,
        @AuthenticationPrincipal UserDetails principal
    ) {
        return ResponseEntity.ok(reviewService.toggleLike(resolveUserId(principal), reviewId));
    }

    /**
     * GET /api/v1/books/{externalBookId}/reviews?page=0&size=10
     * Popular reviews for a specific book (sorted by likes).
     */
    @GetMapping("/books/{externalBookId}/reviews")
    public ResponseEntity<Page<ReviewDto>> getByBook(
        @PathVariable String externalBookId,
        @RequestParam(defaultValue = "0")  int page,
        @RequestParam(defaultValue = "10") int size,
        @AuthenticationPrincipal UserDetails principal
    ) {
        Long currentUserId = principal != null ? resolveUserId(principal) : null;
        return ResponseEntity.ok(reviewService.getByBook(externalBookId, currentUserId, page, size));
    }

    /**
     * GET /api/v1/reviews/popular?page=0&size=6
     * Site-wide popular reviews from the past week.
     */
    @GetMapping("/reviews/popular")
    public ResponseEntity<Page<ReviewDto>> getPopular(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "6") int size,
        @AuthenticationPrincipal UserDetails principal
    ) {
        Long currentUserId = principal != null ? resolveUserId(principal) : null;
        return ResponseEntity.ok(reviewService.getPopular(currentUserId, page, size));
    }

    /**
     * GET /api/v1/users/{userId}/reviews?page=0&size=10
     */
    @GetMapping("/users/{userId}/reviews")
    public ResponseEntity<Page<ReviewDto>> getByUser(
        @PathVariable Long userId,
        @RequestParam(defaultValue = "0")  int page,
        @RequestParam(defaultValue = "10") int size,
        @AuthenticationPrincipal UserDetails principal
    ) {
        Long currentUserId = principal != null ? resolveUserId(principal) : null;
        return ResponseEntity.ok(reviewService.getByUser(userId, currentUserId, page, size));
    }

    // ── Helper ────────────────────────────────────────────────────────────
    private Long resolveUserId(UserDetails principal) {
        return userRepository.findByUsername(principal.getUsername())
            .orElseThrow(() -> new BookLensException("User not found", HttpStatus.UNAUTHORIZED))
            .getId();
    }
}
