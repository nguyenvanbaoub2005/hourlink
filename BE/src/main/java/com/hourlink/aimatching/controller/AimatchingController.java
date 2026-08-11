package com.hourlink.aimatching.controller;

import com.hourlink.aimatching.dto.request.PredictCategoryRequest;
import com.hourlink.aimatching.dto.response.AiRecommendationResponse;
import com.hourlink.aimatching.dto.response.PredictCategoryResponse;
import com.hourlink.aimatching.service.AimatchingService;
import com.hourlink.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Aimatching Management")
@RestController
@RequestMapping("/ai-matching")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AimatchingController {

    AimatchingService aimatchingService;

    @PostMapping("/predict-category")
    public ResponseEntity<ApiResponse<PredictCategoryResponse>> predictCategory(@RequestBody PredictCategoryRequest request) {
        PredictCategoryResponse response = aimatchingService.predictCategory(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/recommend/{helpRequestId}")
    public ResponseEntity<ApiResponse<List<AiRecommendationResponse>>> recommendHelpers(@PathVariable UUID helpRequestId) {
        List<AiRecommendationResponse> response = aimatchingService.recommendHelpers(helpRequestId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
