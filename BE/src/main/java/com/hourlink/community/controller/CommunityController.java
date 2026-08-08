package com.hourlink.community.controller;

import com.hourlink.common.response.ApiResponse;
import com.hourlink.community.dto.request.ConfirmParticipantsRequest;
import com.hourlink.community.dto.request.CreateActivityRequest;
import com.hourlink.community.dto.request.UpdateActivityRequest;
import com.hourlink.community.dto.request.MarkParticipantsAbsentRequest;
import com.hourlink.community.dto.response.ActivityResponse;
import com.hourlink.community.dto.response.FollowedOrganizationResponse;
import com.hourlink.community.dto.response.ParticipantResponse;
import com.hourlink.community.service.CommunityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

/**
 * CommunityController — REST API cho module Community (US-35 → US-38).
 *
 * Base path: /community
 *
 * Endpoints:
 *   POST   /community/activities              → Tạo hoạt động (US-35)
 *   PUT    /community/activities/{id}         → Sửa hoạt động (US-35)
 *   DELETE /community/activities/{id}         → Xóa hoạt động (US-35)
 *   PATCH  /community/activities/{id}/close   → Đóng đăng ký (US-35)
 *   GET    /community/activities              → Danh sách hoạt động OPEN (US-36)
 *   GET    /community/activities/all          → Toàn bộ (admin/organizer)
 *   GET    /community/activities/mine         → Hoạt động tôi tạo
 *   GET    /community/activities/{id}         → Chi tiết hoạt động
 *   POST   /community/activities/{id}/register   → Đăng ký (US-36)
 *   DELETE /community/activities/{id}/register   → Hủy đăng ký (US-36)
 *   GET    /community/activities/{id}/participants → Danh sách người tham gia (US-37)
 *   POST   /community/activities/{id}/participants/confirm → Xác nhận (US-37 + US-38)
 *   GET    /community/my-registrations        → Hoạt động tôi đã đăng ký
 */
@Tag(name = "Community Management", description = "Quản lý hoạt động cộng đồng (US-35 → US-38)")
@RestController
@RequestMapping("/community")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CommunityController {

    CommunityService communityService;

    // ─── US-35: CRUD ─────────────────────────────────────────────────────────

    @Operation(summary = "Tạo hoạt động cộng đồng (US-35)")
    @PostMapping("/activities")
    public ResponseEntity<ApiResponse<ActivityResponse>> create(
            @Valid @RequestBody CreateActivityRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Hoạt động đã được tạo thành công", communityService.createActivity(req)));
    }

    @Operation(summary = "Cập nhật hoạt động (US-35)")
    @PutMapping("/activities/{id}")
    public ResponseEntity<ApiResponse<ActivityResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateActivityRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", communityService.updateActivity(id, req)));
    }

    @Operation(summary = "Xóa hoạt động (US-35)")
    @DeleteMapping("/activities/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        communityService.deleteActivity(id);
        return ResponseEntity.ok(ApiResponse.noContent("Hoạt động đã được xóa"));
    }

    @Operation(summary = "Đóng đăng ký thủ công (US-35)")
    @PatchMapping("/activities/{id}/close")
    public ResponseEntity<ApiResponse<ActivityResponse>> closeRegistration(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Đã đóng đăng ký", communityService.closeRegistration(id)));
    }

    @Operation(summary = "Hủy hoạt động và thông báo người tham gia")
    @PatchMapping("/activities/{id}/cancel")
    public ResponseEntity<ApiResponse<ActivityResponse>> cancelActivity(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(
                "Đã hủy hoạt động", communityService.cancelActivity(id)));
    }

    // ─── Read ─────────────────────────────────────────────────────────────────

    @Operation(summary = "Danh sách hoạt động đang mở (US-36)")
    @GetMapping("/activities")
    public ResponseEntity<ApiResponse<Page<ActivityResponse>>> getOpen(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(communityService.getOpenActivities(page, size)));
    }

    @Operation(summary = "Toàn bộ hoạt động (admin / organizer)")
    @GetMapping("/activities/all")
    public ResponseEntity<ApiResponse<Page<ActivityResponse>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(communityService.getAllActivities(page, size)));
    }

    @Operation(summary = "Hoạt động tôi đã tạo")
    @GetMapping("/activities/mine")
    public ResponseEntity<ApiResponse<Page<ActivityResponse>>> getMine(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(communityService.getMyActivities(page, size)));
    }

    @Operation(summary = "Chi tiết hoạt động")
    @GetMapping("/activities/{id}")
    public ResponseEntity<ApiResponse<ActivityResponse>> getOne(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(communityService.getActivity(id)));
    }

    // ─── Theo dõi tổ chức ───────────────────────────────────────────────────

    @Operation(summary = "Theo dõi tổ chức có hoạt động Community")
    @PostMapping("/organizations/{organizationId}/follow")
    public ResponseEntity<ApiResponse<FollowedOrganizationResponse>> followOrganization(
            @PathVariable UUID organizationId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(
                "Đã theo dõi tổ chức", communityService.followOrganization(organizationId)));
    }

    @Operation(summary = "Bỏ theo dõi tổ chức")
    @DeleteMapping("/organizations/{organizationId}/follow")
    public ResponseEntity<ApiResponse<Void>> unfollowOrganization(
            @PathVariable UUID organizationId) {
        communityService.unfollowOrganization(organizationId);
        return ResponseEntity.ok(ApiResponse.noContent("Đã bỏ theo dõi tổ chức"));
    }

    @Operation(summary = "Danh sách tổ chức tôi đang theo dõi")
    @GetMapping("/organizations/following")
    public ResponseEntity<ApiResponse<List<FollowedOrganizationResponse>>> getFollowedOrganizations() {
        return ResponseEntity.ok(ApiResponse.success(communityService.getFollowedOrganizations()));
    }

    // ─── US-36: Đăng ký / hủy đăng ký ───────────────────────────────────────

    @Operation(summary = "Đăng ký tham gia hoạt động (US-36)")
    @PostMapping("/activities/{id}/register")
    public ResponseEntity<ApiResponse<ParticipantResponse>> register(@PathVariable UUID id) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Đăng ký thành công", communityService.register(id)));
    }

    @Operation(summary = "Hủy đăng ký tham gia (US-36)")
    @DeleteMapping("/activities/{id}/register")
    public ResponseEntity<ApiResponse<Void>> cancelRegistration(@PathVariable UUID id) {
        communityService.cancelRegistration(id);
        return ResponseEntity.ok(ApiResponse.noContent("Đã hủy đăng ký"));
    }

    @Operation(summary = "Lấy danh sách hoạt động đã đăng ký của tôi")
    @GetMapping("/my-registrations")
    public ResponseEntity<ApiResponse<Page<ParticipantResponse>>> getMyRegistrations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(communityService.getMyRegistrations(page, size)));
    }

    @Operation(summary = "Xem đăng ký của tôi trong một hoạt động")
    @GetMapping("/activities/{id}/my-participation")
    public ResponseEntity<ApiResponse<ParticipantResponse>> getMyParticipation(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(communityService.getMyParticipation(id)));
    }

    @Operation(summary = "Gửi hoặc cập nhật ảnh minh chứng tham gia hoạt động")
    @PostMapping(value = "/activities/{id}/evidence", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ParticipantResponse>> submitEvidence(
            @PathVariable UUID id,
            @RequestPart(name = "files", required = false) List<MultipartFile> files,
            @RequestParam(name = "note", required = false) String note) {
        return ResponseEntity.ok(ApiResponse.success(
                "Đã gửi minh chứng tham gia", communityService.submitEvidence(id, files, note)));
    }

    // ─── US-37 + US-38: Xác nhận người tham gia ──────────────────────────────

    @Operation(summary = "Lấy danh sách người tham gia hoạt động (US-37)")
    @GetMapping("/activities/{id}/participants")
    public ResponseEntity<ApiResponse<Page<ParticipantResponse>>> getParticipants(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(ApiResponse.success(communityService.getParticipants(id, page, size)));
    }

    @Operation(summary = "Xác nhận người tham gia + cộng Time Credit (US-37, US-38)")
    @PostMapping("/activities/{id}/participants/confirm")
    public ResponseEntity<ApiResponse<List<ParticipantResponse>>> confirmParticipants(
            @PathVariable UUID id,
            @Valid @RequestBody ConfirmParticipantsRequest req) {
        List<ParticipantResponse> confirmed = communityService.confirmParticipants(id, req);
        return ResponseEntity.ok(ApiResponse.success(
                String.format("Đã xác nhận %d người tham gia và cộng Time Credit thành công", confirmed.size()),
                confirmed));
    }

    @Operation(summary = "Đánh dấu người đăng ký vắng mặt")
    @PostMapping("/activities/{id}/participants/absent")
    public ResponseEntity<ApiResponse<List<ParticipantResponse>>> markParticipantsAbsent(
            @PathVariable UUID id,
            @Valid @RequestBody MarkParticipantsAbsentRequest request) {
        List<ParticipantResponse> absent = communityService.markParticipantsAbsent(id, request);
        return ResponseEntity.ok(ApiResponse.success(
                String.format("Đã đánh dấu %d người vắng mặt", absent.size()), absent));
    }
}
