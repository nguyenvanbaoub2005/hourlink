package com.hourlink.admin.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.UUID;

/**
 * AdminCategoryResponse — Thông tin danh mục kỹ năng kèm thống kê số lượng.
 */
@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AdminCategoryResponse {
    UUID id;
    String name;
    String description;
    /** Số kỹ năng đang VISIBLE thuộc danh mục */
    long visibleSkillCount;
    /** Tổng số kỹ năng (mọi status, trừ DELETED) thuộc danh mục */
    long totalSkillCount;
    /** Số yêu cầu hỗ trợ đang SEARCHING thuộc danh mục */
    long activeHelpRequestCount;
    /** Tổng số yêu cầu hỗ trợ (trừ DELETED) thuộc danh mục */
    long totalHelpRequestCount;
    Instant createdAt;
}
