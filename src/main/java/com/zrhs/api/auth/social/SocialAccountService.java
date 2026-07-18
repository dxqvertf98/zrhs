package com.zrhs.api.auth.social;

import com.zrhs.api.user.User;
import com.zrhs.api.user.UserRepository;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class SocialAccountService {
    private final SocialAccountRepository socialAccountRepository;
    private final UserRepository userRepository;

    public SocialAccountService(SocialAccountRepository socialAccountRepository, UserRepository userRepository) {
        this.socialAccountRepository = socialAccountRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public User findOrCreate(SocialProvider provider, String providerUserId, String displayName) {
        return socialAccountRepository.findByProviderAndProviderUserId(provider, providerUserId)
                .map(SocialAccount::getUser)
                .orElseGet(() -> createUser(provider, providerUserId, displayName));
    }

    private User createUser(SocialProvider provider, String providerUserId, String displayName) {
        String username = createSocialUsername(provider);
        String safeDisplayName = (displayName == null || displayName.isBlank())
                ? provider.name().toLowerCase() + " 사용자"
                : displayName.trim();
        if (safeDisplayName.length() > 50) {
            safeDisplayName = safeDisplayName.substring(0, 50);
        }

        User user = userRepository.save(new User(username, null, safeDisplayName, "ko"));
        socialAccountRepository.save(new SocialAccount(user, provider, providerUserId));
        return user;
    }

    private String createSocialUsername(SocialProvider provider) {
        String prefix = provider.name().toLowerCase() + "_";
        String username;
        do {
            username = prefix + UUID.randomUUID().toString().replace("-", "").substring(0, 24);
        } while (userRepository.existsByUsername(username));
        return username;
    }
}
