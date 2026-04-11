package com.booklens.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * Review — a user's written review of a book.
 *
 * References the book by externalBookId only.
 * Book metadata is fetched from the external API when needed.
 */
@Entity
@Table(
    name = "reviews",
    uniqueConstraints = @UniqueConstraint(
        name = "uc_review_user_book",
        columnNames = {"user_id", "external_book_id"}
    ),
    indexes = {
        @Index(name = "idx_review_user",         columnList = "user_id"),
        @Index(name = "idx_review_external_book", columnList = "external_book_id")
    }
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Open Library work ID — e.g. "OL45804W" */
    @Column(name = "external_book_id", nullable = false, length = 50)
    private String externalBookId;

    @Column(nullable = false, length = 5000)
    private String content;

    @Builder.Default
    private boolean hasSpoiler = false;

    @JsonIgnore
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "review_likes",
        joinColumns        = @JoinColumn(name = "review_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    @Builder.Default
    private Set<User> likedBy = new HashSet<>();

    public int getLikesCount() {
        return likedBy.size();
    }

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
