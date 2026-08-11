package com.hourlink.skill.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.UUID;

/**
 * SkillAttachmentResponse — Thông tin file minh chứng trả về cho client.
 */
@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SkillAttachmentResponse {
    UUID id;
    String fileUrl;
    String publicId;
    String originalName;
    String fileType;    // "IMAGE" hoặc "DOCUMENT"
    Long fileSize;
    Instant createdAt;
}
