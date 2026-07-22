package com.hourlink.user.entity;

import com.hourlink.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * OrganizationProfile — Hồ sơ bổ sung cho tài khoản tổ chức.
 * TODO: map fields theo DBML schema.
 */
@Entity
@Table(name = "organization_profile")
@Getter @Setter @Builder @AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrganizationProfile extends BaseEntity {
    // TODO: user_id (FK), organization_name, organization_type, address,
    //       representative_name, verified_document_url
}
