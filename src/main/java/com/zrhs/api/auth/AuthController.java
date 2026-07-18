package com.zrhs.api.auth;

import com.zrhs.api.auth.AuthDtos.AuthResponse;
import com.zrhs.api.auth.AuthDtos.LoginRequest;
import com.zrhs.api.auth.AuthDtos.RegistrationResponse;
import com.zrhs.api.auth.AuthDtos.ResendVerificationRequest;
import com.zrhs.api.auth.AuthDtos.SignUpRequest;
import com.zrhs.api.auth.AuthDtos.UserResponse;
import com.zrhs.api.auth.social.OAuthProperties;
import com.zrhs.api.auth.verification.EmailVerificationService;
import com.zrhs.api.security.AuthenticatedUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    private final OAuthProperties oAuthProperties;
    private final EmailVerificationService emailVerificationService;

    public AuthController(AuthService authService, OAuthProperties oAuthProperties, EmailVerificationService emailVerificationService) {
        this.authService = authService;
        this.oAuthProperties = oAuthProperties;
        this.emailVerificationService = emailVerificationService;
    }

    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public RegistrationResponse signUp(@Valid @RequestBody SignUpRequest request) {
        return authService.signUp(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal AuthenticatedUser user) {
        return authService.getUser(user.id());
    }

    @GetMapping("/social/providers")
    public List<String> socialProviders() {
        return List.of("google", "kakao").stream().filter(oAuthProperties::isEnabled).toList();
    }

    @GetMapping("/verify-email")
    public java.util.Map<String, String> verifyEmail(@org.springframework.web.bind.annotation.RequestParam String token) {
        emailVerificationService.verify(token);
        return java.util.Map.of("message", "이메일 인증이 완료되었습니다. 이제 로그인할 수 있습니다.");
    }

    @PostMapping("/verification/resend")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resendVerification(@Valid @RequestBody ResendVerificationRequest request) {
        // 계정 존재 여부를 응답으로 알리지 않아 이메일 수집 공격을 막습니다.
        authService.resendVerification(request.email());
    }
}
