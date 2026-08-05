package com.hourlink.rating.controller;

import com.hourlink.common.response.ApiResponse;
import com.hourlink.rating.dto.request.RatingRequest;
import com.hourlink.rating.dto.response.RatingResponse;
import com.hourlink.rating.dto.response.RatingSummaryResponse;
import com.hourlink.rating.service.RatingService;
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
 * RatingController — API cho module Rating (Task 32).
 * Base URL: /api/rating
 */
@Tag(name = "Rating Management")
@RestController
@RequestMapping("/rating")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class RatingController {

    RatingService ratingService;

    /** POST /api/rating — Gửi đánh giá sau khi hoàn thành lịch hẹn */
    @Operation(summary = "Gửi đánh giá (1-5 sao) sau buổi hỗ trợ")
    @PostMapping
    public ApiResponse<RatingResponse> createRating(@RequestBody @Valid RatingRequest request) {
        return ApiResponse.success("Đánh giá thành công", ratingService.createRating(request));
    }

    /** GET /api/rating/me — Xem danh sách đánh giá mà tôi nhận được */
    @Operation(summary = "Xem đánh giá mà tôi nhận được")
    @GetMapping("/me")
    public ApiResponse<List<RatingResponse>> getMyRatings() {
        return ApiResponse.success("Lấy danh sách đánh giá thành công", ratingService.getMyRatings());
    }

    /** GET /api/rating/user/{userId} — Xem đánh giá của một người dùng cụ thể */
    @Operation(summary = "Xem đánh giá của một người dùng")
    @GetMapping("/user/{userId}")
    public ApiResponse<List<RatingResponse>> getRatingsByUser(@PathVariable UUID userId) {
        return ApiResponse.success("Lấy danh sách đánh giá thành công", ratingService.getRatingsByUser(userId));
    }

    /** GET /api/rating/user/{userId}/summary — Thống kê tổng hợp của một user */
    @Operation(summary = "Thống kê tổng hợp đánh giá + uy tín của một người")
    @GetMapping("/user/{userId}/summary")
    public ApiResponse<RatingSummaryResponse> getUserSummary(@PathVariable UUID userId) {
        return ApiResponse.success("Lấy thống kê thành công", ratingService.getSummaryByUser(userId));
    }

    /** GET /api/rating/me/summary — Thống kê của chính mình */
    @Operation(summary = "Thống kê đánh giá + uy tín của chính mình")
    @GetMapping("/me/summary")
    public ApiResponse<RatingSummaryResponse> getMySummary() {
        return ApiResponse.success("Lấy thống kê thành công", ratingService.getMySummary());
    }

    /** GET /api/rating/has-rated?appointmentId=...&toUserId=... — Kiểm tra đã đánh giá chưa */
    @Operation(summary = "Kiểm tra bạn đã đánh giá người này trong buổi hỗ trợ chưa")
    @GetMapping("/has-rated")
    public ApiResponse<Boolean> hasRated(
            @RequestParam UUID appointmentId,
            @RequestParam UUID toUserId) {
        return ApiResponse.success("OK", ratingService.hasRated(appointmentId, toUserId));
    }
}
