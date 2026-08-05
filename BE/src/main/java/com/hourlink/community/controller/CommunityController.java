package com.hourlink.community.controller;

import com.hourlink.common.response.ApiResponse;
import com.hourlink.community.dto.request.ActivityRequest;
import com.hourlink.community.dto.request.ParticipantConfirmRequest;
import com.hourlink.community.dto.response.ActivityResponse;
import com.hourlink.community.dto.response.ParticipantResponse;
import com.hourlink.community.enums.ActivityStatus;
import com.hourlink.community.service.CommunityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/community")
@RequiredArgsConstructor
public class CommunityController {

    private final CommunityService communityService;

    // ==========================================
    // Hoạt động cộng đồng chung
    // ==========================================

    @GetMapping("/activities")
    public ApiResponse<List<ActivityResponse>> getAllActivities() {
        return ApiResponse.success(communityService.getAllActivities());
    }

    @GetMapping("/activities/{id}")
    public ApiResponse<ActivityResponse> getActivityById(@PathVariable UUID id) {
        return ApiResponse.success(communityService.getActivityById(id));
    }

    // ==========================================
    // Dành cho Tổ chức (Organizer)
    // ==========================================

    @PostMapping("/activities")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ActivityResponse> createActivity(@Valid @RequestBody ActivityRequest request) {
        return ApiResponse.success(communityService.createActivity(request));
    }

    @GetMapping("/organizer/activities")
    public ApiResponse<List<ActivityResponse>> getMyCreatedActivities() {
        return ApiResponse.success(communityService.getMyCreatedActivities());
    }

    @PatchMapping("/activities/{id}/status")
    public ApiResponse<ActivityResponse> updateActivityStatus(
            @PathVariable UUID id,
            @RequestParam ActivityStatus status) {
        return ApiResponse.success(communityService.updateActivityStatus(id, status));
    }

    @PutMapping("/activities/{id}")
    public ApiResponse<ActivityResponse> updateActivity(
            @PathVariable UUID id,
            @Valid @RequestBody ActivityRequest request) {
        return ApiResponse.success(communityService.updateActivity(id, request));
    }

    @DeleteMapping("/activities/{id}")
    public ApiResponse<Void> deleteActivity(@PathVariable UUID id) {
        communityService.deleteActivity(id);
        return ApiResponse.success(null);
    }

    @GetMapping("/activities/{id}/participants")
    public ApiResponse<List<ParticipantResponse>> getActivityParticipants(@PathVariable UUID id) {
        return ApiResponse.success(communityService.getActivityParticipants(id));
    }

    @PostMapping("/activities/{activityId}/participants/{participantId}/confirm")
    public ApiResponse<ParticipantResponse> confirmParticipant(
            @PathVariable UUID activityId,
            @PathVariable UUID participantId,
            @Valid @RequestBody ParticipantConfirmRequest request) {
        return ApiResponse.success(communityService.confirmParticipant(activityId, participantId, request));
    }

    // ==========================================
    // Dành cho Người tham gia (Participant)
    // ==========================================

    @PostMapping("/activities/{id}/register")
    public ApiResponse<ParticipantResponse> registerForActivity(@PathVariable UUID id) {
        return ApiResponse.success(communityService.registerForActivity(id));
    }

    @PostMapping("/activities/{id}/unregister")
    public ApiResponse<Void> unregisterForActivity(@PathVariable UUID id) {
        communityService.unregisterForActivity(id);
        return ApiResponse.success(null);
    }

    @GetMapping("/me/registrations")
    public ApiResponse<List<ParticipantResponse>> getMyRegistrations() {
        return ApiResponse.success(communityService.getMyRegistrations());
    }
}
