package com.hourlink.appointment.service;

import com.hourlink.appointment.dto.request.ConfirmCompletionRequest;
import com.hourlink.appointment.dto.request.CreateAppointmentRequest;
import com.hourlink.appointment.dto.request.RespondAppointmentRequest;
import com.hourlink.appointment.dto.request.VerifyCodeRequest;
import com.hourlink.appointment.entity.Appointment;
import com.hourlink.appointment.entity.AppointmentCompletion;
import com.hourlink.appointment.entity.AppointmentVerification;
import com.hourlink.appointment.enums.AppointmentStatus;
import com.hourlink.appointment.enums.VerificationMethod;
import com.hourlink.appointment.repository.AppointmentCompletionRepository;
import com.hourlink.appointment.repository.AppointmentRepository;
import com.hourlink.appointment.repository.AppointmentVerificationRepository;
import com.hourlink.chat.service.ChatService;
import com.hourlink.common.exception.AppException;
import com.hourlink.common.exception.ErrorCode;
import com.hourlink.invitation.repository.InvitationRepository;
import com.hourlink.invitation.entity.Invitation;
import com.hourlink.invitation.enums.InvitationStatus;
import com.hourlink.notification.enums.NotificationType;
import com.hourlink.notification.service.NotificationService;
import com.hourlink.rating.service.RatingService;
import com.hourlink.skill.enums.SessionFormat;
import com.hourlink.skill.repository.SkillRepository;
import com.hourlink.user.entity.User;
import com.hourlink.user.repository.UserRepository;
import com.hourlink.wallet.service.WalletService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AppointmentServiceTest {

    @Mock AppointmentRepository appointmentRepository;
    @Mock AppointmentVerificationRepository verificationRepository;
    @Mock AppointmentCompletionRepository completionRepository;
    @Mock UserRepository userRepository;
    @Mock InvitationRepository invitationRepository;
    @Mock SkillRepository skillRepository;
    @Mock NotificationService notificationService;
    @Mock ChatService chatService;
    @Mock WalletService walletService;
    @Mock RatingService ratingService;

    AppointmentService service;
    User provider;
    User receiver;

    @BeforeEach
    void setUp() {
        service = new AppointmentService(appointmentRepository, verificationRepository,
                completionRepository, userRepository, invitationRepository, skillRepository,
                notificationService, chatService, walletService, ratingService);
        provider = user("provider@hourlink.vn", "Người hỗ trợ");
        receiver = user("receiver@hourlink.vn", "Người nhận");
    }

    @AfterEach
    void clearSecurity() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void createAppointment_afterPreviousSessionEnded_allowsNextSession() {
        authenticate(receiver);
        Invitation invitation = acceptedInvitation();
        CreateAppointmentRequest request = createRequest(invitation);
        when(userRepository.findById(provider.getId())).thenReturn(Optional.of(provider));
        when(userRepository.findById(receiver.getId())).thenReturn(Optional.of(receiver));
        when(invitationRepository.findByIdForUpdate(invitation.getId())).thenReturn(Optional.of(invitation));
        when(appointmentRepository.findFirstByInvitation_IdAndStatusInOrderByCreatedAtDesc(
                eq(invitation.getId()), any())).thenReturn(Optional.empty());
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(invocation -> {
            Appointment saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });
        UUID conversationId = UUID.randomUUID();
        when(chatService.findConversationIdByInvitation(invitation.getId())).thenReturn(conversationId);

        var response = service.createAppointment(request);

        assertEquals(AppointmentStatus.PENDING, response.getStatus());
        verify(appointmentRepository).findFirstByInvitation_IdAndStatusInOrderByCreatedAtDesc(
                eq(invitation.getId()), argThat(statuses ->
                        statuses.contains(AppointmentStatus.PENDING)
                                && statuses.contains(AppointmentStatus.DISPUTED)
                                && !statuses.contains(AppointmentStatus.COMPLETED)
                                && !statuses.contains(AppointmentStatus.CANCELLED)));
        verify(appointmentRepository).save(any(Appointment.class));
        verify(chatService).sendAppointmentCardInternal(
                eq(conversationId), eq(response.getId()), any(String.class), eq(receiver));
    }

    @Test
    void createAppointment_whileAnotherSessionIsActive_isRejected() {
        authenticate(receiver);
        Invitation invitation = acceptedInvitation();
        Appointment active = appointment(AppointmentStatus.CONFIRMED, provider);
        when(userRepository.findById(provider.getId())).thenReturn(Optional.of(provider));
        when(userRepository.findById(receiver.getId())).thenReturn(Optional.of(receiver));
        when(invitationRepository.findByIdForUpdate(invitation.getId())).thenReturn(Optional.of(invitation));
        when(appointmentRepository.findFirstByInvitation_IdAndStatusInOrderByCreatedAtDesc(
                eq(invitation.getId()), any())).thenReturn(Optional.of(active));

        AppException error = assertThrows(AppException.class,
                () -> service.createAppointment(createRequest(invitation)));

        assertEquals(ErrorCode.INVALID_REQUEST, error.getErrorCode());
        assertEquals("Hai bạn đang có một lịch hẹn chưa kết thúc. Hãy hoàn thành hoặc hủy lịch đó trước khi tạo buổi tiếp theo.",
                error.getMessage());
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    void confirm_byOtherParticipant_holdsCreditAndReturnsConfirmedAppointment() {
        authenticate(receiver);
        Appointment appointment = appointment(AppointmentStatus.PENDING, provider);
        when(appointmentRepository.findByIdForUpdate(appointment.getId())).thenReturn(Optional.of(appointment));
        when(appointmentRepository.save(appointment)).thenReturn(appointment);

        RespondAppointmentRequest request = RespondAppointmentRequest.builder().action("CONFIRM").build();
        var response = service.respondAppointment(appointment.getId(), request);

        assertEquals(AppointmentStatus.CONFIRMED, appointment.getStatus());
        assertEquals(AppointmentStatus.CONFIRMED, response.getStatus());
        verify(walletService).holdCredit(receiver, appointment.getTimeCreditAmount(), appointment);
        verify(chatService).updateAppointmentCardData(any(), any());
    }

    @Test
    void confirm_byProposer_isRejectedWithoutHoldingCredit() {
        authenticate(provider);
        Appointment appointment = appointment(AppointmentStatus.PENDING, provider);
        when(appointmentRepository.findByIdForUpdate(appointment.getId())).thenReturn(Optional.of(appointment));

        AppException error = assertThrows(AppException.class, () -> service.respondAppointment(
                appointment.getId(), RespondAppointmentRequest.builder().action("CONFIRM").build()));

        assertEquals(ErrorCode.ACCESS_DENIED, error.getErrorCode());
        verify(walletService, never()).holdCredit(any(), any(), any());
    }

    @Test
    void confirm_expiredAppointment_requiresReschedule() {
        authenticate(receiver);
        Appointment appointment = appointment(AppointmentStatus.PENDING, provider);
        appointment.setAppointmentDate(LocalDate.now().minusDays(1));
        when(appointmentRepository.findByIdForUpdate(appointment.getId())).thenReturn(Optional.of(appointment));

        AppException error = assertThrows(AppException.class, () -> service.respondAppointment(
                appointment.getId(), RespondAppointmentRequest.builder().action("CONFIRM").build()));

        assertEquals(ErrorCode.APPOINTMENT_INVALID_STATUS, error.getErrorCode());
        assertEquals("Lịch hẹn đã quá giờ. Vui lòng đề xuất thời gian mới trước khi chấp nhận.", error.getMessage());
        verify(walletService, never()).holdCredit(any(), any(), any());
    }

    @Test
    void reschedule_confirmedAppointment_releasesHoldAndWaitsForOtherParticipant() {
        authenticate(receiver);
        Appointment appointment = appointment(AppointmentStatus.CONFIRMED, provider);
        appointment.setReminderSentAt(Instant.now());
        when(appointmentRepository.findByIdForUpdate(appointment.getId())).thenReturn(Optional.of(appointment));
        when(appointmentRepository.save(appointment)).thenReturn(appointment);
        LocalDate newDate = LocalDate.now().plusDays(2);

        service.respondAppointment(appointment.getId(), RespondAppointmentRequest.builder()
                .action("RESCHEDULE")
                .newAppointmentDate(newDate)
                .newStartTime(LocalTime.of(15, 0))
                .newEndTime(LocalTime.of(16, 0))
                .build());

        assertEquals(AppointmentStatus.RESCHEDULED, appointment.getStatus());
        assertEquals(newDate, appointment.getAppointmentDate());
        assertSame(receiver, appointment.getProposedBy());
        assertNull(appointment.getReminderSentAt());
        verify(walletService).releaseCredit(appointment);
    }

    @Test
    void cancel_inProgressAppointment_isRejectedWithoutReleasingCredit() {
        authenticate(provider);
        Appointment appointment = appointment(AppointmentStatus.IN_PROGRESS, receiver);
        when(appointmentRepository.findByIdForUpdate(appointment.getId())).thenReturn(Optional.of(appointment));

        AppException error = assertThrows(AppException.class, () -> service.respondAppointment(
                appointment.getId(), RespondAppointmentRequest.builder().action("CANCEL").build()));

        assertEquals(ErrorCode.APPOINTMENT_INVALID_STATUS, error.getErrorCode());
        verify(walletService, never()).releaseCredit(any());
    }

    @Test
    void cancel_withoutReason_isRejected() {
        authenticate(provider);
        Appointment appointment = appointment(AppointmentStatus.CONFIRMED, receiver);
        when(appointmentRepository.findByIdForUpdate(appointment.getId())).thenReturn(Optional.of(appointment));

        AppException error = assertThrows(AppException.class, () -> service.respondAppointment(
                appointment.getId(), RespondAppointmentRequest.builder()
                        .action("CANCEL")
                        .reason("   ")
                        .build()));

        assertEquals(ErrorCode.INVALID_REQUEST, error.getErrorCode());
        assertEquals("Vui lòng nhập lý do hủy lịch hẹn.", error.getMessage());
        assertEquals(AppointmentStatus.CONFIRMED, appointment.getStatus());
        verify(appointmentRepository, never()).save(any());
        verify(walletService, never()).releaseCredit(any());
    }

    @Test
    void cancel_withReason_trimsStoresAndReturnsReason() {
        authenticate(provider);
        Appointment appointment = appointment(AppointmentStatus.CONFIRMED, receiver);
        when(appointmentRepository.findByIdForUpdate(appointment.getId())).thenReturn(Optional.of(appointment));
        when(appointmentRepository.save(appointment)).thenReturn(appointment);

        var response = service.respondAppointment(appointment.getId(), RespondAppointmentRequest.builder()
                .action("CANCEL")
                .reason("  Tôi có việc đột xuất  ")
                .build());

        assertEquals(AppointmentStatus.CANCELLED, appointment.getStatus());
        assertEquals("Tôi có việc đột xuất", appointment.getCancelReason());
        assertEquals("Tôi có việc đột xuất", response.getCancelReason());
        verify(walletService).releaseCredit(appointment);
        verify(appointmentRepository).save(appointment);
    }

    @Test
    void generateVerification_reusesCurrentActiveCode() {
        authenticate(provider);
        Appointment appointment = appointment(AppointmentStatus.CONFIRMED, receiver);
        AppointmentVerification verification = AppointmentVerification.builder()
                .appointment(appointment)
                .method(VerificationMethod.OTP)
                .code("123456")
                .expiresAt(LocalDateTime.now().plusMinutes(30))
                .generatedBy(provider)
                .build();
        verification.setId(UUID.randomUUID());
        when(appointmentRepository.findByIdForUpdate(appointment.getId())).thenReturn(Optional.of(appointment));
        when(verificationRepository.findTopByAppointmentIdOrderByCreatedAtDesc(appointment.getId()))
                .thenReturn(Optional.of(verification));

        var response = service.generateVerificationCode(appointment.getId());

        assertEquals("123456", response.getCode());
        verify(verificationRepository, never()).save(any());
    }

    @Test
    void verifyCode_rejectsAlreadyUsedCode() {
        authenticate(receiver);
        Appointment appointment = appointment(AppointmentStatus.CONFIRMED, provider);
        AppointmentVerification verification = AppointmentVerification.builder()
                .appointment(appointment)
                .method(VerificationMethod.OTP)
                .code("123456")
                .expiresAt(LocalDateTime.now().plusMinutes(30))
                .verifiedAt(LocalDateTime.now().minusMinutes(1))
                .build();
        when(appointmentRepository.findByIdForUpdate(appointment.getId())).thenReturn(Optional.of(appointment));
        when(verificationRepository.findByAppointmentIdAndCode(appointment.getId(), "123456"))
                .thenReturn(Optional.of(verification));

        AppException error = assertThrows(AppException.class, () -> service.verifyCode(
                appointment.getId(), VerifyCodeRequest.builder()
                        .code("123456")
                        .allowEarlyStart(true)
                        .build()));

        assertEquals(ErrorCode.VERIFICATION_INVALID, error.getErrorCode());
        assertEquals(AppointmentStatus.CONFIRMED, appointment.getStatus());
    }

    @Test
    void verifyCode_rejectsUserWhoGeneratedTheCode() {
        authenticate(provider);
        Appointment appointment = appointment(AppointmentStatus.CONFIRMED, receiver);
        AppointmentVerification verification = AppointmentVerification.builder()
                .appointment(appointment)
                .method(VerificationMethod.OTP)
                .code("654321")
                .expiresAt(LocalDateTime.now().plusMinutes(30))
                .generatedBy(provider)
                .build();
        when(appointmentRepository.findByIdForUpdate(appointment.getId())).thenReturn(Optional.of(appointment));
        when(verificationRepository.findByAppointmentIdAndCode(appointment.getId(), "654321"))
                .thenReturn(Optional.of(verification));

        AppException error = assertThrows(AppException.class, () -> service.verifyCode(
                appointment.getId(), VerifyCodeRequest.builder()
                        .code("654321")
                        .allowEarlyStart(true)
                        .build()));

        assertEquals(ErrorCode.ACCESS_DENIED, error.getErrorCode());
        assertEquals(AppointmentStatus.CONFIRMED, appointment.getStatus());
        verify(verificationRepository, never()).save(any());
    }

    @Test
    void verifyCode_byOtherParticipant_startsAppointmentAndUpdatesChatCard() {
        authenticate(receiver);
        Appointment appointment = appointment(AppointmentStatus.CONFIRMED, provider);
        AppointmentVerification verification = AppointmentVerification.builder()
                .appointment(appointment)
                .method(VerificationMethod.OTP)
                .code("246810")
                .expiresAt(LocalDateTime.now().plusMinutes(30))
                .generatedBy(provider)
                .build();
        when(appointmentRepository.findByIdForUpdate(appointment.getId())).thenReturn(Optional.of(appointment));
        when(verificationRepository.findByAppointmentIdAndCode(appointment.getId(), "246810"))
                .thenReturn(Optional.of(verification));
        when(appointmentRepository.save(appointment)).thenReturn(appointment);

        var response = service.verifyCode(
                appointment.getId(), VerifyCodeRequest.builder()
                        .code("246810")
                        .allowEarlyStart(true)
                        .build());

        assertEquals(AppointmentStatus.IN_PROGRESS, response.getStatus());
        assertSame(receiver, verification.getVerifiedBy());
        verify(chatService).updateAppointmentCardData(any(), any());
    }

    @Test
    void verifyCode_beforeStart_requiresExplicitEarlyStartConfirmation() {
        authenticate(receiver);
        Appointment appointment = appointment(AppointmentStatus.CONFIRMED, provider);
        when(appointmentRepository.findByIdForUpdate(appointment.getId())).thenReturn(Optional.of(appointment));

        AppException error = assertThrows(AppException.class, () -> service.verifyCode(
                appointment.getId(), VerifyCodeRequest.builder().code("246810").build()));

        assertEquals(ErrorCode.INVALID_REQUEST, error.getErrorCode());
        assertEquals("Chưa tới giờ hẹn. Vui lòng xác nhận nếu hai bạn muốn bắt đầu sớm.", error.getMessage());
        verify(verificationRepository, never()).findByAppointmentIdAndCode(any(), anyString());
    }

    @Test
    void lifecycle_movesConfirmedToUpcomingAndSendsReminderOnlyOnce() {
        LocalDateTime now = LocalDateTime.of(LocalDate.now(), LocalTime.of(8, 45));
        Appointment appointment = appointment(AppointmentStatus.CONFIRMED, provider);
        appointment.setAppointmentDate(now.toLocalDate());
        appointment.setStartTime(LocalTime.of(9, 0));
        appointment.setEndTime(LocalTime.of(10, 0));
        when(appointmentRepository.findLifecycleCandidatesForUpdate(any(), eq(now.toLocalDate().plusDays(1))))
                .thenReturn(List.of(appointment));
        when(appointmentRepository.save(appointment)).thenReturn(appointment);

        service.synchronizeLifecycleAt(now);
        service.synchronizeLifecycleAt(now.plusMinutes(1));

        assertEquals(AppointmentStatus.UPCOMING, appointment.getStatus());
        assertNotNull(appointment.getReminderSentAt());
        verify(notificationService, times(2)).createNotification(
                any(User.class), isNull(), eq(NotificationType.APPOINTMENT_REMINDER),
                anyString(), anyString(), eq(appointment.getId()));
        verify(appointmentRepository, times(1)).save(appointment);
        verify(chatService, times(1)).updateAppointmentCardData(eq(appointment.getId()), anyString());
    }

    @Test
    void lifecycle_expiresConfirmedAppointmentAndReleasesHeldCredit() {
        LocalDateTime now = LocalDateTime.of(LocalDate.now(), LocalTime.of(11, 0));
        Appointment appointment = appointment(AppointmentStatus.CONFIRMED, provider);
        appointment.setAppointmentDate(now.toLocalDate());
        appointment.setStartTime(LocalTime.of(9, 0));
        appointment.setEndTime(LocalTime.of(10, 0));
        when(appointmentRepository.findLifecycleCandidatesForUpdate(any(), eq(now.toLocalDate().plusDays(1))))
                .thenReturn(List.of(appointment));
        when(appointmentRepository.save(appointment)).thenReturn(appointment);

        service.synchronizeLifecycleAt(now);

        assertEquals(AppointmentStatus.CANCELLED, appointment.getStatus());
        assertEquals("Lịch hẹn đã tự động hủy vì quá thời gian diễn ra.", appointment.getCancelReason());
        verify(walletService).releaseCredit(appointment);
        verify(notificationService, times(2)).createNotification(
                any(User.class), isNull(), eq(NotificationType.APPOINTMENT_CANCELLED),
                anyString(), anyString(), eq(appointment.getId()));
        verify(chatService).updateAppointmentCardData(eq(appointment.getId()), anyString());
    }

    @Test
    void completionByProvider_completesAndTransfersCreditImmediately() {
        authenticate(provider);
        Appointment appointment = appointment(AppointmentStatus.IN_PROGRESS, receiver);
        when(appointmentRepository.findByIdForUpdate(appointment.getId())).thenReturn(Optional.of(appointment));
        when(completionRepository.existsByAppointmentIdAndUserId(appointment.getId(), provider.getId()))
                .thenReturn(false);
        when(appointmentRepository.save(appointment)).thenReturn(appointment);

        var response = service.confirmCompletion(appointment.getId(), completionRequest());

        assertEquals(AppointmentStatus.COMPLETED, response.getStatus());
        assertEquals(1, provider.getCompletedSessions());
        assertEquals(1, receiver.getCompletedSessions());
        verify(walletService).transferCredit(appointment);
        verify(chatService).updateAppointmentCardData(any(), any());
    }

    @Test
    void completionByReceiver_completesAndTransfersCreditImmediately() {
        authenticate(receiver);
        Appointment appointment = appointment(AppointmentStatus.IN_PROGRESS, receiver);
        when(appointmentRepository.findByIdForUpdate(appointment.getId())).thenReturn(Optional.of(appointment));
        when(completionRepository.existsByAppointmentIdAndUserId(appointment.getId(), receiver.getId()))
                .thenReturn(false);
        when(appointmentRepository.save(appointment)).thenReturn(appointment);

        var response = service.confirmCompletion(appointment.getId(), completionRequest());

        assertEquals(AppointmentStatus.COMPLETED, response.getStatus());
        assertEquals(1, provider.getCompletedSessions());
        assertEquals(1, receiver.getCompletedSessions());
        verify(walletService).transferCredit(appointment);
    }

    @Test
    void completionWithIssue_movesAppointmentToDisputedWithoutTransferringCredit() {
        authenticate(receiver);
        Appointment appointment = appointment(AppointmentStatus.IN_PROGRESS, receiver);
        when(appointmentRepository.findByIdForUpdate(appointment.getId())).thenReturn(Optional.of(appointment));
        when(completionRepository.existsByAppointmentIdAndUserId(appointment.getId(), receiver.getId()))
                .thenReturn(false);
        when(appointmentRepository.save(appointment)).thenReturn(appointment);

        ConfirmCompletionRequest request = completionRequest();
        request.setHasIssue(true);
        request.setIssueDescription("Nội dung buổi học có vấn đề");
        var response = service.confirmCompletion(appointment.getId(), request);

        assertEquals(AppointmentStatus.DISPUTED, response.getStatus());
        verify(walletService, never()).transferCredit(any());
        verify(chatService).updateAppointmentCardData(any(), any());
    }

    @Test
    void completionAfterAppointmentAlreadyCompleted_doesNotTransferCreditAgain() {
        authenticate(receiver);
        Appointment appointment = appointment(AppointmentStatus.COMPLETED, receiver);
        when(appointmentRepository.findByIdForUpdate(appointment.getId())).thenReturn(Optional.of(appointment));

        AppException error = assertThrows(AppException.class,
                () -> service.confirmCompletion(appointment.getId(), completionRequest()));

        assertEquals(ErrorCode.APPOINTMENT_INVALID_STATUS, error.getErrorCode());
        verify(walletService, never()).transferCredit(any());
        verify(completionRepository, never()).save(any());
    }

    private ConfirmCompletionRequest completionRequest() {
        return ConfirmCompletionRequest.builder()
                .actualDurationMinutes(60)
                .contentCompleted("Hoàn thành nội dung")
                .hasIssue(false)
                .build();
    }

    private Invitation acceptedInvitation() {
        Invitation invitation = Invitation.builder()
                .sender(receiver)
                .receiver(provider)
                .content("Học kỹ năng")
                .format(SessionFormat.ONLINE)
                .status(InvitationStatus.ACCEPTED)
                .build();
        invitation.setId(UUID.randomUUID());
        return invitation;
    }

    private CreateAppointmentRequest createRequest(Invitation invitation) {
        return CreateAppointmentRequest.builder()
                .invitationId(invitation.getId())
                .providerId(provider.getId())
                .receiverId(receiver.getId())
                .title("Buổi học tiếp theo")
                .appointmentDate(LocalDate.now().plusDays(1))
                .startTime(LocalTime.of(19, 0))
                .endTime(LocalTime.of(20, 0))
                .meetingType(SessionFormat.ONLINE)
                .locationOrLink("https://meet.google.com/next-session")
                .timeCreditAmount(1.0)
                .build();
    }

    private Appointment appointment(AppointmentStatus status, User proposedBy) {
        Appointment appointment = Appointment.builder()
                .provider(provider)
                .receiver(receiver)
                .proposedBy(proposedBy)
                .title("Học kỹ năng")
                .appointmentDate(LocalDate.now().plusDays(1))
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(10, 0))
                .meetingType(SessionFormat.ONLINE)
                .locationOrLink("https://meet.google.com/test-room")
                .timeCreditAmount(1.0)
                .status(status)
                .build();
        appointment.setId(UUID.randomUUID());
        return appointment;
    }

    private User user(String email, String fullName) {
        User user = User.builder()
                .email(email)
                .fullName(fullName)
                .passwordHash("test")
                .build();
        user.setId(UUID.randomUUID());
        return user;
    }

    private void authenticate(User user) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(user.getEmail(), null, List.of()));
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
    }
}
