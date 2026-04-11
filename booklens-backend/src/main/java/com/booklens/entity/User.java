package com.booklens.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users", uniqueConstraints = {
    @UniqueConstraint(name = "uc_users_username", columnNames = "username"),
    @UniqueConstraint(name = "uc_users_email",    columnNames = "email")
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String username;

    @JsonIgnore
    @Column(nullable = false)
    private String email;

    @JsonIgnore
    @Column(nullable = false)
    private String password;

    @Column(length = 100)
    private String displayName;

    @Column(length = 500)
    private String bio;

    private String avatarUrl;
    private String location;

    @Column(nullable = false)
    @Builder.Default
    private boolean enabled = true;

    /** User's annual reading goal (books per year) */
    private Integer readingGoal;

    // ── Relationships ──────────────────────────────────────────────────────
    @JsonIgnore
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private Set<BookLog> bookLogs = new HashSet<>();

    @JsonIgnore
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private Set<Review> reviews = new HashSet<>();

    @JsonIgnore
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "follows",
        joinColumns        = @JoinColumn(name = "follower_id"),
        inverseJoinColumns = @JoinColumn(name = "following_id")
    )
    @Builder.Default
    private Set<User> following = new HashSet<>();

    @JsonIgnore
    @ManyToMany(mappedBy = "following", fetch = FetchType.LAZY)
    @Builder.Default
    private Set<User> followers = new HashSet<>();

    @JsonIgnore
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private Set<BookList> lists = new HashSet<>();

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // ── Domain logic ──────────────────────────────────────────────────────
    public void follow(User other) {
        this.following.add(other);
        other.getFollowers().add(this);
    }

    public void unfollow(User other) {
        this.following.remove(other);
        other.getFollowers().remove(this);
    }
}
