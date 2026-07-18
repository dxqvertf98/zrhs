package com.zrhs.api.auth.social;

import com.zrhs.api.auth.AuthDtos.AuthResponse;
import com.zrhs.api.auth.AuthService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.net.URLEncoder;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

@Component
public class OAuthLoginSuccessHandler implements AuthenticationSuccessHandler {
    private final AuthService authService;
    private final OAuthProperties properties;

    public OAuthLoginSuccessHandler(AuthService authService, OAuthProperties properties) {
        this.authService = authService;
        this.properties = properties;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication)
            throws IOException, ServletException {
        if (!(authentication.getPrincipal() instanceof SocialOAuth2User socialUser)) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }
        AuthResponse token = authService.issueAccessToken(socialUser.getUser());
        response.sendRedirect(withFragment("access_token=" + URLEncoder.encode(token.accessToken(), StandardCharsets.UTF_8)
                + "&token_type=" + token.tokenType()));
    }

    private String withFragment(String fragment) {
        String redirectUri = properties.getSuccessRedirectUri();
        int fragmentIndex = redirectUri.indexOf('#');
        String baseUri = fragmentIndex >= 0 ? redirectUri.substring(0, fragmentIndex) : redirectUri;
        return baseUri + "#" + fragment;
    }
}
