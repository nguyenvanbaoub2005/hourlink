package com.hourlink.rating.entity;

import com.hourlink.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * Rating — TODO: map fields từ DBML schema.
 */
@Entity
@Table(name = "rating")
@Getter @Setter @Builder @AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Rating extends BaseEntity {
    // TODO: thêm fields theo DBML schema
}
