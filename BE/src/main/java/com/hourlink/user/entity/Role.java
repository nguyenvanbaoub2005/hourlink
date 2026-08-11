package com.hourlink.user.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

@Entity
@Table(name = "role")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "role_id")
    UUID roleId;

    @Column(name = "role_name", length = 100, nullable = false)
    String roleName;

    @Column(name = "role_code", length = 50, nullable = false, unique = true)
    String roleCode;

    @Column(name = "description", length = 255)
    String description;
}
