package com.hourlink.admin.controller;


import com.hourlink.admin.service.AdminService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

/**
 * AdminController — TODO: implement endpoints cho module admin.
 */
@Tag(name = "Admin Management")
@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AdminController {

    AdminService adminService;

    // TODO: thêm các endpoints
}
