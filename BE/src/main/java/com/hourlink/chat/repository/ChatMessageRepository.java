package com.hourlink.chat.repository;

import com.hourlink.chat.entity.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;
import java.util.List;

/**
 * ChatMessageRepository — Truy vấn DB cho tin nhắn (chức năng 9.10).
 */
@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {

    /** Lịch sử tin nhắn của một cuộc trò chuyện, mới nhất trước (phân trang) */
    Page<ChatMessage> findAllByConversation_IdOrderByCreatedAtDesc(UUID conversationId, Pageable pageable);

    /** Số tin chưa đọc của tôi trong một cuộc trò chuyện (tin do người kia gửi) */
    @Query("""
            SELECT COUNT(m) FROM ChatMessage m
            WHERE m.conversation.id = :conversationId
              AND m.isRead = false
              AND m.sender IS NOT NULL
              AND m.sender.email <> :email
            """)
    long countUnreadInConversation(@Param("conversationId") UUID conversationId,
                                   @Param("email") String email);

    /** Tổng số tin chưa đọc của tôi trên toàn bộ cuộc trò chuyện (badge) */
    @Query("""
            SELECT COUNT(m) FROM ChatMessage m
            WHERE (m.conversation.userOne.email = :email OR m.conversation.userTwo.email = :email)
              AND m.isRead = false
              AND m.sender IS NOT NULL
              AND m.sender.email <> :email
            """)
    long countTotalUnread(@Param("email") String email);

    /** Đánh dấu toàn bộ tin nhắn của người kia trong cuộc trò chuyện là đã đọc */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            UPDATE ChatMessage m SET m.isRead = true
            WHERE m.conversation.id = :conversationId
              AND m.isRead = false
              AND m.sender IS NOT NULL
              AND m.sender.email <> :email
            """)
    int markAllReadInConversation(@Param("conversationId") UUID conversationId,
                                  @Param("email") String email);

    /** Lấy các card của một lịch hẹn để cập nhật cả MySQL và Firebase. */
    List<ChatMessage> findAllByAppointmentId(UUID appointmentId);

    /**
     * Lấy tin nhắn mới nhất còn hiển thị với một user cụ thể trong hội thoại.
     * Dùng để cập nhật lastMessagePreview khi user xóa tin nhắn phía mình.
     */
    @Query("""
            SELECT m FROM ChatMessage m
            WHERE m.conversation.id = :conversationId
              AND m.isRecalled = false
              AND (
                (m.sender IS NOT NULL AND m.sender.email = :email AND m.hiddenBySender = false)
                OR
                (m.sender IS NULL OR m.sender.email <> :email) AND m.hiddenByReceiver = false
              )
            ORDER BY m.createdAt DESC
            LIMIT 1
            """)
    java.util.Optional<ChatMessage> findLastVisibleForUser(
            @Param("conversationId") UUID conversationId,
            @Param("email") String email);
}
