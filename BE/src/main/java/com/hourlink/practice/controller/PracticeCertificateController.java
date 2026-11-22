package com.hourlink.practice.controller;

import com.hourlink.common.response.ApiResponse;
import com.hourlink.practice.dto.request.AssignPracticeRequest;
import com.hourlink.practice.dto.request.GradePracticeRequest;
import com.hourlink.practice.dto.request.SubmitPracticeRequest;
import com.hourlink.practice.dto.response.AiPracticeTemplateResponse;
import com.hourlink.practice.dto.response.PracticeAssessmentResponse;
import com.hourlink.practice.service.PracticeCertificateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Soft-Skill Practice & Certificates", description = "Giao bài thực hành kỹ năng mềm, chấm điểm 3 tiêu chí & Cấp chứng nhận kỹ năng số")
@RestController
@RequestMapping("/practice")
@RequiredArgsConstructor
public class PracticeCertificateController {

    private final PracticeCertificateService practiceService;

    @Operation(summary = "Lấy bài thực hành & chứng nhận của lịch hẹn")
    @GetMapping("/appointment/{appointmentId}")
    public ApiResponse<PracticeAssessmentResponse> getByAppointment(@PathVariable UUID appointmentId) {
        return ApiResponse.success(practiceService.getByAppointment(appointmentId));
    }

    @Operation(summary = "Người hướng dẫn giao bài thực hành kỹ năng mềm")
    @PostMapping("/appointment/{appointmentId}/assign")
    public ApiResponse<PracticeAssessmentResponse> assignPractice(
            @PathVariable UUID appointmentId,
            @Valid @RequestBody AssignPracticeRequest request) {
        return ApiResponse.success("Đã giao bài thực hành kỹ năng", practiceService.assignPractice(appointmentId, request));
    }

    @Operation(summary = "Người học nộp bài thực hành kỹ năng mềm")
    @PostMapping("/appointment/{appointmentId}/submit")
    public ApiResponse<PracticeAssessmentResponse> submitPractice(
            @PathVariable UUID appointmentId,
            @Valid @RequestBody SubmitPracticeRequest request) {
        return ApiResponse.success("Đã nộp bài thực hành thành công", practiceService.submitPractice(appointmentId, request));
    }

    @Operation(summary = "Người hướng dẫn chấm điểm 3 tiêu chí & tự động cấp Chứng nhận kỹ năng số")
    @PostMapping("/appointment/{appointmentId}/grade")
    public ApiResponse<PracticeAssessmentResponse> gradePractice(
            @PathVariable UUID appointmentId,
            @Valid @RequestBody GradePracticeRequest request) {
        return ApiResponse.success("Đã chấm điểm bài thực hành", practiceService.gradePractice(appointmentId, request));
    }

    @Operation(summary = "AI gợi ý đề bài & tiêu chí thực hành kỹ năng mềm")
    @GetMapping("/ai-template")
    public ApiResponse<AiPracticeTemplateResponse> getAiTemplate(
            @RequestParam(defaultValue = "Kỹ năng giao tiếp & thuyết trình") String skillTitle) {
        return ApiResponse.success(practiceService.generateSoftSkillTemplate(skillTitle));
    }

    @Operation(summary = "Lấy danh sách Chứng nhận kỹ năng số đã đạt của tôi")
    @GetMapping("/certificates/my")
    public ApiResponse<List<PracticeAssessmentResponse>> getMyEarnedCertificates() {
        return ApiResponse.success(practiceService.getMyEarnedCertificates());
    }

    @Operation(summary = "Lấy danh sách Chứng nhận kỹ năng tôi đã hướng dẫn & cấp cho học viên")
    @GetMapping("/certificates/issued")
    public ApiResponse<List<PracticeAssessmentResponse>> getMyIssuedCertificates() {
        return ApiResponse.success(practiceService.getMyIssuedCertificates());
    }

    @Operation(summary = "Xác thực mã Chứng nhận kỹ năng số (HL-CERT-...)")
    @GetMapping("/certificates/verify/{code}")
    public ApiResponse<PracticeAssessmentResponse> verifyCertificate(@PathVariable String code) {
        return ApiResponse.success(practiceService.verifyCertificateCode(code));
    }
}
