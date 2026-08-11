package com.hourlink.admin.controller;

import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class AdminContentControllerSecurityTest {

    @Test
    void skillManagementRequiresAdminAuthority() {
        assertAdminOnly(AdminSkillController.class.getAnnotation(PreAuthorize.class));
    }

    @Test
    void helpRequestManagementRequiresAdminAuthority() {
        assertAdminOnly(AdminHelpRequestController.class.getAnnotation(PreAuthorize.class));
    }

    private void assertAdminOnly(PreAuthorize annotation) {
        assertNotNull(annotation);
        assertEquals("hasAuthority('ROLE_ADMIN')", annotation.value());
    }
}
