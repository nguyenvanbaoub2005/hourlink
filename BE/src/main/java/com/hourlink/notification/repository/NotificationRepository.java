package com.hourlink.notification.repository;

import com.hourlink.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    /** Tất cả thông báo của user, mới nhất trước */
    List<Notification> findAllByUser_EmailOrderByCreatedAtDesc(String email);

    /** Số thông báo chưa đọc */
    long countByUser_EmailAndIsReadFalse(String email);

    /** Đánh dấu đọc tất cả thông báo của user */
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.user.email = :email AND n.isRead = false")
    void markAllReadByEmail(String email);
}
