package com.hourlink.config;

import com.hourlink.user.entity.Role;
import com.hourlink.user.entity.User;
import com.hourlink.user.entity.UserRole;
import com.hourlink.user.repository.RoleRepository;
import com.hourlink.user.repository.UserRepository;
import com.hourlink.user.repository.UserRoleRepository;
import com.hourlink.skill.entity.SkillCategory;
import com.hourlink.skill.repository.SkillCategoryRepository;
import com.hourlink.skill.entity.Skill;
import com.hourlink.skill.repository.SkillRepository;
import com.hourlink.helprequest.entity.HelpRequest;
import com.hourlink.helprequest.repository.HelpRequestRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.List;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class DataInitializer implements CommandLineRunner {

    RoleRepository roleRepository;
    UserRepository userRepository;
    UserRoleRepository userRoleRepository;
    SkillCategoryRepository skillCategoryRepository;
    SkillRepository skillRepository;
    HelpRequestRepository helpRequestRepository;
    PasswordEncoder passwordEncoder;
    JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        fixSchemaColumns();
        createRoleIfNotFound("USER", "ROLE_USER", "Quyền người dùng cá nhân (Individual)");
        createRoleIfNotFound("ORGANIZATION", "ROLE_ORGANIZATION", "Quyền tổ chức / CLB / Trường học");
        createRoleIfNotFound("ADMIN", "ROLE_ADMIN", "Quyền quản trị viên hệ thống");
        
        createAdminUserIfNotFound("admin@hourlink.vn", "admin123", "Admin Hệ Thống", "ROLE_ADMIN");
        
        initSkillCategories();
    }

    private void fixSchemaColumns() {
        try {
            jdbcTemplate.execute("ALTER TABLE skill MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'VISIBLE'");
        } catch (Exception ignored) {}
        try {
            jdbcTemplate.execute("ALTER TABLE help_request MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'SEARCHING'");
        } catch (Exception ignored) {}
    }

    private void initSkillCategories() {
        createCategoryIfNotFound("Lập trình", "Lập trình web, mobile, AI, dữ liệu, phần mềm...");
        createCategoryIfNotFound("Ngôn ngữ", "Tiếng Anh, Nhật, Hàn, Trung, Pháp, Đức...");
        createCategoryIfNotFound("Thiết kế", "UI/UX, Photoshop, Illustrator, 3D, video...");
        createCategoryIfNotFound("Kinh doanh", "Khởi nghiệp, tài chính, marketing, bán hàng...");
        createCategoryIfNotFound("Giáo dục", "Toán, Lý, Hóa, Văn, luyện thi, gia sư...");
        createCategoryIfNotFound("Sức khỏe", "Gym, Yoga, dinh dưỡng, bơi lội, thể thao...");
        createCategoryIfNotFound("Nghệ thuật", "Âm nhạc, hội họa, đàn Guitar, Piano...");
        createCategoryIfNotFound("Khác", "Các kỹ năng và lĩnh vực khác");

        cleanupOldCategories();
    }

    private void cleanupOldCategories() {
        List<String> validNames = List.of(
                "Lập trình", "Ngôn ngữ", "Thiết kế", "Kinh doanh",
                "Giáo dục", "Sức khỏe", "Nghệ thuật", "Khác"
        );
        SkillCategory otherCategory = skillCategoryRepository.findByName("Khác").orElse(null);

        List<SkillCategory> allCategories = skillCategoryRepository.findAll();
        for (SkillCategory cat : allCategories) {
            if (!validNames.contains(cat.getName())) {
                if (otherCategory != null && !cat.getId().equals(otherCategory.getId())) {
                    List<Skill> skills = skillRepository.findAll();
                    for (Skill s : skills) {
                        if (s.getCategory() != null && s.getCategory().getId().equals(cat.getId())) {
                            s.setCategory(otherCategory);
                            skillRepository.save(s);
                        }
                    }
                    List<HelpRequest> requests = helpRequestRepository.findAll();
                    for (HelpRequest r : requests) {
                        if (r.getCategory() != null && r.getCategory().getId().equals(cat.getId())) {
                            r.setCategory(otherCategory);
                            helpRequestRepository.save(r);
                        }
                    }
                }
                skillCategoryRepository.delete(cat);
            }
        }
    }

    private void createCategoryIfNotFound(String name, String description) {
        if (skillCategoryRepository.findByName(name).isEmpty()) {
            skillCategoryRepository.save(SkillCategory.builder()
                    .name(name)
                    .description(description)
                    .build());
        }
    }

    private void createRoleIfNotFound(String roleName, String roleCode, String description) {
        Optional<Role> roleOpt = roleRepository.findByRoleCode(roleCode);
        if (roleOpt.isEmpty()) {
            Role role = Role.builder()
                    .roleName(roleName)
                    .roleCode(roleCode)
                    .description(description)
                    .build();
            roleRepository.save(role);
        }
    }

    private void createAdminUserIfNotFound(String email, String password, String fullName, String roleCode) {
        if (!userRepository.existsByEmail(email)) {
            User admin = User.builder()
                    .email(email)
                    .passwordHash(passwordEncoder.encode(password))
                    .fullName(fullName)
                    .phone("0999999999")
                    .build();
            admin = userRepository.save(admin);

            Role adminRole = roleRepository.findByRoleCode(roleCode).orElseThrow();
            UserRole userRole = UserRole.builder()
                    .user(admin)
                    .role(adminRole)
                    .build();
            userRoleRepository.save(userRole);
        }
    }
}
