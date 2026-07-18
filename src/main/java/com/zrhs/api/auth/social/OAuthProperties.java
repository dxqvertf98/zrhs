package com.zrhs.api.auth.social;

import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.oauth")
public class OAuthProperties {
    private String successRedirectUri;
    private Map<String, Provider> providers = new LinkedHashMap<>();

    public String getSuccessRedirectUri() { return successRedirectUri; }
    public void setSuccessRedirectUri(String successRedirectUri) { this.successRedirectUri = successRedirectUri; }
    public Map<String, Provider> getProviders() { return providers; }
    public void setProviders(Map<String, Provider> providers) { this.providers = providers; }

    public boolean isEnabled(String provider) {
        Provider configuration = providers.get(provider);
        if (configuration == null || configuration.clientId == null || configuration.clientId.isBlank()) {
            return false;
        }
        // Google의 웹 OAuth 클라이언트는 Client Secret이 반드시 필요합니다.
        return !"google".equals(provider)
                || (configuration.clientSecret != null && !configuration.clientSecret.isBlank());
    }

    public static class Provider {
        private String clientId;
        private String clientSecret;

        public String getClientId() { return clientId; }
        public void setClientId(String clientId) { this.clientId = clientId; }
        public String getClientSecret() { return clientSecret; }
        public void setClientSecret(String clientSecret) { this.clientSecret = clientSecret; }
    }
}
