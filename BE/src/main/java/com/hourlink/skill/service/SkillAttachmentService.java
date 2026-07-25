package com.hourlink.skill.service;

import com.hourlink.common.exception.AppException;
import com.hourlink.common.exception.ErrorCode;
import com.hourlink.common.service.CloudinaryService;
import com.hourlink.common.util.SecurityUtil;
import com.hourlink.skill.dto.response.SkillAttachmentResponse;
import com.hourlink.skill.entity.Skill;
import com.hourlink.skill.entity.SkillAttachment;
import com.hourlink.skill.repository.SkillAttachmentRepository;
import com.hourlink.skill.repository.SkillRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
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

        if (!skill.getUser().getEmail().equals(email)) {
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
     * Lấy danh sách file minh chứng của một kỹ năng.
     */
    public List<SkillAttachmentResponse> getAttachments(UUID skillId) {
        return attachmentRepository.findAllBySkill_Id(skillId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Xoá một file minh chứng (chủ kỹ năng mới được xoá).
     */
    @Transactional
    public void deleteAttachment(UUID attachmentId) {
        String email = SecurityUtil.getCurrentUserEmail();
        SkillAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));

        if (!attachment.getSkill().getUser().getEmail().equals(email)) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }

        boolean isImage = "IMAGE".equals(attachment.getFileType());
        cloudinaryService.deleteFile(attachment.getPublicId(), isImage);
        attachmentRepository.delete(attachment);
    }

    // ─── Private helpers ────────────────────────────────────────────

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        String contentType = file.getContentType() != null ? file.getContentType() : "";
        boolean isAllowed = ALLOWED_IMAGE_TYPES.contains(contentType)
                || ALLOWED_DOC_TYPES.contains(contentType);
        if (!isAllowed) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
    }

    private SkillAttachmentResponse mapToResponse(SkillAttachment attachment) {
        return SkillAttachmentResponse.builder()
                .id(attachment.getId())
                .fileUrl(attachment.getFileUrl())
                .publicId(attachment.getPublicId())
                .originalName(attachment.getOriginalName())
                .fileType(attachment.getFileType())
                .fileSize(attachment.getFileSize())
                .createdAt(attachment.getCreatedAt())
                .build();
    }
}
