package com.booklens.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * BookLog — records a user's relationship with a book.
 *
 * IMPORTANT: We no longer store a Book entity.
 * Instead we store externalBookId (Open Library work ID, e.g. "OL45804W").
 * Book metadata is fetched dynamically from the external API and merged.
 */
@Entity
@Table(
    name = "book_logs",
    uniqueConstraints = @UniqueConstraint(
        name = "uc_book_logs_user_book",
        columnNames = {"user_id", "external_book_id"}
    ),
    indexes = {
        @Index(name = "idx_log_user",        columnList = "user_id"),
        @Index(name = "idx_log_external_book", columnList = "external_book_id"),
        @Index(name = "idx_log_status",      columnList = "status")
    }
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class BookLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * Open Library work ID — e.g. "OL45804W".
     * This is the ONLY book identifier we store.
     * Full book data comes from the external API.
     */
    @Column(name = "external_book_id", nullable = false, length = 50)
    private String externalBookId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ReadingStatus status = ReadingStatus.WANT;

    /**
     * Rating stored as integer 2–10 (supports half-stars).
     * 10 = 5★, 9 = 4.5★, 8 = 4★ ... 2 = 1★
     * null = not yet rated.
     */
    @Min(2) @Max(10)
    private Integer rating;

    private LocalDate startedAt;
    private LocalDate finishedAt;

    @Builder.Default
    private boolean reread = false;

    @Builder.Default
    private int rereadCount = 0;

    @Builder.Default
    private boolean privateEntry = false;

    @Column(length = 300)
    private String tags;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public enum ReadingStatus {
        WANT,
        READING,
        READ
    }

    /** Expose rating as 0.5–5.0 star scale */
    public Double getRatingAsStars() {
        return rating != null ? rating / 2.0 : null;
    }
}
