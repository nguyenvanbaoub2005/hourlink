package com.hourlink.invitation.controller;

import com.hourlink.common.response.ApiResponse;
import com.hourlink.invitation.dto.request.InvitationRequest;
import com.hourlink.invitation.dto.request.RespondInvitationRequest;
import com.hourlink.invitation.dto.response.InvitationResponse;
import com.hourlink.invitation.service.InvitationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * InvitationController — API endpoints cho chức năng 9.9 Gửi lời mời hỗ trợ.
 */
@Tag(name = "Invitation Management", description = "Quản lý lời mời hỗ trợ (chức năng 9.9)")
@RestController
@RequestMapping("/invitation")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class InvitationController {

    InvitationService invitationService;

    // ─── Gửi lời mời ─────────────────────────────────────────────────────────

    @Operation(summary = "Gửi lời mời hỗ trợ", description = "Người cần hỗ trợ gửi lời mời đến người có kỹ năng")
    @PostMapping
    public ApiResponse<InvitationResponse> sendInvitation(
            @RequestBody @Valid InvitationRequest request) {
        return ApiResponse.created("Gửi lời mời thành công", invitationService.sendInvitation(request));
    }

    // ─── Xem danh sách ───────────────────────────────────────────────────────

    @Operation(summary = "Danh sách lời mời đã gửi")
    @GetMapping("/sent")
    public ApiResponse<List<InvitationResponse>> getMySentInvitations() {
        return ApiResponse.success(invitationService.getMySentInvitations());
    }

    @Operation(summary = "Danh sách lời mời nhận được")
    @GetMapping("/received")
    public ApiResponse<List<InvitationResponse>> getMyReceivedInvitations() {
        return ApiResponse.success(invitationService.getMyReceivedInvitations());
    }

    @Operation(summary = "Chi tiết lời mời")
    @GetMapping("/{id}")
    public ApiResponse<InvitationResponse> getInvitationDetail(@PathVariable UUID id) {
        return ApiResponse.success(invitationService.getInvitationDetail(id));
    }

    // ─── Phản hồi lời mời (helper) ───────────────────────────────────────────

    @Operation(
            summary = "Phản hồi lời mời",
            description = "Helper chấp nhận (ACCEPT), từ chối (REJECT) hoặc đề xuất thời gian khác (RESCHEDULE)"
    )
    @PutMapping("/{id}/respond")
    public ApiResponse<InvitationResponse> respondToInvitation(
            @PathVariable UUID id,
            @RequestBody @Valid RespondInvitationRequest request) {
        return ApiResponse.success(invitationService.respondToInvitation(id, request));
    }

    // ─── Hủy lời mời (sender) ────────────────────────────────────────────────

    @Operation(summary = "Hủy lời mời đã gửi", description = "Sender hủy lời mời khi còn ở trạng thái PENDING hoặc RESCHEDULED")
    @PutMapping("/{id}/cancel")
    public ApiResponse<InvitationResponse> cancelInvitation(@PathVariable UUID id) {
        return ApiResponse.success(invitationService.cancelInvitation(id));
    }
}
