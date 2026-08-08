package com.hourlink.admin.dto.response;

import com.hourlink.user.enums.UserType;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class AdminUserResponse {
    private UUID id;
    private String fullName;
    private String email;
    private String phone;
    private String avatarUrl;
    private UserType userType;
    private boolean isVerified;
    private boolean isLocked;
    private boolean isDeleted;
    private double reputationScore;
    private Instant createdAt;
}
