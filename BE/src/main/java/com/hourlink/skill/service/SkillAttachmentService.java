package com.hourlink.skill.service;

import com.hourlink.appointment.enums.AppointmentStatus;
import com.hourlink.appointment.repository.AppointmentRepository;
import com.hourlink.common.exception.AppException;
import com.hourlink.common.exception.BadRequestException;
import com.hourlink.common.exception.ErrorCode;
import com.hourlink.common.service.CloudinaryService;
import com.hourlink.common.util.SecurityUtil;
import com.hourlink.skill.dto.response.SkillAttachmentResponse;
import com.hourlink.skill.entity.Skill;
import com.hourlink.skill.entity.SkillAttachment;
import com.hourlink.skill.enums.SkillStatus;
import com.hourlink.skill.repository.SkillAttachmentRepository;
import com.hourlink.skill.repository.SkillRepository;
import com.hourlink.user.entity.User;
import com.hourlink.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * SkillAttachmentService — Xử lý upload/xoá file minh chứng kỹ năng.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SkillAttachmentService {

    private final SkillAttachmentRepository attachmentRepository;
    private final SkillRepository skillRepository;
    private final CloudinaryService cloudinaryService;
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;

    private static final List<AppointmentStatus> ACTIVE_APPOINTMENT_STATUSES = Arrays.asList(
            AppointmentStatus.PENDING,
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.UPCOMING,
            AppointmentStatus.IN_PROGRESS,
            AppointmentStatus.DISPUTED,
            AppointmentStatus.RESCHEDULED
    );

    private static final String CLOUDINARY_FOLDER = "skill_attachments";
    private static final long MAX_FILE_SIZE = 20 * 1024 * 1024L; // 20MB
    private static final List<String> ALLOWED_IMAGE_TYPES = List.of(
            "image/jpeg", "image/png", "image/gif", "image/webp"
    );
    private static final List<String> ALLOWED_DOC_TYPES = List.of(
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    );

    /**
     * Upload một file minh chứng cho kỹ năng.
     */
    @Transactional
    public SkillAttachmentResponse uploadAttachment(UUID skillId, MultipartFile file) {
        String email = SecurityUtil.getCurrentUserEmail();
        Skill skill = skillRepository.findById(skillId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));

        User currentUser = userRepository.findByEmail(email).orElse(null);
        boolean isAdmin = currentUser != null && currentUser.getUserRoles() != null && currentUser.getUserRoles().stream()
                .anyMatch(ur -> ur.getRole() != null && ("ROLE_ADMIN".equals(ur.getRole().getRoleCode()) || "ADMIN".equals(ur.getRole().getRoleName())));
        boolean isOwner = skill.getUser().getEmail().equals(email);

        if (!isOwner && !isAdmin) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }

        validateFile(file);

        try {
            Map<String, Object> uploadResult = cloudinaryService.uploadFile(file, CLOUDINARY_FOLDER);

            String contentType = file.getContentType() != null ? file.getContentType() : "";
            boolean isImage = ALLOWED_IMAGE_TYPES.contains(contentType);

            SkillAttachment attachment = SkillAttachment.builder()
                    .skill(skill)
                    .fileUrl((String) uploadResult.get("secure_url"))
                    .publicId((String) uploadResult.get("public_id"))
                    .originalName(file.getOriginalFilename())
                    .fileType(isImage ? "IMAGE" : "DOCUMENT")
                    .fileSize(file.getSize())
                    .build();

            return mapToResponse(attachmentRepository.save(attachment));

        } catch (IOException e) {
            log.error("Lỗi upload file: {}", e.getMessage());
            throw new AppException(ErrorCode.UPLOAD_FAILED);
        }
    }

    /**
     * Lấy danh sách file minh chứng của một kỹ năng (chỉ lấy file chưa xóa).
     *
     * <p>Chủ sở hữu và admin có thể xem cả kỹ năng đang ẩn để quản lý. Người
     * dùng khác chỉ được xem minh chứng của kỹ năng đang công khai và thuộc
     * một tài khoản còn hoạt động. Public ID của Cloudinary chỉ phục vụ thao
     * tác quản trị/xóa nên không trả cho người xem công khai.</p>
     */
    public List<SkillAttachmentResponse> getAttachments(UUID skillId) {
        Skill skill = skillRepository.findById(skillId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));
        String email = SecurityUtil.getCurrentUserEmail();
        User currentUser = userRepository.findByEmail(email).orElse(null);
        boolean canManage = canManageSkill(skill, currentUser, email);

        if (!canManage && !isPubliclyVisible(skill)) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }

        return attachmentRepository.findAllBySkill_IdAndIsDeletedFalse(skillId)
                .stream()
                .map(attachment -> mapToResponse(attachment, canManage))
                .collect(Collectors.toList());
    }

    /**
     * Xoá một file minh chứng (đồng thời xóa trên Cloudinary).
     */
    @Transactional
    public void deleteAttachment(UUID attachmentId) {
        String email = SecurityUtil.getCurrentUserEmail();
        SkillAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy minh chứng."));

        User currentUser = userRepository.findByEmail(email).orElse(null);
        boolean isAdmin = currentUser != null && currentUser.getUserRoles() != null && currentUser.getUserRoles().stream()
                .anyMatch(ur -> ur.getRole() != null && ("ROLE_ADMIN".equals(ur.getRole().getRoleCode()) || "ADMIN".equals(ur.getRole().getRoleName())));
        boolean isOwner = attachment.getSkill().getUser().getEmail().equals(email);

        if (!isOwner && !isAdmin) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }

        // Ràng buộc: Không được xóa minh chứng nếu kỹ năng đang trong lịch hẹn hoạt động
        boolean hasActiveAppointment = appointmentRepository
                .existsBySkill_IdAndStatusIn(attachment.getSkill().getId(), ACTIVE_APPOINTMENT_STATUSES);
        if (hasActiveAppointment) {
            throw new BadRequestException("Không thể xóa minh chứng khi kỹ năng đang có lịch hẹn hoạt động.");
        }

        // Xóa file thực sự trên Cloudinary nếu có publicId
        if (attachment.getPublicId() != null && !attachment.getPublicId().isBlank()) {
            // Thử xóa dạng image trước, nếu lỗi thì xóa dạng raw
            cloudinaryService.deleteFile(attachment.getPublicId(), true);
            cloudinaryService.deleteFile(attachment.getPublicId(), false);
            log.info("Đã xóa file khỏi Cloudinary: publicId={}", attachment.getPublicId());
        }

        // Xóa mềm trong DB
        attachment.setDeleted(true);
        attachmentRepository.save(attachment);
        log.info("User {} đã xóa minh chứng ID [{}]", email, attachmentId);
    }

    // ─── Private helpers ────────────────────────────────────────────

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File không được để trống.");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BadRequestException("Dung lượng file tối đa là 20MB.");
        }
        String contentType = file.getContentType() != null ? file.getContentType() : "";
        boolean isAllowed = ALLOWED_IMAGE_TYPES.contains(contentType)
                || ALLOWED_DOC_TYPES.contains(contentType);
        if (!isAllowed) {
            throw new BadRequestException("Định dạng file không hỗ trợ. Chỉ chấp nhận ảnh (JPG, PNG, GIF, WEBP) hoặc tài liệu (PDF, DOC, DOCX, PPT, PPTX).");
        }
    }

    private boolean canManageSkill(Skill skill, User currentUser, String currentEmail) {
        boolean isOwner = skill.getUser() != null
                && skill.getUser().getEmail().equals(currentEmail);
        boolean isAdmin = currentUser != null
                && currentUser.getUserRoles() != null
                && currentUser.getUserRoles().stream()
                .anyMatch(userRole -> userRole.getRole() != null
                        && ("ROLE_ADMIN".equals(userRole.getRole().getRoleCode())
                        || "ADMIN".equals(userRole.getRole().getRoleName())));
        return isOwner || isAdmin;
    }

    private boolean isPubliclyVisible(Skill skill) {
        if (skill.getStatus() != SkillStatus.VISIBLE || skill.getUser() == null) {
            return false;
        }
        if (skill.getUser().isLocked() || skill.getUser().isDeleted()) {
            return false;
        }
        return skill.getCategory() == null || !skill.getCategory().isDeleted();
    }

    private SkillAttachmentResponse mapToResponse(SkillAttachment attachment) {
        return mapToResponse(attachment, true);
    }

    private SkillAttachmentResponse mapToResponse(
            SkillAttachment attachment,
            boolean includeManagementFields) {
        return SkillAttachmentResponse.builder()
                .id(attachment.getId())
                .fileUrl(attachment.getFileUrl())
                .publicId(includeManagementFields ? attachment.getPublicId() : null)
                .originalName(attachment.getOriginalName())
                .fileType(attachment.getFileType())
                .fileSize(attachment.getFileSize())
                .createdAt(attachment.getCreatedAt())
                .build();
    }
}
