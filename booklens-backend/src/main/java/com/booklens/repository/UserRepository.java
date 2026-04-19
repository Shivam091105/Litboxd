package com.booklens.repository;

import com.booklens.entity.User;
import org.springframework.data.domain.Page;
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

    /** All users except the given one (for Members page) */
    Page<User> findAllByIdNot(Long id, org.springframework.data.domain.Pageable pageable);

    /** All users paginated (for unauthenticated Members page) */
    @Query("SELECT u FROM User u ORDER BY SIZE(u.followers) DESC")
    Page<User> findAllOrderByFollowersDesc(org.springframework.data.domain.Pageable pageable);

    /** Search users by username or displayName */
    @Query("""
        SELECT u FROM User u
        WHERE LOWER(u.username) LIKE LOWER(CONCAT('%', :q, '%'))
           OR LOWER(u.displayName) LIKE LOWER(CONCAT('%', :q, '%'))
        ORDER BY SIZE(u.followers) DESC
        """)
    Page<User> searchUsers(@Param("q") String query, org.springframework.data.domain.Pageable pageable);

    // Find all users that a given user follows
    @Query("SELECT u.following FROM User u WHERE u.id = :userId")
    List<User> findFollowingByUserId(@Param("userId") Long userId);

    // Find all followers of a given user
    @Query("SELECT u.followers FROM User u WHERE u.id = :userId")
    List<User> findFollowersByUserId(@Param("userId") Long userId);

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

    /** Count followers */
    @Query("SELECT SIZE(u.followers) FROM User u WHERE u.id = :userId")
    int countFollowers(@Param("userId") Long userId);

    /** Count following */
    @Query("SELECT SIZE(u.following) FROM User u WHERE u.id = :userId")
    int countFollowing(@Param("userId") Long userId);
}
