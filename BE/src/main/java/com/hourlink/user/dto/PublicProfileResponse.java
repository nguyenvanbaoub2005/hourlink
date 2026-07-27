package com.hourlink.user.dto;

import com.hourlink.skill.dto.response.SkillResponse;
import com.hourlink.user.enums.UserType;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * PublicProfileResponse — Hồ sơ công khai của một người dùng khác.
 *
 * <p>Cố ý KHÔNG chứa email, số điện thoại và ngày sinh: theo yêu cầu phi chức
 * năng ở mục 14, thông tin liên hệ riêng tư không được công khai cho người
 * khác trong hệ thống. Khu vực chỉ hiển thị ở mức chung chung như hồ sơ đã
 * khai, không phải địa chỉ chính xác (mục 9.13).</p>
 */
@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PublicProfileResponse {

    UUID id;
    String fullName;
    String avatarUrl;
    String bio;
    String region;
    String occupation;
    String languages;
    UserType userType;

    /** Đã xác minh danh tính chưa */
    Boolean isVerified;

    // ─── Uy tín (mục 9.19) ───────────────────────────────────────────────────
    Double reputationScore;
    Integer completedSessions;
    Double cancelRate;

    /** Ngày tham gia HourLink */
    Instant joinedAt;

    /** Các kỹ năng người này đang chia sẻ (chỉ những kỹ năng đang hiển thị) */
    List<SkillResponse> skills;
}
