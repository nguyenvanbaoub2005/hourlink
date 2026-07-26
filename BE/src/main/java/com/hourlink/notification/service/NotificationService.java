package com.hourlink.notification.service;

import com.hourlink.common.exception.AppException;
import com.hourlink.common.exception.ErrorCode;
import com.hourlink.common.util.SecurityUtil;
import com.hourlink.notification.dto.response.NotificationResponse;
import com.hourlink.notification.entity.Notification;
import com.hourlink.notification.enums.NotificationType;
import com.hourlink.notification.repository.NotificationRepository;
import com.hourlink.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * NotificationService — Business logic cho hệ thống thông báo HourLink.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {

    private final NotificationRepository notificationRepository;

    // ─── Tạo thông báo (internal - gọi từ các service khác) ──────────────────

    /**
     * Tạo thông báo và lưu vào DB.
     * Được gọi từ InvitationService sau mỗi action quan trọng.
     */
    @Transactional
    public void createNotification(User user, NotificationType type,
                                   String title, String body, UUID referenceId) {
        Notification notif = Notification.builder()
                .user(user)
                .type(type)
                .title(title)
                .body(body)
                .referenceId(referenceId)
                .isRead(false)
                .build();
        notificationRepository.save(notif);
        log.info("Notification [{}] created for user: {}", type, user.getEmail());
    }

    // ─── Đọc thông báo (user) ─────────────────────────────────────────────────

    /** Danh sách thông báo của user hiện tại (mới nhất trước) */
    public List<NotificationResponse> getMyNotifications() {
        String email = SecurityUtil.getCurrentUserEmail();
        return notificationRepository.findAllByUser_EmailOrderByCreatedAtDesc(email)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    /** Số thông báo chưa đọc */
    public long getUnreadCount() {
        String email = SecurityUtil.getCurrentUserEmail();
        return notificationRepository.countByUser_EmailAndIsReadFalse(email);
    }

    // ─── Đánh dấu đã đọc ─────────────────────────────────────────────────────

    /** Đánh dấu một thông báo đã đọc */
    @Transactional
    public NotificationResponse markRead(UUID id) {
        String email = SecurityUtil.getCurrentUserEmail();
        Notification notif = notificationRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));

        // Chỉ owner mới được đánh dấu
        if (!notif.getUser().getEmail().equals(email)) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }

        notif.setIsRead(true);
        return mapToResponse(notificationRepository.save(notif));
    }

    /** Đánh dấu tất cả thông báo của user hiện tại là đã đọc */
    @Transactional
    public void markAllRead() {
        String email = SecurityUtil.getCurrentUserEmail();
        notificationRepository.markAllReadByEmail(email);
        log.info("Marked all notifications as read for: {}", email);
    }

    // ─── Mapper ───────────────────────────────────────────────────────────────

    private NotificationResponse mapToResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .type(n.getType())
                .title(n.getTitle())
                .body(n.getBody())
                .referenceId(n.getReferenceId())
                .isRead(n.getIsRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
