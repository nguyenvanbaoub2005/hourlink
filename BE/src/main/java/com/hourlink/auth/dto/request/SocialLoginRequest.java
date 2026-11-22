package com.hourlink.auth.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Yêu cầu đăng nhập qua Firebase Auth BaaS (Google / Apple).
 * Nếu backend có cấu hình Firebase Admin SDK và client gửi idToken thật từ Firebase Auth,
 * backend sẽ verify chữ ký idToken trực tiếp qua FirebaseAuth.verifyIdToken().
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SocialLoginRequest {

    @NotBlank(message = "Provider không được để trống")
    @Pattern(regexp = "google|apple|firebase", message = "Provider phải là google, apple hoặc firebase")
    String provider;

    /** Firebase ID Token do Firebase Auth cấp ở phía client */
    String idToken;

    @Email(message = "Email không đúng định dạng")
    String email;

    String fullName;

    String avatarUrl;
}
