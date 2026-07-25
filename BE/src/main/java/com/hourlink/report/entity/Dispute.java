package com.hourlink.report.entity;

import com.hourlink.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * Dispute — TODO: map fields từ DBML schema.
 */
@Entity
@Table(name = "dispute")
@Getter @Setter @Builder @AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Dispute extends BaseEntity {
    // TODO: thêm fields theo DBML schema
}
