package com.hourlink.chat.entity;

import com.hourlink.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * ChatMessage — TODO: map fields từ DBML schema.
 */
@Entity
@Table(name = "chat_message")
@Getter @Setter @Builder @AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChatMessage extends BaseEntity {
    // TODO: thêm fields theo DBML schema
}
