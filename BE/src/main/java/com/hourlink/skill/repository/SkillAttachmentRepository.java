package com.hourlink.skill.repository;

import com.hourlink.skill.entity.SkillAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface SkillAttachmentRepository extends JpaRepository<SkillAttachment, UUID> {
    // TODO: thêm custom queries
}
