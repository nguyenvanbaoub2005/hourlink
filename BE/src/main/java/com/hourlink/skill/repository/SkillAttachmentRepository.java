package com.hourlink.skill.repository;

import com.hourlink.skill.entity.SkillAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SkillAttachmentRepository extends JpaRepository<SkillAttachment, UUID> {

    List<SkillAttachment> findAllBySkill_Id(UUID skillId);

    List<SkillAttachment> findAllBySkill_IdAndIsDeletedFalse(UUID skillId);

    void deleteAllBySkill_Id(UUID skillId);
}
