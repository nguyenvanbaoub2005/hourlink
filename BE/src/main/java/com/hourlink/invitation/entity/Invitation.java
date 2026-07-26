package com.hourlink.invitation.entity;

import com.hourlink.common.entity.BaseEntity;
import com.hourlink.helprequest.entity.HelpRequest;
import com.hourlink.invitation.enums.InvitationStatus;
import com.hourlink.skill.entity.Skill;
import com.hourlink.skill.enums.SessionFormat;
import com.hourlink.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * Invitation — Lời mời hỗ trợ (chức năng 9.9).
 * Người cần hỗ trợ (sender) gửi lời mời đến người có kỹ năng (receiver).
 */
@Entity
@Table(name = "invitation", indexes = {
        @Index(name = "idx_invitation_sender",   columnList = "sender_id"),
        @Index(name = "idx_invitation_receiver", columnList = "receiver_id"),
        @Index(name = "idx_invitation_status",   columnList = "status")
})
@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Invitation extends BaseEntity {

    /** Người gửi lời mời (người cần hỗ trợ / requester) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    User sender;

    /** Người nhận lời mời (người có kỹ năng / helper) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_id", nullable = false)
    User receiver;

    /** Kỹ năng mà sender muốn được hỗ trợ (tùy chọn) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "skill_id")
    Skill skill;

    /** Yêu cầu hỗ trợ liên kết (tùy chọn, nếu xuất phát từ HelpRequest) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "help_request_id")
    HelpRequest helpRequest;

    /** Nội dung cụ thể của yêu cầu */
    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    String content;

    /** Tin nhắn giới thiệu cá nhân từ người gửi */
    @Column(name = "message", columnDefinition = "TEXT")
    String message;

    /** Thời gian đề xuất (ví dụ: "Tối thứ Bảy 19:00") */
    @Column(name = "proposed_time", length = 200)
    String proposedTime;

    /** Thời lượng đề xuất (phút) */
    @Column(name = "duration")
    Integer duration;

    /** Hình thức: ONLINE, OFFLINE, BOTH */
    @Enumerated(EnumType.STRING)
    @Column(name = "format", length = 50, nullable = false)
    SessionFormat format;

    /** Trạng thái lời mời */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 50, nullable = false)
    @Builder.Default
    InvitationStatus status = InvitationStatus.PENDING;

    /** Lý do từ chối (khi status = REJECTED) */
    @Column(name = "reject_reason", columnDefinition = "TEXT")
    String rejectReason;

    /** Thời gian đề xuất mới của receiver khi RESCHEDULED */
    @Column(name = "reschedule_time", length = 200)
    String rescheduleTime;
}
