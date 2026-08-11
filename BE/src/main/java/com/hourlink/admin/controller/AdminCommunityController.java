package com.hourlink.admin.controller;

import com.hourlink.admin.dto.response.AdminCommunityActivityDetailResponse;
import com.hourlink.admin.dto.response.AdminCommunityActivityResponse;
import com.hourlink.admin.dto.response.AdminCommunityParticipantResponse;
import com.hourlink.admin.dto.response.AdminCommunityStatsResponse;
import com.hourlink.admin.service.AdminCommunityService;
import com.hourlink.community.enums.ActivityStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/admin/community")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminCommunityController {

    private final AdminCommunityService adminCommunityService;

    @GetMapping
    public ResponseEntity<Page<AdminCommunityActivityResponse>> getActivities(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) ActivityStatus status,
            @RequestParam(required = false) UUID organizerId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startTo,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(adminCommunityService.getActivities(
                search, status, organizerId, startFrom, startTo, pageable));
    }

    @GetMapping("/stats")
    public ResponseEntity<AdminCommunityStatsResponse> getStats() {
        return ResponseEntity.ok(adminCommunityService.getStats());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminCommunityActivityDetailResponse> getActivity(@PathVariable UUID id) {
        return ResponseEntity.ok(adminCommunityService.getActivity(id));
    }

    @GetMapping("/{id}/participants")
    public ResponseEntity<Page<AdminCommunityParticipantResponse>> getParticipants(
            @PathVariable UUID id,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(adminCommunityService.getParticipants(id, pageable));
    }

    @PostMapping("/{id}/close")
    public ResponseEntity<AdminCommunityActivityDetailResponse> closeRegistration(@PathVariable UUID id) {
        return ResponseEntity.ok(adminCommunityService.closeRegistration(id));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<AdminCommunityActivityDetailResponse> cancelActivity(@PathVariable UUID id) {
        return ResponseEntity.ok(adminCommunityService.cancelActivity(id));
    }
}
