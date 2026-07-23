package com.hourlink.helprequest.controller;


import com.hourlink.common.response.ApiResponse;
import com.hourlink.helprequest.service.HelpRequestService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Help Request Management")
@RestController
@RequestMapping("/help-request")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class HelpRequestController {

    HelpRequestService helpRequestService;

    @PostMapping
    public ApiResponse<com.hourlink.helprequest.dto.response.HelpRequestResponse> createHelpRequest(
            @RequestBody @jakarta.validation.Valid com.hourlink.helprequest.dto.request.HelpRequestRequest request) {
        return ApiResponse.success(helpRequestService.createHelpRequest(request));
    }

    @GetMapping("/my-requests")
    public ApiResponse<java.util.List<com.hourlink.helprequest.dto.response.HelpRequestResponse>> getMyHelpRequests() {
        return ApiResponse.success(helpRequestService.getMyHelpRequests());
    }
}
