package com.hourlink.admin.service;

import com.hourlink.admin.dto.request.AdminReportStatusUpdateRequest;
import com.hourlink.admin.dto.request.UserActionRequest;
import com.hourlink.admin.dto.response.AdminReportDetailResponse;
import com.hourlink.admin.dto.response.AdminReportResponse;
import com.hourlink.admin.dto.response.AdminReportStatsResponse;
import com.hourlink.admin.enums.AdminReportSource;
import com.hourlink.admin.enums.AdminReportUserAction;
import com.hourlink.chat.entity.ChatMessage;
import com.hourlink.chat.entity.ChatReport;
import com.hourlink.chat.enums.ChatReportReason;
import com.hourlink.chat.enums.ChatReportStatus;
import com.hourlink.chat.enums.MessageType;
import com.hourlink.chat.repository.ChatMessageRepository;
import com.hourlink.chat.repository.ChatReportRepository;
import com.hourlink.common.exception.AppException;
import com.hourlink.community.entity.CommunityActivity;
import com.hourlink.community.repository.CommunityActivityRepository;
import com.hourlink.report.entity.Report;
import com.hourlink.report.enums.ReportReason;
import com.hourlink.report.enums.ReportStatus;
import com.hourlink.report.enums.ReportTargetType;
import com.hourlink.report.repository.ReportRepository;
import com.hourlink.user.entity.User;
import com.hourlink.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminReportServiceTest {

    @Mock ReportRepository reportRepository;
    @Mock ChatReportRepository chatReportRepository;
    @Mock UserRepository userRepository;
    @Mock ChatMessageRepository chatMessageRepository;
    @Mock CommunityActivityRepository communityActivityRepository;
    @Mock AdminUserService adminUserService;
    @InjectMocks AdminReportService service;

    @Test
    void getStats_aggregatesAndNormalizesBothReportSources() {
        when(reportRepository.countByStatus(ReportStatus.PENDING)).thenReturn(2L);
        when(reportRepository.countByStatus(ReportStatus.REVIEWING)).thenReturn(3L);
        when(reportRepository.countByStatus(ReportStatus.RESOLVED)).thenReturn(4L);
        when(reportRepository.countByStatus(ReportStatus.DISMISSED)).thenReturn(5L);
        when(chatReportRepository.countByStatus(ChatReportStatus.PENDING)).thenReturn(7L);
        when(chatReportRepository.countByStatus(ChatReportStatus.REVIEWED)).thenReturn(11L);
        when(chatReportRepository.countByStatus(ChatReportStatus.ACTIONED)).thenReturn(13L);
        when(chatReportRepository.countByStatus(ChatReportStatus.DISMISSED)).thenReturn(17L);

        AdminReportStatsResponse stats = service.getStats();

        assertEquals(62, stats.total());
        assertEquals(9, stats.pending());
        assertEquals(14, stats.reviewing());
        assertEquals(17, stats.resolved());
        assertEquals(22, stats.dismissed());
    }

    @Test
    void getReports_includesChatReportsAndAcceptsChatSpecificReasonFilter() {
        User reporter = user("Người báo cáo", "reporter@test.vn");
        User reported = user("Người bị báo cáo", "reported@test.vn");
        ChatMessage message = ChatMessage.builder()
                .sender(reported)
                .type(MessageType.TEXT)
                .content("Nội dung tin nhắn")
                .build();
        message.setId(UUID.randomUUID());
        ChatReport chatReport = ChatReport.builder()
                .reporter(reporter)
                .reportedUser(reported)
                .message(message)
                .reason(ChatReportReason.SCAM)
                .description("Có dấu hiệu lừa đảo")
                .messageSnapshot("Nội dung tại thời điểm báo cáo")
                .status(ChatReportStatus.REVIEWED)
                .build();
        chatReport.setId(UUID.randomUUID());
        chatReport.setCreatedAt(Instant.parse("2026-08-09T12:00:00Z"));

        when(reportRepository.findAll(any(Sort.class))).thenReturn(List.of());
        when(chatReportRepository.findAll(any(Sort.class))).thenReturn(List.of(chatReport));

        Page<AdminReportResponse> result = service.getReports(
                null, null, null, null, null, "SCAM", null, null,
                PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "createdAt")));

        assertEquals(1, result.getTotalElements());
        AdminReportResponse item = result.getContent().getFirst();
        assertEquals(AdminReportSource.CHAT, item.source());
        assertEquals(ReportTargetType.MESSAGE, item.targetType());
        assertEquals("SCAM", item.reason());
        assertEquals(ReportStatus.REVIEWING, item.status());
        assertEquals("Người báo cáo", item.reporterName());
    }

    @Test
    void getReports_userFilterIncludesGeneralReportsSentByOrTargetingUserDirectly() {
        User subject = user("Người cần xem", "subject@test.vn");
        User other = user("Người khác", "other@test.vn");
        Report sentBySubject = generalReport(subject.getId(), ReportStatus.PENDING, ReportTargetType.USER);
        sentBySubject.setTargetId(other.getId());
        Report targetingSubject = generalReport(other.getId(), ReportStatus.REVIEWING, ReportTargetType.USER);
        targetingSubject.setTargetId(subject.getId());
        Report unrelated = generalReport(other.getId(), ReportStatus.PENDING, ReportTargetType.USER);

        when(reportRepository.findAll(any(Sort.class)))
                .thenReturn(List.of(sentBySubject, targetingSubject, unrelated));
        when(chatReportRepository.findAll(any(Sort.class))).thenReturn(List.of());
        when(userRepository.findById(subject.getId())).thenReturn(Optional.of(subject));
        when(userRepository.findById(other.getId())).thenReturn(Optional.of(other));

        Page<AdminReportResponse> result = service.getReports(
                null, subject.getId(), null, null, null, null, null, null,
                PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "createdAt")));

        assertEquals(2, result.getTotalElements());
        assertEquals(Set.of(sentBySubject.getId(), targetingSubject.getId()),
                result.getContent().stream().map(AdminReportResponse::id).collect(java.util.stream.Collectors.toSet()));
    }

    @Test
    void getReports_userFilterResolvesMessageSenderAndContentOrganizer() {
        User subject = user("Người cần xem", "subject@test.vn");
        User other = user("Người khác", "other@test.vn");

        ChatMessage subjectMessage = ChatMessage.builder()
                .sender(subject).type(MessageType.TEXT).content("Nội dung bị báo cáo").build();
        subjectMessage.setId(UUID.randomUUID());
        ChatMessage otherMessage = ChatMessage.builder()
                .sender(other).type(MessageType.TEXT).content("Không liên quan").build();
        otherMessage.setId(UUID.randomUUID());
        CommunityActivity subjectActivity = CommunityActivity.builder()
                .organizer(subject).title("Hoạt động của subject").description("Mô tả").build();
        subjectActivity.setId(UUID.randomUUID());

        Report messageReport = generalReport(other.getId(), ReportStatus.PENDING, ReportTargetType.MESSAGE);
        messageReport.setTargetId(subjectMessage.getId());
        Report contentReport = generalReport(other.getId(), ReportStatus.PENDING, ReportTargetType.CONTENT);
        contentReport.setTargetId(subjectActivity.getId());
        Report unrelated = generalReport(other.getId(), ReportStatus.PENDING, ReportTargetType.MESSAGE);
        unrelated.setTargetId(otherMessage.getId());

        when(reportRepository.findAll(any(Sort.class)))
                .thenReturn(List.of(messageReport, contentReport, unrelated));
        when(chatReportRepository.findAll(any(Sort.class))).thenReturn(List.of());
        when(chatMessageRepository.findById(subjectMessage.getId())).thenReturn(Optional.of(subjectMessage));
        when(chatMessageRepository.findById(otherMessage.getId())).thenReturn(Optional.of(otherMessage));
        when(communityActivityRepository.findById(subjectActivity.getId()))
                .thenReturn(Optional.of(subjectActivity));
        when(userRepository.findById(other.getId())).thenReturn(Optional.of(other));

        Page<AdminReportResponse> result = service.getReports(
                null, subject.getId(), null, null, null, null, null, null,
                PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "createdAt")));

        assertEquals(2, result.getTotalElements());
        assertEquals(Set.of(messageReport.getId(), contentReport.getId()),
                result.getContent().stream().map(AdminReportResponse::id).collect(java.util.stream.Collectors.toSet()));
    }

    @Test
    void getReports_userFilterIncludesChatReportsAsReporterOrReportedUser() {
        User subject = user("Người cần xem", "subject@test.vn");
        User other = user("Người khác", "other@test.vn");
        User third = user("Người thứ ba", "third@test.vn");
        ChatReport sentBySubject = chatReport(subject, other);
        ChatReport targetingSubject = chatReport(other, subject);
        ChatReport unrelated = chatReport(other, third);

        when(reportRepository.findAll(any(Sort.class))).thenReturn(List.of());
        when(chatReportRepository.findAll(any(Sort.class)))
                .thenReturn(List.of(sentBySubject, targetingSubject, unrelated));

        Page<AdminReportResponse> result = service.getReports(
                null, subject.getId(), null, null, null, null, null, null,
                PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "createdAt")));

        assertEquals(2, result.getTotalElements());
        assertEquals(Set.of(sentBySubject.getId(), targetingSubject.getId()),
                result.getContent().stream().map(AdminReportResponse::id).collect(java.util.stream.Collectors.toSet()));
    }

    @Test
    void getReport_missingGeneralTargetReturnsUsefulFallbackInsteadOfFailing() {
        UUID reporterId = UUID.randomUUID();
        User reporter = user("Người báo cáo", "reporter@test.vn");
        reporter.setId(reporterId);
        Report report = generalReport(reporterId, ReportStatus.PENDING, ReportTargetType.CONTENT);
        when(reportRepository.findById(report.getId())).thenReturn(Optional.of(report));
        when(userRepository.findById(reporterId)).thenReturn(Optional.of(reporter));
        when(communityActivityRepository.findById(report.getTargetId())).thenReturn(Optional.empty());

        AdminReportDetailResponse detail = service.getReport(report.getId(), AdminReportSource.GENERAL);

        assertEquals("Đối tượng không còn tồn tại", detail.targetLabel());
        assertNull(detail.targetUserId());
        assertNull(detail.targetUserLocked());
    }

    @Test
    void updateStatus_resolveMessageAndWarn_reusesAdminUserModerationFlow() {
        UUID reporterId = UUID.randomUUID();
        User reporter = user("Người báo cáo", "reporter@test.vn");
        reporter.setId(reporterId);
        User sender = user("Người gửi vi phạm", "sender@test.vn");
        ChatMessage message = ChatMessage.builder()
                .sender(sender)
                .type(MessageType.TEXT)
                .content("Nội dung vi phạm")
                .build();
        Report report = generalReport(reporterId, ReportStatus.REVIEWING, ReportTargetType.MESSAGE);
        message.setId(report.getTargetId());

        when(reportRepository.findById(report.getId())).thenReturn(Optional.of(report));
        when(reportRepository.save(report)).thenReturn(report);
        when(userRepository.findById(reporterId)).thenReturn(Optional.of(reporter));
        when(chatMessageRepository.findById(report.getTargetId())).thenReturn(Optional.of(message));

        AdminReportStatusUpdateRequest request = update(
                ReportStatus.RESOLVED, "Đã xác minh hành vi vi phạm", AdminReportUserAction.WARN);
        AdminReportDetailResponse detail = service.updateStatus(
                report.getId(), AdminReportSource.GENERAL, request, "admin@hourlink.vn");

        assertEquals(ReportStatus.RESOLVED, report.getStatus());
        assertEquals("Đã xác minh hành vi vi phạm", report.getAdminNote());
        assertEquals(sender.getId(), detail.targetUserId());
        ArgumentCaptor<UserActionRequest> action = ArgumentCaptor.forClass(UserActionRequest.class);
        verify(adminUserService).performAction(
                org.mockito.ArgumentMatchers.eq(sender.getId()), action.capture(),
                org.mockito.ArgumentMatchers.eq("admin@hourlink.vn"));
        assertEquals("WARN", action.getValue().getActionType());
        assertEquals("Đã xác minh hành vi vi phạm", action.getValue().getReason());
    }

    @Test
    void updateStatus_terminalStatusRequiresAdminNote() {
        Report report = generalReport(UUID.randomUUID(), ReportStatus.PENDING, ReportTargetType.USER);
        when(reportRepository.findById(report.getId())).thenReturn(Optional.of(report));
        AdminReportStatusUpdateRequest request = update(ReportStatus.DISMISSED, "  ", AdminReportUserAction.NONE);

        AppException exception = assertThrows(AppException.class,
                () -> service.updateStatus(report.getId(), AdminReportSource.GENERAL, request, "admin@test.vn"));

        assertTrue(exception.getMessage().contains("ghi chú"));
        verify(reportRepository, never()).save(any());
    }

    @Test
    void updateStatus_terminalReportCannotBeReopened() {
        Report report = generalReport(UUID.randomUUID(), ReportStatus.RESOLVED, ReportTargetType.USER);
        when(reportRepository.findById(report.getId())).thenReturn(Optional.of(report));
        AdminReportStatusUpdateRequest request = update(ReportStatus.REVIEWING, null, AdminReportUserAction.NONE);

        AppException exception = assertThrows(AppException.class,
                () -> service.updateStatus(report.getId(), AdminReportSource.GENERAL, request, "admin@test.vn"));

        assertTrue(exception.getMessage().contains("Không thể chuyển"));
        verify(reportRepository, never()).save(any());
    }

    @Test
    void updateChatStatus_normalizesResolvedToActionedAndPersistsNote() {
        User reporter = user("Người báo cáo", "reporter@test.vn");
        User reported = user("Người bị báo cáo", "reported@test.vn");
        ChatMessage message = ChatMessage.builder()
                .sender(reported)
                .type(MessageType.TEXT)
                .content("spam")
                .build();
        message.setId(UUID.randomUUID());
        ChatReport report = ChatReport.builder()
                .reporter(reporter)
                .reportedUser(reported)
                .message(message)
                .reason(ChatReportReason.SPAM)
                .status(ChatReportStatus.REVIEWED)
                .build();
        report.setId(UUID.randomUUID());
        report.setCreatedAt(Instant.now());
        when(chatReportRepository.findById(report.getId())).thenReturn(Optional.of(report));
        when(chatReportRepository.save(report)).thenReturn(report);

        AdminReportDetailResponse detail = service.updateStatus(
                report.getId(), AdminReportSource.CHAT,
                update(ReportStatus.RESOLVED, "Đã xử lý", AdminReportUserAction.NONE), "admin@test.vn");

        assertEquals(ChatReportStatus.ACTIONED, report.getStatus());
        assertEquals("Đã xử lý", report.getAdminNote());
        assertEquals(ReportStatus.RESOLVED, detail.status());
    }

    private Report generalReport(UUID reporterId, ReportStatus status, ReportTargetType targetType) {
        Report report = Report.builder()
                .reporterId(reporterId)
                .targetId(UUID.randomUUID())
                .targetType(targetType)
                .reason(ReportReason.SPAM)
                .description("Mô tả báo cáo")
                .status(status)
                .build();
        report.setId(UUID.randomUUID());
        report.setCreatedAt(Instant.parse("2026-08-09T10:00:00Z"));
        return report;
    }

    private User user(String name, String email) {
        User user = User.builder()
                .fullName(name)
                .email(email)
                .passwordHash("hash")
                .build();
        user.setId(UUID.randomUUID());
        return user;
    }

    private ChatReport chatReport(User reporter, User reportedUser) {
        ChatMessage message = ChatMessage.builder()
                .sender(reportedUser)
                .type(MessageType.TEXT)
                .content("Tin nhắn")
                .build();
        message.setId(UUID.randomUUID());
        ChatReport report = ChatReport.builder()
                .reporter(reporter)
                .reportedUser(reportedUser)
                .message(message)
                .reason(ChatReportReason.SPAM)
                .status(ChatReportStatus.PENDING)
                .build();
        report.setId(UUID.randomUUID());
        report.setCreatedAt(Instant.parse("2026-08-09T12:00:00Z"));
        return report;
    }

    private AdminReportStatusUpdateRequest update(
            ReportStatus status, String note, AdminReportUserAction action) {
        AdminReportStatusUpdateRequest request = new AdminReportStatusUpdateRequest();
        request.setStatus(status);
        request.setAdminNote(note);
        request.setUserAction(action);
        return request;
    }
}
