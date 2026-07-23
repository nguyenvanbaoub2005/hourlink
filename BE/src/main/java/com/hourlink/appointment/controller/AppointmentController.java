package com.hourlink.appointment.controller;


import com.hourlink.appointment.service.AppointmentService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

/**
 * AppointmentController — TODO: implement endpoints cho module appointment.
 */
@Tag(name = "Appointment Management")
@RestController
@RequestMapping("/appointment")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AppointmentController {

    AppointmentService appointmentService;

    // TODO: thêm các endpoints
}
