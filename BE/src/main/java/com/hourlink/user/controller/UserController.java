package com.hourlink.user.controller;

import com.hourlink.common.response.ApiResponse;
import com.hourlink.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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

    // TODO: thêm các endpoints
}
