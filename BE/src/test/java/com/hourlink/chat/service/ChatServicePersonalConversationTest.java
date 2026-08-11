package com.hourlink.chat.service;

import com.hourlink.appointment.repository.AppointmentRepository;
import com.hourlink.chat.entity.ChatMessage;
import com.hourlink.chat.entity.Conversation;
import com.hourlink.chat.entity.UserBlock;
import com.hourlink.chat.enums.ConversationSourceType;
import com.hourlink.chat.enums.MessageType;
import com.hourlink.chat.repository.ChatMessageRepository;
import com.hourlink.chat.repository.ChatReportRepository;
import com.hourlink.chat.repository.ConversationRepository;
import com.hourlink.chat.repository.UserBlockRepository;
import com.hourlink.common.exception.AppException;
import com.hourlink.common.service.CloudinaryService;
import com.hourlink.common.service.FirebaseService;
import com.hourlink.community.repository.ActivityParticipantRepository;
import com.hourlink.community.repository.CommunityActivityRepository;
import com.hourlink.invitation.entity.Invitation;
import com.hourlink.invitation.enums.InvitationStatus;
import com.hourlink.invitation.repository.InvitationRepository;
import com.hourlink.notification.service.NotificationService;
import com.hourlink.skill.entity.Skill;
import com.hourlink.user.entity.User;
import com.hourlink.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.ArgumentCaptor;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ChatServicePersonalConversationTest {

    @Mock ConversationRepository conversationRepository;
    @Mock ChatMessageRepository chatMessageRepository;
    @Mock UserBlockRepository userBlockRepository;
    @Mock ChatReportRepository chatReportRepository;
    @Mock InvitationRepository invitationRepository;
    @Mock AppointmentRepository appointmentRepository;
    @Mock CommunityActivityRepository communityActivityRepository;
    @Mock ActivityParticipantRepository activityParticipantRepository;
    @Mock UserRepository userRepository;
    @Mock CloudinaryService cloudinaryService;
    @Mock FirebaseService firebaseService;
    @Mock NotificationService notificationService;

    @InjectMocks ChatService service;

    @AfterEach
    void clearThreadState() {
        SecurityContextHolder.clearContext();
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    void acceptedInvitationWithSameUserReusesPersonalConversation() {
        User requester = user("requester@hourlink.vn", "Người học");
        User helper = user("helper@hourlink.vn", "Người hỗ trợ");
        Invitation oldInvitation = invitation(requester, helper, "Guitar điện",
                Instant.parse("2026-08-01T00:00:00Z"));
        Invitation newInvitation = invitation(requester, helper, "Guitar đệm hát",
                Instant.parse("2026-08-09T00:00:00Z"));
        String pairKey = ChatService.personalPairKey(requester.getId(), helper.getId());

        Conversation existing = Conversation.builder()
                .invitation(oldInvitation)
                .sourceType(ConversationSourceType.SKILL_INVITATION)
                .personalPairKey(pairKey)
                .userOne(requester)
                .userTwo(helper)
                .hiddenByUserOne(true)
                .hiddenByUserTwo(true)
                .isActive(true)
                .build();
        existing.setId(UUID.randomUUID());
        existing.setCreatedAt(Instant.parse("2026-08-01T00:00:00Z"));

        when(conversationRepository.findByPersonalPairKeyAndIsActiveTrue(pairKey))
                .thenReturn(Optional.of(existing));
        when(conversationRepository.save(any(Conversation.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(chatMessageRepository.save(any(ChatMessage.class))).thenAnswer(invocation -> {
            ChatMessage message = invocation.getArgument(0);
            message.setId(UUID.randomUUID());
            message.setCreatedAt(Instant.parse("2026-08-09T00:01:00Z"));
            return message;
        });

        Conversation result = service.createConversationInternal(newInvitation);

        assertSame(existing, result);
        assertSame(newInvitation, result.getInvitation());
        assertEquals(pairKey, result.getPersonalPairKey());
        assertFalse(result.isHiddenByUserOne());
        assertFalse(result.isHiddenByUserTwo());
        assertEquals(MessageType.SYSTEM, result.getLastMessageType());
        verify(chatMessageRepository).save(any(ChatMessage.class));
    }

    @Test
    void duplicatePersonalRoomsAreArchivedAndMessagesMoveToCanonicalRoom() {
        User first = user("first@hourlink.vn", "Người thứ nhất");
        User second = user("second@hourlink.vn", "Người thứ hai");
        Invitation olderInvitation = invitation(first, second, "Java",
                Instant.parse("2026-08-01T00:00:00Z"));
        Invitation newerInvitation = invitation(second, first, "Spring Boot",
                Instant.parse("2026-08-08T00:00:00Z"));

        Conversation canonical = conversation(first, second, olderInvitation,
                Instant.parse("2026-08-01T00:00:00Z"),
                Instant.parse("2026-08-02T00:00:00Z"), "Tin cũ");
        canonical.setHiddenByUserOne(false);
        canonical.setHiddenByUserTwo(true);
        Conversation duplicate = conversation(second, first, newerInvitation,
                Instant.parse("2026-08-08T00:00:00Z"),
                Instant.parse("2026-08-09T00:00:00Z"), "Tin mới nhất");
        duplicate.setHiddenByUserOne(false);
        duplicate.setHiddenByUserTwo(false);

        when(conversationRepository.findAllActiveBySourceType(
                ConversationSourceType.SKILL_INVITATION))
                .thenReturn(List.of(canonical, duplicate));

        int archived = service.consolidateDuplicatePersonalConversations();

        String pairKey = ChatService.personalPairKey(first.getId(), second.getId());
        assertEquals(1, archived);
        assertEquals(pairKey, canonical.getPersonalPairKey());
        assertSame(newerInvitation, canonical.getInvitation());
        assertEquals("Tin mới nhất", canonical.getLastMessagePreview());
        assertTrue(canonical.getIsActive());
        assertFalse(canonical.isHiddenByUserOne());
        assertFalse(canonical.isHiddenByUserTwo());

        assertFalse(duplicate.getIsActive());
        assertNull(duplicate.getInvitation());
        assertNull(duplicate.getPersonalPairKey());
        assertTrue(duplicate.isHiddenByUserOne());
        assertTrue(duplicate.isHiddenByUserTwo());
        verify(chatMessageRepository).moveToConversation(canonical, List.of(duplicate.getId()));
        verify(conversationRepository).flush();
    }

    @Test
    void oldInvitationConversationIdResolvesToCanonicalRoom() {
        User first = user("first@hourlink.vn", "Người thứ nhất");
        User second = user("second@hourlink.vn", "Người thứ hai");
        Invitation invitation = invitation(first, second, "Guitar",
                Instant.parse("2026-08-01T00:00:00Z"));
        Conversation archived = conversation(first, second, invitation,
                Instant.parse("2026-08-01T00:00:00Z"),
                Instant.parse("2026-08-01T01:00:00Z"), "Phòng cũ");
        archived.setIsActive(false);
        Conversation canonical = conversation(first, second, null,
                Instant.parse("2026-08-01T00:00:00Z"),
                Instant.parse("2026-08-09T00:00:00Z"), "Phòng chính");
        canonical.setPersonalPairKey(ChatService.personalPairKey(first.getId(), second.getId()));

        when(conversationRepository.findByInvitation_Id(invitation.getId()))
                .thenReturn(Optional.of(archived));
        when(conversationRepository.findByPersonalPairKeyAndIsActiveTrue(
                canonical.getPersonalPairKey())).thenReturn(Optional.of(canonical));

        UUID resolved = service.findConversationIdByInvitation(invitation.getId());

        assertEquals(canonical.getId(), resolved);
    }

    @Test
    void attachmentValidationAcceptsIosHeicImage() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "IMG_1001.HEIC", "image/heic", new byte[]{1});

        assertTrue(service.validateFile(file));
    }

    @Test
    void attachmentValidationInfersSupportedTypesFromGenericPickerMime() {
        MockMultipartFile image = new MockMultipartFile(
                "file", "photo.webp", "application/octet-stream", new byte[]{1});
        MockMultipartFile document = new MockMultipartFile(
                "file", "lesson.docx", "application/octet-stream", new byte[]{1});

        assertTrue(service.validateFile(image));
        assertFalse(service.validateFile(document));
    }

    @Test
    void attachmentValidationStillRejectsUnsupportedGenericFile() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "malware.exe", "application/octet-stream", new byte[]{1});

        assertThrows(AppException.class, () -> service.validateFile(file));
    }

    @Test
    void attachmentWithArchivedConversationIdUsesCanonicalRoomAndCleansOnRollback()
            throws Exception {
        User first = user("first@hourlink.vn", "Người thứ nhất");
        User second = user("second@hourlink.vn", "Người thứ hai");
        Conversation archived = conversation(first, second, null,
                Instant.parse("2026-08-01T00:00:00Z"),
                Instant.parse("2026-08-01T01:00:00Z"), "Phòng cũ");
        archived.setIsActive(false);
        Conversation canonical = conversation(second, first, null,
                Instant.parse("2026-08-01T00:00:00Z"),
                Instant.parse("2026-08-09T00:00:00Z"), "Phòng chính");
        canonical.setPersonalPairKey(null); // Mô phỏng dữ liệu cũ chưa backfill key.

        String longOriginalName = "C:\\fakepath\\" + "a".repeat(280) + ".pdf";
        MockMultipartFile file = new MockMultipartFile(
                "file", longOriginalName, "application/pdf", new byte[]{1, 2, 3});
        authenticate(first);

        String pairKey = ChatService.personalPairKey(first.getId(), second.getId());
        when(conversationRepository.findById(archived.getId())).thenReturn(Optional.of(archived));
        when(conversationRepository.findByPersonalPairKeyAndIsActiveTrue(pairKey))
                .thenReturn(Optional.empty());
        when(conversationRepository.findActivePersonalBetweenUsers(first.getId(), second.getId()))
                .thenReturn(List.of(canonical));
        when(userRepository.findByEmail(first.getEmail())).thenReturn(Optional.of(first));
        when(cloudinaryService.uploadFile(file, "chat_attachments", false)).thenReturn(Map.of(
                "secure_url", "https://cdn.example/lesson.pdf",
                "public_id", "chat_attachments/lesson"));
        when(chatMessageRepository.save(any(ChatMessage.class))).thenAnswer(invocation -> {
            ChatMessage message = invocation.getArgument(0);
            message.setId(UUID.randomUUID());
            message.setCreatedAt(Instant.parse("2026-08-09T01:00:00Z"));
            return message;
        });
        when(conversationRepository.save(any(Conversation.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        TransactionSynchronizationManager.initSynchronization();
        var response = service.sendAttachment(archived.getId(), file, "Tài liệu buổi học");

        ArgumentCaptor<ChatMessage> savedMessage = ArgumentCaptor.forClass(ChatMessage.class);
        verify(chatMessageRepository).save(savedMessage.capture());
        assertSame(canonical, savedMessage.getValue().getConversation());
        assertEquals(canonical.getId(), response.getConversationId());
        assertEquals(255, savedMessage.getValue().getOriginalName().length());
        assertTrue(savedMessage.getValue().getOriginalName().endsWith(".pdf"));
        assertFalse(savedMessage.getValue().getOriginalName().contains("/"));
        verify(cloudinaryService, never()).deleteFile(any(), eq(false));

        List<TransactionSynchronization> synchronizations =
                TransactionSynchronizationManager.getSynchronizations();
        assertEquals(1, synchronizations.size());
        synchronizations.getFirst().afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK);
        verify(cloudinaryService).deleteFile("chat_attachments/lesson", false);
    }

    @Test
    void attachmentDeletesCloudinaryAssetWhenDatabaseWriteFails() throws Exception {
        User first = user("first@hourlink.vn", "Người thứ nhất");
        User second = user("second@hourlink.vn", "Người thứ hai");
        Conversation canonical = conversation(first, second, null,
                Instant.parse("2026-08-01T00:00:00Z"),
                Instant.parse("2026-08-09T00:00:00Z"), "Phòng chính");
        canonical.setPersonalPairKey(ChatService.personalPairKey(first.getId(), second.getId()));
        MockMultipartFile file = new MockMultipartFile(
                "file", "photo.png", "image/png", new byte[]{1, 2, 3});
        authenticate(first);

        when(conversationRepository.findById(canonical.getId())).thenReturn(Optional.of(canonical));
        when(conversationRepository.findByPersonalPairKeyAndIsActiveTrue(
                canonical.getPersonalPairKey())).thenReturn(Optional.of(canonical));
        when(userRepository.findByEmail(first.getEmail())).thenReturn(Optional.of(first));
        when(cloudinaryService.uploadFile(file, "chat_attachments", true)).thenReturn(Map.of(
                "secure_url", "https://cdn.example/photo.png",
                "public_id", "chat_attachments/photo"));
        when(chatMessageRepository.save(any(ChatMessage.class)))
                .thenThrow(new IllegalStateException("database unavailable"));

        assertThrows(IllegalStateException.class,
                () -> service.sendAttachment(canonical.getId(), file, null));

        verify(cloudinaryService).deleteFile("chat_attachments/photo", true);
    }

    @Test
    void attachmentRejectsIncompleteCloudinaryResultAndDeletesUploadedAsset() throws Exception {
        User first = user("first@hourlink.vn", "Người thứ nhất");
        User second = user("second@hourlink.vn", "Người thứ hai");
        Conversation canonical = conversation(first, second, null,
                Instant.parse("2026-08-01T00:00:00Z"),
                Instant.parse("2026-08-09T00:00:00Z"), "Phòng chính");
        canonical.setPersonalPairKey(ChatService.personalPairKey(first.getId(), second.getId()));
        MockMultipartFile file = new MockMultipartFile(
                "file", "lesson.pdf", "application/pdf", new byte[]{1, 2, 3});
        authenticate(first);

        when(conversationRepository.findById(canonical.getId())).thenReturn(Optional.of(canonical));
        when(conversationRepository.findByPersonalPairKeyAndIsActiveTrue(
                canonical.getPersonalPairKey())).thenReturn(Optional.of(canonical));
        when(userRepository.findByEmail(first.getEmail())).thenReturn(Optional.of(first));
        when(cloudinaryService.uploadFile(file, "chat_attachments", false))
                .thenReturn(Map.of("public_id", "chat_attachments/incomplete"));

        AppException error = assertThrows(AppException.class,
                () -> service.sendAttachment(canonical.getId(), file, null));

        assertEquals(com.hourlink.common.exception.ErrorCode.UPLOAD_FAILED, error.getErrorCode());
        verify(cloudinaryService).deleteFile("chat_attachments/incomplete", false);
        verify(chatMessageRepository, never()).save(any(ChatMessage.class));
    }

    @Test
    void appointmentCardWithArchivedConversationIdIsStoredInCanonicalRoom() {
        User first = user("first@hourlink.vn", "Người thứ nhất");
        User second = user("second@hourlink.vn", "Người thứ hai");
        Invitation currentInvitation = invitation(first, second, "Spring Boot",
                Instant.parse("2026-08-09T00:00:00Z"));
        Conversation archived = conversation(first, second, null,
                Instant.parse("2026-08-01T00:00:00Z"),
                Instant.parse("2026-08-01T01:00:00Z"), "Phòng cũ");
        archived.setIsActive(false);
        Conversation canonical = conversation(second, first, currentInvitation,
                Instant.parse("2026-08-01T00:00:00Z"),
                Instant.parse("2026-08-09T00:00:00Z"), "Phòng chính");
        canonical.setPersonalPairKey(ChatService.personalPairKey(first.getId(), second.getId()));

        UUID appointmentId = UUID.randomUUID();
        when(conversationRepository.findById(archived.getId())).thenReturn(Optional.of(archived));
        when(conversationRepository.findByPersonalPairKeyAndIsActiveTrue(
                canonical.getPersonalPairKey())).thenReturn(Optional.of(canonical));
        when(chatMessageRepository.save(any(ChatMessage.class))).thenAnswer(invocation -> {
            ChatMessage message = invocation.getArgument(0);
            message.setId(UUID.randomUUID());
            message.setCreatedAt(Instant.parse("2026-08-09T01:00:00Z"));
            return message;
        });
        when(conversationRepository.save(any(Conversation.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        service.sendAppointmentCardInternal(
                archived.getId(), appointmentId, "{\"status\":\"PENDING\"}", first);

        ArgumentCaptor<ChatMessage> savedMessage = ArgumentCaptor.forClass(ChatMessage.class);
        verify(chatMessageRepository).save(savedMessage.capture());
        assertSame(canonical, savedMessage.getValue().getConversation());
        assertEquals(appointmentId, savedMessage.getValue().getAppointmentId());
    }

    @Test
    void unblockRestoresConversationWhenNoBlockRemainsBetweenUsers() {
        User blocker = user("blocker@hourlink.vn", "Người chặn");
        User blocked = user("blocked@hourlink.vn", "Người bị chặn");
        Conversation conversation = conversation(blocker, blocked, null,
                Instant.parse("2026-08-01T00:00:00Z"),
                Instant.parse("2026-08-09T00:00:00Z"), "Tin nhắn");
        UserBlock block = UserBlock.builder().blocker(blocker).blocked(blocked).build();
        block.setId(UUID.randomUUID());
        authenticate(blocker);

        when(userRepository.findByEmail(blocker.getEmail())).thenReturn(Optional.of(blocker));
        when(userBlockRepository.findByBlocker_IdAndBlocked_Id(blocker.getId(), blocked.getId()))
                .thenReturn(Optional.of(block));
        when(userBlockRepository.existsBlockBetween(blocker.getId(), blocked.getId()))
                .thenReturn(false);
        when(firebaseService.isEnabled()).thenReturn(true);
        when(conversationRepository.findAllByParticipantEmail(blocker.getEmail()))
                .thenReturn(List.of(conversation));

        service.unblockUser(blocked.getId());

        verify(userBlockRepository).delete(block);
        verify(firebaseService).setBlocked(conversation.getId().toString(), false);
    }

    @Test
    void unblockKeepsConversationLockedWhenOtherUserStillBlocksMe() {
        User blocker = user("blocker@hourlink.vn", "Người chặn");
        User blocked = user("blocked@hourlink.vn", "Người bị chặn");
        UserBlock block = UserBlock.builder().blocker(blocker).blocked(blocked).build();
        block.setId(UUID.randomUUID());
        authenticate(blocker);

        when(userRepository.findByEmail(blocker.getEmail())).thenReturn(Optional.of(blocker));
        when(userBlockRepository.findByBlocker_IdAndBlocked_Id(blocker.getId(), blocked.getId()))
                .thenReturn(Optional.of(block));
        when(userBlockRepository.existsBlockBetween(blocker.getId(), blocked.getId()))
                .thenReturn(true);

        service.unblockUser(blocked.getId());

        verify(userBlockRepository).delete(block);
        verify(firebaseService, never()).setBlocked(any(), eq(false));
    }

    private void authenticate(User user) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(user.getEmail(), null, List.of()));
    }

    private Conversation conversation(User userOne, User userTwo, Invitation invitation,
                                      Instant createdAt, Instant lastMessageAt, String preview) {
        Conversation value = Conversation.builder()
                .invitation(invitation)
                .sourceType(ConversationSourceType.SKILL_INVITATION)
                .userOne(userOne)
                .userTwo(userTwo)
                .lastMessageAt(lastMessageAt)
                .lastMessagePreview(preview)
                .lastMessageType(MessageType.TEXT)
                .isActive(true)
                .build();
        value.setId(UUID.randomUUID());
        value.setCreatedAt(createdAt);
        return value;
    }

    private Invitation invitation(User sender, User receiver, String skillName, Instant createdAt) {
        Skill skill = Skill.builder().name(skillName).user(receiver).build();
        skill.setId(UUID.randomUUID());
        Invitation value = Invitation.builder()
                .sender(sender)
                .receiver(receiver)
                .skill(skill)
                .content("Hỗ trợ " + skillName)
                .status(InvitationStatus.ACCEPTED)
                .build();
        value.setId(UUID.randomUUID());
        value.setCreatedAt(createdAt);
        return value;
    }

    private User user(String email, String name) {
        User value = User.builder()
                .email(email)
                .fullName(name)
                .passwordHash("test")
                .build();
        value.setId(UUID.randomUUID());
        return value;
    }
}
