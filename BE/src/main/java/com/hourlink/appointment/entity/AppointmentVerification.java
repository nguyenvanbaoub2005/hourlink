package com.hourlink.appointment.entity;

import com.hourlink.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * AppointmentVerification — TODO: map fields từ DBML schema.
 */
@Entity
@Table(name = "appointment_verification")
@Getter @Setter @Builder @AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AppointmentVerification extends BaseEntity {
    // TODO: thêm fields theo DBML schema
}
