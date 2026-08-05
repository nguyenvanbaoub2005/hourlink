package com.hourlink.user.entity;

import com.hourlink.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * Badge — Danh mục các huy hiệu có thể được trao trong HourLink (chức năng 9.20).
 * Dữ liệu bảng này thường được seed sẵn bởi admin/system.
 *
 * Ví dụ mã huy hiệu:
 *   ACTIVE_SUPPORTER  — Người hỗ trợ tích cực
 *   ALWAYS_ON_TIME    — Luôn đúng giờ
 *   EXPERT_JAVA       — Chuyên gia Java
 *   OUTSTANDING_VOL   — Tình nguyện viên nổi bật
 *   SESSION_10        — Hoàn thành 10 buổi
 *   TOP_RATED         — Được đánh giá cao
 *   VERIFIED_ID       — Đã xác minh danh tính
 */
@Entity
@Table(name = "badge", indexes = {
        @Index(name = "idx_badge_code", columnList = "code", unique = true)
})
@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Badge extends BaseEntity {

    /** Mã định danh duy nhất của huy hiệu (SCREAMING_SNAKE_CASE) */
    @Column(name = "code", nullable = false, unique = true, length = 50)
    String code;

    /** Tên hiển thị của huy hiệu */
    @Column(name = "name", nullable = false, length = 100)
    String name;

    /** Mô tả điều kiện nhận huy hiệu */
    @Column(name = "description", columnDefinition = "TEXT")
    String description;

    /** URL hình ảnh/icon đại diện */
    @Column(name = "icon_url", length = 500)
    String iconUrl;
}
