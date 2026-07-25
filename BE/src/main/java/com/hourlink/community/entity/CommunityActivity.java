package com.hourlink.community.entity;

import com.hourlink.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * CommunityActivity — TODO: map fields từ DBML schema.
 */
@Entity
@Table(name = "community_activity")
@Getter @Setter @Builder @AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CommunityActivity extends BaseEntity {
    // TODO: thêm fields theo DBML schema
}
