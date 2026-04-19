package com.booklens.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * UserRecommendation — one slot in a user's persistent recommendation pool.
 *
 * The pool works like a ranked list:
 *   - position 0 = most recently added / most relevant
 *   - higher positions = older, less fresh
 *   - pool is capped at POOL_MAX (15) items per user
 *
 * On every new log/rating signal:
 *   - fresh candidates are inserted at position 0..N-1
 *   - existing entries are shifted down by N
 *   - anything beyond POOL_MAX is deleted
 *
 * This gives the Netflix-style behaviour: new signals surface to the top,
 * old recommendations drift to the back and eventually age off, but they
 * don't simply vanish on the next request.
 */
@Entity
@Table(
        name = "user_recommendations",
        uniqueConstraints = @UniqueConstraint(
                name = "uc_user_rec_book",
                columnNames = {"user_id", "external_book_id"}
        ),
        indexes = {
                @Index(name = "idx_rec_user_pos", columnList = "user_id, position")
        }
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class UserRecommendation {

    public static final int POOL_MAX = 15;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** FK to users.id */
    @Column(name = "user_id", nullable = false)
    private Long userId;

    /** Open Library work ID, e.g. "OL45804W" — same pattern as BookLog */
    @Column(name = "external_book_id", nullable = false, length = 100)
    private String externalBookId;

    /** Rank within the pool: 0 = freshest, POOL_MAX-1 = oldest */
    @Column(nullable = false)
    private int position;

    /** Human-readable reason shown in the UI */
    @Column(length = 200)
    private String reason;

    // ── Denormalised book metadata (fetched at insert time, not re-fetched) ──
    @Column(length = 300)
    private String title;

    @Column(length = 200)
    private String author;

    @Column(length = 500)
    private String coverUrl;

    @Column(length = 500)
    private String coverUrlSmall;

    private Double averageRating;

    private Integer ratingsCount;

    @CreationTimestamp
    private LocalDateTime addedAt;
}