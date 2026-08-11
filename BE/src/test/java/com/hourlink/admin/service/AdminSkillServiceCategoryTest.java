package com.hourlink.admin.service;

import com.hourlink.admin.dto.request.AdminCategoryCreateRequest;
import com.hourlink.admin.dto.request.AdminCategoryRequest;
import com.hourlink.admin.repository.UserAdminActionRepository;
import com.hourlink.appointment.repository.AppointmentRepository;
import com.hourlink.common.exception.BadRequestException;
import com.hourlink.common.service.EmailService;
import com.hourlink.helprequest.repository.HelpRequestRepository;
import com.hourlink.skill.entity.SkillCategory;
import com.hourlink.skill.repository.SkillAttachmentRepository;
import com.hourlink.skill.repository.SkillCategoryRepository;
import com.hourlink.skill.repository.SkillRepository;
import com.hourlink.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminSkillServiceCategoryTest {

    @Mock SkillRepository skillRepository;
    @Mock SkillAttachmentRepository attachmentRepository;
    @Mock SkillCategoryRepository categoryRepository;
    @Mock AppointmentRepository appointmentRepository;
    @Mock UserAdminActionRepository userAdminActionRepository;
    @Mock UserRepository userRepository;
    @Mock EmailService emailService;
    @Mock HelpRequestRepository helpRequestRepository;
    @InjectMocks AdminSkillService service;

    @Test
    void createCategory_restoresSoftDeletedRowInsteadOfCreatingDuplicate() {
        UUID existingId = UUID.randomUUID();
        SkillCategory deleted = SkillCategory.builder()
                .name("Ẩm thực")
                .description("Mô tả cũ")
                .isDeleted(true)
                .build();
        deleted.setId(existingId);
        AdminCategoryCreateRequest request = new AdminCategoryCreateRequest();
        request.setName("  Ẩm   thực  ");
        request.setDescription("  Nấu ăn và làm bánh  ");

        when(categoryRepository.findAllByNameIgnoreCaseAndIsDeletedFalse("Ẩm thực"))
                .thenReturn(List.of());
        when(categoryRepository.findAllByNameIgnoreCase("Ẩm thực"))
                .thenReturn(List.of(deleted));
        when(categoryRepository.save(any(SkillCategory.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        var result = service.createCategory(request);

        assertEquals(existingId, result.getId());
        assertEquals("Ẩm thực", result.getName());
        assertEquals("Nấu ăn và làm bánh", result.getDescription());
        assertFalse(deleted.isDeleted());
        verify(categoryRepository).save(deleted);
    }

    @Test
    void updateCategory_rejectsSoftDeletedCategory() {
        UUID categoryId = UUID.randomUUID();
        AdminCategoryRequest request = new AdminCategoryRequest("Ẩm thực", "Mô tả");
        when(categoryRepository.findByIdAndIsDeletedFalse(categoryId))
                .thenReturn(Optional.empty());

        assertThrows(BadRequestException.class,
                () -> service.updateCategory(categoryId, request));
    }
}
