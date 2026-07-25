package com.hourlink.user.entity;

import com.hourlink.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * Badge — Huy hiệu người dùng có thể nhận.
 * TODO: map fields theo DBML schema.
 */
@Entity
@Table(name = "badge")
@Getter @Setter @Builder @AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Badge extends BaseEntity {
    // TODO: code (unique), name, description, icon_url
}
