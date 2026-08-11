package com.hourlink.skill.service;

import com.hourlink.skill.entity.Skill;
import com.hourlink.skill.entity.SkillCategory;
import com.hourlink.skill.enums.SkillStatus;
import com.hourlink.skill.repository.SkillAttachmentRepository;
import com.hourlink.skill.repository.SkillCategoryRepository;
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
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SkillServiceTest {

    @Mock SkillRepository skillRepository;
    @Mock SkillCategoryRepository categoryRepository;
    @Mock UserRepository userRepository;
    @Mock SkillAttachmentRepository attachmentRepository;

    SkillService service;

    @BeforeEach
    void setUp() {
        service = new SkillService(
                skillRepository, categoryRepository, userRepository, attachmentRepository);
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getCategories_usesDistinctSupporterStatsAndExcludesCurrentUserFromContract() {
        User currentUser = user("current@hourlink.vn");
        authenticate(currentUser.getEmail());
        when(userRepository.findByEmail(currentUser.getEmail())).thenReturn(Optional.of(currentUser));

        SkillCategory art = category("Nghệ thuật");
        SkillCategory programming = category("Lập trình");
        SkillRepository.CategoryStatsProjection artStats = stats(art.getId(), 3, 1);
        when(skillRepository.summarizeVisibleCategories(currentUser.getId()))
                .thenReturn(List.of(artStats));
        when(categoryRepository.findAllByIsDeletedFalse())
                .thenReturn(List.of(art, programming));

        var result = service.getCategories();

        assertEquals(List.of("Lập trình", "Nghệ thuật"),
                result.stream().map(item -> item.getName()).toList());
        assertEquals(0, result.get(0).getSkillCount());
        assertEquals(0, result.get(0).getSupporterCount());
        assertEquals(3, result.get(1).getSkillCount());
        assertEquals(1, result.get(1).getSupporterCount());
    }

    @Test
    void getCategories_includesAdminCreatedCategoryWithStatsBeforeOtherCategory() {
        SkillCategory other = category("Khác");
        SkillCategory custom = category("Ẩm thực");
        SkillCategory art = category("Nghệ thuật");
        SkillCategory programming = category("Lập trình");
        when(skillRepository.summarizeVisibleCategories(null))
                .thenReturn(List.of(stats(custom.getId(), 4, 2)));
        when(categoryRepository.findAllByIsDeletedFalse())
                .thenReturn(List.of(other, custom, art, programming));

        var result = service.getCategories();

        assertEquals(List.of("Lập trình", "Nghệ thuật", "Ẩm thực", "Khác"),
                result.stream().map(item -> item.getName()).toList());
        assertEquals(4, result.get(2).getSkillCount());
        assertEquals(2, result.get(2).getSupporterCount());
    }

    @Test
    void searchSkills_returnsOnlyVisibleSkillsFromActiveUsersAndCategories() {
        SkillCategory activeCategory = category("Nghệ thuật");
        SkillCategory deletedCategory = category("Danh mục đã xóa");
        deletedCategory.setDeleted(true);

        User activeUser = user("active@hourlink.vn");
        User lockedUser = user("locked@hourlink.vn");
        lockedUser.setLocked(true);
        User deletedUser = user("deleted@hourlink.vn");
        deletedUser.setDeleted(true);

        Skill expected = skill("Guitar", activeUser, activeCategory);
        when(skillRepository.findAllByStatus(SkillStatus.VISIBLE)).thenReturn(List.of(
                expected,
                skill("Piano", lockedUser, activeCategory),
                skill("Thanh nhạc", deletedUser, activeCategory),
                skill("Hội họa", activeUser, deletedCategory)));

        var result = service.searchSkills(null, null, null, null);

        assertEquals(1, result.size());
        assertEquals(expected.getId(), result.get(0).getId());
    }

    private void authenticate(String email) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(email, null, List.of()));
    }

    private User user(String email) {
        User user = User.builder()
                .email(email)
                .fullName("Người dùng")
                .passwordHash("hash")
                .build();
        user.setId(UUID.randomUUID());
        return user;
    }

    private SkillCategory category(String name) {
        SkillCategory category = SkillCategory.builder().name(name).build();
        category.setId(UUID.randomUUID());
        return category;
    }

    private Skill skill(String name, User owner, SkillCategory category) {
        Skill skill = Skill.builder()
                .name(name)
                .user(owner)
                .category(category)
                .status(SkillStatus.VISIBLE)
                .build();
        skill.setId(UUID.randomUUID());
        return skill;
    }

    private SkillRepository.CategoryStatsProjection stats(
            UUID categoryId, long skillCount, long supporterCount) {
        return new SkillRepository.CategoryStatsProjection() {
            @Override
            public UUID getCategoryId() {
                return categoryId;
            }

            @Override
            public long getSkillCount() {
                return skillCount;
            }

            @Override
            public long getSupporterCount() {
                return supporterCount;
            }
        };
    }
}
