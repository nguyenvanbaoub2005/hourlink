package com.hourlink.auth.entity;

import com.hourlink.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * UserVerification — Lưu OTP để xác minh email/phone.
 * TODO: map đầy đủ fields theo DBML schema.
 */
@Entity
@Table(name = "user_verification")
@Getter @Setter @Builder @AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserVerification extends BaseEntity {
    // TODO: user_id, otp_code, channel, purpose, expires_at, verified_at
}
