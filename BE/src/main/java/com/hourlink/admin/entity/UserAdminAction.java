package com.hourlink.admin.entity;

import com.hourlink.common.entity.BaseEntity;
import com.hourlink.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "user_admin_actions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserAdminAction extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_id", nullable = false)
    User admin; // The admin who performed the action

    @Column(name = "action_type", nullable = false, length = 50)
    String actionType; // "WARN", "LOCK", "UNLOCK", "SOFT_DELETE", "WALLET_ADJUSTMENT"

    @Column(name = "reason", columnDefinition = "TEXT")
    String reason;
}
