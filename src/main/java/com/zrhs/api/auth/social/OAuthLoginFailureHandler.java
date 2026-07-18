package com.zrhs.api.auth.social;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

@Component
public class OAuthLoginFailureHandler implements AuthenticationFailureHandler {
    private final OAuthProperties properties;

    public OAuthLoginFailureHandler(OAuthProperties properties) {
        this.properties = properties;
    }

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response, AuthenticationException exception)
            throws IOException {
        String redirectUri = properties.getSuccessRedirectUri();
        int fragmentIndex = redirectUri.indexOf('#');
        String baseUri = fragmentIndex >= 0 ? redirectUri.substring(0, fragmentIndex) : redirectUri;
        String message = exception.getMessage() == null ? "소셜 로그인을 완료하지 못했습니다." : exception.getMessage();
        response.sendRedirect(baseUri + "#oauth_error=" + URLEncoder.encode(message, StandardCharsets.UTF_8));
    }
}
