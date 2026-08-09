package com.hourlink.skill.repository;

import com.hourlink.skill.entity.Skill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface SkillRepository extends JpaRepository<Skill, UUID>, JpaSpecificationExecutor<Skill> {
    java.util.List<Skill> findAllByUser_Email(String email);
    java.util.List<Skill> findAllByStatus(com.hourlink.skill.enums.SkillStatus status);

    /** Kỹ năng đang hiển thị của một người dùng — dùng cho hồ sơ công khai */
    java.util.List<Skill> findAllByUser_IdAndStatus(
            java.util.UUID userId, com.hourlink.skill.enums.SkillStatus status);
            
    java.util.List<Skill> findAllByCategory_Id(java.util.UUID categoryId);
}
