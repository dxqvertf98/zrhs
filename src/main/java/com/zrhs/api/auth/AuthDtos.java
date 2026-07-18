package com.zrhs.api.auth;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public final class AuthDtos {
    private AuthDtos() {
    }

    public record SignUpRequest(
            @NotBlank @Pattern(regexp = "^[a-zA-Z0-9_.-]{4,40}$", message = "아이디는 영문, 숫자, . _ - 만 사용해 4~40자로 입력하세요.") String username,
            @NotBlank @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).{10,72}$", message = "비밀번호는 영문과 숫자를 포함해 10~72자로 입력하세요.") String password,
            @NotBlank @Size(max = 50) String displayName,
            @NotBlank @Size(max = 10) String preferredLanguage,
            @NotBlank @Email @Size(max = 254) String email,
            @AssertTrue(message = "서비스 이용약관과 개인정보 처리방침에 동의해 주세요.") boolean termsAccepted
    ) {
    }

    public record LoginRequest(
            @NotBlank String username,
            @NotBlank String password
    ) {
    }

    public record UserResponse(Long id, String username, String displayName, String preferredLanguage, String email, boolean emailVerified, Instant createdAt) {
    }

    public record AuthResponse(String accessToken, String tokenType, long expiresInSeconds, UserResponse user) {
    }

    public record RegistrationResponse(AuthResponse authentication, boolean emailVerificationRequired, String message) {
    }

    public record ResendVerificationRequest(@NotBlank @Email @Size(max = 254) String email) {
    }
}
