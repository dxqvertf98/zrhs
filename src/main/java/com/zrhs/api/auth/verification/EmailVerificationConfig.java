package com.zrhs.api.auth.verification;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(EmailVerificationProperties.class)
public class EmailVerificationConfig {
}
