package com.booklens.service;

import com.booklens.books.BookApiService;
import com.booklens.dto.book.BookDto;
import com.booklens.dto.review.ReviewDto;
import com.booklens.entity.Review;
import com.booklens.entity.User;
import com.booklens.exception.BookLensException;
import com.booklens.repository.ReviewRepository;
import com.booklens.repository.UserRepository;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository   userRepository;
    private final BookApiService   bookApiService;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @jakarta.annotation.PostConstruct
    public void fixSchema() {
        try {
            jdbcTemplate.execute("ALTER TABLE reviews ALTER COLUMN book_id DROP NOT NULL");
            log.info("Schema fix: Set book_id to DROP NOT NULL on reviews table.");
        } catch (Exception e) {
            log.info("Schema fix: book_id column not found or already fixed.");
        }
    }

    @Transactional
    @CacheEvict(value = "recommendations", key = "#userId")
    public ReviewDto createReview(Long userId, String externalBookId, String content, boolean hasSpoiler) {
        if (reviewRepository.existsByUserIdAndExternalBookId(userId, externalBookId))
            throw new BookLensException("You've already reviewed this book.", HttpStatus.CONFLICT);

        if (content == null || content.isBlank())
            throw new BookLensException("Review content cannot be empty.", HttpStatus.BAD_REQUEST);

        User user = getUser(userId);
        Review review = reviewRepository.save(Review.builder()
                .user(user)
                .externalBookId(externalBookId)
                .content(content.trim())
                .hasSpoiler(hasSpoiler)
                .build());

        // Do not fetch book metadata here — keeps the transaction clean.
        // The caller (ReviewController) returns the ReviewDto; the frontend
        // refreshes the full review list to get enriched book data.
        return toDtoNoBook(review, userId);
    }

    @Transactional
    public ReviewDto updateReview(Long userId, Long reviewId, String content, boolean hasSpoiler) {
        if (content == null || content.isBlank())
            throw new BookLensException("Review content cannot be empty.", HttpStatus.BAD_REQUEST);

        Review review = getAndCheckOwner(userId, reviewId);
        review.setContent(content.trim());
        review.setHasSpoiler(hasSpoiler);
        return toDtoNoBook(reviewRepository.save(review), userId);
    }

    @Transactional
    @CacheEvict(value = "recommendations", key = "#userId")
    public void deleteReview(Long userId, Long reviewId) {
        reviewRepository.delete(getAndCheckOwner(userId, reviewId));
    }

    @Transactional
    public Map<String, Object> toggleLike(Long userId, Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new BookLensException("Review not found", HttpStatus.NOT_FOUND));
        User user = getUser(userId);
        boolean liked = review.getLikedBy().contains(user);
        if (liked) review.getLikedBy().remove(user);
        else        review.getLikedBy().add(user);
        int newCount = reviewRepository.save(review).getLikesCount();
        return java.util.Map.of("likesCount", newCount, "liked", !liked);
    }

    @Transactional(readOnly = true)
    public Page<ReviewDto> getByBook(String externalBookId, Long currentUserId, int page, int size) {
        BookDto book = safeGetBook(externalBookId);
        return reviewRepository
                .findPopularByExternalBookId(externalBookId, PageRequest.of(page, size))
                .map(r -> toDto(r, book, currentUserId));
    }

    @Transactional(readOnly = true)
    public Page<ReviewDto> getByUser(Long userId, Long currentUserId, int page, int size) {
        return reviewRepository
                .findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size))
                .map(r -> toDto(r, safeGetBook(r.getExternalBookId()), currentUserId));
    }

    @Transactional(readOnly = true)
    public Page<ReviewDto> getPopular(Long currentUserId, int page, int size) {
        LocalDateTime since = LocalDateTime.now().minusWeeks(1);
        return reviewRepository
                .findPopularSince(since, PageRequest.of(page, size))
                .map(r -> toDto(r, safeGetBook(r.getExternalBookId()), currentUserId));
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private Review getAndCheckOwner(Long userId, Long reviewId) {
        Review r = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new BookLensException("Review not found", HttpStatus.NOT_FOUND));
        if (!r.getUser().getId().equals(userId))
            throw new BookLensException("Not authorized", HttpStatus.FORBIDDEN);
        return r;
    }

    private User getUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new BookLensException("User not found", HttpStatus.NOT_FOUND));
    }

    private BookDto safeGetBook(String externalBookId) {
        try {
            return bookApiService.getBookDetail(externalBookId);
        } catch (Exception e) {
            log.debug("Could not fetch book {}: {}", externalBookId, e.getMessage());
            return BookDto.builder().externalId(externalBookId).title("").author("").build();
        }
    }

    /** Lightweight DTO without book metadata — used for create/update responses. */
    private ReviewDto toDtoNoBook(Review r, Long currentUserId) {
        boolean liked = currentUserId != null &&
                r.getLikedBy().stream().anyMatch(u -> u.getId().equals(currentUserId));
        return ReviewDto.builder()
                .id(r.getId())
                .content(r.getContent())
                .hasSpoiler(r.isHasSpoiler())
                .likesCount(r.getLikesCount())
                .likedByCurrentUser(liked)
                .bookExternalId(r.getExternalBookId())
                .userId(r.getUser().getId())
                .username(r.getUser().getUsername())
                .displayName(r.getUser().getDisplayName())
                .avatarUrl(r.getUser().getAvatarUrl())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }

    private ReviewDto toDto(Review r, BookDto book, Long currentUserId) {
        boolean liked = currentUserId != null &&
                r.getLikedBy().stream().anyMatch(u -> u.getId().equals(currentUserId));

        return ReviewDto.builder()
                .id(r.getId())
                .content(r.getContent())
                .hasSpoiler(r.isHasSpoiler())
                .likesCount(r.getLikesCount())
                .likedByCurrentUser(liked)
                .bookExternalId(r.getExternalBookId())
                .bookTitle(book != null ? book.getTitle() : null)
                .bookAuthor(book != null ? book.getAuthor() : null)
                .bookCoverUrl(book != null ? book.getCoverUrl() : null)
                .userId(r.getUser().getId())
                .username(r.getUser().getUsername())
                .displayName(r.getUser().getDisplayName())
                .avatarUrl(r.getUser().getAvatarUrl())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }
}