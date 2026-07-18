package com.zrhs.api.auth;

import com.zrhs.api.auth.AuthDtos.AuthResponse;
import com.zrhs.api.auth.AuthDtos.LoginRequest;
import com.zrhs.api.auth.AuthDtos.SignUpRequest;
import com.zrhs.api.auth.AuthDtos.UserResponse;
import com.zrhs.api.common.ConflictException;
import com.zrhs.api.common.UnauthorizedException;
import com.zrhs.api.user.User;
import com.zrhs.api.user.UserRepository;
import java.util.Locale;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse signUp(SignUpRequest request) {
        String username = normalizeUsername(request.username());
        if (userRepository.existsByUsername(username)) {
            throw new ConflictException("이미 사용 중인 아이디입니다.");
        }

        User user = userRepository.save(new User(
                username,
                passwordEncoder.encode(request.password()),
                request.displayName().trim(),
                request.preferredLanguage().trim()
        ));
        return authResponse(user);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(normalizeUsername(request.username()))
                .orElseThrow(() -> new UnauthorizedException("아이디 또는 비밀번호가 올바르지 않습니다."));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new UnauthorizedException("아이디 또는 비밀번호가 올바르지 않습니다.");
        }
        return authResponse(user);
    }

    public UserResponse getUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("로그인 정보를 찾을 수 없습니다."));
        return toUserResponse(user);
    }

    private AuthResponse authResponse(User user) {
        return new AuthResponse(
                jwtService.createAccessToken(user.getId(), user.getUsername()),
                "Bearer",
                jwtService.getExpirationSeconds(),
                toUserResponse(user)
        );
    }

    private UserResponse toUserResponse(User user) {
        return new UserResponse(user.getId(), user.getUsername(), user.getDisplayName(), user.getPreferredLanguage(), user.getCreatedAt());
    }

    private String normalizeUsername(String username) {
        return username.trim().toLowerCase(Locale.ROOT);
    }
}
