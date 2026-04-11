package com.booklens.controller;

import com.booklens.dto.log.BookLogDto;
import com.booklens.entity.BookLog.ReadingStatus;
import com.booklens.exception.BookLensException;
import com.booklens.repository.UserRepository;
import com.booklens.service.BookLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class BookLogController {

    private final BookLogService bookLogService;
    private final UserRepository userRepository;

    /**
     * POST /api/v1/books/{externalBookId}/log
     *
     * Log or update a reading entry. externalBookId is the Open Library work ID.
     *
     * Body:
     * {
     *   "status":       "READ",         // WANT | READING | READ
     *   "rating":       4.5,            // 0.5–5.0 (half-star increments)
     *   "startedAt":    "2025-01-01",   // ISO date, optional
     *   "finishedAt":   "2025-01-20",   // ISO date, optional
     *   "reread":       false,
     *   "privateEntry": false,
     *   "tags":         "favourites,2025-reads"
     * }
     *
     * Example response:
     * {
     *   "id": 1,
     *   "status": "READ",
     *   "rating": 4.5,
     *   "bookExternalId": "OL45804W",
     *   "bookTitle": "The Brothers Karamazov",
     *   "bookAuthor": "Fyodor Dostoyevsky",
     *   "bookCoverUrl": "https://covers.openlibrary.org/...",
     *   "username": "aryan_reads",
     *   "updatedAt": "2025-01-20T14:22:00"
     * }
     */
    @PostMapping("/books/{externalBookId}/log")
    public ResponseEntity<BookLogDto> logBook(
        @PathVariable String externalBookId,
        @RequestBody Map<String, Object> payload,
        @AuthenticationPrincipal UserDetails principal
    ) {
        Long userId = resolveUserId(principal);
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(bookLogService.logBook(userId, externalBookId, payload));
    }

    /**
     * DELETE /api/v1/logs/{logId}
     */
    @DeleteMapping("/logs/{logId}")
    public ResponseEntity<Void> deleteLog(
        @PathVariable Long logId,
        @AuthenticationPrincipal UserDetails principal
    ) {
        bookLogService.deleteLog(resolveUserId(principal), logId);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/v1/me/diary?status=READ&page=0&size=20
     *
     * Returns the authenticated user's reading diary.
     * Each entry includes book metadata fetched from Open Library.
     */
    @GetMapping("/me/diary")
    public ResponseEntity<Page<BookLogDto>> getDiary(
        @RequestParam(required = false) ReadingStatus status,
        @RequestParam(defaultValue = "0")  int page,
        @RequestParam(defaultValue = "20") int size,
        @AuthenticationPrincipal UserDetails principal
    ) {
        return ResponseEntity.ok(
            bookLogService.getUserDiary(resolveUserId(principal), status, page, size)
        );
    }

    /**
     * GET /api/v1/me/feed?page=0&size=20
     *
     * Activity feed from users the authenticated user follows.
     */
    @GetMapping("/me/feed")
    public ResponseEntity<Page<BookLogDto>> getFeed(
        @RequestParam(defaultValue = "0")  int page,
        @RequestParam(defaultValue = "20") int size,
        @AuthenticationPrincipal UserDetails principal
    ) {
        return ResponseEntity.ok(
            bookLogService.getFeed(resolveUserId(principal), page, size)
        );
    }

    /**
     * GET /api/v1/me/challenge?year=2025
     */
    @GetMapping("/me/challenge")
    public ResponseEntity<Map<String, Object>> getChallengeProgress(
        @RequestParam(defaultValue = "2025") int year,
        @AuthenticationPrincipal UserDetails principal
    ) {
        return ResponseEntity.ok(
            bookLogService.getChallengeProgress(resolveUserId(principal), year)
        );
    }

    // ── Helper ────────────────────────────────────────────────────────────
    private Long resolveUserId(UserDetails principal) {
        return userRepository.findByUsername(principal.getUsername())
            .orElseThrow(() -> new BookLensException("User not found", HttpStatus.UNAUTHORIZED))
            .getId();
    }
}
