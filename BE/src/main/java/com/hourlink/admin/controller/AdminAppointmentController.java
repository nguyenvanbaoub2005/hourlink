package com.hourlink.admin.controller;

import com.hourlink.admin.dto.response.AdminAppointmentConfirmationResponse;
import com.hourlink.admin.dto.response.AdminAppointmentDetailResponse;
import com.hourlink.admin.dto.response.AdminAppointmentResponse;
import com.hourlink.admin.dto.response.AdminAppointmentStatsResponse;
import com.hourlink.admin.service.AdminAppointmentService;
import com.hourlink.appointment.enums.AppointmentStatus;
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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/admin/appointments")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminAppointmentController {

    private final AdminAppointmentService adminAppointmentService;

    @GetMapping
    public ResponseEntity<Page<AdminAppointmentResponse>> getAppointments(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) AppointmentStatus status,
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(adminAppointmentService.getAppointments(
                search, status, userId, dateFrom, dateTo, pageable));
    }

    @GetMapping("/stats")
    public ResponseEntity<AdminAppointmentStatsResponse> getStats() {
        return ResponseEntity.ok(adminAppointmentService.getStats());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminAppointmentDetailResponse> getAppointment(@PathVariable UUID id) {
        return ResponseEntity.ok(adminAppointmentService.getAppointment(id));
    }

    @GetMapping("/{id}/confirmation-log")
    public ResponseEntity<List<AdminAppointmentConfirmationResponse>> getConfirmationLog(@PathVariable UUID id) {
        return ResponseEntity.ok(adminAppointmentService.getConfirmationLog(id));
    }
}
