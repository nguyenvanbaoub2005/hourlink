package com.hourlink.wallet.entity;

import com.hourlink.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * Wallet — TODO: map fields từ DBML schema.
 */
@Entity
@Table(name = "wallet")
@Getter @Setter @Builder @AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Wallet extends BaseEntity {
    // TODO: thêm fields theo DBML schema
}
