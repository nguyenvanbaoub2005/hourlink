package com.hourlink.user.entity;

import com.hourlink.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * UserBadge — Quan hệ giữa User và Badge.
 * TODO: map fields theo DBML schema.
 */
@Entity
@Table(name = "user_badge")
@Getter @Setter @Builder @AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserBadge extends BaseEntity {
    // TODO: user_id (FK → users), badge_id (FK → badge), awarded_at
}
