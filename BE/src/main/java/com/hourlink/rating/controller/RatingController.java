package com.hourlink.rating.controller;

import com.hourlink.common.response.ApiResponse;
import com.hourlink.rating.dto.request.RatingRequest;
import com.hourlink.rating.dto.response.BadgeResponse;
import com.hourlink.rating.dto.response.RatingResponse;
import com.hourlink.rating.service.RatingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * RatingController — Endpoints cho module Rating và Badge.
 * Base path: /ratings
 */
@Tag(name = "Rating & Badge", description = "Đánh giá sau buổi hỗ trợ và huy hiệu người dùng")
@RestController
@RequestMapping("/ratings")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class RatingController {

    RatingService ratingService;

    // ─── Rating ───────────────────────────────────────────────────────────────

    @Operation(summary = "Gửi đánh giá sau buổi hẹn",
               description = "Hai bên (provider và receiver) đều có thể đánh giá nhau sau khi Appointment COMPLETED")
    @PostMapping
    public ResponseEntity<ApiResponse<RatingResponse>> submitRating(
            @Valid @RequestBody RatingRequest request) {

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        RatingResponse response = ratingService.submitRating(email, request);
        return ResponseEntity.status(201)
                .body(ApiResponse.created("Đánh giá đã được ghi nhận", response));
    }

    @Operation(summary = "Kiểm tra và lấy đánh giá của mình cho một lịch hẹn")
    @GetMapping("/appointment/{appointmentId}")
    public ResponseEntity<ApiResponse<RatingResponse>> getRatingForAppointment(
            @PathVariable String appointmentId) {

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        RatingResponse response = ratingService.getRatingForAppointment(email, UUID.fromString(appointmentId));
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "Lấy danh sách đánh giá người dùng nhận được")
    @GetMapping("/received/{userId}")
    public ResponseEntity<ApiResponse<Page<RatingResponse>>> getRatingsReceived(
            @PathVariable String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Page<RatingResponse> data = ratingService.getRatingsReceived(UUID.fromString(userId), page, size);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @Operation(summary = "Lấy danh sách đánh giá người dùng đã gửi")
    @GetMapping("/given/{userId}")
    public ResponseEntity<ApiResponse<Page<RatingResponse>>> getRatingsGiven(
            @PathVariable String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Page<RatingResponse> data = ratingService.getRatingsGiven(UUID.fromString(userId), page, size);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    // ─── Badge ────────────────────────────────────────────────────────────────

    @Operation(summary = "Lấy danh sách huy hiệu của người dùng")
    @GetMapping("/badges/{userId}")
    public ResponseEntity<ApiResponse<List<BadgeResponse>>> getUserBadges(
            @PathVariable String userId) {

        List<BadgeResponse> badges = ratingService.getUserBadges(UUID.fromString(userId));
        return ResponseEntity.ok(ApiResponse.success(badges));
    }
}
