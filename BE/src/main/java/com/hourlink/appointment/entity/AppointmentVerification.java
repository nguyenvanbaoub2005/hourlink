package com.hourlink.appointment.entity;

import com.hourlink.common.entity.BaseEntity;
import com.hourlink.appointment.enums.VerificationMethod;
import com.hourlink.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import java.time.LocalDateTime;

/**
 * AppointmentVerification — Quản lý mã QR hoặc OTP xác minh khi bắt đầu lịch hẹn (chức năng 9.14).
 */
@Entity
@Table(name = "appointment_verification", indexes = {
        @Index(name = "idx_verif_appointment", columnList = "appointment_id"),
        @Index(name = "idx_verif_code", columnList = "code")
})
@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AppointmentVerification extends BaseEntity {

    /** Lịch hẹn được xác minh */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", nullable = false)
    Appointment appointment;

    /** Hình thức: QR hoặc OTP */
    @Enumerated(EnumType.STRING)
    @Column(name = "method", length = 50, nullable = false)
    VerificationMethod method;

    /** Chuỗi mã xác thực (Token string cho QR hoặc chuỗi 6 số cho OTP) */
    @Column(name = "code", nullable = false, length = 255)
    String code;

    /** Thời gian hết hạn của mã */
    @Column(name = "expires_at", nullable = false)
    LocalDateTime expiresAt;

    /** Thời gian mã đã được sử dụng/xác minh thành công */
    @Column(name = "verified_at")
    LocalDateTime verifiedAt;

    /** Người đã nhập OTP / Quét QR */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verified_by")
    User verifiedBy;
}
