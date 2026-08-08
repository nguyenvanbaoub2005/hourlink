package com.hourlink.invitation.repository;

import com.hourlink.invitation.entity.Invitation;
import com.hourlink.invitation.enums.InvitationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * InvitationRepository — Truy vấn DB cho module Invitation.
 */
@Repository
public interface InvitationRepository extends JpaRepository<Invitation, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Invitation i WHERE i.id = :id")
    Optional<Invitation> findByIdForUpdate(@Param("id") UUID id);

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
