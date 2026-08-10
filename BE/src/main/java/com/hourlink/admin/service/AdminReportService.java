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
import com.hourlink.chat.enums.ChatReportStatus;
import com.hourlink.chat.enums.MessageType;
import com.hourlink.chat.repository.ChatMessageRepository;
import com.hourlink.chat.repository.ChatReportRepository;
import com.hourlink.common.exception.AppException;
import com.hourlink.common.exception.ErrorCode;
import com.hourlink.community.entity.CommunityActivity;
import com.hourlink.community.repository.CommunityActivityRepository;
import com.hourlink.report.entity.Report;
import com.hourlink.report.enums.ReportStatus;
import com.hourlink.report.enums.ReportTargetType;
import com.hourlink.report.repository.ReportRepository;
import com.hourlink.user.entity.User;
import com.hourlink.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminReportService {

    private static final ZoneId REPORT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final ReportRepository reportRepository;
    private final ChatReportRepository chatReportRepository;
    private final UserRepository userRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final CommunityActivityRepository communityActivityRepository;
    private final AdminUserService adminUserService;

    /**
     * Hợp nhất báo cáo chung và báo cáo tin nhắn vào cùng một trang quản trị.
     * Hai bảng có bộ trạng thái khác nhau nên trạng thái chat được chuẩn hóa tại đây.
     */
    public Page<AdminReportResponse> getReports(
            String search,
            AdminReportSource source,
            ReportStatus status,
            ReportTargetType targetType,
            String reason,
            LocalDate dateFrom,
            LocalDate dateTo,
            Pageable pageable) {
        validateDateRange(dateFrom, dateTo);

        List<AdminReportResponse> reports = new ArrayList<>();
        reportRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream().map(this::toGeneralSummary).forEach(reports::add);
        chatReportRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream().map(this::toChatSummary).forEach(reports::add);

        Instant from = dateFrom == null ? null : dateFrom.atStartOfDay(REPORT_ZONE).toInstant();
        Instant toExclusive = dateTo == null ? null : dateTo.plusDays(1).atStartOfDay(REPORT_ZONE).toInstant();
        String normalizedSearch = normalize(search);
        String normalizedReason = normalize(reason);

        List<AdminReportResponse> filtered = reports.stream()
                .filter(item -> source == null || item.source() == source)
                .filter(item -> status == null || item.status() == status)
                .filter(item -> targetType == null || item.targetType() == targetType)
                .filter(item -> normalizedReason == null || item.reason().equalsIgnoreCase(normalizedReason))
                .filter(item -> from == null || !item.createdAt().isBefore(from))
                .filter(item -> toExclusive == null || item.createdAt().isBefore(toExclusive))
                .filter(item -> matchesSearch(item, normalizedSearch))
                .sorted(createdAtComparator(pageable.getSort()))
                .toList();

        int start = (int) Math.min(pageable.getOffset(), filtered.size());
        int end = Math.min(start + pageable.getPageSize(), filtered.size());
        return new PageImpl<>(filtered.subList(start, end), pageable, filtered.size());
    }

    public AdminReportStatsResponse getStats() {
        long pending = reportRepository.countByStatus(ReportStatus.PENDING)
                + chatReportRepository.countByStatus(ChatReportStatus.PENDING);
        long reviewing = reportRepository.countByStatus(ReportStatus.REVIEWING)
                + chatReportRepository.countByStatus(ChatReportStatus.REVIEWED);
        long resolved = reportRepository.countByStatus(ReportStatus.RESOLVED)
                + chatReportRepository.countByStatus(ChatReportStatus.ACTIONED);
        long dismissed = reportRepository.countByStatus(ReportStatus.DISMISSED)
                + chatReportRepository.countByStatus(ChatReportStatus.DISMISSED);
        return new AdminReportStatsResponse(pending + reviewing + resolved + dismissed,
                pending, reviewing, resolved, dismissed);
    }

    public AdminReportDetailResponse getReport(UUID id, AdminReportSource source) {
        if (source == null || source == AdminReportSource.GENERAL) {
            return toGeneralDetail(findGeneral(id));
        }
        return toChatDetail(findChat(id));
    }

    @Transactional
    public AdminReportDetailResponse updateStatus(
            UUID id,
            AdminReportSource source,
            AdminReportStatusUpdateRequest request,
            String adminEmail) {
        if (source == null || source == AdminReportSource.GENERAL) {
            return updateGeneral(findGeneral(id), request, adminEmail);
        }
        return updateChat(findChat(id), request, adminEmail);
    }

    private AdminReportDetailResponse updateGeneral(
            Report report, AdminReportStatusUpdateRequest request, String adminEmail) {
        ReportStatus current = report.getStatus();
        String note = validateUpdate(current, request);
        TargetContext target = resolveGeneralTarget(report);
        applyUserAction(request, current, target.targetUser(), note, adminEmail);

        report.setStatus(request.getStatus());
        report.setAdminNote(note);
        return toGeneralDetail(reportRepository.save(report));
    }

    private AdminReportDetailResponse updateChat(
            ChatReport report, AdminReportStatusUpdateRequest request, String adminEmail) {
        ReportStatus current = normalizeChatStatus(report.getStatus());
        String note = validateUpdate(current, request);
        applyUserAction(request, current, report.getReportedUser(), note, adminEmail);

        report.setStatus(toChatStatus(request.getStatus()));
        report.setAdminNote(note);
        return toChatDetail(chatReportRepository.save(report));
    }

    private String validateUpdate(ReportStatus current, AdminReportStatusUpdateRequest request) {
        ReportStatus next = request.getStatus();
        if (!isAllowedTransition(current, next)) {
            throw new AppException(ErrorCode.INVALID_REQUEST,
                    "Không thể chuyển báo cáo từ " + current + " sang " + next);
        }

        String note = trimToNull(request.getAdminNote());
        if ((next == ReportStatus.RESOLVED || next == ReportStatus.DISMISSED) && note == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST,
                    "Cần nhập ghi chú xử lý khi kết thúc báo cáo");
        }
        return note;
    }

    private boolean isAllowedTransition(ReportStatus current, ReportStatus next) {
        if (current == next) {
            return true;
        }
        return switch (current) {
            case PENDING -> next == ReportStatus.REVIEWING
                    || next == ReportStatus.RESOLVED
                    || next == ReportStatus.DISMISSED;
            case REVIEWING -> next == ReportStatus.RESOLVED || next == ReportStatus.DISMISSED;
            case RESOLVED, DISMISSED -> false;
        };
    }

    private void applyUserAction(
            AdminReportStatusUpdateRequest request,
            ReportStatus current,
            User targetUser,
            String note,
            String adminEmail) {
        AdminReportUserAction action = request.getUserAction() == null
                ? AdminReportUserAction.NONE
                : request.getUserAction();
        if (action == AdminReportUserAction.NONE) {
            return;
        }
        if (request.getStatus() != ReportStatus.RESOLVED) {
            throw new AppException(ErrorCode.INVALID_REQUEST,
                    "Chỉ được cảnh cáo hoặc khóa người dùng khi giải quyết báo cáo");
        }
        if (current == ReportStatus.RESOLVED) {
            throw new AppException(ErrorCode.INVALID_REQUEST,
                    "Báo cáo đã được xử lý; không thể lặp lại hành động người dùng");
        }
        if (targetUser == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST,
                    "Không còn tìm thấy người dùng bị báo cáo để thực hiện hành động");
        }

        UserActionRequest userRequest = new UserActionRequest();
        userRequest.setActionType(action.name());
        userRequest.setReason(note);
        adminUserService.performAction(targetUser.getId(), userRequest, adminEmail);
    }

    private AdminReportResponse toGeneralSummary(Report report) {
        ReporterContext reporter = resolveReporter(report.getReporterId());
        TargetContext target = resolveGeneralTarget(report);
        return new AdminReportResponse(
                report.getId(), AdminReportSource.GENERAL, report.getTargetId(), report.getTargetType(),
                target.label(), report.getReason().name(), report.getDescription(),
                parseEvidenceUrls(report.getEvidenceUrls()).size(), report.getStatus(),
                reporter.id(), reporter.name(), reporter.email(), report.getCreatedAt(), report.getUpdatedAt());
    }

    private AdminReportResponse toChatSummary(ChatReport report) {
        User reporter = report.getReporter();
        TargetContext target = resolveChatTarget(report);
        return new AdminReportResponse(
                report.getId(), AdminReportSource.CHAT, report.getMessage().getId(), ReportTargetType.MESSAGE,
                target.label(), report.getReason().name(), report.getDescription(), chatEvidenceCount(report),
                normalizeChatStatus(report.getStatus()), reporter.getId(), reporter.getFullName(), reporter.getEmail(),
                report.getCreatedAt(), report.getUpdatedAt());
    }

    private AdminReportDetailResponse toGeneralDetail(Report report) {
        ReporterContext reporter = resolveReporter(report.getReporterId());
        TargetContext target = resolveGeneralTarget(report);
        List<String> evidence = parseEvidenceUrls(report.getEvidenceUrls());
        return new AdminReportDetailResponse(
                report.getId(), AdminReportSource.GENERAL, report.getTargetId(), report.getTargetType(),
                target.label(), target.description(), report.getReason().name(), report.getDescription(),
                evidence.size(), evidence, report.getStatus(), report.getAdminNote(), reporter.id(), reporter.name(),
                reporter.email(), reporter.avatarUrl(), userId(target.targetUser()), userName(target.targetUser()),
                userEmail(target.targetUser()), userLocked(target.targetUser()), report.getCreatedAt(), report.getUpdatedAt());
    }

    private AdminReportDetailResponse toChatDetail(ChatReport report) {
        User reporter = report.getReporter();
        TargetContext target = resolveChatTarget(report);
        List<String> evidence = chatEvidenceUrls(report);
        return new AdminReportDetailResponse(
                report.getId(), AdminReportSource.CHAT, report.getMessage().getId(), ReportTargetType.MESSAGE,
                target.label(), target.description(), report.getReason().name(), report.getDescription(),
                chatEvidenceCount(report), evidence, normalizeChatStatus(report.getStatus()), report.getAdminNote(),
                reporter.getId(), reporter.getFullName(), reporter.getEmail(), reporter.getAvatarUrl(),
                userId(target.targetUser()), userName(target.targetUser()), userEmail(target.targetUser()),
                userLocked(target.targetUser()), report.getCreatedAt(), report.getUpdatedAt());
    }

    private TargetContext resolveGeneralTarget(Report report) {
        return switch (report.getTargetType()) {
            case USER -> userRepository.findById(report.getTargetId())
                    .map(user -> new TargetContext(user.getFullName(), user.getBio(), user))
                    .orElseGet(TargetContext::missing);
            case MESSAGE -> chatMessageRepository.findById(report.getTargetId())
                    .map(this::messageTarget)
                    .orElseGet(TargetContext::missing);
            case CONTENT -> communityActivityRepository.findById(report.getTargetId())
                    .map(this::activityTarget)
                    .orElseGet(TargetContext::missing);
        };
    }

    private TargetContext resolveChatTarget(ChatReport report) {
        String snapshot = trimToNull(report.getMessageSnapshot());
        ChatMessage message = report.getMessage();
        User reportedUser = report.getReportedUser();
        String label = "Tin nhắn của " + displayName(reportedUser);
        return new TargetContext(label, snapshot == null ? describeMessage(message) : snapshot, reportedUser);
    }

    private TargetContext messageTarget(ChatMessage message) {
        User sender = message.getSender();
        String label = sender == null ? "Tin nhắn hệ thống" : "Tin nhắn của " + displayName(sender);
        return new TargetContext(label, describeMessage(message), sender);
    }

    private TargetContext activityTarget(CommunityActivity activity) {
        return new TargetContext(activity.getTitle(), activity.getDescription(), activity.getOrganizer());
    }

    private ReporterContext resolveReporter(UUID reporterId) {
        return userRepository.findById(reporterId)
                .map(user -> new ReporterContext(user.getId(), user.getFullName(), user.getEmail(), user.getAvatarUrl()))
                .orElseGet(() -> new ReporterContext(reporterId, "Người dùng không còn tồn tại", null, null));
    }

    private String describeMessage(ChatMessage message) {
        if (message.isRecalled()) {
            return "Tin nhắn đã được thu hồi";
        }
        String content = trimToNull(message.getContent());
        if (content != null) {
            return content;
        }
        if (message.getType() == MessageType.DOCUMENT && trimToNull(message.getOriginalName()) != null) {
            return "Tài liệu: " + message.getOriginalName();
        }
        if (message.getType() == MessageType.LOCATION && trimToNull(message.getLocationLabel()) != null) {
            return "Vị trí: " + message.getLocationLabel();
        }
        if (message.getType() == MessageType.MEETING_LINK && trimToNull(message.getMeetingLink()) != null) {
            return "Phòng họp: " + message.getMeetingLink();
        }
        return switch (message.getType()) {
            case IMAGE -> "Hình ảnh";
            case DOCUMENT -> "Tài liệu";
            case LOCATION -> "Vị trí";
            case MEETING_LINK -> "Phòng họp trực tuyến";
            case RESCHEDULE_PROPOSAL -> "Đề xuất đổi lịch";
            case APPOINTMENT_CARD -> "Thông tin lịch hẹn";
            case SYSTEM -> "Tin nhắn hệ thống";
            case TEXT -> "Tin nhắn văn bản";
        };
    }

    private List<String> parseEvidenceUrls(String raw) {
        String normalized = trimToNull(raw);
        if (normalized == null) {
            return List.of();
        }
        if (normalized.startsWith("[") && normalized.endsWith("]")) {
            normalized = normalized.substring(1, normalized.length() - 1);
        }
        return List.of(normalized.split("[,\\n]"))
                .stream()
                .map(String::trim)
                .map(value -> value.replaceAll("^['\"]|['\"]$", ""))
                .filter(value -> !value.isBlank())
                .distinct()
                .toList();
    }

    private List<String> chatEvidenceUrls(ChatReport report) {
        String attachmentUrl = trimToNull(report.getMessage().getAttachmentUrl());
        return attachmentUrl == null ? List.of() : List.of(attachmentUrl);
    }

    private int chatEvidenceCount(ChatReport report) {
        int count = chatEvidenceUrls(report).size();
        return trimToNull(report.getMessageSnapshot()) == null ? count : count + 1;
    }

    private boolean matchesSearch(AdminReportResponse item, String search) {
        if (search == null) {
            return true;
        }
        return contains(item.targetLabel(), search)
                || contains(item.description(), search)
                || contains(item.reporterName(), search)
                || contains(item.reporterEmail(), search)
                || contains(item.reason(), search)
                || contains(item.targetId().toString(), search);
    }

    private Comparator<AdminReportResponse> createdAtComparator(Sort sort) {
        Comparator<AdminReportResponse> comparator = Comparator.comparing(
                AdminReportResponse::createdAt, Comparator.nullsLast(Comparator.naturalOrder()));
        Sort.Order order = sort.getOrderFor("createdAt");
        return order != null && order.isAscending() ? comparator : comparator.reversed();
    }

    private ReportStatus normalizeChatStatus(ChatReportStatus status) {
        return switch (status) {
            case PENDING -> ReportStatus.PENDING;
            case REVIEWED -> ReportStatus.REVIEWING;
            case ACTIONED -> ReportStatus.RESOLVED;
            case DISMISSED -> ReportStatus.DISMISSED;
        };
    }

    private ChatReportStatus toChatStatus(ReportStatus status) {
        return switch (status) {
            case PENDING -> ChatReportStatus.PENDING;
            case REVIEWING -> ChatReportStatus.REVIEWED;
            case RESOLVED -> ChatReportStatus.ACTIONED;
            case DISMISSED -> ChatReportStatus.DISMISSED;
        };
    }

    private void validateDateRange(LocalDate dateFrom, LocalDate dateTo) {
        if (dateFrom != null && dateTo != null && dateFrom.isAfter(dateTo)) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Ngày bắt đầu không thể sau ngày kết thúc");
        }
    }

    private String normalize(String value) {
        String trimmed = trimToNull(value);
        return trimmed == null ? null : trimmed.toLowerCase(Locale.ROOT);
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private boolean contains(String value, String search) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(search);
    }

    private String displayName(User user) {
        if (user == null) {
            return "người dùng không còn tồn tại";
        }
        return trimToNull(user.getFullName()) == null ? user.getEmail() : user.getFullName();
    }

    private UUID userId(User user) {
        return user == null ? null : user.getId();
    }

    private String userName(User user) {
        return user == null ? null : user.getFullName();
    }

    private String userEmail(User user) {
        return user == null ? null : user.getEmail();
    }

    private Boolean userLocked(User user) {
        return user == null ? null : user.isLocked();
    }

    private Report findGeneral(UUID id) {
        return reportRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.REPORT_NOT_FOUND));
    }

    private ChatReport findChat(UUID id) {
        return chatReportRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.REPORT_NOT_FOUND));
    }

    private record ReporterContext(UUID id, String name, String email, String avatarUrl) {
    }

    private record TargetContext(String label, String description, User targetUser) {
        private static TargetContext missing() {
            return new TargetContext("Đối tượng không còn tồn tại", null, null);
        }
    }
}
