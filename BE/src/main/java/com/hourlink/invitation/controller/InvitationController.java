package com.hourlink.invitation.controller;

import com.hourlink.common.response.ApiResponse;
import com.hourlink.invitation.service.InvitationService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

/**
 * InvitationController — TODO: implement endpoints cho module invitation.
 */
@Tag(name = "Invitation Management")
@RestController
@RequestMapping("/invitation")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class InvitationController {

    InvitationService invitationService;

    // TODO: thêm các endpoints
}
