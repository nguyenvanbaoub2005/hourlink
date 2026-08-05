package com.hourlink.rating.dto.response;

import com.hourlink.rating.entity.Rating;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

/**
 * RatingResponse — Kết quả trả về sau khi tạo đánh giá.
 */
@Data
@Builder
public class RatingResponse {

    UUID id;
    UUID appointmentId;
    UUID fromUserId;
    String fromUserName;
    String fromUserAvatar;
    UUID toUserId;
    String toUserName;
    int score;
    String comment;
    Instant createdAt;

    public static RatingResponse fromEntity(Rating r) {
        return RatingResponse.builder()
                .id(r.getId())
                .appointmentId(r.getAppointment().getId())
                .fromUserId(r.getFromUser().getId())
                .fromUserName(r.getFromUser().getFullName())
                .fromUserAvatar(r.getFromUser().getAvatarUrl())
                .toUserId(r.getToUser().getId())
                .toUserName(r.getToUser().getFullName())
                .score(r.getScore())
                .comment(r.getComment())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
