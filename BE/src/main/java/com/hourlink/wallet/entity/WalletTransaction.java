package com.hourlink.wallet.entity;

import com.hourlink.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * WalletTransaction — TODO: map fields từ DBML schema.
 */
@Entity
@Table(name = "wallet_transaction")
@Getter @Setter @Builder @AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class WalletTransaction extends BaseEntity {
    // TODO: thêm fields theo DBML schema
}
