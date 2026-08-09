package com.hourlink.common.service;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;

class CloudinaryServiceTest {

    private final CloudinaryService service = new CloudinaryService(
            mock(com.cloudinary.Cloudinary.class));

    @Test
    void rawPublicIdKeepsSafeOriginalExtension() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "C:\\fakepath\\Bai hoc.PDF", "application/pdf", new byte[]{1});

        assertTrue(service.rawPublicId(file)
                .matches("file_[0-9a-f-]{36}\\.pdf"));
    }

    @Test
    void rawPublicIdInfersExtensionFromMimeWhenNameHasNone() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "attachment", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                new byte[]{1});

        assertTrue(service.rawPublicId(file)
                .matches("file_[0-9a-f-]{36}\\.docx"));
    }

    @Test
    void rawPublicIdDoesNotTrustAConflictingFilenameExtension() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "fake.exe", "application/pdf", new byte[]{1});

        assertTrue(service.rawPublicId(file)
                .matches("file_[0-9a-f-]{36}\\.pdf"));
    }
}
