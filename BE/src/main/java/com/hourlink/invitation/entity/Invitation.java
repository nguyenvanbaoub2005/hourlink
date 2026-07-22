package com.hourlink.invitation.entity;

import com.hourlink.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * Invitation — TODO: map fields từ DBML schema.
 */
@Entity
@Table(name = "invitation")
@Getter @Setter @Builder @AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Invitation extends BaseEntity {
    // TODO: thêm fields theo DBML schema
}
