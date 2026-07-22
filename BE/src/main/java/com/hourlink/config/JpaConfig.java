package com.hourlink.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * JpaConfig — Bật JPA Auditing để @CreatedDate và @LastModifiedDate hoạt động.
 */
@Configuration
@EnableJpaAuditing
public class JpaConfig {
}
