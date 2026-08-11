package com.hourlink.skill.service;

import com.hourlink.appointment.repository.AppointmentRepository;
import com.hourlink.common.exception.AppException;
import com.hourlink.common.service.CloudinaryService;
import com.hourlink.skill.entity.Skill;
import com.hourlink.skill.entity.SkillAttachment;
import com.hourlink.skill.entity.SkillCategory;
import com.hourlink.skill.enums.SkillStatus;
import com.hourlink.skill.repository.SkillAttachmentRepository;
import com.hourlink.skill.repository.SkillRepository;
import com.hourlink.user.entity.User;
import com.hourlink.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SkillAttachmentServiceTest {

    @Mock SkillAttachmentRepository attachmentRepository;
    @Mock SkillRepository skillRepository;
    @Mock CloudinaryService cloudinaryService;
    @Mock AppointmentRepository appointmentRepository;
    @Mock UserRepository userRepository;

    SkillAttachmentService service;

    @BeforeEach
    void setUp() {
        service = new SkillAttachmentService(
                attachmentRepository,
                skillRepository,
                cloudinaryService,
                appointmentRepository,
                userRepository);
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getAttachments_allowsPublicViewerForVisibleSkillWithoutCloudinaryPublicId() {
        authenticate("viewer@hourlink.vn");
        User owner = user("owner@hourlink.vn");
        User viewer = user("viewer@hourlink.vn");
        Skill skill = skill(owner, SkillStatus.VISIBLE, false);
        SkillAttachment attachment = attachment(skill);

        when(skillRepository.findById(skill.getId())).thenReturn(Optional.of(skill));
        when(userRepository.findByEmail(viewer.getEmail())).thenReturn(Optional.of(viewer));
        when(attachmentRepository.findAllBySkill_IdAndIsDeletedFalse(skill.getId()))
                .thenReturn(List.of(attachment));

        var result = service.getAttachments(skill.getId());

        assertEquals(1, result.size());
        assertEquals(attachment.getFileUrl(), result.get(0).getFileUrl());
        assertNull(result.get(0).getPublicId());
    }

    @Test
    void getAttachments_rejectsPublicViewerForHiddenSkill() {
        authenticate("viewer@hourlink.vn");
        User owner = user("owner@hourlink.vn");
        User viewer = user("viewer@hourlink.vn");
        Skill skill = skill(owner, SkillStatus.HIDDEN, false);

        when(skillRepository.findById(skill.getId())).thenReturn(Optional.of(skill));
        when(userRepository.findByEmail(viewer.getEmail())).thenReturn(Optional.of(viewer));

        assertThrows(AppException.class, () -> service.getAttachments(skill.getId()));
        verify(attachmentRepository, never())
                .findAllBySkill_IdAndIsDeletedFalse(skill.getId());
    }

    @Test
    void getAttachments_allowsOwnerToManageHiddenSkill() {
        authenticate("owner@hourlink.vn");
        User owner = user("owner@hourlink.vn");
        Skill skill = skill(owner, SkillStatus.HIDDEN, false);
        SkillAttachment attachment = attachment(skill);

        when(skillRepository.findById(skill.getId())).thenReturn(Optional.of(skill));
        when(userRepository.findByEmail(owner.getEmail())).thenReturn(Optional.of(owner));
        when(attachmentRepository.findAllBySkill_IdAndIsDeletedFalse(skill.getId()))
                .thenReturn(List.of(attachment));

        var result = service.getAttachments(skill.getId());

        assertEquals("cloudinary-public-id", result.get(0).getPublicId());
    }

    private User user(String email) {
        User user = User.builder()
                .email(email)
                .fullName(email)
                .passwordHash("hash")
                .build();
        user.setId(UUID.randomUUID());
        return user;
    }

    private Skill skill(User owner, SkillStatus status, boolean deletedCategory) {
        SkillCategory category = SkillCategory.builder()
                .name("Lập trình")
                .isDeleted(deletedCategory)
                .build();
        category.setId(UUID.randomUUID());
        Skill skill = Skill.builder()
                .name("Spring Boot")
                .user(owner)
                .category(category)
                .status(status)
                .build();
        skill.setId(UUID.randomUUID());
        return skill;
    }

    private SkillAttachment attachment(Skill skill) {
        SkillAttachment attachment = SkillAttachment.builder()
                .skill(skill)
                .fileUrl("https://example.com/certificate.pdf")
                .publicId("cloudinary-public-id")
                .originalName("certificate.pdf")
                .fileType("DOCUMENT")
                .fileSize(1024L)
                .build();
        attachment.setId(UUID.randomUUID());
        return attachment;
    }

    private void authenticate(String email) {
        SecurityContextHolder.getContext().setAuthentication(
                UsernamePasswordAuthenticationToken.authenticated(email, null, List.of()));
    }
}
