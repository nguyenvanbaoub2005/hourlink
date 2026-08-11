package com.hourlink.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProfileUpdateRequest {
    
    @NotBlank(message = "Họ và tên không được để trống")
    String fullName;

    String bio;
    String region;
    String phone;
    String email;
    String occupation;
    String languages;
    String avatarUrl;
    LocalDate dob;
    
    // trigger recompilation
}
