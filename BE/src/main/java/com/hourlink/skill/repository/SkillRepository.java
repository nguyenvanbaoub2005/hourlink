package com.hourlink.skill.repository;

import com.hourlink.skill.entity.Skill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface SkillRepository extends JpaRepository<Skill, UUID>, JpaSpecificationExecutor<Skill> {
    interface CategoryStatsProjection {
        UUID getCategoryId();
        long getSkillCount();
        long getSupporterCount();
    }

    java.util.List<Skill> findAllByUser_Email(String email);
    java.util.List<Skill> findAllByStatus(com.hourlink.skill.enums.SkillStatus status);

    /** Kỹ năng đang hiển thị của một người dùng — dùng cho hồ sơ công khai */
    java.util.List<Skill> findAllByUser_IdAndStatus(
            java.util.UUID userId, com.hourlink.skill.enums.SkillStatus status);
            
    java.util.List<Skill> findAllByCategory_Id(java.util.UUID categoryId);

    /**
     * Thống kê dữ liệu thực sự có thể xuất hiện ở màn Khám phá.
     * Chỉ tính kỹ năng công khai của tài khoản và danh mục còn hoạt động;
     * một người có nhiều kỹ năng trong cùng danh mục chỉ được tính một supporter.
     */
    @Query("""
            SELECT s.category.id AS categoryId,
                   COUNT(s.id) AS skillCount,
                   COUNT(DISTINCT s.user.id) AS supporterCount
            FROM Skill s
            WHERE s.status = com.hourlink.skill.enums.SkillStatus.VISIBLE
              AND s.category IS NOT NULL
              AND s.category.isDeleted = false
              AND s.user.isLocked = false
              AND s.user.isDeleted = false
              AND (:excludedUserId IS NULL OR s.user.id <> :excludedUserId)
            GROUP BY s.category.id
            """)
    List<CategoryStatsProjection> summarizeVisibleCategories(
            @Param("excludedUserId") UUID excludedUserId);
}
