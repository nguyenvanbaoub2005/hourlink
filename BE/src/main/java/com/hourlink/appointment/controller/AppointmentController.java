package com.hourlink.appointment.controller;

import com.hourlink.appointment.dto.request.*;
import com.hourlink.appointment.dto.response.*;
import com.hourlink.appointment.service.AppointmentService;
import com.hourlink.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * AppointmentController — API endpoints cho module appointment.
 */
@Tag(name = "Appointment Management", description = "Quản lý lịch hẹn hỗ trợ kỹ năng và xác thực QR/OTP")
@RestController
@RequestMapping({"/appointment", "/appointments"})
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AppointmentController {

    AppointmentService appointmentService;

    @Operation(summary = "Tạo lịch hẹn mới", description = "Tạo lịch hẹn từ lời mời đã được chấp nhận hoặc tạo trực tiếp")
    @PostMapping
    public ApiResponse<AppointmentResponse> createAppointment(@RequestBody @Valid CreateAppointmentRequest request) {
        return ApiResponse.created("Tạo lịch hẹn thành công", appointmentService.createAppointment(request));
    }

    @Operation(summary = "Xem danh sách lịch hẹn cá nhân", description = "Lấy danh sách lịch hẹn của người dùng hiện tại (filter theo tab)")
    @GetMapping({"", "/my", "/my-appointments"})
    public ApiResponse<Page<AppointmentResponse>> getMyAppointments(
            @RequestParam(defaultValue = "ALL") String tab,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success("Lấy danh sách lịch hẹn thành công", appointmentService.getMyAppointments(tab, page, size));
    }

    @Operation(summary = "Xem chi tiết lịch hẹn", description = "Lấy thông tin chi tiết của một lịch hẹn theo ID")
    @GetMapping("/{id}")
    public ApiResponse<AppointmentResponse> getAppointmentDetail(@PathVariable UUID id) {
        return ApiResponse.success("Lấy chi tiết lịch hẹn thành công", appointmentService.getAppointmentDetail(id));
    }

    @Operation(summary = "Phản hồi lịch hẹn", description = "Xác nhận (CONFIRM), Hủy (CANCEL) hoặc Đề xuất đổi lịch (RESCHEDULE)")
    @PutMapping("/{id}/respond")
    public ApiResponse<AppointmentResponse> respondAppointment(
            @PathVariable UUID id,
            @RequestBody @Valid RespondAppointmentRequest request) {
        return ApiResponse.success("Phản hồi lịch hẹn thành công", appointmentService.respondAppointment(id, request));
    }

    @Operation(summary = "Tạo mã xác minh (QR/OTP)", description = "Sinh mã QR (OFFLINE) hoặc mã OTP 6 số (ONLINE) khi bắt đầu buổi hỗ trợ")
    @PostMapping({"/{id}/generate-verification", "/{id}/qr", "/{id}/otp"})
    public ApiResponse<AppointmentVerificationResponse> generateVerificationCode(@PathVariable UUID id) {
        return ApiResponse.success("Tạo mã xác thực thành công", appointmentService.generateVerificationCode(id));
    }

    @Operation(summary = "Xác thực mã (QR/OTP)", description = "Quét mã QR hoặc nhập mã OTP 6 số để chuyển trạng thái Đang diễn ra")
    @PostMapping({"/{id}/verify-code", "/{id}/verify-otp", "/{id}/verify-qr"})
    public ApiResponse<AppointmentResponse> verifyCode(
            @PathVariable UUID id,
            @RequestBody @Valid VerifyCodeRequest request) {
        return ApiResponse.success("Xác thực mã thành công", appointmentService.verifyCode(id, request));
    }

    @Operation(summary = "Xác nhận hoàn thành buổi hỗ trợ", description = "Ghi nhận hoàn thành và thời lượng thực tế từ người dùng")
    @PostMapping({"/{id}/confirm-completion", "/{id}/confirm-complete"})
    public ApiResponse<AppointmentResponse> confirmCompletion(
            @PathVariable UUID id,
            @RequestBody @Valid ConfirmCompletionRequest request) {
        return ApiResponse.success("Xác nhận hoàn thành thành công", appointmentService.confirmCompletion(id, request));
    }
}
