package com.hourlink.skill.service;

import com.hourlink.common.exception.AppException;
import com.hourlink.common.exception.ErrorCode;
import com.hourlink.common.util.SecurityUtil;
import com.hourlink.skill.dto.request.SkillRequest;
import com.hourlink.skill.dto.response.SkillResponse;
import com.hourlink.skill.entity.Skill;
import com.hourlink.skill.entity.SkillCategory;
import com.hourlink.skill.enums.SkillStatus;
import com.hourlink.skill.repository.SkillCategoryRepository;
import com.hourlink.skill.repository.SkillRepository;
import com.hourlink.user.entity.User;
import com.hourlink.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SkillService {
    private final SkillRepository skillRepository;
    private final SkillCategoryRepository categoryRepository;
    private final UserRepository userRepository;

    @Transactional
    public SkillResponse createSkill(SkillRequest request) {
        String email = SecurityUtil.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        SkillCategory category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND)); // Or create specific CATEGORY_NOT_FOUND

        Skill skill = Skill.builder()
                .name(request.getName())
                .description(request.getDescription())
                .level(request.getLevel())
                .format(request.getFormat())
                .duration(request.getDuration())
                .freeTime(request.getFreeTime())
                .region(request.getRegion())
                .category(category)
                .user(user)
                .status(SkillStatus.VISIBLE)
                .build();

        Skill saved = skillRepository.save(skill);
        return mapToResponse(saved);
    }

    public List<SkillResponse> getMySkills() {
        String email = SecurityUtil.getCurrentUserEmail();
        List<Skill> skills = skillRepository.findAllByUser_Email(email);
        return skills.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional
    public SkillResponse updateSkill(UUID skillId, SkillRequest request) {
        String email = SecurityUtil.getCurrentUserEmail();
        Skill skill = skillRepository.findById(skillId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));

        if (!skill.getUser().getEmail().equals(email)) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }

        SkillCategory category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));

        skill.setName(request.getName());
        skill.setDescription(request.getDescription());
        skill.setLevel(request.getLevel());
        skill.setFormat(request.getFormat());
        skill.setDuration(request.getDuration());
        skill.setFreeTime(request.getFreeTime());
        skill.setRegion(request.getRegion());
        skill.setCategory(category);

        return mapToResponse(skillRepository.save(skill));
    }

    @Transactional
    public SkillResponse toggleSkillVisibility(UUID skillId) {
        String email = SecurityUtil.getCurrentUserEmail();
        Skill skill = skillRepository.findById(skillId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));

        if (!skill.getUser().getEmail().equals(email)) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }

        skill.setStatus(skill.getStatus() == SkillStatus.VISIBLE ? SkillStatus.HIDDEN : SkillStatus.VISIBLE);
        return mapToResponse(skillRepository.save(skill));
    }

    public List<com.hourlink.skill.dto.response.SkillCategoryResponse> getCategories() {
        List<String> order = List.of(
                "Lập trình", "Ngôn ngữ", "Thiết kế", "Kinh doanh",
                "Giáo dục", "Sức khỏe", "Nghệ thuật", "Khác"
        );
        return categoryRepository.findAll().stream()
                .sorted((a, b) -> {
                    int idxA = order.indexOf(a.getName());
                    int idxB = order.indexOf(b.getName());
                    if (idxA != -1 && idxB != -1) return Integer.compare(idxA, idxB);
                    if ("Khác".equals(a.getName())) return 1;
                    if ("Khác".equals(b.getName())) return -1;
                    return a.getName().compareTo(b.getName());
                })
                .map(c -> com.hourlink.skill.dto.response.SkillCategoryResponse.builder()
                        .id(c.getId())
                        .name(c.getName())
                        .description(c.getDescription())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteSkill(UUID skillId) {
        String email = SecurityUtil.getCurrentUserEmail();
        Skill skill = skillRepository.findById(skillId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));

        if (!skill.getUser().getEmail().equals(email)) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }

        skillRepository.delete(skill);
    }

    private SkillResponse mapToResponse(Skill skill) {
        return SkillResponse.builder()
                .id(skill.getId())
                .name(skill.getName())
                .description(skill.getDescription())
                .level(skill.getLevel())
                .format(skill.getFormat())
                .duration(skill.getDuration())
                .freeTime(skill.getFreeTime())
                .region(skill.getRegion())
                .status(skill.getStatus())
                .categoryId(skill.getCategory() != null ? skill.getCategory().getId() : null)
                .categoryName(skill.getCategory() != null ? skill.getCategory().getName() : null)
                .userId(skill.getUser().getId())
                .userFullName(skill.getUser().getFullName())
                .createdAt(skill.getCreatedAt())
                .updatedAt(skill.getUpdatedAt())
                .build();
    }
}
