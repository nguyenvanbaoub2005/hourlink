package com.hourlink.skill.controller;


import com.hourlink.common.response.ApiResponse;
import com.hourlink.skill.service.SkillService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

/**
 * SkillController — TODO: implement endpoints cho module skill.
 */
@Tag(name = "Skill Management")
@RestController
@RequestMapping("/skill")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SkillController {

    SkillService skillService;

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

    @GetMapping("/categories")
    public ApiResponse<java.util.List<com.hourlink.skill.dto.response.SkillCategoryResponse>> getCategories() {
        return ApiResponse.success(skillService.getCategories());
    }
}
