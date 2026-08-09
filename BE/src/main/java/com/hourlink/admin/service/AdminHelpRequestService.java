package com.hourlink.admin.service;

import com.hourlink.admin.dto.request.AdminCreateHelpRequestRequest;
import com.hourlink.admin.dto.request.AdminHelpRequestActionRequest;
import com.hourlink.admin.dto.request.AdminUpdateHelpRequestRequest;
import com.hourlink.admin.dto.response.AdminHelpRequestDetailResponse;
import com.hourlink.admin.dto.response.AdminHelpRequestResponse;
import com.hourlink.admin.entity.UserAdminAction;
import com.hourlink.admin.repository.UserAdminActionRepository;
import com.hourlink.appointment.enums.AppointmentStatus;
import com.hourlink.appointment.repository.AppointmentRepository;
import com.hourlink.common.exception.BadRequestException;
import com.hourlink.common.service.EmailService;
import com.hourlink.helprequest.entity.HelpRequest;
import com.hourlink.helprequest.enums.RequestStatus;
import com.hourlink.helprequest.repository.HelpRequestRepository;
import com.hourlink.skill.entity.SkillCategory;
import com.hourlink.skill.repository.SkillCategoryRepository;
import com.hourlink.user.entity.User;
import com.hourlink.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminHelpRequestService {

    private final HelpRequestRepository helpRequestRepository;
    private final UserAdminActionRepository userAdminActionRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final SkillCategoryRepository categoryRepository;
    private final AppointmentRepository appointmentRepository;

    private static final java.util.List<AppointmentStatus> ACTIVE_APPOINTMENT_STATUSES = java.util.Arrays.asList(
            AppointmentStatus.PENDING,
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.UPCOMING,
            AppointmentStatus.IN_PROGRESS,
            AppointmentStatus.DISPUTED,
            AppointmentStatus.RESCHEDULED
    );

    @Transactional(readOnly = true)
    public Page<AdminHelpRequestResponse> getHelpRequests(
            String title, String requesterName, String requesterEmail, RequestStatus status, UUID categoryId, String region, Pageable pageable) {

        Specification<HelpRequest> spec = Specification.where(null);

        if (region != null && !region.trim().isEmpty()) {
            String kw = "%" + region.trim().toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("region")), kw));
        }

        if (title != null && !title.trim().isEmpty()) {
            String kw = "%" + title.trim().toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("title")), kw));
        }
        if (requesterName != null && !requesterName.trim().isEmpty()) {
            String kw = "%" + requesterName.trim().toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.join("requester").get("fullName")), kw));
        }
        if (requesterEmail != null && !requesterEmail.trim().isEmpty()) {
            String kw = "%" + requesterEmail.trim().toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.join("requester").get("email")), kw));
        }
        if (categoryId != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.join("category").get("id"), categoryId));
        }
        if (status != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("status"), status));
        } else {
            spec = spec.and((root, query, cb) ->
                    cb.notEqual(root.get("status"), RequestStatus.DELETED));
        }

        return helpRequestRepository.findAll(spec, pageable).map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public AdminHelpRequestDetailResponse getHelpRequestDetail(UUID id) {
        HelpRequest request = helpRequestRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy yêu cầu hỗ trợ"));

        return mapToDetailResponse(request);
    }

    @Transactional
    public void performAction(UUID id, AdminHelpRequestActionRequest actionRequest, String adminEmail) {
        HelpRequest request = helpRequestRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy yêu cầu hỗ trợ"));

        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy admin"));

        User requester = request.getRequester();
        String actionType = actionRequest.getActionType().toUpperCase();

        switch (actionType) {
            case "DELETE" -> {
                if (request.getStatus() == RequestStatus.DELETED) {
                    throw new BadRequestException("Yêu cầu này đã bị xóa trước đó.");
                }
                boolean hasActiveAppointment = appointmentRepository
                        .existsByHelpRequestIdAndStatusIn(id, ACTIVE_APPOINTMENT_STATUSES);
                if (hasActiveAppointment || request.getStatus() == RequestStatus.ASSIGNED) {
                    throw new BadRequestException("Không thể xóa yêu cầu hỗ trợ vì đang nằm trong lịch hẹn hoạt động hoặc đã được nhận.");
                }
                request.setStatus(RequestStatus.DELETED);
                helpRequestRepository.save(request);
                log.info("Admin {} đã xóa mềm yêu cầu hỗ trợ {}", adminEmail, id);
            }
            case "WARN" -> {
                if (actionRequest.getReason() == null || actionRequest.getReason().trim().isEmpty()) {
                    throw new BadRequestException("Lý do cảnh báo không được để trống.");
                }
                requester.setWarningCount(requester.getWarningCount() + 1);
                userRepository.save(requester);
                // Can reuse sendWarningEmail for now, or create a specific one for HelpRequest
                emailService.sendWarningEmail(
                        requester.getEmail(),
                        requester.getFullName(),
                        requester.getWarningCount(),
                        actionRequest.getReason()
                );
                log.info("Admin {} đã cảnh báo user {} về yêu cầu hỗ trợ {}", adminEmail, requester.getEmail(), request.getTitle());
            }
            default -> throw new IllegalArgumentException("Hành động không hợp lệ: " + actionType);
        }

        UserAdminAction action = UserAdminAction.builder()
                .user(requester)
                .admin(admin)
                .actionType("HELP_REQUEST_" + actionType)
                .reason(actionRequest.getReason())
                .build();
        userAdminActionRepository.save(action);
    }

    @Transactional
    public void createHelpRequest(AdminCreateHelpRequestRequest request) {
        User requester = userRepository.findById(request.getRequesterId())
                .orElseThrow(() -> new BadRequestException("Không tìm thấy người dùng"));

        SkillCategory category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId()).orElse(null);
        }

        HelpRequest helpRequest = HelpRequest.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .currentLevel(request.getCurrentLevel())
                .format(request.getFormat())
                .desiredTime(request.getDesiredTime())
                .duration(request.getDuration())
                .region(request.getRegion())
                .timeCreditAmount(request.getTimeCreditAmount() != null ? request.getTimeCreditAmount() : 1)
                .status(request.getStatus() != null ? request.getStatus() : RequestStatus.SEARCHING)
                .requester(requester)
                .category(category)
                .build();

        helpRequestRepository.save(helpRequest);
        log.info("Admin created help request '{}' for user {}", request.getTitle(), requester.getEmail());
    }

    @Transactional
    public void updateHelpRequest(UUID id, AdminUpdateHelpRequestRequest request) {
        HelpRequest helpRequest = helpRequestRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy yêu cầu hỗ trợ"));

        boolean hasActiveAppointment = appointmentRepository
                .existsByHelpRequestIdAndStatusIn(id, ACTIVE_APPOINTMENT_STATUSES);
        if (hasActiveAppointment || helpRequest.getStatus() == RequestStatus.ASSIGNED) {
            throw new BadRequestException("Không thể chỉnh sửa yêu cầu hỗ trợ vì đang nằm trong lịch hẹn hoạt động hoặc đã được nhận.");
        }

        helpRequest.setTitle(request.getTitle());
        helpRequest.setDescription(request.getDescription());
        helpRequest.setCurrentLevel(request.getCurrentLevel());
        helpRequest.setFormat(request.getFormat());
        helpRequest.setDesiredTime(request.getDesiredTime());
        helpRequest.setDuration(request.getDuration());
        helpRequest.setRegion(request.getRegion());

        if (request.getTimeCreditAmount() != null) {
            helpRequest.setTimeCreditAmount(request.getTimeCreditAmount());
        }
        if (request.getStatus() != null) {
            helpRequest.setStatus(request.getStatus());
        }
        if (request.getCategoryId() != null) {
            SkillCategory category = categoryRepository.findById(request.getCategoryId()).orElse(null);
            helpRequest.setCategory(category);
        } else {
            helpRequest.setCategory(null);
        }

        helpRequestRepository.save(helpRequest);
        log.info("Admin updated help request '{}' (id={})", helpRequest.getTitle(), id);
    }

    private AdminHelpRequestResponse mapToResponse(HelpRequest request) {
        return AdminHelpRequestResponse.builder()
                .id(request.getId())
                .title(request.getTitle())
                .status(request.getStatus())
                .categoryName(request.getCategory() != null ? request.getCategory().getName() : null)
                .region(request.getRegion())
                .requesterId(request.getRequester().getId())
                .requesterFullName(request.getRequester().getFullName())
                .requesterEmail(request.getRequester().getEmail())
                .requesterAvatarUrl(request.getRequester().getAvatarUrl())
                .timeCreditAmount(request.getTimeCreditAmount())
                .createdAt(request.getCreatedAt())
                .build();
    }

    private AdminHelpRequestDetailResponse mapToDetailResponse(HelpRequest request) {
        User requester = request.getRequester();
        return AdminHelpRequestDetailResponse.builder()
                .id(request.getId())
                .title(request.getTitle())
                .description(request.getDescription())
                .currentLevel(request.getCurrentLevel())
                .format(request.getFormat())
                .desiredTime(request.getDesiredTime())
                .duration(request.getDuration())
                .region(request.getRegion())
                .timeCreditAmount(request.getTimeCreditAmount())
                .status(request.getStatus())
                .responseCount(request.getResponseCount())
                .categoryName(request.getCategory() != null ? request.getCategory().getName() : null)
                .createdAt(request.getCreatedAt())
                .updatedAt(request.getUpdatedAt())
                .requesterId(requester.getId())
                .requesterFullName(requester.getFullName())
                .requesterEmail(requester.getEmail())
                .requesterAvatarUrl(requester.getAvatarUrl())
                .requesterReputationScore(requester.getReputationScore())
                .requesterCompletedSessions(requester.getCompletedSessions())
                .requesterWarningCount(requester.getWarningCount())
                .build();
    }
}
