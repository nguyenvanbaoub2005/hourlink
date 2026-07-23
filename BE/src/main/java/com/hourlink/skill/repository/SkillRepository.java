package com.hourlink.skill.repository;

import com.hourlink.skill.entity.Skill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface SkillRepository extends JpaRepository<Skill, UUID> {
    java.util.List<Skill> findAllByUser_Email(String email);
}
