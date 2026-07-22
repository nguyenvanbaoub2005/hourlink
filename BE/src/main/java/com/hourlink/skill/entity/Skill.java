package com.hourlink.skill.entity;

import com.hourlink.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * Skill — TODO: map fields từ DBML schema.
 */
@Entity
@Table(name = "skill")
@Getter @Setter @Builder @AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Skill extends BaseEntity {
    // TODO: thêm fields theo DBML schema
}
