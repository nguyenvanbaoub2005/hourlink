package com.hourlink.rating.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

/**
 * BadgeResponse — Response trả về khi đọc huy hiệu của người dùng.
 */
@Data
@Builder
public class BadgeResponse {
    private String id;
    private String code;
    private String category;
    private Integer level;
    private String name;
    private String description;
    private String iconUrl;
    /** Thời điểm người dùng nhận huy hiệu này (chỉ có khi query qua UserBadge) */
    private Instant awardedAt;
}
