package com.hourlink.admin.controller;

import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class AdminWalletControllerSecurityTest {

    @Test
    void adminWalletControllerRequiresAdminAuthority() {
        PreAuthorize annotation = AdminWalletController.class.getAnnotation(PreAuthorize.class);
        assertNotNull(annotation);
        assertEquals("hasAuthority('ROLE_ADMIN')", annotation.value());
    }
}
