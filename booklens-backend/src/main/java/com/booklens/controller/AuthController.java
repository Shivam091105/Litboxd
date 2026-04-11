package com.booklens.controller;

import com.booklens.dto.request.AuthRequest;
import com.booklens.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * POST /api/v1/auth/register
     * Body: { username, email, password, displayName? }
     */
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(
        @Valid @RequestBody AuthRequest.Register request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    /**
     * POST /api/v1/auth/login
     * Body: { usernameOrEmail, password }
     */
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(
        @Valid @RequestBody AuthRequest.Login request
    ) {
        return ResponseEntity.ok(authService.login(request));
    }

    /**
     * POST /api/v1/auth/refresh
     * Body: { refreshToken }
     */
    @PostMapping("/refresh")
    public ResponseEntity<Map<String, Object>> refresh(
        @Valid @RequestBody AuthRequest.Refresh request
    ) {
        return ResponseEntity.ok(authService.refresh(request));
    }
}
