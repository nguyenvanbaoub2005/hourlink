package com.hourlink.rating.controller;

import com.hourlink.common.response.ApiResponse;
import com.hourlink.rating.service.RatingService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

/**
 * RatingController — TODO: implement endpoints cho module rating.
 */
@Tag(name = "Rating Management")
@RestController
@RequestMapping("/rating")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class RatingController {

    RatingService ratingService;

    // TODO: thêm các endpoints
}
