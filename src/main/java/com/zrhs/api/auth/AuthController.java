package com.zrhs.api.auth;

import com.zrhs.api.auth.AuthDtos.AuthResponse;
import com.zrhs.api.auth.AuthDtos.LoginRequest;
import com.zrhs.api.auth.AuthDtos.SignUpRequest;
import com.zrhs.api.auth.AuthDtos.UserResponse;
import com.zrhs.api.auth.social.OAuthProperties;
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

    public AuthController(AuthService authService, OAuthProperties oAuthProperties) {
        this.authService = authService;
        this.oAuthProperties = oAuthProperties;
    }

    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse signUp(@Valid @RequestBody SignUpRequest request) {
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
}
