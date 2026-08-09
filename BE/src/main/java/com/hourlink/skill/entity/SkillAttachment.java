package com.hourlink.skill.entity;

import com.hourlink.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * SkillAttachment — Lưu thông tin file (ảnh/tài liệu) minh chứng kỹ năng.
 * File thực được lưu trên Cloudinary, entity này lưu metadata.
 */
@Entity
@Table(name = "skill_attachment")
@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SkillAttachment extends BaseEntity {

    /**
     * Kỹ năng mà file minh chứng thuộc về
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "skill_id", nullable = false)
    Skill skill;

    /**
     * URL công khai trên Cloudinary
     */
    @Column(name = "file_url", nullable = false, columnDefinition = "TEXT")
    String fileUrl;

    /**
     * Public ID trên Cloudinary (dùng để xoá file)
     */
    @Column(name = "public_id", length = 300)
    String publicId;

    /**
     * Tên gốc của file khi upload
     */
    @Column(name = "original_name", length = 255)
    String originalName;

    /**
     * Loại file: IMAGE hoặc DOCUMENT
     */
    @Column(name = "file_type", length = 50)
    String fileType;

    /**
     * Kích thước file tính theo bytes
     */
    @Column(name = "file_size")
    Long fileSize;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    boolean isDeleted = false;
}
