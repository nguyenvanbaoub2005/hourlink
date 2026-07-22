package com.hourlink.user.entity;

import com.hourlink.common.entity.BaseEntity;
import com.hourlink.common.constant.AppConstants;
import com.hourlink.user.enums.UserType;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * User — Entity chính của người dùng HourLink.
 * Maps tới bảng `users` trong DB.
 */
@Entity
@Table(name = "users", indexes = {
        @Index(name = "idx_user_email",  columnList = "email",  unique = true),
        @Index(name = "idx_user_phone",  columnList = "phone",  unique = true),
        @Index(name = "idx_user_type",   columnList = "user_type")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class User extends BaseEntity {

    @Column(name = "full_name", nullable = false, length = 150)
    String fullName;

    @Column(name = "email", nullable = false, unique = true, length = 150)
    String email;

    @Column(name = "phone", unique = true, length = 20)
    String phone;

    @Column(name = "password_hash", nullable = false, length = 255)
    String passwordHash;

    @Column(name = "dob")
    java.time.LocalDate dob;

    @Column(name = "region", length = 200)
    String region;

    @Column(name = "occupation", length = 150)
    String occupation;

    @Enumerated(EnumType.STRING)
    @Column(name = "user_type", nullable = false, length = 20)
    @Builder.Default
    UserType userType = UserType.individual;

    @Column(name = "avatar_url", length = 500)
    String avatarUrl;

    @Column(name = "bio", columnDefinition = "TEXT")
    String bio;

    @Column(name = "languages", length = 255)
    String languages;

    @Column(name = "is_verified", nullable = false)
    @Builder.Default
    boolean isVerified = false;

    @Column(name = "is_locked", nullable = false)
    @Builder.Default
    boolean isLocked = false;

    @Column(name = "reputation_score", nullable = false)
    @Builder.Default
    double reputationScore = AppConstants.DEFAULT_REPUTATION_SCORE;

    @Column(name = "completed_sessions", nullable = false)
    @Builder.Default
    int completedSessions = 0;

    @Column(name = "cancel_rate", nullable = false)
    @Builder.Default
    double cancelRate = 0.0;

    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    java.util.List<UserRole> userRoles;
}
