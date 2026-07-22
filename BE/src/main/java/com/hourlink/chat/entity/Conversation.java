package com.hourlink.chat.entity;

import com.hourlink.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * Conversation — TODO: map fields từ DBML schema.
 */
@Entity
@Table(name = "conversation")
@Getter @Setter @Builder @AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Conversation extends BaseEntity {
    // TODO: thêm fields theo DBML schema
}
