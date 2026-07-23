package com.hourlink.community.entity;

import com.hourlink.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * ActivityParticipant — TODO: map fields từ DBML schema.
 */
@Entity
@Table(name = "activity_participant")
@Getter @Setter @Builder @AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ActivityParticipant extends BaseEntity {
    // TODO: thêm fields theo DBML schema
}
