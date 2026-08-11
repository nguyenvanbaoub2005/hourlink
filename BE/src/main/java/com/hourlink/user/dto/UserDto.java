package com.hourlink.user.dto;

import com.hourlink.user.enums.UserType;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserDto {
    UUID id;
    String fullName;
    String email;
    String phone;
    LocalDate dob;
    String region;
    String occupation;
    UserType userType;
    String avatarUrl;
    String bio;
    String languages;
    boolean isVerified;
    boolean isLocked;
    double reputationScore;
    int completedSessions;
    double cancelRate;
    
    // trigger recompilation
}
