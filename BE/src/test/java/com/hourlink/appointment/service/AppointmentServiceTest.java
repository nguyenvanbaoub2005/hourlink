package com.hourlink.appointment.service;

import com.hourlink.appointment.dto.request.ConfirmCompletionRequest;
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
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
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
                appointment.getId(), VerifyCodeRequest.builder().code("123456").build()));

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
                appointment.getId(), VerifyCodeRequest.builder().code("654321").build()));

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
                appointment.getId(), VerifyCodeRequest.builder().code("246810").build());

        assertEquals(AppointmentStatus.IN_PROGRESS, response.getStatus());
        assertSame(receiver, verification.getVerifiedBy());
        verify(chatService).updateAppointmentCardData(any(), any());
    }

    @Test
    void firstCompletion_keepsAppointmentInProgressAndDoesNotTransferCredit() {
        authenticate(provider);
        Appointment appointment = appointment(AppointmentStatus.IN_PROGRESS, receiver);
        AtomicReference<AppointmentCompletion> savedCompletion = new AtomicReference<>();
        when(appointmentRepository.findByIdForUpdate(appointment.getId())).thenReturn(Optional.of(appointment));
        when(completionRepository.existsByAppointmentIdAndUserId(appointment.getId(), provider.getId()))
                .thenReturn(false);
        when(completionRepository.save(any())).thenAnswer(invocation -> {
            AppointmentCompletion completion = invocation.getArgument(0);
            savedCompletion.set(completion);
            return completion;
        });
        when(completionRepository.findByAppointmentId(appointment.getId()))
                .thenAnswer(invocation -> List.of(savedCompletion.get()));
        when(appointmentRepository.save(appointment)).thenReturn(appointment);

        var response = service.confirmCompletion(appointment.getId(), completionRequest());

        assertEquals(AppointmentStatus.IN_PROGRESS, response.getStatus());
        verify(walletService, never()).transferCredit(any());
    }

    @Test
    void secondCompletion_completesAndTransfersCreditExactlyOnce() {
        authenticate(provider);
        Appointment appointment = appointment(AppointmentStatus.IN_PROGRESS, receiver);
        AppointmentCompletion receiverCompletion = AppointmentCompletion.builder()
                .appointment(appointment).user(receiver).actualDurationMinutes(60)
                .hasIssue(false).confirmedAt(LocalDateTime.now()).build();
        AtomicReference<AppointmentCompletion> providerCompletion = new AtomicReference<>();
        when(appointmentRepository.findByIdForUpdate(appointment.getId())).thenReturn(Optional.of(appointment));
        when(completionRepository.existsByAppointmentIdAndUserId(appointment.getId(), provider.getId()))
                .thenReturn(false);
        when(completionRepository.save(any())).thenAnswer(invocation -> {
            AppointmentCompletion completion = invocation.getArgument(0);
            providerCompletion.set(completion);
            return completion;
        });
        when(completionRepository.findByAppointmentId(appointment.getId()))
                .thenAnswer(invocation -> List.of(receiverCompletion, providerCompletion.get()));
        when(appointmentRepository.save(appointment)).thenReturn(appointment);

        var response = service.confirmCompletion(appointment.getId(), completionRequest());

        assertEquals(AppointmentStatus.COMPLETED, response.getStatus());
        assertEquals(1, provider.getCompletedSessions());
        assertEquals(1, receiver.getCompletedSessions());
        verify(walletService).transferCredit(appointment);
    }

    private ConfirmCompletionRequest completionRequest() {
        return ConfirmCompletionRequest.builder()
                .actualDurationMinutes(60)
                .contentCompleted("Hoàn thành nội dung")
                .hasIssue(false)
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
