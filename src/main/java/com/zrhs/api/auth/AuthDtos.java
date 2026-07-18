package com.zrhs.api.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public final class AuthDtos {
    private AuthDtos() {
    }

    public record SignUpRequest(
            @NotBlank @Pattern(regexp = "^[a-zA-Z0-9_.-]{4,40}$", message = "아이디는 영문, 숫자, . _ - 만 사용해 4~40자로 입력하세요.") String username,
            @NotBlank @Size(min = 8, max = 72, message = "비밀번호는 8~72자로 입력하세요.") String password,
            @NotBlank @Size(max = 50) String displayName,
            @NotBlank @Size(max = 10) String preferredLanguage
    ) {
    }

    public record LoginRequest(
            @NotBlank String username,
            @NotBlank String password
    ) {
    }

    public record UserResponse(Long id, String username, String displayName, String preferredLanguage, Instant createdAt) {
    }

    public record AuthResponse(String accessToken, String tokenType, long expiresInSeconds, UserResponse user) {
    }
}
