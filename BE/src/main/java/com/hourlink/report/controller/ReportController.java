package com.hourlink.report.controller;

import com.hourlink.common.response.ApiResponse;
import com.hourlink.report.service.ReportService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

/**
 * ReportController — TODO: implement endpoints cho module report.
 */
@Tag(name = "Report Management")
@RestController
@RequestMapping("/report")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ReportController {

    ReportService reportService;

    // TODO: thêm các endpoints
}
