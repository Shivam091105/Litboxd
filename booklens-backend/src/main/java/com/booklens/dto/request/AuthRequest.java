package com.booklens.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

// ── Register ──────────────────────────────────────────────────────────────────
public class AuthRequest {

    @Data
    public static class Register {
        @NotBlank
        @Size(min = 3, max = 50)
        private String username;

        @NotBlank
        @Email
        private String email;

        @NotBlank
        @Size(min = 8, max = 100)
        private String password;

        @Size(max = 100)
        private String displayName;
    }

    @Data
    public static class Login {
        @NotBlank
        private String usernameOrEmail;

        @NotBlank
        private String password;
    }

    @Data
    public static class Refresh {
        @NotBlank
        private String refreshToken;
    }
}
