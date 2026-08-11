package com.hourlink.skill.repository;

import com.hourlink.skill.entity.SkillCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

import java.util.List;
import java.util.Optional;

@Repository
public interface SkillCategoryRepository extends JpaRepository<SkillCategory, UUID> {
    Optional<SkillCategory> findByIdAndIsDeletedFalse(UUID id);
    List<SkillCategory> findAllByNameIgnoreCase(String name);
    List<SkillCategory> findAllByNameIgnoreCaseAndIsDeletedFalse(String name);
    List<SkillCategory> findAllByIsDeletedFalse();
}
