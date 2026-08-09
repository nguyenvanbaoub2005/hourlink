package com.hourlink.admin.controller;

import com.hourlink.admin.dto.request.AdminCategoryCreateRequest;
import com.hourlink.admin.dto.request.AdminCategoryRequest;
import com.hourlink.admin.dto.request.AdminCreateSkillRequest;
import com.hourlink.admin.dto.request.AdminSkillActionRequest;
import com.hourlink.admin.dto.request.AdminUpdateSkillRequest;
import com.hourlink.admin.dto.response.AdminCategoryResponse;
import com.hourlink.admin.dto.response.AdminSkillDetailResponse;
import com.hourlink.admin.dto.response.AdminSkillResponse;
import com.hourlink.admin.service.AdminSkillService;
import com.hourlink.skill.enums.SessionFormat;
import com.hourlink.skill.enums.SkillLevel;
import com.hourlink.skill.enums.SkillStatus;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

/**
 * AdminSkillController — API quản lý kỹ năng dành cho Admin.
 */
@RestController
@RequestMapping("/admin/skills")
@RequiredArgsConstructor
public class AdminSkillController {

    private final AdminSkillService adminSkillService;
    private final com.hourlink.skill.service.SkillAttachmentService attachmentService;

    /** Danh sách kỹ năng có phân trang và lọc */
    @GetMapping
    public ResponseEntity<Page<AdminSkillResponse>> getSkills(
            @RequestParam(required = false) String skillName,
            @RequestParam(required = false) String userName,
            @RequestParam(required = false) String userEmail,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) SkillStatus status,
            @RequestParam(required = false) SkillLevel level,
            @RequestParam(required = false) SessionFormat format,
            @RequestParam(required = false) String region,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(
                adminSkillService.getSkills(skillName, userName, userEmail, categoryId, status, level, format, region, pageable));
    }

    /** Chi tiết kỹ năng bao gồm danh sách minh chứng */
    @GetMapping("/{id}")
    public ResponseEntity<AdminSkillDetailResponse> getSkillDetail(@PathVariable UUID id) {
        return ResponseEntity.ok(adminSkillService.getSkillDetail(id));
    }

    /** Thực hiện hành động: HIDE / SHOW / DELETE / WARN */
    @PostMapping("/{id}/actions")
    public ResponseEntity<Void> performAction(
            @PathVariable UUID id,
            @Valid @RequestBody AdminSkillActionRequest request,
            Authentication authentication) {
        adminSkillService.performSkillAction(id, request, authentication.getName());
        return ResponseEntity.ok().build();
    }

    /** Danh sách danh mục kỹ năng kèm thống kê */
    @GetMapping("/categories")
    public ResponseEntity<List<AdminCategoryResponse>> getCategories() {
        return ResponseEntity.ok(adminSkillService.getCategories());
    }

    /** Cập nhật tên/mô tả danh mục */
    @PutMapping("/categories/{id}")
    public ResponseEntity<AdminCategoryResponse> updateCategory(
            @PathVariable UUID id,
            @Valid @RequestBody AdminCategoryRequest request) {
        return ResponseEntity.ok(adminSkillService.updateCategory(id, request));
    }

    /** Tạo danh mục mới */
    @PostMapping("/categories")
    public ResponseEntity<AdminCategoryResponse> createCategory(
            @Valid @RequestBody AdminCategoryCreateRequest request) {
        return ResponseEntity.ok(adminSkillService.createCategory(request));
    }

    /** Xóa danh mục */
    @DeleteMapping("/categories/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable UUID id) {
        adminSkillService.deleteCategory(id);
        return ResponseEntity.ok().build();
    }

    /** Admin tạo kỹ năng mới */
    @PostMapping
    public ResponseEntity<Void> createSkill(
            @Valid @RequestBody AdminCreateSkillRequest request) {
        adminSkillService.createSkill(request);
        return ResponseEntity.ok().build();
    }

    /** Admin cập nhật kỹ năng */
    @PutMapping("/{id}")
    public ResponseEntity<Void> updateSkill(
            @PathVariable UUID id,
            @Valid @RequestBody AdminUpdateSkillRequest request) {
        adminSkillService.updateSkill(id, request);
        return ResponseEntity.ok().build();
    }

    /** Admin upload file minh chứng cho kỹ năng */
    @PostMapping(value = "/{id}/attachments", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<com.hourlink.skill.dto.response.SkillAttachmentResponse> uploadAttachment(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(attachmentService.uploadAttachment(id, file));
    }

    /** Admin xoá file minh chứng */
    @DeleteMapping("/attachments/{attachmentId}")
    public ResponseEntity<Void> deleteAttachment(@PathVariable UUID attachmentId) {
        attachmentService.deleteAttachment(attachmentId);
        return ResponseEntity.ok().build();
    }
}
