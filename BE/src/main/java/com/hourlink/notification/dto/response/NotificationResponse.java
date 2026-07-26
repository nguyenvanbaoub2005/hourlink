package com.hourlink.notification.dto.response;

import com.hourlink.notification.enums.NotificationType;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.UUID;

/**
 * NotificationResponse — DTO trả về cho FE.
 */
@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class NotificationResponse {

    UUID id;
    NotificationType type;
    String title;
    String body;

    // ─── Người gây ra thông báo (để hiện avatar trên thông báo) ──────────────
    /** Null với thông báo do hệ thống sinh */
    UUID actorId;
    String actorName;
    String actorAvatarUrl;

    /** ID tham chiếu (invitation_id...) để FE navigate tới màn hình tương ứng */
    UUID referenceId;

    Boolean isRead;
    Instant createdAt;
}
