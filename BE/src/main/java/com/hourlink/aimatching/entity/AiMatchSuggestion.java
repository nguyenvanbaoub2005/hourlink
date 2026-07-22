package com.hourlink.aimatching.entity;

import com.hourlink.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * AiMatchSuggestion — TODO: map fields từ DBML schema.
 */
@Entity
@Table(name = "ai_match_suggestion")
@Getter @Setter @Builder @AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AiMatchSuggestion extends BaseEntity {
    // TODO: thêm fields theo DBML schema
}
