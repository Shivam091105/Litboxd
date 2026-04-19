package com.booklens.repository;

import com.booklens.entity.UserRecommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Set;

public interface UserRecommendationRepository extends JpaRepository<UserRecommendation, Long> {

    /** Fetch the full pool for a user, ordered by position (freshest first) */
    List<UserRecommendation> findByUserIdOrderByPositionAsc(Long userId);

    /** All external book IDs currently in the pool for a user */
    @Query("SELECT r.externalBookId FROM UserRecommendation r WHERE r.userId = :userId")
    Set<String> findExternalBookIdsByUserId(@Param("userId") Long userId);

    /** Shift all existing entries down by `shift` positions to make room at the front */
    @Modifying
    @Query("UPDATE UserRecommendation r SET r.position = r.position + :shift WHERE r.userId = :userId")
    void shiftPositions(@Param("userId") Long userId, @Param("shift") int shift);

    /** Remove entries that have fallen beyond the pool cap */
    @Modifying
    @Query("DELETE FROM UserRecommendation r WHERE r.userId = :userId AND r.position >= :maxPosition")
    void deleteOverflow(@Param("userId") Long userId, @Param("maxPosition") int maxPosition);

    /** Delete any existing entry for this book (used before re-inserting at front) */
    @Modifying
    @Query("DELETE FROM UserRecommendation r WHERE r.userId = :userId AND r.externalBookId = :bookId")
    void deleteByUserIdAndBookId(@Param("userId") Long userId, @Param("bookId") String bookId);

    /** Delete all recommendations for a user (e.g. when all logs are cleared) */
    @Modifying
    @Query("DELETE FROM UserRecommendation r WHERE r.userId = :userId")
    void deleteAllByUserId(@Param("userId") Long userId);

    /** Count entries for a user */
    long countByUserId(Long userId);
}