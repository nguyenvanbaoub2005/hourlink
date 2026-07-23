package com.hourlink.appointment.entity;

import com.hourlink.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * Appointment — TODO: map fields từ DBML schema.
 */
@Entity
@Table(name = "appointment")
@Getter @Setter @Builder @AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Appointment extends BaseEntity {
    // TODO: thêm fields theo DBML schema
}
