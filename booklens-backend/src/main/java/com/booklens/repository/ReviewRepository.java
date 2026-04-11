package com.booklens.repository;

import com.booklens.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    Optional<Review> findByUserIdAndExternalBookId(Long userId, String externalBookId);

    boolean existsByUserIdAndExternalBookId(Long userId, String externalBookId);

    Page<Review> findByExternalBookIdOrderByCreatedAtDesc(String externalBookId, Pageable pageable);

    Page<Review> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    /** Most-liked reviews for a specific book */
    @Query("""
        SELECT r FROM Review r
        WHERE r.externalBookId = :externalBookId
        ORDER BY SIZE(r.likedBy) DESC, r.createdAt DESC
        """)
    Page<Review> findPopularByExternalBookId(
        @Param("externalBookId") String externalBookId,
        Pageable pageable
    );

    /** Site-wide popular reviews since a given time */
    @Query("""
        SELECT r FROM Review r
        WHERE r.createdAt >= :since
        ORDER BY SIZE(r.likedBy) DESC, r.createdAt DESC
        """)
    Page<Review> findPopularSince(
        @Param("since") LocalDateTime since,
        Pageable pageable
    );

    /** Count reviews for a specific book */
    long countByExternalBookId(String externalBookId);
}
