package com.hourlink.community.entity;

import com.hourlink.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;
import lombok.AccessLevel;

/** Ảnh minh chứng do người dùng gửi sau khi tham gia hoạt động. */
@Entity
@Table(name = "activity_evidence")
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ActivityEvidence extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "participant_id", nullable = false)
    ActivityParticipant participant;

    @Column(name = "file_url", nullable = false, columnDefinition = "TEXT")
    String fileUrl;

    @Column(name = "public_id", nullable = false, length = 300)
    String publicId;

    @Column(name = "original_name", length = 255)
    String originalName;

    @Column(name = "file_size")
    Long fileSize;
}
