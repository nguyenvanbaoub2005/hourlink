package com.hourlink.notification.controller;

import com.hourlink.common.response.ApiResponse;
import com.hourlink.notification.dto.response.NotificationResponse;
import com.hourlink.notification.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * NotificationController — REST endpoints cho hệ thống thông báo HourLink.
 * Base URL: /notifications
 */
@Tag(name = "Notification Management", description = "Quản lý thông báo trong app")
@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class NotificationController {

    NotificationService notificationService;

    @Operation(summary = "Danh sách thông báo của tôi")
    @GetMapping
    public ApiResponse<List<NotificationResponse>> getMyNotifications() {
        return ApiResponse.success(notificationService.getMyNotifications());
    }

    @Operation(summary = "Số thông báo chưa đọc")
    @GetMapping("/unread-count")
    public ApiResponse<Map<String, Long>> getUnreadCount() {
        return ApiResponse.success(Map.of("count", notificationService.getUnreadCount()));
    }

    @Operation(summary = "Đánh dấu một thông báo đã đọc")
    @PutMapping("/{id}/read")
    public ApiResponse<NotificationResponse> markRead(@PathVariable UUID id) {
        return ApiResponse.success(notificationService.markRead(id));
    }

    @Operation(summary = "Đánh dấu tất cả thông báo đã đọc")
    @PutMapping("/read-all")
    public ApiResponse<Void> markAllRead() {
        notificationService.markAllRead();
        return ApiResponse.success(null);
    }
}
