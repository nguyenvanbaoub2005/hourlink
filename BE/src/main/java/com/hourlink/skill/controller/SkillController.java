package com.hourlink.skill.controller;


import com.hourlink.common.response.ApiResponse;
import com.hourlink.skill.service.SkillAttachmentService;
import com.hourlink.skill.service.SkillService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * SkillController — Quản lý kỹ năng và file minh chứng.
 */
@Tag(name = "Skill Management")
@RestController
@RequestMapping("/skill")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SkillController {

    SkillService skillService;
    SkillAttachmentService attachmentService;

    @PostMapping
    public ApiResponse<com.hourlink.skill.dto.response.SkillResponse> createSkill(@RequestBody @jakarta.validation.Valid com.hourlink.skill.dto.request.SkillRequest request) {
        return ApiResponse.success(skillService.createSkill(request));
    }

    @GetMapping("/my-skills")
    public ApiResponse<java.util.List<com.hourlink.skill.dto.response.SkillResponse>> getMySkills() {
        return ApiResponse.success(skillService.getMySkills());
    }

    @PutMapping("/{id}")
    public ApiResponse<com.hourlink.skill.dto.response.SkillResponse> updateSkill(
            @PathVariable java.util.UUID id,
            @RequestBody @jakarta.validation.Valid com.hourlink.skill.dto.request.SkillRequest request) {
        return ApiResponse.success(skillService.updateSkill(id, request));
    }

    @PatchMapping("/{id}/toggle-visibility")
    public ApiResponse<com.hourlink.skill.dto.response.SkillResponse> toggleVisibility(@PathVariable java.util.UUID id) {
        return ApiResponse.success(skillService.toggleSkillVisibility(id));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteSkill(@PathVariable java.util.UUID id) {
        skillService.deleteSkill(id);
        return ApiResponse.success(null);
    }

    @GetMapping("/categories")
    public ApiResponse<java.util.List<com.hourlink.skill.dto.response.SkillCategoryResponse>> getCategories() {
        return ApiResponse.success(skillService.getCategories());
    }

    // ─── Attachment endpoints ────────────────────────────────────────

    /**
     * Upload một file minh chứng (ảnh hoặc tài liệu) cho kỹ năng.
     * Content-Type: multipart/form-data
     */
    @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<com.hourlink.skill.dto.response.SkillAttachmentResponse> uploadAttachment(
            @PathVariable java.util.UUID id,
            @RequestParam("file") MultipartFile file) {
        return ApiResponse.success(attachmentService.uploadAttachment(id, file));
    }

    /**
     * Lấy danh sách file minh chứng của kỹ năng.
     */
    @GetMapping("/{id}/attachments")
    public ApiResponse<java.util.List<com.hourlink.skill.dto.response.SkillAttachmentResponse>> getAttachments(
            @PathVariable java.util.UUID id) {
        return ApiResponse.success(attachmentService.getAttachments(id));
    }

    /**
     * Xoá một file minh chứng.
     */
    @DeleteMapping("/attachments/{attachmentId}")
    public ApiResponse<Void> deleteAttachment(@PathVariable java.util.UUID attachmentId) {
        attachmentService.deleteAttachment(attachmentId);
        return ApiResponse.success(null);
    }
}
