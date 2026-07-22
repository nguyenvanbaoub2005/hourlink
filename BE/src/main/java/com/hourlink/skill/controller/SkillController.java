package com.hourlink.skill.controller;

import com.hourlink.common.response.ApiResponse;
import com.hourlink.skill.service.SkillService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

/**
 * SkillController — TODO: implement endpoints cho module skill.
 */
@Tag(name = "Skill Management")
@RestController
@RequestMapping("/skill")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SkillController {

    SkillService skillService;

    // TODO: thêm các endpoints
}
