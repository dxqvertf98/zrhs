package com.zrhs.api.auth.social;

import java.util.ArrayList;
import java.util.List;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;

@Configuration
@EnableConfigurationProperties(OAuthProperties.class)
public class OAuthClientConfig {
    @Bean
    public ClientRegistrationRepository clientRegistrationRepository(OAuthProperties properties) {
        List<ClientRegistration> registrations = new ArrayList<>();
        if (properties.isEnabled("google")) {
            registrations.add(google(properties.getProviders().get("google")));
        }
        if (properties.isEnabled("kakao")) {
            registrations.add(kakao(properties.getProviders().get("kakao")));
        }
        return new ConfiguredClientRegistrationRepository(registrations);
    }

    private ClientRegistration google(OAuthProperties.Provider provider) {
        return ClientRegistration.withRegistrationId("google")
                .clientId(provider.getClientId())
                .clientSecret(provider.getClientSecret())
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
                // openid scope를 쓰면 OIDC 처리기가 선택되어 커스텀 사용자 저장 로직을 우회하므로 제외합니다.
                .scope("profile", "email")
                .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
                .tokenUri("https://oauth2.googleapis.com/token")
                .jwkSetUri("https://www.googleapis.com/oauth2/v3/certs")
                .userInfoUri("https://openidconnect.googleapis.com/v1/userinfo")
                .userNameAttributeName("sub")
                .clientName("Google")
                .build();
    }

    private ClientRegistration kakao(OAuthProperties.Provider provider) {
        ClientAuthenticationMethod authenticationMethod = provider.getClientSecret() == null || provider.getClientSecret().isBlank()
                ? ClientAuthenticationMethod.NONE
                : ClientAuthenticationMethod.CLIENT_SECRET_POST;
        return ClientRegistration.withRegistrationId("kakao")
                .clientId(provider.getClientId())
                .clientSecret(provider.getClientSecret())
                .clientAuthenticationMethod(authenticationMethod)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
                .scope("profile_nickname", "account_email")
                .authorizationUri("https://kauth.kakao.com/oauth/authorize")
                .tokenUri("https://kauth.kakao.com/oauth/token")
                .userInfoUri("https://kapi.kakao.com/v2/user/me")
                .userNameAttributeName("id")
                .clientName("Kakao")
                .build();
    }
}
