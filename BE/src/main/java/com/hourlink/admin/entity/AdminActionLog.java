package com.hourlink.admin.entity;

import com.hourlink.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * AdminActionLog — TODO: map fields từ DBML schema.
 */
@Entity
@Table(name = "admin_action_log")
@Getter @Setter @Builder @AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AdminActionLog extends BaseEntity {
    // TODO: thêm fields theo DBML schema
}
