package com.hourlink.admin.entity;

import com.hourlink.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * SystemStatSnapshot — TODO: map fields từ DBML schema.
 */
@Entity
@Table(name = "system_stat_snapshot")
@Getter @Setter @Builder @AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SystemStatSnapshot extends BaseEntity {
    // TODO: thêm fields theo DBML schema
}
