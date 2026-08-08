package com.hourlink.admin.dto.request;

import com.hourlink.user.enums.UserType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AdminUpdateUserRequest {
    @NotBlank(message = "Họ tên không được để trống")
    @Size(max = 150)
    private String fullName;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    @Size(max = 150)
    private String email;

    @Size(max = 20)
    private String phone;

    private UserType userType;

    @Size(max = 200)
    private String region;

    @Size(max = 150)
    private String occupation;

    @Size(max = 500)
    private String avatarUrl;

    private String bio;

    private Boolean isVerified;
}
