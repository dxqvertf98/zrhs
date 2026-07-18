package com.zrhs.api.auth.social;

import com.zrhs.api.user.User;
import java.util.Map;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

@Service
public class SocialOAuth2UserService extends DefaultOAuth2UserService {
    private final SocialAccountService socialAccountService;

    public SocialOAuth2UserService(SocialAccountService socialAccountService) {
        this.socialAccountService = socialAccountService;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oauthUser = super.loadUser(userRequest);
        SocialProvider provider = SocialProvider.fromRegistrationId(userRequest.getClientRegistration().getRegistrationId());
        Map<String, Object> attributes = oauthUser.getAttributes();
        String providerUserId = requiredValue(attributes, provider == SocialProvider.GOOGLE ? "sub" : "id");
        User user = socialAccountService.findOrCreate(provider, providerUserId, displayName(provider, attributes));
        return new SocialOAuth2User(user, attributes);
    }

    private String displayName(SocialProvider provider, Map<String, Object> attributes) {
        if (provider == SocialProvider.GOOGLE) {
            return firstNonBlank(asString(attributes.get("name")), asString(attributes.get("email")));
        }
        Object properties = attributes.get("properties");
        if (properties instanceof Map<?, ?> propertyMap) {
            return firstNonBlank(asString(propertyMap.get("nickname")), asString(attributes.get("id")));
        }
        return asString(attributes.get("id"));
    }

    private String requiredValue(Map<String, Object> attributes, String name) {
        String value = asString(attributes.get(name));
        if (value == null || value.isBlank()) {
            throw new OAuth2AuthenticationException("소셜 계정 식별 정보를 가져오지 못했습니다.");
        }
        return value;
    }

    private String firstNonBlank(String first, String second) {
        return first != null && !first.isBlank() ? first : second;
    }

    private String asString(Object value) {
        return value == null ? null : String.valueOf(value);
    }
}
