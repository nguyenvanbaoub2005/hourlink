package com.hourlink.community.entity;

import com.hourlink.common.entity.BaseEntity;
import com.hourlink.user.entity.User;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Quan hệ người dùng theo dõi một tổ chức có hoạt động Community. */
@Entity
@Table(
        name = "community_organization_follow",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_community_follower_organization",
                columnNames = {"follower_id", "organization_id"}),
        indexes = {
                @Index(name = "idx_community_follow_follower", columnList = "follower_id"),
                @Index(name = "idx_community_follow_organization", columnList = "organization_id")
        })
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationFollow extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "follower_id", nullable = false)
    private User follower;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organization_id", nullable = false)
    private User organization;
}
