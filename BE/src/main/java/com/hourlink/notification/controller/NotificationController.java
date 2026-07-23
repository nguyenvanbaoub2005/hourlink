package com.hourlink.notification.controller;


import com.hourlink.notification.service.NotificationService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

/**
 * NotificationController — TODO: implement endpoints cho module notification.
 */
@Tag(name = "Notification Management")
@RestController
@RequestMapping("/notification")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class NotificationController {

    NotificationService notificationService;

    // TODO: thêm các endpoints
}
