package com.hourlink.chat.service;

import com.hourlink.appointment.repository.AppointmentRepository;
import com.hourlink.chat.dto.request.ProposeRescheduleRequest;
import com.hourlink.chat.entity.ChatMessage;
import com.hourlink.chat.entity.Conversation;
import com.hourlink.chat.enums.ConversationSourceType;
import com.hourlink.chat.repository.ChatMessageRepository;
import com.hourlink.chat.repository.ChatReportRepository;
import com.hourlink.chat.repository.ConversationRepository;
import com.hourlink.chat.repository.UserBlockRepository;
import com.hourlink.common.exception.AppException;
import com.hourlink.common.exception.ErrorCode;
import com.hourlink.common.service.CloudinaryService;
import com.hourlink.common.service.FirebaseService;
import com.hourlink.community.entity.ActivityParticipant;
import com.hourlink.community.entity.CommunityActivity;
import com.hourlink.community.enums.ActivityParticipantStatus;
import com.hourlink.community.repository.ActivityParticipantRepository;
import com.hourlink.community.repository.CommunityActivityRepository;
import com.hourlink.invitation.repository.InvitationRepository;
import com.hourlink.notification.service.NotificationService;
import com.hourlink.user.entity.User;
import com.hourlink.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ChatServiceCommunityTest {

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

    private User participantUser;
    private User organizer;
    private CommunityActivity activity;

    @BeforeEach
    void setUp() {
        participantUser = user("participant@hourlink.vn", "Người tham gia");
        organizer = user("organization@hourlink.vn", "Tổ chức Xanh");
        activity = CommunityActivity.builder()
                .organizer(organizer)
                .title("Dọn rác bãi biển")
                .startTime(Instant.now().plusSeconds(3600))
                .endTime(Instant.now().plusSeconds(7200))
                .creditReward(2.0)
                .build();
        activity.setId(UUID.randomUUID());

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(participantUser.getEmail(), null,
                        List.of(new SimpleGrantedAuthority("ROLE_USER"))));
        when(userRepository.findByEmail(participantUser.getEmail()))
                .thenReturn(Optional.of(participantUser));
    }

    @AfterEach
    void clearSecurity() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void registeredParticipantCanOpenIdempotentCommunityConversation() {
        ActivityParticipant participant = ActivityParticipant.builder()
                .activity(activity)
                .user(participantUser)
                .status(ActivityParticipantStatus.REGISTERED)
                .build();
        when(communityActivityRepository.findByIdForUpdate(activity.getId()))
                .thenReturn(Optional.of(activity));
        when(activityParticipantRepository.findByActivityIdAndUserId(
                activity.getId(), participantUser.getId())).thenReturn(Optional.of(participant));

        Conversation existing = Conversation.builder()
                .communityActivity(activity)
                .sourceType(ConversationSourceType.COMMUNITY_ACTIVITY)
                .userOne(organizer)
                .userTwo(participantUser)
                .build();
        existing.setId(UUID.randomUUID());
        existing.setCreatedAt(Instant.now());
        when(conversationRepository.findByCommunityActivity_IdAndUserTwo_Id(
                activity.getId(), participantUser.getId()))
                .thenReturn(Optional.empty(), Optional.of(existing));
        when(conversationRepository.save(any(Conversation.class))).thenAnswer(invocation -> {
            Conversation conversation = invocation.getArgument(0);
            if (conversation.getId() == null) conversation.setId(existing.getId());
            if (conversation.getCreatedAt() == null) conversation.setCreatedAt(Instant.now());
            return conversation;
        });
        when(chatMessageRepository.save(any(ChatMessage.class))).thenAnswer(invocation -> {
            ChatMessage message = invocation.getArgument(0);
            message.setId(UUID.randomUUID());
            message.setCreatedAt(Instant.now());
            return message;
        });
        when(chatMessageRepository.findLastVisibleForUser(any(), any()))
                .thenReturn(Optional.empty());

        var created = service.getOrCreateCommunityConversation(activity.getId());
        var reopened = service.getOrCreateCommunityConversation(activity.getId());

        assertEquals(existing.getId(), created.getId());
        assertEquals(existing.getId(), reopened.getId());
        assertEquals(ConversationSourceType.COMMUNITY_ACTIVITY, created.getSourceType());
        assertEquals(activity.getId(), created.getCommunityActivityId());
        assertEquals(activity.getTitle(), created.getCommunityActivityTitle());
        assertNull(created.getInvitationId());
        verify(chatMessageRepository).save(any(ChatMessage.class));
    }

    @Test
    void cancelledParticipantCannotOpenCommunityConversation() {
        ActivityParticipant participant = ActivityParticipant.builder()
                .activity(activity)
                .user(participantUser)
                .status(ActivityParticipantStatus.CANCELLED)
                .build();
        when(communityActivityRepository.findByIdForUpdate(activity.getId()))
                .thenReturn(Optional.of(activity));
        when(activityParticipantRepository.findByActivityIdAndUserId(
                activity.getId(), participantUser.getId())).thenReturn(Optional.of(participant));

        AppException error = assertThrows(AppException.class,
                () -> service.getOrCreateCommunityConversation(activity.getId()));

        assertEquals(ErrorCode.COMMUNITY_CHAT_NOT_ALLOWED, error.getErrorCode());
        verify(conversationRepository, never()).save(any());
    }

    @Test
    void communityConversationCannotRescheduleSkillInvitation() {
        Conversation conversation = Conversation.builder()
                .communityActivity(activity)
                .sourceType(ConversationSourceType.COMMUNITY_ACTIVITY)
                .userOne(organizer)
                .userTwo(participantUser)
                .build();
        conversation.setId(UUID.randomUUID());
        when(conversationRepository.findById(conversation.getId()))
                .thenReturn(Optional.of(conversation));

        ProposeRescheduleRequest request = new ProposeRescheduleRequest();
        request.setProposedTime("Tối thứ Bảy 19:00");

        AppException error = assertThrows(AppException.class,
                () -> service.proposeReschedule(conversation.getId(), request));

        assertEquals(ErrorCode.CHAT_NOT_ALLOWED, error.getErrorCode());
        verify(invitationRepository, never()).save(any());
    }

    private User user(String email, String fullName) {
        User value = User.builder()
                .email(email)
                .fullName(fullName)
                .passwordHash("test")
                .build();
        value.setId(UUID.randomUUID());
        return value;
    }
}
