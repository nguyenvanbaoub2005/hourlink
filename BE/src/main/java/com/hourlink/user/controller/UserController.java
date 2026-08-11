package com.hourlink.user.controller;
import com.hourlink.common.response.ApiResponse;
import com.hourlink.user.dto.ChangePasswordRequest;
import com.hourlink.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

/**
 * UserController — TODO: implement endpoints quản lý người dùng.
 *
 * GET    /users              — Danh sách users (ADMIN)
 * GET    /users/{id}         — Chi tiết user (ADMIN)
 * GET    /users/profile      — Xem hồ sơ bản thân
 * PUT    /users/profile      — Cập nhật hồ sơ bản thân
 * POST   /users/change-password
 * PUT    /users/{id}/lock    — Khóa tài khoản (ADMIN)
 * PUT    /users/{id}/unlock  — Mở khóa tài khoản (ADMIN)
 * GET    /users/{id}/badges  — Xem huy hiệu
 */
@Tag(name = "User Management")
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserController {

    UserService userService;

    @Operation(summary = "Xem hồ sơ công khai của một người dùng",
            description = "Không trả về email / số điện thoại / ngày sinh. Kèm kỹ năng đang hiển thị và huy hiệu đã đạt.")
    @GetMapping("/{id}")
    public ApiResponse<com.hourlink.user.dto.PublicProfileResponse> getPublicProfile(
            @PathVariable java.util.UUID id) {
        return ApiResponse.success(userService.getPublicProfile(id));
    }

    @Operation(summary = "Xem hồ sơ bản thân")
    @GetMapping("/profile")
    public ApiResponse<com.hourlink.user.dto.UserDto> getMyProfile() {
        return ApiResponse.success(userService.getMyProfile());
    }

    @Operation(summary = "Cập nhật hồ sơ bản thân")
    @PutMapping("/profile")
    public ApiResponse<com.hourlink.user.dto.UserDto> updateMyProfile(
            @jakarta.validation.Valid @RequestBody com.hourlink.user.dto.ProfileUpdateRequest request) {
        return ApiResponse.success(userService.updateMyProfile(request));
    }

    @Operation(summary = "Đổi mật khẩu")
    @PostMapping("/change-password")
    public ApiResponse<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(request);
        return ApiResponse.noContent("Đổi mật khẩu thành công");
    }
}
