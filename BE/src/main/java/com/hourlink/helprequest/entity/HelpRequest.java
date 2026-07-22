package com.hourlink.helprequest.entity;

import com.hourlink.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * HelpRequest — TODO: map fields từ DBML schema.
 */
@Entity
@Table(name = "help_request")
@Getter @Setter @Builder @AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class HelpRequest extends BaseEntity {
    // TODO: thêm fields theo DBML schema
}
