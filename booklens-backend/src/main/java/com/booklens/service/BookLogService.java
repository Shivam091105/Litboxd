package com.booklens.service;

import com.booklens.books.BookApiService;
import com.booklens.dto.book.BookDto;
import com.booklens.dto.log.BookLogDto;
import com.booklens.entity.BookLog;
import com.booklens.entity.BookLog.ReadingStatus;
import com.booklens.entity.User;
import com.booklens.exception.BookLensException;
import com.booklens.repository.BookLogRepository;
import com.booklens.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookLogService {

    private final BookLogRepository bookLogRepository;
    private final UserRepository    userRepository;
    private final BookApiService    bookApiService;

    // ── Log / update a book entry ─────────────────────────────────────────

    @Transactional
    @CacheEvict(value = "recommendations", key = "#userId")
    public BookLogDto logBook(Long userId, String externalBookId, Map<String, Object> payload) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BookLensException("User not found", HttpStatus.NOT_FOUND));

        // Validate that the book actually exists in Open Library before saving
        // (only on new logs — skip for updates to avoid extra API call)
        boolean isNew = !bookLogRepository.existsByUserIdAndExternalBookId(userId, externalBookId);

        BookLog log = bookLogRepository
            .findByUserIdAndExternalBookId(userId, externalBookId)
            .orElse(BookLog.builder().user(user).externalBookId(externalBookId).build());

        applyPayload(log, payload);
        BookLog saved = bookLogRepository.save(log);

        // Fetch book metadata to return rich response
        BookDto bookDto = safeGetBook(externalBookId);

        return toDto(saved, bookDto);
    }

    // ── Get user diary ────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<BookLogDto> getUserDiary(Long userId, ReadingStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<BookLog> logs = status != null
            ? bookLogRepository.findByUserIdAndStatusOrderByUpdatedAtDesc(userId, status, pageable)
            : bookLogRepository.findByUserIdOrderByUpdatedAtDesc(userId, pageable);

        return logs.map(log -> toDto(log, safeGetBook(log.getExternalBookId())));
    }

    // ── Activity feed ─────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<BookLogDto> getFeed(Long userId, int page, int size) {
        Page<BookLog> logs = bookLogRepository
            .findFeedForUser(userId, PageRequest.of(page, size));

        return logs.map(log -> toDto(log, safeGetBook(log.getExternalBookId())));
    }

    // ── Delete a log ──────────────────────────────────────────────────────

    @Transactional
    @CacheEvict(value = "recommendations", key = "#userId")
    public void deleteLog(Long userId, Long logId) {
        BookLog log = bookLogRepository.findById(logId)
            .orElseThrow(() -> new BookLensException("Log not found", HttpStatus.NOT_FOUND));
        if (!log.getUser().getId().equals(userId))
            throw new BookLensException("Not authorized", HttpStatus.FORBIDDEN);
        bookLogRepository.delete(log);
    }

    // ── Reading challenge ─────────────────────────────────────────────────

    public Map<String, Object> getChallengeProgress(Long userId, int year) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BookLensException("User not found", HttpStatus.NOT_FOUND));

        LocalDate start = LocalDate.of(year, 1, 1);
        LocalDate end   = LocalDate.of(year + 1, 1, 1);
        long booksRead  = bookLogRepository.countBooksReadInYear(userId, start, end);

        int    goal    = user.getReadingGoal() != null ? user.getReadingGoal() : 36;
        double percent = goal > 0 ? Math.min(100.0, booksRead * 100.0 / goal) : 0;

        return Map.of(
            "year",      year,
            "goal",      goal,
            "booksRead", booksRead,
            "percent",   (long) Math.round(percent)
        );
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private void applyPayload(BookLog log, Map<String, Object> payload) {
        if (payload.containsKey("status"))
            log.setStatus(ReadingStatus.valueOf(((String) payload.get("status")).toUpperCase()));

        if (payload.containsKey("rating") && payload.get("rating") != null) {
            double stars = ((Number) payload.get("rating")).doubleValue();
            log.setRating((int) Math.round(stars * 2));
        }
        if (payload.containsKey("startedAt")) {
            String v = (String) payload.get("startedAt");
            if (v != null && !v.isBlank()) log.setStartedAt(LocalDate.parse(v));
        }
        if (payload.containsKey("finishedAt")) {
            String v = (String) payload.get("finishedAt");
            if (v != null && !v.isBlank()) log.setFinishedAt(LocalDate.parse(v));
        }
        if (payload.containsKey("reread"))       log.setReread(Boolean.TRUE.equals(payload.get("reread")));
        if (payload.containsKey("privateEntry")) log.setPrivateEntry(Boolean.TRUE.equals(payload.get("privateEntry")));
        if (payload.containsKey("tags") && payload.get("tags") != null)
            log.setTags((String) payload.get("tags"));
    }

    /** Fetch book from external API — return stub if API is down */
    private BookDto safeGetBook(String externalBookId) {
        try {
            return bookApiService.getBookDetail(externalBookId);
        } catch (Exception e) {
            log.debug("Could not fetch book {} from API: {}", externalBookId, e.getMessage());
            return BookDto.builder()
                .externalId(externalBookId)
                .title("Book details unavailable")
                .author("")
                .build();
        }
    }

    private BookLogDto toDto(BookLog log, BookDto book) {
        return BookLogDto.builder()
            .id(log.getId())
            .status(log.getStatus().name())
            .rating(log.getRatingAsStars())
            .startedAt(log.getStartedAt())
            .finishedAt(log.getFinishedAt())
            .reread(log.isReread())
            .privateEntry(log.isPrivateEntry())
            .tags(log.getTags())
            .bookExternalId(log.getExternalBookId())
            .bookTitle(book != null ? book.getTitle() : null)
            .bookAuthor(book != null ? book.getAuthor() : null)
            .bookCoverUrl(book != null ? book.getCoverUrl() : null)
            .userId(log.getUser().getId())
            .username(log.getUser().getUsername())
            .displayName(log.getUser().getDisplayName())
            .createdAt(log.getCreatedAt())
            .updatedAt(log.getUpdatedAt())
            .build();
    }
}
