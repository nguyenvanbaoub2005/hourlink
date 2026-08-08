package com.hourlink.invitation.service;

import com.hourlink.appointment.entity.Appointment;
import com.hourlink.appointment.enums.AppointmentStatus;
import com.hourlink.appointment.repository.AppointmentRepository;
import com.hourlink.chat.repository.UserBlockRepository;
import com.hourlink.chat.service.ChatService;
import com.hourlink.common.exception.AppException;
import com.hourlink.common.exception.ErrorCode;
import com.hourlink.helprequest.entity.HelpRequest;
import com.hourlink.helprequest.enums.RequestStatus;
import com.hourlink.helprequest.repository.HelpRequestRepository;
import com.hourlink.invitation.dto.request.InvitationRequest;
import com.hourlink.invitation.dto.request.RespondInvitationRequest;
import com.hourlink.invitation.entity.Invitation;
import com.hourlink.invitation.enums.InvitationStatus;
import com.hourlink.invitation.repository.InvitationRepository;
import com.hourlink.notification.enums.NotificationType;
import com.hourlink.notification.service.NotificationService;
import com.hourlink.skill.entity.Skill;
import com.hourlink.skill.enums.SessionFormat;
import com.hourlink.skill.enums.SkillStatus;
import com.hourlink.skill.repository.SkillRepository;
import com.hourlink.user.entity.User;
import com.hourlink.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InvitationServiceTest {

    @Mock InvitationRepository invitationRepository;
    @Mock AppointmentRepository appointmentRepository;
    @Mock UserRepository userRepository;
    @Mock SkillRepository skillRepository;
    @Mock HelpRequestRepository helpRequestRepository;
    @Mock UserBlockRepository userBlockRepository;
    @Mock ChatService chatService;
    @Mock NotificationService notificationService;

    InvitationService service;
    User sender;
    User receiver;

    @BeforeEach
    void setUp() {
        service = new InvitationService(invitationRepository, appointmentRepository, userRepository, skillRepository,
                helpRequestRepository, userBlockRepository, chatService, notificationService);
        sender = user("sender@hourlink.vn", "Người gửi");
        receiver = user("receiver@hourlink.vn", "Người nhận");
    }

    @AfterEach
    void clearSecurity() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void acceptPending_byReceiver_usesLockAndCreatesConversation() {
        authenticate(receiver);
        Invitation invitation = invitation(InvitationStatus.PENDING);
        when(invitationRepository.findByIdForUpdate(invitation.getId())).thenReturn(Optional.of(invitation));
        when(invitationRepository.save(invitation)).thenReturn(invitation);

        var response = service.respondToInvitation(invitation.getId(),
                RespondInvitationRequest.builder().action("ACCEPT").build());

        assertEquals(InvitationStatus.ACCEPTED, response.getStatus());
        assertTrue(response.isCanCreateAppointment());
        verify(invitationRepository).findByIdForUpdate(invitation.getId());
        verify(chatService).createConversationInternal(invitation);
    }

    @Test
    void acceptReschedule_bySender_updatesTimeAndCreatesConversation() {
        authenticate(sender);
        Invitation invitation = invitation(InvitationStatus.RESCHEDULED);
        invitation.setRescheduleTime("Tối thứ Bảy 19:00");
        when(invitationRepository.findByIdForUpdate(invitation.getId())).thenReturn(Optional.of(invitation));
        when(invitationRepository.save(invitation)).thenReturn(invitation);

        var response = service.respondToInvitation(invitation.getId(),
                RespondInvitationRequest.builder().action("ACCEPT_RESCHEDULE").build());

        assertEquals(InvitationStatus.ACCEPTED, response.getStatus());
        assertEquals("Tối thứ Bảy 19:00", response.getProposedTime());
        verify(chatService).createConversationInternal(invitation);
        verify(notificationService).createNotification(
                eq(receiver), eq(sender), eq(NotificationType.INVITATION_RESCHEDULE_ACCEPTED),
                anyString(), anyString(), eq(invitation.getId()));
    }

    @Test
    void rejectReschedule_bySender_returnsInvitationToPending() {
        authenticate(sender);
        Invitation invitation = invitation(InvitationStatus.RESCHEDULED);
        invitation.setRescheduleTime("Sáng Chủ Nhật");
        when(invitationRepository.findByIdForUpdate(invitation.getId())).thenReturn(Optional.of(invitation));
        when(invitationRepository.save(invitation)).thenReturn(invitation);

        var response = service.respondToInvitation(invitation.getId(),
                RespondInvitationRequest.builder().action("REJECT_RESCHEDULE").build());

        assertEquals(InvitationStatus.PENDING, response.getStatus());
        assertNull(response.getRescheduleTime());
        verify(chatService, never()).createConversationInternal(any());
        verify(notificationService).createNotification(
                eq(receiver), eq(sender), eq(NotificationType.INVITATION_RESCHEDULE_REJECTED),
                anyString(), anyString(), eq(invitation.getId()));
    }

    @Test
    void rejectPending_withoutReason_isRejected() {
        authenticate(receiver);
        Invitation invitation = invitation(InvitationStatus.PENDING);
        when(invitationRepository.findByIdForUpdate(invitation.getId())).thenReturn(Optional.of(invitation));

        AppException error = assertThrows(AppException.class, () -> service.respondToInvitation(
                invitation.getId(), RespondInvitationRequest.builder().action("REJECT").rejectReason("  ").build()));

        assertEquals(ErrorCode.INVALID_REQUEST, error.getErrorCode());
        assertEquals(InvitationStatus.PENDING, invitation.getStatus());
        verify(invitationRepository, never()).save(any());
    }

    @Test
    void reschedulePending_withoutNewTime_isRejected() {
        authenticate(receiver);
        Invitation invitation = invitation(InvitationStatus.PENDING);
        when(invitationRepository.findByIdForUpdate(invitation.getId())).thenReturn(Optional.of(invitation));

        AppException error = assertThrows(AppException.class, () -> service.respondToInvitation(
                invitation.getId(), RespondInvitationRequest.builder().action("RESCHEDULE").build()));

        assertEquals(ErrorCode.INVALID_REQUEST, error.getErrorCode());
        assertEquals(InvitationStatus.PENDING, invitation.getStatus());
        verify(invitationRepository, never()).save(any());
    }

    @Test
    void cancelPending_bySender_usesLock() {
        authenticate(sender);
        Invitation invitation = invitation(InvitationStatus.PENDING);
        when(invitationRepository.findByIdForUpdate(invitation.getId())).thenReturn(Optional.of(invitation));
        when(invitationRepository.save(invitation)).thenReturn(invitation);

        var response = service.cancelInvitation(invitation.getId());

        assertEquals(InvitationStatus.CANCELLED, response.getStatus());
        verify(invitationRepository).findByIdForUpdate(invitation.getId());
    }

    @Test
    void getDetail_withActiveAppointment_exposesCurrentSession() {
        authenticate(sender);
        Invitation invitation = invitation(InvitationStatus.ACCEPTED);
        Appointment active = Appointment.builder()
                .invitation(invitation)
                .provider(receiver)
                .receiver(sender)
                .status(AppointmentStatus.CONFIRMED)
                .build();
        active.setId(UUID.randomUUID());
        when(invitationRepository.findById(invitation.getId())).thenReturn(Optional.of(invitation));
        when(appointmentRepository.findFirstByInvitation_IdAndStatusInOrderByCreatedAtDesc(
                eq(invitation.getId()), any())).thenReturn(Optional.of(active));

        var response = service.getInvitationDetail(invitation.getId());

        assertEquals(active.getId(), response.getActiveAppointmentId());
        assertEquals(AppointmentStatus.CONFIRMED, response.getActiveAppointmentStatus());
        assertFalse(response.isCanCreateAppointment());
    }

    @Test
    void sendInvitation_withSkillOwnedByAnotherUser_isRejected() {
        authenticate(sender);
        User stranger = user("stranger@hourlink.vn", "Người khác");
        Skill skill = skill(stranger);
        when(userRepository.findByEmail(sender.getEmail())).thenReturn(Optional.of(sender));
        when(userRepository.findById(receiver.getId())).thenReturn(Optional.of(receiver));
        when(skillRepository.findById(skill.getId())).thenReturn(Optional.of(skill));

        AppException error = assertThrows(AppException.class,
                () -> service.sendInvitation(request(skill.getId(), null)));

        assertEquals(ErrorCode.INVALID_REQUEST, error.getErrorCode());
        verify(invitationRepository, never()).save(any());
    }

    @Test
    void sendInvitation_withHelpRequestOwnedByAnotherUser_isRejected() {
        authenticate(sender);
        User stranger = user("stranger@hourlink.vn", "Người khác");
        HelpRequest helpRequest = HelpRequest.builder()
                .requester(stranger)
                .title("Cần hỗ trợ")
                .status(RequestStatus.SEARCHING)
                .build();
        helpRequest.setId(UUID.randomUUID());
        when(userRepository.findByEmail(sender.getEmail())).thenReturn(Optional.of(sender));
        when(userRepository.findById(receiver.getId())).thenReturn(Optional.of(receiver));
        when(helpRequestRepository.findById(helpRequest.getId())).thenReturn(Optional.of(helpRequest));

        AppException error = assertThrows(AppException.class,
                () -> service.sendInvitation(request(null, helpRequest.getId())));

        assertEquals(ErrorCode.ACCESS_DENIED, error.getErrorCode());
        verify(invitationRepository, never()).save(any());
    }

    @Test
    void sendInvitation_whenEitherUserBlocked_isRejected() {
        authenticate(sender);
        when(userRepository.findByEmail(sender.getEmail())).thenReturn(Optional.of(sender));
        when(userRepository.findById(receiver.getId())).thenReturn(Optional.of(receiver));
        when(userBlockRepository.existsBlockBetween(sender.getId(), receiver.getId())).thenReturn(true);

        AppException error = assertThrows(AppException.class,
                () -> service.sendInvitation(request(null, null)));

        assertEquals(ErrorCode.USER_BLOCKED, error.getErrorCode());
        verify(invitationRepository, never()).save(any());
    }

    @Test
    void sendInvitation_withValidReferences_trimsAndSavesContent() {
        authenticate(sender);
        Skill skill = skill(receiver);
        HelpRequest helpRequest = HelpRequest.builder()
                .requester(sender)
                .title("Cần học")
                .status(RequestStatus.SEARCHING)
                .build();
        helpRequest.setId(UUID.randomUUID());
        when(userRepository.findByEmail(sender.getEmail())).thenReturn(Optional.of(sender));
        when(userRepository.findById(receiver.getId())).thenReturn(Optional.of(receiver));
        when(skillRepository.findById(skill.getId())).thenReturn(Optional.of(skill));
        when(helpRequestRepository.findById(helpRequest.getId())).thenReturn(Optional.of(helpRequest));
        when(invitationRepository.save(any())).thenAnswer(invocation -> {
            Invitation saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });

        InvitationRequest request = request(skill.getId(), helpRequest.getId());
        request.setContent("  Học guitar cơ bản  ");
        request.setMessage("  Xin chào  ");
        var response = service.sendInvitation(request);

        assertEquals("Học guitar cơ bản", response.getContent());
        assertEquals("Xin chào", response.getMessage());
        ArgumentCaptor<Invitation> captor = ArgumentCaptor.forClass(Invitation.class);
        verify(invitationRepository).save(captor.capture());
        assertTrue(captor.getValue().getSkill().getUser().getId().equals(receiver.getId()));
    }

    private Invitation invitation(InvitationStatus status) {
        Invitation invitation = Invitation.builder()
                .sender(sender)
                .receiver(receiver)
                .content("Học guitar")
                .duration(60)
                .format(SessionFormat.ONLINE)
                .status(status)
                .build();
        invitation.setId(UUID.randomUUID());
        return invitation;
    }

    private InvitationRequest request(UUID skillId, UUID helpRequestId) {
        return InvitationRequest.builder()
                .receiverId(receiver.getId())
                .skillId(skillId)
                .helpRequestId(helpRequestId)
                .content("Học guitar")
                .duration(60)
                .format(SessionFormat.ONLINE)
                .build();
    }

    private Skill skill(User owner) {
        Skill skill = Skill.builder()
                .name("Guitar")
                .user(owner)
                .status(SkillStatus.VISIBLE)
                .build();
        skill.setId(UUID.randomUUID());
        return skill;
    }

    private User user(String email, String fullName) {
        User user = User.builder()
                .email(email)
                .fullName(fullName)
                .passwordHash("hash")
                .build();
        user.setId(UUID.randomUUID());
        return user;
    }

    private void authenticate(User user) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(user.getEmail(), null, List.of()));
    }
}
