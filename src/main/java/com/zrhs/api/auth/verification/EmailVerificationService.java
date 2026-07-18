package com.zrhs.api.auth.verification;

import com.zrhs.api.common.BadRequestException;
import com.zrhs.api.common.ServiceUnavailableException;
import com.zrhs.api.user.User;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.UriComponentsBuilder;

@Service
@Transactional(readOnly = true)
public class EmailVerificationService {
    private final EmailVerificationTokenRepository tokenRepository;
    private final EmailVerificationProperties properties;
    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final SecureRandom secureRandom = new SecureRandom();

    public EmailVerificationService(
            EmailVerificationTokenRepository tokenRepository,
            EmailVerificationProperties properties,
            ObjectProvider<JavaMailSender> mailSenderProvider
    ) {
        this.tokenRepository = tokenRepository;
        this.properties = properties;
        this.mailSenderProvider = mailSenderProvider;
    }

    public boolean isRequired() {
        return properties.isEnabled();
    }

    @Transactional
    public void sendVerificationEmail(User user) {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            throw new ServiceUnavailableException("이메일 인증이 켜져 있지만 메일 서버가 설정되지 않았습니다.");
        }

        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        tokenRepository.deleteByUserId(user.getId());
        tokenRepository.save(new EmailVerificationToken(
                user,
                hash(rawToken),
                Instant.now().plusSeconds(properties.getTokenExpirationMinutes() * 60)
        ));

        String verifyUrl = UriComponentsBuilder.fromUriString(properties.getVerificationUrl())
                .queryParam("token", rawToken)
                .toUriString();
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(properties.getFrom());
        message.setTo(user.getEmail());
        message.setSubject("맥아리 통역사 이메일 인증");
        message.setText("아래 링크를 열어 회원가입을 완료해 주세요.\n\n" + verifyUrl
                + "\n\n링크는 " + properties.getTokenExpirationMinutes() + "분 동안 유효합니다.");
        try {
            mailSender.send(message);
        } catch (MailException exception) {
            throw new ServiceUnavailableException("인증 메일을 보내지 못했습니다. 메일 서버 설정을 확인해 주세요.");
        }
    }

    @Transactional
    public void verify(String rawToken) {
        EmailVerificationToken token = tokenRepository.findByTokenHash(hash(rawToken))
                .orElseThrow(() -> new BadRequestException("유효하지 않은 이메일 인증 링크입니다."));
        if (token.getUsedAt() != null || token.getExpiresAt().isBefore(Instant.now())) {
            throw new BadRequestException("만료되었거나 이미 사용한 이메일 인증 링크입니다.");
        }
        token.getUser().markEmailVerified();
        token.markUsed();
    }

    private String hash(String value) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256을 사용할 수 없습니다.", exception);
        }
    }
}
