package com.zrhs.api.auth.verification;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.email-verification")
public class EmailVerificationProperties {
    private boolean enabled;
    private String from;
    private String verificationUrl;
    private long tokenExpirationMinutes;

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public String getFrom() { return from; }
    public void setFrom(String from) { this.from = from; }
    public String getVerificationUrl() { return verificationUrl; }
    public void setVerificationUrl(String verificationUrl) { this.verificationUrl = verificationUrl; }
    public long getTokenExpirationMinutes() { return tokenExpirationMinutes; }
    public void setTokenExpirationMinutes(long tokenExpirationMinutes) { this.tokenExpirationMinutes = tokenExpirationMinutes; }
}
