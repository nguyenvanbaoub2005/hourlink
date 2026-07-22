package com.hourlink.auth.controller;

import com.hourlink.auth.dto.request.IntrospectRequest;
import com.hourlink.auth.dto.request.LoginRequest;
import com.hourlink.auth.dto.request.LogoutRequest;
import com.hourlink.auth.dto.request.RefreshRequest;
import com.hourlink.auth.dto.request.RegisterRequest;
import com.hourlink.auth.dto.response.AuthResponse;
import com.hourlink.auth.dto.response.IntrospectResponse;
import com.hourlink.auth.service.AuthService;
import com.hourlink.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Authentication")
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthController {

    AuthService authService;

    @PostMapping("/login")
    public ApiResponse<AuthResponse> authenticate(@RequestBody @Valid LoginRequest request) {
        var result = authService.authenticate(request);
        return ApiResponse.success(result);
    }

    @PostMapping("/register")
    public ApiResponse<AuthResponse> register(@RequestBody @Valid RegisterRequest request) {
        var result = authService.register(request);
        return ApiResponse.success(result);
    }

    @PostMapping("/introspect")
    public ApiResponse<IntrospectResponse> introspect(@RequestBody IntrospectRequest request) {
        var result = authService.introspect(request);
        return ApiResponse.success(result);
    }

    @PostMapping("/refresh")
    public ApiResponse<AuthResponse> refreshToken(@RequestBody RefreshRequest request) {
        var result = authService.refreshToken(request);
        return ApiResponse.success(result);
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(@RequestBody LogoutRequest request) {
        authService.logout(request);
        return ApiResponse.success(null);
    }
}
