package com.booklens.service;

import com.booklens.entity.User;
import com.booklens.exception.BookLensException;
import com.booklens.repository.BookLogRepository;
import com.booklens.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository    userRepository;
    private final BookLogRepository bookLogRepository;
    private final PasswordEncoder   passwordEncoder;

    @Transactional(readOnly = true)
    public Map<String, Object> getProfile(String username, Long currentUserId) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new BookLensException("User not found", HttpStatus.NOT_FOUND));

        int year = LocalDate.now().getYear();
        // FIX: pass LocalDate parameters matching the fixed repository signature
        long readThisYr = bookLogRepository.countBooksReadInYear(
            user.getId(),
            LocalDate.of(year, 1, 1),
            LocalDate.of(year + 1, 1, 1)
        );

        boolean isFollowing = currentUserId != null &&
            user.getFollowers().stream().anyMatch(f -> f.getId().equals(currentUserId));

        return Map.ofEntries(
            Map.entry("id",                 user.getId()),
            Map.entry("username",           user.getUsername()),
            Map.entry("displayName",        user.getDisplayName() != null ? user.getDisplayName() : user.getUsername()),
            Map.entry("bio",                user.getBio() != null ? user.getBio() : ""),
            Map.entry("avatarUrl",          user.getAvatarUrl() != null ? user.getAvatarUrl() : ""),
            Map.entry("location",           user.getLocation() != null ? user.getLocation() : ""),
            Map.entry("booksRead",          user.getBookLogs().size()),
            Map.entry("reviewsCount",       user.getReviews().size()),
            Map.entry("listsCount",         user.getLists().size()),
            Map.entry("followersCount",     user.getFollowers().size()),
            Map.entry("followingCount",     user.getFollowing().size()),
            Map.entry("readingGoal",        user.getReadingGoal() != null ? user.getReadingGoal() : 36),
            Map.entry("booksReadThisYear",  readThisYr),
            Map.entry("isFollowedByViewer", isFollowing),
            Map.entry("memberSince",        user.getCreatedAt() != null ? user.getCreatedAt().toString() : "")
        );
    }

    @Transactional
    public User updateProfile(Long userId, Map<String, Object> updates) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BookLensException("User not found", HttpStatus.NOT_FOUND));

        if (updates.containsKey("displayName")) user.setDisplayName((String) updates.get("displayName"));
        if (updates.containsKey("bio"))         user.setBio((String) updates.get("bio"));
        if (updates.containsKey("location"))    user.setLocation((String) updates.get("location"));
        if (updates.containsKey("avatarUrl"))   user.setAvatarUrl((String) updates.get("avatarUrl"));
        if (updates.containsKey("readingGoal")) user.setReadingGoal(((Number) updates.get("readingGoal")).intValue());
        if (updates.containsKey("password"))    user.setPassword(passwordEncoder.encode((String) updates.get("password")));

        return userRepository.save(user);
    }

    @Transactional
    public Map<String, Object> follow(Long followerId, Long targetId) {
        if (followerId.equals(targetId))
            throw new BookLensException("Cannot follow yourself", HttpStatus.BAD_REQUEST);
        User follower = getUser(followerId);
        User target   = getUser(targetId);
        follower.follow(target);
        userRepository.save(follower);
        return Map.of("following", true, "followersCount", target.getFollowers().size());
    }

    @Transactional
    public Map<String, Object> unfollow(Long followerId, Long targetId) {
        User follower = getUser(followerId);
        User target   = getUser(targetId);
        follower.unfollow(target);
        userRepository.save(follower);
        return Map.of("following", false, "followersCount", target.getFollowers().size());
    }

    @Transactional(readOnly = true)
    public List<User> getSuggestedUsers(Long userId, int limit) {
        return userRepository.findSuggestedUsers(userId, PageRequest.of(0, limit));
    }

    private User getUser(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new BookLensException("User not found", HttpStatus.NOT_FOUND));
    }
}
