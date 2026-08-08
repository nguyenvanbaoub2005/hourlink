package com.hourlink.chat.repository;

import com.hourlink.chat.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * ConversationRepository — Truy vấn DB cho cuộc trò chuyện (chức năng 9.10).
 */
@Repository
public interface ConversationRepository extends JpaRepository<Conversation, UUID> {

    /** Tìm cuộc trò chuyện gắn với một lời mời (quan hệ 1-1) */
    Optional<Conversation> findByInvitation_Id(UUID invitationId);

    /** Đã tồn tại cuộc trò chuyện cho lời mời này chưa */
    boolean existsByInvitation_Id(UUID invitationId);

    /** Một người tham gia chỉ có một hội thoại trong mỗi hoạt động. */
    Optional<Conversation> findByCommunityActivity_IdAndUserTwo_Id(
            UUID communityActivityId, UUID participantUserId);

    /**
     * Danh sách cuộc trò chuyện của một người dùng, mới nhất trước.
     * Dùng JPQL vì derived query cho điều kiện OR trên hai quan hệ rất dài dòng.
     */
    @Query("""
            SELECT c FROM Conversation c
            WHERE c.userOne.email = :email OR c.userTwo.email = :email
            ORDER BY COALESCE(c.lastMessageAt, c.createdAt) DESC
            """)
    List<Conversation> findAllByParticipantEmail(@Param("email") String email);
}
