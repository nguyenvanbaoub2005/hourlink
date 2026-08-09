package com.hourlink.admin.controller;

import com.hourlink.admin.dto.request.AdminCreateHelpRequestRequest;
import com.hourlink.admin.dto.request.AdminHelpRequestActionRequest;
import com.hourlink.admin.dto.request.AdminUpdateHelpRequestRequest;
import com.hourlink.admin.dto.response.AdminHelpRequestDetailResponse;
import com.hourlink.admin.dto.response.AdminHelpRequestResponse;
import com.hourlink.admin.service.AdminHelpRequestService;
import com.hourlink.helprequest.enums.RequestStatus;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/admin/help-requests")
@RequiredArgsConstructor
public class AdminHelpRequestController {

    private final AdminHelpRequestService adminHelpRequestService;

    @GetMapping
    public ResponseEntity<Page<AdminHelpRequestResponse>> getHelpRequests(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String requesterName,
            @RequestParam(required = false) String requesterEmail,
            @RequestParam(required = false) RequestStatus status,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) String region,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(
                adminHelpRequestService.getHelpRequests(title, requesterName, requesterEmail, status, categoryId, region, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminHelpRequestDetailResponse> getHelpRequestDetail(@PathVariable UUID id) {
        return ResponseEntity.ok(adminHelpRequestService.getHelpRequestDetail(id));
    }

    @PostMapping("/{id}/actions")
    public ResponseEntity<Void> performAction(
            @PathVariable UUID id,
            @Valid @RequestBody AdminHelpRequestActionRequest request,
            Authentication authentication) {
        adminHelpRequestService.performAction(id, request, authentication.getName());
        return ResponseEntity.ok().build();
    }

    @PostMapping
    public ResponseEntity<Void> createHelpRequest(@Valid @RequestBody AdminCreateHelpRequestRequest request) {
        adminHelpRequestService.createHelpRequest(request);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> updateHelpRequest(
            @PathVariable UUID id,
            @Valid @RequestBody AdminUpdateHelpRequestRequest request) {
        adminHelpRequestService.updateHelpRequest(id, request);
        return ResponseEntity.ok().build();
    }
}
