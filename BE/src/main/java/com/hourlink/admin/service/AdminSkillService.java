package com.hourlink.admin.service;

import com.hourlink.admin.dto.request.AdminCategoryCreateRequest;
import com.hourlink.admin.dto.request.AdminCategoryRequest;
import com.hourlink.admin.dto.request.AdminCreateSkillRequest;
import com.hourlink.admin.dto.request.AdminSkillActionRequest;
import com.hourlink.admin.dto.request.AdminUpdateSkillRequest;
import com.hourlink.admin.dto.response.AdminCategoryResponse;
import com.hourlink.admin.dto.response.AdminSkillDetailResponse;
import com.hourlink.admin.dto.response.AdminSkillResponse;
import com.hourlink.admin.entity.UserAdminAction;
import com.hourlink.admin.repository.UserAdminActionRepository;
import com.hourlink.appointment.enums.AppointmentStatus;
import com.hourlink.appointment.repository.AppointmentRepository;
import com.hourlink.common.exception.BadRequestException;
import com.hourlink.common.service.EmailService;
import com.hourlink.helprequest.entity.HelpRequest;
import com.hourlink.helprequest.enums.RequestStatus;
import com.hourlink.helprequest.repository.HelpRequestRepository;
import com.hourlink.skill.dto.response.SkillAttachmentResponse;
import com.hourlink.skill.entity.Skill;
import com.hourlink.skill.entity.SkillAttachment;
import com.hourlink.skill.entity.SkillCategory;
import com.hourlink.skill.enums.SessionFormat;
import com.hourlink.skill.enums.SkillLevel;
import com.hourlink.skill.enums.SkillStatus;
import com.hourlink.skill.repository.SkillAttachmentRepository;
import com.hourlink.skill.repository.SkillCategoryRepository;
import com.hourlink.skill.repository.SkillRepository;
import com.hourlink.user.entity.User;
import com.hourlink.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * AdminSkillService — Xử lý nghiệp vụ quản lý kỹ năng cho Admin.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminSkillService {

    private final SkillRepository skillRepository;
    private final SkillAttachmentRepository attachmentRepository;
    private final SkillCategoryRepository categoryRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserAdminActionRepository userAdminActionRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final HelpRequestRepository helpRequestRepository;

    /** Trạng thái lịch hẹn bị coi là "đang hoạt động" — chặn xóa kỹ năng */
    private static final List<AppointmentStatus> ACTIVE_APPOINTMENT_STATUSES = Arrays.asList(
            AppointmentStatus.PENDING,
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.UPCOMING,
            AppointmentStatus.IN_PROGRESS,
            AppointmentStatus.DISPUTED,
            AppointmentStatus.RESCHEDULED
    );

    // ─── Skill listing ────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<AdminSkillResponse> getSkills(
            String skillName, String userName, String userEmail, UUID categoryId,
            SkillStatus status, SkillLevel level, SessionFormat format, String region,
            Pageable pageable) {

        Specification<Skill> spec = Specification.where(null);

        if (region != null && !region.trim().isEmpty()) {
            String kw = "%" + region.trim().toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("region")), kw));
        }

        if (skillName != null && !skillName.trim().isEmpty()) {
            String kw = "%" + skillName.trim().toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("name")), kw));
        }
        if (userName != null && !userName.trim().isEmpty()) {
            String kw = "%" + userName.trim().toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.join("user").get("fullName")), kw));
        }
        if (userEmail != null && !userEmail.trim().isEmpty()) {
            String kw = "%" + userEmail.trim().toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.join("user").get("email")), kw));
        }
        if (categoryId != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.join("category").get("id"), categoryId));
        }
        if (status != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("status"), status));
        } else {
            // Mặc định ẩn DELETED nếu không lọc cụ thể
            spec = spec.and((root, query, cb) ->
                    cb.notEqual(root.get("status"), SkillStatus.DELETED));
        }
        if (level != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("level"), level));
        }
        if (format != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("format"), format));
        }

        return skillRepository.findAll(spec, pageable).map(this::mapToResponse);
    }

    // ─── Skill detail ─────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public AdminSkillDetailResponse getSkillDetail(UUID skillId) {
        Skill skill = skillRepository.findById(skillId)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy kỹ năng"));

        List<SkillAttachment> attachments = attachmentRepository.findAllBySkill_IdAndIsDeletedFalse(skillId);

        return mapToDetailResponse(skill, attachments);
    }

    // ─── Skill actions ────────────────────────────────────────────────

    @Transactional
    public void performSkillAction(UUID skillId, AdminSkillActionRequest request, String adminEmail) {
        Skill skill = skillRepository.findById(skillId)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy kỹ năng"));

        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy admin"));

        User skillOwner = skill.getUser();
        String actionType = request.getActionType().toUpperCase();

        switch (actionType) {
            case "HIDE" -> {
                if (skill.getStatus() == SkillStatus.DELETED) {
                    throw new BadRequestException("Kỹ năng đã bị xóa, không thể ẩn.");
                }
                skill.setStatus(SkillStatus.HIDDEN);
                skillRepository.save(skill);
                log.info("Admin {} đã ẩn kỹ năng {}", adminEmail, skillId);
            }
            case "SHOW" -> {
                if (skill.getStatus() == SkillStatus.DELETED) {
                    throw new BadRequestException("Kỹ năng đã bị xóa, không thể hiện lại.");
                }
                skill.setStatus(SkillStatus.VISIBLE);
                skillRepository.save(skill);
                log.info("Admin {} đã hiện lại kỹ năng {}", adminEmail, skillId);
            }
            case "DELETE" -> {
                if (skill.getStatus() == SkillStatus.DELETED) {
                    throw new BadRequestException("Kỹ năng này đã bị xóa trước đó.");
                }
                // Kiểm tra ràng buộc lịch hẹn đang hoạt động
                boolean hasActiveAppointment = appointmentRepository
                        .existsBySkill_IdAndStatusIn(skillId, ACTIVE_APPOINTMENT_STATUSES);
                if (hasActiveAppointment) {
                    throw new BadRequestException(
                            "Không thể xóa kỹ năng vì đang có lịch hẹn chưa hoàn tất hoặc đang tranh chấp.");
                }
                // Soft delete
                skill.setStatus(SkillStatus.DELETED);
                skillRepository.save(skill);
                log.info("Admin {} đã xóa mềm kỹ năng {}", adminEmail, skillId);
            }
            case "WARN" -> {
                if (request.getReason() == null || request.getReason().trim().isEmpty()) {
                    throw new BadRequestException("Lý do cảnh báo không được để trống.");
                }
                // Tăng cảnh báo người đăng
                skillOwner.setWarningCount(skillOwner.getWarningCount() + 1);
                userRepository.save(skillOwner);
                // Gửi email cảnh báo
                emailService.sendSkillWarningEmail(
                        skillOwner.getEmail(),
                        skillOwner.getFullName(),
                        skill.getName(),
                        skillOwner.getWarningCount(),
                        request.getReason()
                );
                log.info("Admin {} đã cảnh báo user {} về kỹ năng {}", adminEmail, skillOwner.getEmail(), skill.getName());
            }
            default -> throw new IllegalArgumentException("Hành động không hợp lệ: " + actionType);
        }

        // Ghi log hành động admin
        UserAdminAction action = UserAdminAction.builder()
                .user(skillOwner)
                .admin(admin)
                .actionType("SKILL_" + actionType)
                .reason(request.getReason())
                .build();
        userAdminActionRepository.save(action);
    }

    // ─── Create / Update Skill ─────────────────────────────────────────

    @Transactional
    public void createSkill(AdminCreateSkillRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new BadRequestException("Không tìm thấy người dùng"));

        SkillCategory category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findByIdAndIsDeletedFalse(request.getCategoryId())
                    .orElseThrow(() -> new BadRequestException("Không tìm thấy danh mục"));
        }

        Skill skill = Skill.builder()
                .name(request.getName())
                .description(request.getDescription())
                .level(request.getLevel())
                .format(request.getFormat())
                .duration(request.getDuration())
                .freeTime(request.getFreeTime())
                .region(request.getRegion())
                .status(request.getStatus() != null ? request.getStatus() : SkillStatus.VISIBLE)
                .category(category)
                .user(user)
                .build();

        skillRepository.save(skill);
        log.info("Admin created skill '{}' for user {}", request.getName(), user.getEmail());
    }

    @Transactional
    public void updateSkill(UUID skillId, AdminUpdateSkillRequest request) {
        Skill skill = skillRepository.findById(skillId)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy kỹ năng"));

        boolean hasActiveAppointment = appointmentRepository
                .existsBySkill_IdAndStatusIn(skillId, ACTIVE_APPOINTMENT_STATUSES);
        if (hasActiveAppointment) {
            throw new BadRequestException("Không thể chỉnh sửa kỹ năng vì kỹ năng này đang nằm trong lịch hẹn hoạt động.");
        }

        skill.setName(request.getName());
        skill.setDescription(request.getDescription());
        skill.setLevel(request.getLevel());
        skill.setFormat(request.getFormat());
        skill.setDuration(request.getDuration());
        skill.setFreeTime(request.getFreeTime());
        skill.setRegion(request.getRegion());

        if (request.getStatus() != null) {
            skill.setStatus(request.getStatus());
        }

        if (request.getCategoryId() != null) {
            SkillCategory category = categoryRepository.findByIdAndIsDeletedFalse(request.getCategoryId())
                    .orElseThrow(() -> new BadRequestException("Không tìm thấy danh mục"));
            skill.setCategory(category);
        } else {
            skill.setCategory(null);
        }

        skillRepository.save(skill);
        log.info("Admin updated skill '{}' (id={})", skill.getName(), skillId);
    }

    // ─── Category management ──────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<AdminCategoryResponse> getCategories() {
        List<SkillCategory> categories = categoryRepository.findAllByIsDeletedFalse();
        List<Skill> allSkills = skillRepository.findAll();
        List<HelpRequest> allHelpRequests = helpRequestRepository.findAll();

        return categories.stream().map(cat -> {
            long visible = allSkills.stream()
                    .filter(s -> s.getCategory() != null
                            && s.getCategory().getId().equals(cat.getId())
                            && s.getStatus() == SkillStatus.VISIBLE)
                    .count();
            long total = allSkills.stream()
                    .filter(s -> s.getCategory() != null
                            && s.getCategory().getId().equals(cat.getId())
                            && s.getStatus() != SkillStatus.DELETED)
                    .count();

            long activeHr = allHelpRequests.stream()
                    .filter(hr -> hr.getCategory() != null
                            && hr.getCategory().getId().equals(cat.getId())
                            && hr.getStatus() == RequestStatus.SEARCHING)
                    .count();
            long totalHr = allHelpRequests.stream()
                    .filter(hr -> hr.getCategory() != null
                            && hr.getCategory().getId().equals(cat.getId())
                            && hr.getStatus() != RequestStatus.DELETED)
                    .count();

            return AdminCategoryResponse.builder()
                    .id(cat.getId())
                    .name(cat.getName())
                    .description(cat.getDescription())
                    .visibleSkillCount(visible)
                    .totalSkillCount(total)
                    .activeHelpRequestCount(activeHr)
                    .totalHelpRequestCount(totalHr)
                    .createdAt(cat.getCreatedAt())
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional
    public AdminCategoryResponse updateCategory(UUID categoryId, AdminCategoryRequest request) {
        SkillCategory category = categoryRepository.findByIdAndIsDeletedFalse(categoryId)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy danh mục"));

        String normalizedName = normalizeCategoryName(request.getName());
        boolean duplicateName = categoryRepository
                .findAllByNameIgnoreCaseAndIsDeletedFalse(normalizedName)
                .stream()
                .anyMatch(existing -> !existing.getId().equals(categoryId));
        if (duplicateName) {
            throw new BadRequestException("Tên danh mục đã tồn tại");
        }

        category.setName(normalizedName);
        category.setDescription(normalizeCategoryDescription(request.getDescription()));
        categoryRepository.save(category);

        return AdminCategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .visibleSkillCount(0)
                .totalSkillCount(0)
                .createdAt(category.getCreatedAt())
                .build();
    }

    @Transactional
    public AdminCategoryResponse createCategory(AdminCategoryCreateRequest request) {
        String normalizedName = normalizeCategoryName(request.getName());
        if (!categoryRepository
                .findAllByNameIgnoreCaseAndIsDeletedFalse(normalizedName)
                .isEmpty()) {
            throw new BadRequestException("Tên danh mục đã tồn tại");
        }

        SkillCategory category = categoryRepository.findAllByNameIgnoreCase(normalizedName)
                .stream()
                .filter(SkillCategory::isDeleted)
                .findFirst()
                .orElseGet(() -> SkillCategory.builder().build());
        category.setName(normalizedName);
        category.setDescription(normalizeCategoryDescription(request.getDescription()));
        category.setDeleted(false);
        category = categoryRepository.save(category);
        log.info("Admin created or restored category '{}'", normalizedName);

        return AdminCategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .visibleSkillCount(0)
                .totalSkillCount(0)
                .createdAt(category.getCreatedAt())
                .build();
    }

    @Transactional
    public void deleteCategory(UUID categoryId) {
        SkillCategory category = categoryRepository.findByIdAndIsDeletedFalse(categoryId)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy danh mục"));

        long skillCount = skillRepository.findAll().stream()
                .filter(s -> s.getCategory() != null
                        && s.getCategory().getId().equals(categoryId)
                        && s.getStatus() != SkillStatus.DELETED)
                .count();

        long hrCount = helpRequestRepository.findAll().stream()
                .filter(hr -> hr.getCategory() != null
                        && hr.getCategory().getId().equals(categoryId)
                        && hr.getStatus() != RequestStatus.DELETED)
                .count();

        if (skillCount > 0 || hrCount > 0) {
            throw new BadRequestException("Không thể xóa danh mục vì vẫn còn kỹ năng hoặc yêu cầu hỗ trợ đang liên kết.");
        }

        category.setDeleted(true);
        categoryRepository.save(category);
        log.info("Admin soft-deleted category '{}' (id={})", category.getName(), categoryId);
    }

    private String normalizeCategoryName(String name) {
        return name.trim().replaceAll("\\s+", " ");
    }

    private String normalizeCategoryDescription(String description) {
        if (description == null) {
            return null;
        }
        String normalized = description.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    // ─── Mappers ──────────────────────────────────────────────────────

    private AdminSkillResponse mapToResponse(Skill skill) {
        int attachmentCount = attachmentRepository.findAllBySkill_IdAndIsDeletedFalse(skill.getId()).size();
        return AdminSkillResponse.builder()
                .id(skill.getId())
                .name(skill.getName())
                .status(skill.getStatus())
                .level(skill.getLevel())
                .format(skill.getFormat())
                .duration(skill.getDuration())
                .region(skill.getRegion())
                .categoryName(skill.getCategory() != null ? skill.getCategory().getName() : null)
                .userId(skill.getUser().getId())
                .userFullName(skill.getUser().getFullName())
                .userEmail(skill.getUser().getEmail())
                .userAvatarUrl(skill.getUser().getAvatarUrl())
                .attachmentCount(attachmentCount)
                .createdAt(skill.getCreatedAt())
                .build();
    }

    private AdminSkillDetailResponse mapToDetailResponse(Skill skill, List<SkillAttachment> attachments) {
        User user = skill.getUser();
        List<SkillAttachmentResponse> attachmentDtos = attachments.stream()
                .map(a -> SkillAttachmentResponse.builder()
                        .id(a.getId())
                        .fileUrl(a.getFileUrl())
                        .publicId(a.getPublicId())
                        .originalName(a.getOriginalName())
                        .fileType(a.getFileType())
                        .fileSize(a.getFileSize())
                        .createdAt(a.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return AdminSkillDetailResponse.builder()
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
                .createdAt(skill.getCreatedAt())
                .updatedAt(skill.getUpdatedAt())
                .userId(user.getId())
                .userFullName(user.getFullName())
                .userEmail(user.getEmail())
                .userAvatarUrl(user.getAvatarUrl())
                .userReputationScore(user.getReputationScore())
                .userCompletedSessions(user.getCompletedSessions())
                .userWarningCount(user.getWarningCount())
                .userRegion(user.getRegion())
                .userOccupation(user.getOccupation())
                .attachments(attachmentDtos)
                .build();
    }
}
