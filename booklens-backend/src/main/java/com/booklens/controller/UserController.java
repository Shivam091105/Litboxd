package com.booklens.controller;

import com.booklens.exception.BookLensException;
import com.booklens.repository.UserRepository;
import com.booklens.service.RecommendationService;
import com.booklens.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class UserController {

    private final UserService            userService;
    private final UserRepository         userRepository;
    private final RecommendationService  recommendationService;

    // ── Public endpoints ─────────────────────────────────────────────────

    /**
     * GET /api/v1/users?page=0&size=20&q=searchTerm
     * Lists all users (for Members page). Public.
     */
    @GetMapping("/users")
    public ResponseEntity<Page<Map<String, Object>>> listUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String q,
            @AuthenticationPrincipal UserDetails principal
    ) {
        Long currentUserId = principal != null ? resolveUserId(principal) : null;
        return ResponseEntity.ok(userService.listAllUsers(currentUserId, q, page, size));
    }

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
     * GET /api/v1/users/{userId}/followers
     * List a user's followers. Public.
     */
    @GetMapping("/users/{userId}/followers")
    public ResponseEntity<List<Map<String, Object>>> getFollowers(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails principal
    ) {
        Long currentUserId = principal != null ? resolveUserId(principal) : null;
        return ResponseEntity.ok(userService.getFollowers(userId, currentUserId));
    }

    /**
     * GET /api/v1/users/{userId}/following
     * List who a user follows. Public.
     */
    @GetMapping("/users/{userId}/following")
    public ResponseEntity<List<Map<String, Object>>> getFollowing(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails principal
    ) {
        Long currentUserId = principal != null ? resolveUserId(principal) : null;
        return ResponseEntity.ok(userService.getFollowing(userId, currentUserId));
    }

    // ── Authenticated endpoints ──────────────────────────────────────────

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
     * Reads from the persistent recommendation pool managed by RecommendationService.
     * The pool is seeded on first request and updated incrementally on every
     * log/rating — new signals surface fresh picks to the front, old ones drift
     * to the back and age off after POOL_MAX (15) total entries.
     */
    @GetMapping("/me/recommendations")
    public ResponseEntity<List<Map<String, Object>>> getRecommendations(
            @AuthenticationPrincipal UserDetails principal
    ) {
        return ResponseEntity.ok(recommendationService.getRecommendations(resolveUserId(principal)));
    }

    // ── Helper ────────────────────────────────────────────────────────────
    private Long resolveUserId(UserDetails principal) {
        return userRepository.findByUsername(principal.getUsername())
                .orElseThrow(() -> new BookLensException("User not found", HttpStatus.UNAUTHORIZED))
                .getId();
    }
}