package com.hourlink.helprequest.controller;

import com.hourlink.common.response.ApiResponse;
import com.hourlink.helprequest.service.HelprequestService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

/**
 * HelprequestController — TODO: implement endpoints cho module helprequest.
 */
@Tag(name = "Helprequest Management")
@RestController
@RequestMapping("/help-requests")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class HelprequestController {

    HelprequestService helprequestService;

    // TODO: thêm các endpoints
}
