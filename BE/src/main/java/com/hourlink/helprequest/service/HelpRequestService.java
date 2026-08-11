package com.hourlink.helprequest.service;

import com.hourlink.common.exception.AppException;
import com.hourlink.common.exception.ErrorCode;
import com.hourlink.common.util.SecurityUtil;
import com.hourlink.helprequest.dto.request.HelpRequestRequest;
import com.hourlink.helprequest.dto.response.HelpRequestResponse;
import com.hourlink.helprequest.entity.HelpRequest;
import com.hourlink.helprequest.enums.RequestStatus;
import com.hourlink.helprequest.repository.HelpRequestRepository;
import com.hourlink.skill.entity.SkillCategory;
import com.hourlink.skill.repository.SkillCategoryRepository;
import com.hourlink.user.entity.User;
import com.hourlink.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HelpRequestService {
    private final HelpRequestRepository helpRequestRepository;
    private final SkillCategoryRepository categoryRepository;
    private final UserRepository userRepository;

    @Transactional
    public HelpRequestResponse createHelpRequest(HelpRequestRequest request) {
        String email = SecurityUtil.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        SkillCategory category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));

        HelpRequest helpRequest = HelpRequest.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .currentLevel(request.getCurrentLevel())
                .format(request.getFormat())
                .desiredTime(request.getDesiredTime())
                .duration(request.getDuration())
                .region(request.getRegion())
                .category(category)
                .requester(user)
                .status(RequestStatus.SEARCHING)
                .timeCreditAmount(request.getDuration() != null ? Math.max(0.5, request.getDuration() / 60.0) : 1.0)
                .build();

        HelpRequest saved = helpRequestRepository.save(helpRequest);
        return mapToResponse(saved);
    }

    public List<HelpRequestResponse> getMyHelpRequests() {
        String email = SecurityUtil.getCurrentUserEmail();
        List<HelpRequest> requests = helpRequestRepository
                .findAllByRequester_EmailAndStatusNotOrderByCreatedAtDesc(email, RequestStatus.DELETED);
        return requests.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional
    public HelpRequestResponse updateHelpRequest(UUID id, HelpRequestRequest request) {
        String email = SecurityUtil.getCurrentUserEmail();
        HelpRequest helpRequest = helpRequestRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));

        if (!helpRequest.getRequester().getEmail().equals(email)) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }
        if (helpRequest.getStatus() == RequestStatus.DELETED) {
            throw new AppException(ErrorCode.REQUEST_NOT_FOUND);
        }

        SkillCategory category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));

        helpRequest.setTitle(request.getTitle());
        helpRequest.setDescription(request.getDescription());
        helpRequest.setCurrentLevel(request.getCurrentLevel());
        helpRequest.setFormat(request.getFormat());
        helpRequest.setDesiredTime(request.getDesiredTime());
        helpRequest.setDuration(request.getDuration());
        helpRequest.setRegion(request.getRegion());
        helpRequest.setCategory(category);
        if (request.getDuration() != null) {
            helpRequest.setTimeCreditAmount(Math.max(0.5, request.getDuration() / 60.0));
        }

        return mapToResponse(helpRequestRepository.save(helpRequest));
    }

    @Transactional
    public void deleteHelpRequest(UUID id) {
        String email = SecurityUtil.getCurrentUserEmail();
        HelpRequest helpRequest = helpRequestRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));

        if (!helpRequest.getRequester().getEmail().equals(email)) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }

        // Keep invitation/appointment history intact. A physical delete is rejected by
        // the invitation.help_request_id foreign key as soon as the request has responses.
        if (helpRequest.getStatus() == RequestStatus.DELETED) {
            return;
        }

        helpRequest.setStatus(RequestStatus.DELETED);
        helpRequestRepository.save(helpRequest);
        log.info("User {} soft-deleted help request {}", email, id);
    }

    @Transactional
    public HelpRequestResponse closeHelpRequest(UUID id) {
        String email = SecurityUtil.getCurrentUserEmail();
        HelpRequest helpRequest = helpRequestRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));

        if (!helpRequest.getRequester().getEmail().equals(email)) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }
        if (helpRequest.getStatus() == RequestStatus.DELETED) {
            throw new AppException(ErrorCode.REQUEST_NOT_FOUND);
        }

        helpRequest.setStatus(RequestStatus.COMPLETED);
        return mapToResponse(helpRequestRepository.save(helpRequest));
    }

    private HelpRequestResponse mapToResponse(HelpRequest request) {
        return HelpRequestResponse.builder()
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
                .categoryId(request.getCategory() != null ? request.getCategory().getId() : null)
                .categoryName(request.getCategory() != null ? request.getCategory().getName() : null)
                .requesterId(request.getRequester().getId())
                .requesterFullName(request.getRequester().getFullName())
                .responseCount(request.getResponseCount() != null ? request.getResponseCount() : 0)
                .createdAt(request.getCreatedAt())
                .updatedAt(request.getUpdatedAt())
                .build();
    }
}
