package com.zrhs.api.auth.social;

public enum SocialProvider {
    GOOGLE,
    KAKAO;

    public static SocialProvider fromRegistrationId(String registrationId) {
        return SocialProvider.valueOf(registrationId.toUpperCase(java.util.Locale.ROOT));
    }
}
