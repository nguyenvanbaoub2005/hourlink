package com.hourlink.chat.entity;

import com.hourlink.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * UserBlock — TODO: map fields từ DBML schema.
 */
@Entity
@Table(name = "user_block")
@Getter @Setter @Builder @AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserBlock extends BaseEntity {
    // TODO: thêm fields theo DBML schema
}
