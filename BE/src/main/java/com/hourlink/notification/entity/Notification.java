package com.hourlink.notification.entity;

import com.hourlink.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * Notification — TODO: map fields từ DBML schema.
 */
@Entity
@Table(name = "notification")
@Getter @Setter @Builder @AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Notification extends BaseEntity {
    // TODO: thêm fields theo DBML schema
}
