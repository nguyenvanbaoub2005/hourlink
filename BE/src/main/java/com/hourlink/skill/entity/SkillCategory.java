package com.hourlink.skill.entity;

import com.hourlink.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * SkillCategory — TODO: map fields từ DBML schema.
 */
@Entity
@Table(name = "skill_category")
@Getter @Setter @Builder @AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SkillCategory extends BaseEntity {
    // TODO: thêm fields theo DBML schema
}
