package com.hourlink.skill.repository;

import com.hourlink.skill.entity.SkillCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

import java.util.Optional;

@Repository
public interface SkillCategoryRepository extends JpaRepository<SkillCategory, UUID> {
    Optional<SkillCategory> findByName(String name);
    Optional<SkillCategory> findByNameAndIsDeletedFalse(String name);
    java.util.List<SkillCategory> findAllByIsDeletedFalse();
}
