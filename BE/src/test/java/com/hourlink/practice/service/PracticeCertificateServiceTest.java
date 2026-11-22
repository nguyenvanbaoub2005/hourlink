package com.hourlink.practice.service;

import com.hourlink.appointment.entity.Appointment;
import com.hourlink.appointment.repository.AppointmentRepository;
import com.hourlink.practice.dto.request.AssignPracticeRequest;
import com.hourlink.practice.dto.request.GradePracticeRequest;
import com.hourlink.practice.dto.request.SubmitPracticeRequest;
import com.hourlink.practice.dto.response.AiPracticeTemplateResponse;
import com.hourlink.practice.dto.response.PracticeAssessmentResponse;
import com.hourlink.practice.entity.SkillPracticeAssessment;
import com.hourlink.practice.enums.PracticeStatus;
import com.hourlink.practice.repository.SkillPracticeAssessmentRepository;
import com.hourlink.user.entity.User;
import com.hourlink.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PracticeCertificateServiceTest {

    @Mock SkillPracticeAssessmentRepository practiceRepository;
    @Mock AppointmentRepository appointmentRepository;
    @Mock UserRepository userRepository;
    @InjectMocks PracticeCertificateService service;

    private User mentor;
    private User learner;
    private Appointment appointment;

    @BeforeEach
    void setUp() {
        mentor = User.builder().email("mentor@hourlink.vn").fullName("Mentor Kỹ Năng").build();
        mentor.setId(UUID.randomUUID());

        learner = User.builder().email("learner@hourlink.vn").fullName("Học Viên").build();
        learner.setId(UUID.randomUUID());

        appointment = Appointment.builder()
                .provider(mentor)
                .receiver(learner)
                .title("Kỹ năng Thuyết trình trước đám đông")
                .timeCreditAmount(1.5)
                .build();
        appointment.setId(UUID.randomUUID());
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void authenticateAs(User user) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(user.getEmail(), null, java.util.List.of()));
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
    }

    @Test
    void fullWorkflow_assignSubmitAndGrade_issuesVerifiedDigitalCertificate() {
        when(practiceRepository.save(any(SkillPracticeAssessment.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        // 1. Mentor giao bài thực hành
        authenticateAs(mentor);
        when(appointmentRepository.findById(appointment.getId())).thenReturn(Optional.of(appointment));
        when(practiceRepository.findByAppointment_Id(appointment.getId())).thenReturn(Optional.empty());

        PracticeAssessmentResponse assigned = service.assignPractice(
                appointment.getId(),
                AssignPracticeRequest.builder()
                        .assignmentTitle("Elevator Pitch 2 phút")
                        .scenarioPrompt("Trình bày ý tưởng trong 2 phút theo cấu trúc 3 điểm.")
                        .practiceCriteria("Mạch lạc, tự tin, đúng trọng tâm.")
                        .build());

        assertEquals(PracticeStatus.ASSIGNED, assigned.getStatus());
        assertEquals("Elevator Pitch 2 phút", assigned.getAssignmentTitle());

        // 2. Học viên nộp bài
        SkillPracticeAssessment stored = SkillPracticeAssessment.builder()
                .appointment(appointment)
                .mentor(mentor)
                .learner(learner)
                .skillTitle(appointment.getTitle())
                .assignmentTitle(assigned.getAssignmentTitle())
                .scenarioPrompt(assigned.getScenarioPrompt())
                .practiceCriteria(assigned.getPracticeCriteria())
                .creditHours(1.5)
                .status(PracticeStatus.ASSIGNED)
                .build();
        stored.setId(UUID.randomUUID());

        authenticateAs(learner);
        when(practiceRepository.findByAppointment_Id(appointment.getId())).thenReturn(Optional.of(stored));

        PracticeAssessmentResponse submitted = service.submitPractice(
                appointment.getId(),
                SubmitPracticeRequest.builder()
                        .submissionText("Mở đầu bằng câu hỏi thực tế, nêu 3 lợi ích cốt lõi và lời kêu gọi hành động.")
                        .submissionLink("https://drive.google.com/pitch-demo")
                        .build());

        assertEquals(PracticeStatus.SUBMITTED, submitted.getStatus());
        assertNotNull(submitted.getSubmittedAt());

        // 3. Mentor chấm điểm 3 tiêu chí Kỹ năng mềm -> Cấp chứng nhận số XUẤT SẮC
        authenticateAs(mentor);
        PracticeAssessmentResponse graded = service.gradePractice(
                appointment.getId(),
                GradePracticeRequest.builder()
                        .communicationScore(9.0)
                        .applicationScore(8.5)
                        .confidenceScore(9.5)
                        .mentorFeedback("Trình bày rất thuyết phục, cấu trúc 3 điểm rõ ràng và giọng điệu tự tin!")
                        .build());

        assertEquals(PracticeStatus.PASSED, graded.getStatus());
        assertEquals(9.0, graded.getOverallScore());
        assertEquals("XUẤT SẮC", graded.getCertificateLevel());
        assertNotNull(graded.getCertificateCode());
        assertTrue(graded.getCertificateCode().startsWith("HL-CERT-"));
        assertNotNull(graded.getIssuedAt());
    }

    @Test
    void generateSoftSkillTemplate_tailorsPromptToSoftSkillTopic() {
        AiPracticeTemplateResponse speaking = service.generateSoftSkillTemplate("Kỹ năng thuyết trình & Public Speaking");
        assertTrue(speaking.getAssignmentTitle().contains("Elevator Pitch"));

        AiPracticeTemplateResponse interview = service.generateSoftSkillTemplate("Luyện phỏng vấn & sửa CV");
        assertTrue(interview.getAssignmentTitle().contains("STAR"));
    }
}
