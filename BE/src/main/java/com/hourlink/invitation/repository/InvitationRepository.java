package com.hourlink.invitation.repository;

import com.hourlink.invitation.entity.Invitation;
import com.hourlink.invitation.enums.InvitationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * InvitationRepository — Truy vấn DB cho module Invitation.
 */
@Repository
public interface InvitationRepository extends JpaRepository<Invitation, UUID> {

    /** Danh sách lời mời đã gửi của một user (theo email) */
    List<Invitation> findAllBySender_EmailOrderByCreatedAtDesc(String senderEmail);

    /** Danh sách lời mời đã nhận của một user (theo email) */
    List<Invitation> findAllByReceiver_EmailOrderByCreatedAtDesc(String receiverEmail);

    /** Kiểm tra xem sender đã gửi lời mời PENDING đến receiver cho skill này chưa */
    boolean existsBySender_EmailAndReceiver_IdAndSkill_IdAndStatus(
            String senderEmail, UUID receiverId, UUID skillId, InvitationStatus status);

    /** Kiểm tra đã có lời mời PENDING giữa 2 user (không kể skill) */
    boolean existsBySender_EmailAndReceiver_IdAndStatus(
            String senderEmail, UUID receiverId, InvitationStatus status);
}
