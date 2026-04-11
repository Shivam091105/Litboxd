package com.booklens.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * BookList — a curated list of books created by a user.
 *
 * Books are stored as a list of externalBookIds (Open Library IDs).
 * Full book data is fetched from the API when the list is rendered.
 */
@Entity
@Table(name = "book_lists")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class BookList {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 1000)
    private String description;

    @Builder.Default
    private boolean isPublic = true;

    /**
     * Ordered list of Open Library work IDs.
     * Stored in a separate join table with position ordering.
     */
    @ElementCollection
    @CollectionTable(
        name = "list_book_ids",
        joinColumns = @JoinColumn(name = "list_id")
    )
    @Column(name = "external_book_id", length = 50)
    @OrderColumn(name = "position")
    @Builder.Default
    private List<String> externalBookIds = new ArrayList<>();

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
