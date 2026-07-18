package com.zrhs.api.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 40)
    private String username;

    @Column
    private String passwordHash;

    @Column(nullable = false, length = 50)
    private String displayName;

    @Column(nullable = false, length = 10)
    private String preferredLanguage;

    @Column(unique = true, length = 254)
    private String email;

    @Column(nullable = false)
    private boolean emailVerified;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected User() {
    }

    public User(String username, String passwordHash, String displayName, String preferredLanguage) {
        this(username, passwordHash, displayName, preferredLanguage, null, true);
    }

    public User(String username, String passwordHash, String displayName, String preferredLanguage, String email, boolean emailVerified) {
        this.username = username;
        this.passwordHash = passwordHash;
        this.displayName = displayName;
        this.preferredLanguage = preferredLanguage;
        this.email = email;
        this.emailVerified = emailVerified;
    }

    @PrePersist
    void setCreatedAt() {
        createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getPasswordHash() { return passwordHash; }
    public String getDisplayName() { return displayName; }
    public String getPreferredLanguage() { return preferredLanguage; }
    public String getEmail() { return email; }
    public boolean isEmailVerified() { return emailVerified; }
    public void markEmailVerified() { this.emailVerified = true; }
    public Instant getCreatedAt() { return createdAt; }
}
