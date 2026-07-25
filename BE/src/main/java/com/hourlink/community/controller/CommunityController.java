package com.hourlink.community.controller;


import com.hourlink.community.service.CommunityService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

/**
 * CommunityController — TODO: implement endpoints cho module community.
 */
@Tag(name = "Community Management")
@RestController
@RequestMapping("/community")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CommunityController {

    CommunityService communityService;

    // TODO: thêm các endpoints
}
