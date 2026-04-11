package com.booklens.service;

import com.booklens.dto.request.AuthRequest;
import com.booklens.entity.User;
import com.booklens.exception.BookLensException;
import com.booklens.repository.UserRepository;
import com.booklens.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.authentication.*;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository     userRepository;
    private final PasswordEncoder    passwordEncoder;
    private final JwtUtils           jwtUtils;
    private final AuthenticationManager authManager;
    private final UserDetailsService userDetailsService;

    // ── Register ──────────────────────────────────────────────────────────
    @Transactional
    public Map<String, Object> register(AuthRequest.Register request) {
        if (userRepository.existsByUsername(request.getUsername()))
            throw new BookLensException("Username already taken", HttpStatus.CONFLICT);

        if (userRepository.existsByEmail(request.getEmail()))
            throw new BookLensException("Email already registered", HttpStatus.CONFLICT);

        User user = User.builder()
            .username(request.getUsername())
            .email(request.getEmail())
            .password(passwordEncoder.encode(request.getPassword()))
            .displayName(request.getDisplayName() != null
                ? request.getDisplayName()
                : request.getUsername())
            .build();

        userRepository.save(user);

        UserDetails details = userDetailsService.loadUserByUsername(user.getUsername());
        return buildTokenResponse(details, user);
    }

    // ── Login ─────────────────────────────────────────────────────────────
    public Map<String, Object> login(AuthRequest.Login request) {
        try {
            authManager.authenticate(new UsernamePasswordAuthenticationToken(
                request.getUsernameOrEmail(), request.getPassword()
            ));
        } catch (AuthenticationException e) {
            throw new BookLensException("Invalid credentials", HttpStatus.UNAUTHORIZED);
        }

        // Resolve user (could be email or username)
        User user = userRepository.findByUsername(request.getUsernameOrEmail())
            .or(() -> userRepository.findByEmail(request.getUsernameOrEmail()))
            .orElseThrow(() -> new BookLensException("User not found", HttpStatus.NOT_FOUND));

        UserDetails details = userDetailsService.loadUserByUsername(user.getUsername());
        return buildTokenResponse(details, user);
    }

    // ── Token refresh ─────────────────────────────────────────────────────
    public Map<String, Object> refresh(AuthRequest.Refresh request) {
        String username = jwtUtils.extractUsername(request.getRefreshToken());
        UserDetails details = userDetailsService.loadUserByUsername(username);

        if (!jwtUtils.isTokenValid(request.getRefreshToken(), details))
            throw new BookLensException("Refresh token expired or invalid", HttpStatus.UNAUTHORIZED);

        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new BookLensException("User not found", HttpStatus.NOT_FOUND));

        return buildTokenResponse(details, user);
    }

    // ── Build response map ────────────────────────────────────────────────
    private Map<String, Object> buildTokenResponse(UserDetails details, User user) {
        return Map.of(
            "accessToken",  jwtUtils.generateToken(details),
            "refreshToken", jwtUtils.generateRefreshToken(details),
            "tokenType",    "Bearer",
            "user", Map.of(
                "id",          user.getId(),
                "username",    user.getUsername(),
                "displayName", user.getDisplayName(),
                "avatarUrl",   user.getAvatarUrl() != null ? user.getAvatarUrl() : ""
            )
        );
    }
}
