package com.zrhs.api.auth;

import com.zrhs.api.auth.AuthDtos.AuthResponse;
import com.zrhs.api.auth.AuthDtos.LoginRequest;
import com.zrhs.api.auth.AuthDtos.RegistrationResponse;
import com.zrhs.api.auth.AuthDtos.SignUpRequest;
import com.zrhs.api.auth.AuthDtos.UserResponse;
import com.zrhs.api.auth.verification.EmailVerificationService;
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
    private final EmailVerificationService emailVerificationService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService,
                       EmailVerificationService emailVerificationService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.emailVerificationService = emailVerificationService;
    }

    @Transactional
    public RegistrationResponse signUp(SignUpRequest request) {
        String username = normalizeUsername(request.username());
        String email = normalizeEmail(request.email());
        if (userRepository.existsByUsername(username)) {
            throw new ConflictException("이미 사용 중인 아이디입니다.");
        }
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("이미 가입된 이메일입니다.");
        }

        boolean emailVerificationRequired = emailVerificationService.isRequired();
        User user = userRepository.save(new User(
                username,
                passwordEncoder.encode(request.password()),
                request.displayName().trim(),
                request.preferredLanguage().trim(),
                email,
                !emailVerificationRequired
        ));
        if (emailVerificationRequired) {
            emailVerificationService.sendVerificationEmail(user);
            return new RegistrationResponse(null, true, "인증 메일을 보냈습니다. 이메일 인증을 완료한 뒤 로그인해 주세요.");
        }
        return new RegistrationResponse(issueAccessToken(user), false, "회원가입과 로그인이 완료되었습니다.");
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(normalizeUsername(request.username()))
                .orElseThrow(() -> new UnauthorizedException("아이디 또는 비밀번호가 올바르지 않습니다."));
        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new UnauthorizedException("아이디 또는 비밀번호가 올바르지 않습니다.");
        }
        if (!user.isEmailVerified()) {
            throw new UnauthorizedException("이메일 인증을 완료한 뒤 로그인해 주세요.");
        }
        return issueAccessToken(user);
    }

    public UserResponse getUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("로그인 정보를 찾을 수 없습니다."));
        return toUserResponse(user);
    }

    @Transactional
    public void resendVerification(String requestedEmail) {
        if (!emailVerificationService.isRequired()) {
            return;
        }
        userRepository.findByEmail(normalizeEmail(requestedEmail))
                .filter(user -> !user.isEmailVerified())
                .ifPresent(emailVerificationService::sendVerificationEmail);
    }

    public AuthResponse issueAccessToken(User user) {
        return new AuthResponse(
                jwtService.createAccessToken(user.getId(), user.getUsername()),
                "Bearer",
                jwtService.getExpirationSeconds(),
                toUserResponse(user)
        );
    }

    private UserResponse toUserResponse(User user) {
        return new UserResponse(user.getId(), user.getUsername(), user.getDisplayName(), user.getPreferredLanguage(),
                user.getEmail(), user.isEmailVerified(), user.getCreatedAt());
    }

    private String normalizeUsername(String username) {
        return username.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
