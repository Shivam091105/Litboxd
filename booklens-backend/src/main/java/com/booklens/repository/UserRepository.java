package com.booklens.repository;

import com.booklens.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);

    // Find all users that a given user follows
    @Query("SELECT u.following FROM User u WHERE u.id = :userId")
    List<User> findFollowingByUserId(@Param("userId") Long userId);

    // Users suggested to follow — not already followed, ordered by follower count
    @Query("""
        SELECT u FROM User u
        WHERE u.id != :currentUserId
        AND u.id NOT IN (
            SELECT f.id FROM User me JOIN me.following f WHERE me.id = :currentUserId
        )
        ORDER BY SIZE(u.followers) DESC
        """)
    List<User> findSuggestedUsers(@Param("currentUserId") Long currentUserId,
                                   org.springframework.data.domain.Pageable pageable);
}
