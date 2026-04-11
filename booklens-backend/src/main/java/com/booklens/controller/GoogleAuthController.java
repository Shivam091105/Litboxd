package com.booklens.controller;

import com.booklens.entity.User;
import com.booklens.exception.BookLensException;
import com.booklens.repository.UserRepository;
import com.booklens.security.JwtUtils;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * Google OAuth2 Sign-In flow:
 *
 * 1. Frontend opens Google Sign-In popup via @react-oauth/google
 * 2. Google returns a credential (ID token) to the frontend
 * 3. Frontend POSTs that token here
 * 4. We verify the token with Google's servers
 * 5. We create/find the user and return our own JWT
 *
 * The frontend never needs to handle Google tokens after this point —
 * it uses our standard JWT for all subsequent requests.
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Slf4j
public class GoogleAuthController {

    private final UserRepository  userRepository;
    private final JwtUtils        jwtUtils;
    private final PasswordEncoder passwordEncoder;

    @Value("${google.client-id}")
    private String googleClientId;

    /**
     * POST /api/v1/auth/google
     * Body: { "credential": "<google_id_token>" }
     */
    @PostMapping("/google")
    public ResponseEntity<Map<String, Object>> googleSignIn(
        @RequestBody Map<String, String> body
    ) {
        String credential = body.get("credential");
        if (credential == null || credential.isBlank()) {
            throw new BookLensException("Missing Google credential", HttpStatus.BAD_REQUEST);
        }

        GoogleIdToken.Payload payload = verifyGoogleToken(credential);

        String googleEmail  = payload.getEmail();
        String googleName   = (String) payload.get("name");
        String googleAvatar = (String) payload.get("picture");
        String googleSub    = payload.getSubject(); // unique Google user ID

        // Find existing user by email or create new one
        User user = userRepository.findByEmail(googleEmail).orElseGet(() -> {
            // Auto-generate a unique username from name
            String base = googleName != null
                ? googleName.toLowerCase().replaceAll("[^a-z0-9]", "_")
                : googleEmail.split("@")[0];
            String username = ensureUniqueUsername(base);

            return userRepository.save(User.builder()
                .username(username)
                .email(googleEmail)
                .displayName(googleName != null ? googleName : username)
                .avatarUrl(googleAvatar)
                // Password not used for OAuth users but column is NOT NULL
                .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                .build());
        });

        // Update avatar if changed on Google side
        if (googleAvatar != null && !googleAvatar.equals(user.getAvatarUrl())) {
            user.setAvatarUrl(googleAvatar);
            userRepository.save(user);
        }

        UserDetails details = toUserDetails(user);
        return ResponseEntity.ok(Map.of(
            "accessToken",  jwtUtils.generateToken(details),
            "refreshToken", jwtUtils.generateRefreshToken(details),
            "tokenType",    "Bearer",
            "user", Map.of(
                "id",          user.getId(),
                "username",    user.getUsername(),
                "displayName", user.getDisplayName() != null ? user.getDisplayName() : user.getUsername(),
                "avatarUrl",   user.getAvatarUrl() != null ? user.getAvatarUrl() : ""
            )
        ));
    }

    // ── Verify the Google ID token with Google's public keys ─────────────
    private GoogleIdToken.Payload verifyGoogleToken(String idTokenString) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(), GsonFactory.getDefaultInstance()
            )
                .setAudience(Collections.singletonList(googleClientId))
                .build();

            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken == null) {
                throw new BookLensException("Invalid Google token", HttpStatus.UNAUTHORIZED);
            }
            return idToken.getPayload();
        } catch (BookLensException e) {
            throw e;
        } catch (Exception e) {
            log.error("Google token verification failed: {}", e.getMessage());
            throw new BookLensException("Google sign-in failed", HttpStatus.UNAUTHORIZED);
        }
    }

    // ── Ensure username is unique by appending a number if needed ─────────
    private String ensureUniqueUsername(String base) {
        String candidate = base.length() > 30 ? base.substring(0, 30) : base;
        if (!userRepository.existsByUsername(candidate)) return candidate;
        int i = 1;
        while (userRepository.existsByUsername(candidate + i)) i++;
        return candidate + i;
    }

    private UserDetails toUserDetails(User user) {
        return new org.springframework.security.core.userdetails.User(
            user.getUsername(), user.getPassword(), user.isEnabled(),
            true, true, true,
            List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );
    }
}
