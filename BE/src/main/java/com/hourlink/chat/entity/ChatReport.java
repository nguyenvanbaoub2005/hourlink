package com.hourlink.chat.entity;

import com.hourlink.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * ChatReport — TODO: map fields từ DBML schema.
 */
@Entity
@Table(name = "chat_report")
@Getter @Setter @Builder @AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChatReport extends BaseEntity {
    // TODO: thêm fields theo DBML schema
}
