package com.hourlink.practice.repository;

import com.hourlink.practice.entity.SkillPracticeAssessment;
import com.hourlink.practice.enums.PracticeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SkillPracticeAssessmentRepository extends JpaRepository<SkillPracticeAssessment, UUID> {

    Optional<SkillPracticeAssessment> findByAppointment_Id(UUID appointmentId);

    List<SkillPracticeAssessment> findAllByLearner_IdAndStatusOrderByIssuedAtDesc(UUID learnerId, PracticeStatus status);

    List<SkillPracticeAssessment> findAllByMentor_IdAndStatusOrderByIssuedAtDesc(UUID mentorId, PracticeStatus status);

    Optional<SkillPracticeAssessment> findByCertificateCodeIgnoreCase(String certificateCode);
}
