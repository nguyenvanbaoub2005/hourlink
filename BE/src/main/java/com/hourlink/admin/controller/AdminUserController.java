package com.hourlink.admin.controller;

import com.hourlink.admin.dto.request.AdminCreateUserRequest;
import com.hourlink.admin.dto.request.AdminUpdateUserRequest;
import com.hourlink.admin.dto.request.AdminNoteUpdateRequest;
import com.hourlink.admin.dto.request.UserActionRequest;
import com.hourlink.admin.dto.response.AdminUserDetailResponse;
import com.hourlink.admin.dto.response.AdminUserResponse;
import com.hourlink.admin.service.AdminUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public ResponseEntity<Page<AdminUserResponse>> getUsers(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String userType,
            @RequestParam(required = false) Boolean locked,
            @RequestParam(required = false) Boolean verified,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(adminUserService.getUsers(name, email, phone, userType, locked, verified, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminUserDetailResponse> getUserDetail(@PathVariable UUID id) {
        return ResponseEntity.ok(adminUserService.getUserDetail(id));
    }

    @PutMapping("/{id}/notes")
    public ResponseEntity<Void> updateUserNotes(
            @PathVariable UUID id,
            @RequestBody AdminNoteUpdateRequest request) {
        adminUserService.updateUserNotes(id, request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/actions")
    public ResponseEntity<Void> performAction(
            @PathVariable UUID id,
            @Valid @RequestBody UserActionRequest request,
            Authentication authentication) {
        // authentication.getName() returns the email of the admin
        adminUserService.performAction(id, request, authentication.getName());
        return ResponseEntity.ok().build();
    }

    @PostMapping
    public ResponseEntity<Void> createUser(@Valid @RequestBody AdminCreateUserRequest request) {
        adminUserService.createUser(request);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> updateUser(
            @PathVariable UUID id,
            @Valid @RequestBody AdminUpdateUserRequest request) {
        adminUserService.updateUser(id, request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/upload-avatar")
    public ResponseEntity<String> uploadAvatar(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(adminUserService.uploadAvatar(file));
    }

    @PostMapping("/{id}/reset-password")
    public ResponseEntity<Void> resetPassword(@PathVariable UUID id) {
        adminUserService.resetPassword(id);
        return ResponseEntity.ok().build();
    }
}
