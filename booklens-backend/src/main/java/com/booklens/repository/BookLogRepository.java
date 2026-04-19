package com.booklens.repository;

import com.booklens.entity.BookLog;
import com.booklens.entity.BookLog.ReadingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface BookLogRepository extends JpaRepository<BookLog, Long> {

    Optional<BookLog> findByUserIdAndExternalBookId(Long userId, String externalBookId);

    boolean existsByUserIdAndExternalBookId(Long userId, String externalBookId);

    Page<BookLog> findByUserIdOrderByUpdatedAtDesc(Long userId, Pageable pageable);

    Page<BookLog> findByUserIdAndStatusOrderByUpdatedAtDesc(
        Long userId, ReadingStatus status, Pageable pageable);

    /** All external book IDs the user has ever logged */
    @Query("SELECT bl.externalBookId FROM BookLog bl WHERE bl.user.id = :userId")
    List<String> findExternalBookIdsByUserId(@Param("userId") Long userId);

    /** Book IDs the user rated highly (≥ 7 = 3.5+ stars) — feeds recommendation engine */
    @Query("SELECT bl.externalBookId FROM BookLog bl WHERE bl.user.id = :userId AND bl.rating >= 7")
    List<String> findHighlyRatedExternalBookIdsByUserId(@Param("userId") Long userId);

    /** Book IDs the user has rated at all (any non-null rating) — fallback for recommendation seeding */
    @Query("SELECT bl.externalBookId FROM BookLog bl WHERE bl.user.id = :userId AND bl.rating IS NOT NULL")
    List<String> findAnyRatedExternalBookIdsByUserId(@Param("userId") Long userId);

    /** Count books finished in a given year (LocalDate range, avoids YEAR() JPQL issue) */
    @Query("""
        SELECT COUNT(bl) FROM BookLog bl
        WHERE bl.user.id       = :userId
        AND   bl.status        = 'READ'
        AND   bl.finishedAt   >= :startOfYear
        AND   bl.finishedAt    < :startOfNextYear
        """)
    long countBooksReadInYear(
        @Param("userId")          Long userId,
        @Param("startOfYear")     LocalDate startOfYear,
        @Param("startOfNextYear") LocalDate startOfNextYear
    );

    /** Activity feed: recent non-private logs from followed users */
    @Query("""
        SELECT bl FROM BookLog bl
        WHERE bl.user.id IN (
            SELECT f.id FROM User u JOIN u.following f WHERE u.id = :userId
        )
        AND bl.privateEntry = false
        ORDER BY bl.updatedAt DESC
        """)
    Page<BookLog> findFeedForUser(@Param("userId") Long userId, Pageable pageable);

    /** Rating distribution for one book — returns [rating(int), count(long)] tuples */
    @Query("""
        SELECT bl.rating, COUNT(bl) FROM BookLog bl
        WHERE bl.externalBookId = :externalBookId
        AND   bl.rating IS NOT NULL
        GROUP BY bl.rating
        ORDER BY bl.rating DESC
        """)
    List<Object[]> getRatingDistributionByExternalId(@Param("externalBookId") String externalBookId);

    /** Aggregate stats for a book — used to enrich BookDto */
    @Query("""
        SELECT
            COUNT(bl)                                        AS logCount,
            AVG(CAST(bl.rating AS double) / 2.0)            AS avgRating,
            SUM(CASE WHEN bl.rating IS NOT NULL THEN 1 ELSE 0 END) AS ratingCount
        FROM BookLog bl
        WHERE bl.externalBookId = :externalBookId
        """)
    List<Object[]> getBookStats(@Param("externalBookId") String externalBookId);
}
