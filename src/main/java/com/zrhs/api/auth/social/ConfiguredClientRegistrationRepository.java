package com.zrhs.api.auth.social;

import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;

/** OAuth 설정이 비어 있어도 서버가 실행되도록 하는 읽기 전용 등록소입니다. */
public class ConfiguredClientRegistrationRepository implements ClientRegistrationRepository, Iterable<ClientRegistration> {
    private final Map<String, ClientRegistration> registrations;

    public ConfiguredClientRegistrationRepository(List<ClientRegistration> registrations) {
        this.registrations = registrations.stream().collect(Collectors.toUnmodifiableMap(
                ClientRegistration::getRegistrationId,
                Function.identity()
        ));
    }

    @Override
    public ClientRegistration findByRegistrationId(String registrationId) {
        return registrations.get(registrationId);
    }

    @Override
    public Iterator<ClientRegistration> iterator() {
        return registrations.values().iterator();
    }
}
