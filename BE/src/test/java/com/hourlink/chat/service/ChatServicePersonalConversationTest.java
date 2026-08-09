package com.hourlink.chat.service;

import com.hourlink.appointment.repository.AppointmentRepository;
import com.hourlink.chat.entity.ChatMessage;
import com.hourlink.chat.entity.Conversation;
import com.hourlink.chat.enums.ConversationSourceType;
import com.hourlink.chat.enums.MessageType;
import com.hourlink.chat.repository.ChatMessageRepository;
import com.hourlink.chat.repository.ChatReportRepository;
import com.hourlink.chat.repository.ConversationRepository;
import com.hourlink.chat.repository.UserBlockRepository;
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
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
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
