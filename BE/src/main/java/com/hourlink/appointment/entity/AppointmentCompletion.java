package com.hourlink.appointment.entity;

import com.hourlink.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * AppointmentCompletion — TODO: map fields từ DBML schema.
 */
@Entity
@Table(name = "appointment_completion")
@Getter @Setter @Builder @AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AppointmentCompletion extends BaseEntity {
    // TODO: thêm fields theo DBML schema
}
