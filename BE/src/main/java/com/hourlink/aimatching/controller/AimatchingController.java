package com.hourlink.aimatching.controller;

import com.hourlink.common.response.ApiResponse;
import com.hourlink.aimatching.service.AimatchingService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

/**
 * AimatchingController — TODO: implement endpoints cho module aimatching.
 */
@Tag(name = "Aimatching Management")
@RestController
@RequestMapping("/ai-matching")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AimatchingController {

    AimatchingService aimatchingService;

    // TODO: thêm các endpoints
}
