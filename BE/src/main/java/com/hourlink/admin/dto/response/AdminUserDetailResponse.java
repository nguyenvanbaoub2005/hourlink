package com.hourlink.admin.dto.response;

import com.hourlink.user.enums.UserType;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class AdminUserDetailResponse {
    private UUID id;
    private String fullName;
    private String email;
    private String phone;
    private UserType userType;
    private String region;
    private String occupation;
    private String avatarUrl;
    private String bio;
    
    private boolean isVerified;
    private boolean isLocked;
    private boolean isDeleted;
    
    private double reputationScore;
    private int completedSessions;
    private double cancelRate;
    
    private String adminNotes;
    private int warningCount;
    private Instant createdAt;

    // We can include a summary of actions
    private List<UserAdminActionDto> adminActions;

    @Data
    @Builder
    public static class UserAdminActionDto {
        private String actionType;
        private String reason;
        private String adminName;
        private Instant createdAt;
    }
}
