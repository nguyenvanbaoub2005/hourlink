package com.hourlink.admin.controller;

import com.hourlink.chat.controller.ChatController;
import com.hourlink.report.controller.ReportController;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class AdminReportControllerSecurityTest {

    @Test
    void newAdminReportControllerRequiresAdminRole() {
        PreAuthorize annotation = AdminReportController.class.getAnnotation(PreAuthorize.class);
        assertNotNull(annotation);
        assertEquals("hasAuthority('ROLE_ADMIN')", annotation.value());
    }

    @Test
    void legacyGeneralReportAdminEndpointsAlsoRequireAdminRole() throws Exception {
        List.of(
                ReportController.class.getMethod("getAllReports"),
                ReportController.class.getMethod("updateStatus", UUID.class,
                        com.hourlink.report.dto.UpdateReportStatusRequest.class)
        ).forEach(method -> assertNotNull(method.getAnnotation(PreAuthorize.class)));
    }

    @Test
    void legacyChatReportAdminEndpointsAlsoRequireAdminRole() throws Exception {
        List.of(
                ChatController.class.getMethod("getAllMessageReports"),
                ChatController.class.getMethod("updateMessageReportStatus", UUID.class,
                        com.hourlink.chat.dto.request.UpdateChatReportStatusRequest.class)
        ).forEach(method -> assertNotNull(method.getAnnotation(PreAuthorize.class)));
    }
}
