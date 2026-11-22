package com.hourlink.practice.service;

import com.hourlink.appointment.entity.Appointment;
import com.hourlink.appointment.repository.AppointmentRepository;
import com.hourlink.common.exception.AppException;
import com.hourlink.common.exception.ErrorCode;
import com.hourlink.common.util.SecurityUtil;
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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.Instant;
import java.time.Year;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PracticeCertificateService {

    private final SkillPracticeAssessmentRepository practiceRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        String email = SecurityUtil.getCurrentUserEmail();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    public PracticeAssessmentResponse getByAppointment(UUID appointmentId) {
        return practiceRepository.findByAppointment_Id(appointmentId)
                .map(this::toResponse)
                .orElse(null);
    }

    /**
     * Người hướng dẫn (Provider/Mentor) giao hoặc cập nhật bài thực hành Kỹ năng mềm cho buổi hẹn.
     */
    @Transactional
    public PracticeAssessmentResponse assignPractice(UUID appointmentId, AssignPracticeRequest request) {
        User currentUser = getCurrentUser();
        Appointment appt = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new AppException(ErrorCode.APPOINTMENT_NOT_FOUND));

        if (!appt.getProvider().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }

        String skillTitle = appt.getSkill() != null && appt.getSkill().getName() != null
                ? appt.getSkill().getName()
                : appt.getTitle();

        SkillPracticeAssessment entity = practiceRepository.findByAppointment_Id(appointmentId)
                .orElseGet(() -> SkillPracticeAssessment.builder()
                        .appointment(appt)
                        .mentor(appt.getProvider())
                        .learner(appt.getReceiver())
                        .skillTitle(skillTitle)
                        .creditHours(appt.getTimeCreditAmount() != null ? appt.getTimeCreditAmount() : 1.0)
                        .build());

        entity.setSkillTitle(skillTitle);
        entity.setAssignmentTitle(request.getAssignmentTitle().trim());
        entity.setScenarioPrompt(request.getScenarioPrompt().trim());
        entity.setPracticeCriteria(request.getPracticeCriteria() != null ? request.getPracticeCriteria().trim() : null);
        if (entity.getStatus() == null) {
            entity.setStatus(PracticeStatus.ASSIGNED);
        }

        return toResponse(practiceRepository.save(entity));
    }

    /**
     * Người học (Receiver/Learner) nộp bài thu hoạch / cách giải quyết tình huống thực hành.
     */
    @Transactional
    public PracticeAssessmentResponse submitPractice(UUID appointmentId, SubmitPracticeRequest request) {
        User currentUser = getCurrentUser();
        SkillPracticeAssessment entity = practiceRepository.findByAppointment_Id(appointmentId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));

        if (!entity.getLearner().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }

        entity.setSubmissionText(request.getSubmissionText().trim());
        entity.setSubmissionLink(
                request.getSubmissionLink() != null && !request.getSubmissionLink().isBlank()
                        ? request.getSubmissionLink().trim()
                        : null
        );
        entity.setSubmittedAt(Instant.now());
        if (entity.getStatus() != PracticeStatus.PASSED) {
            entity.setStatus(PracticeStatus.SUBMITTED);
        }

        return toResponse(practiceRepository.save(entity));
    }

    /**
     * Người hướng dẫn (Mentor) chấm điểm 3 trụ cột Kỹ năng mềm (1–10) & Nhận xét.
     * Nếu điểm trung bình >= 5.0 -> tự động chuyển trạng thái PASSED và cấp Chứng nhận kỹ năng số (HL-CERT-YYYY-XXXXXX).
     */
    @Transactional
    public PracticeAssessmentResponse gradePractice(UUID appointmentId, GradePracticeRequest request) {
        User currentUser = getCurrentUser();
        SkillPracticeAssessment entity = practiceRepository.findByAppointment_Id(appointmentId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));

        if (!entity.getMentor().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }

        double comm = request.getCommunicationScore();
        double app = request.getApplicationScore();
        double conf = request.getConfidenceScore();
        double overall = Math.round(((comm + app + conf) / 3.0) * 10.0) / 10.0;

        entity.setCommunicationScore(comm);
        entity.setApplicationScore(app);
        entity.setConfidenceScore(conf);
        entity.setOverallScore(overall);
        entity.setMentorFeedback(
                request.getMentorFeedback() != null && !request.getMentorFeedback().isBlank()
                        ? request.getMentorFeedback().trim()
                        : null
        );

        if (overall >= 5.0) {
            entity.setStatus(PracticeStatus.PASSED);
            entity.setCertificateLevel(resolveCertificateLevel(overall));
            if (entity.getCertificateCode() == null || entity.getCertificateCode().isBlank()) {
                entity.setCertificateCode(generateCertificateCode());
            }
            if (entity.getIssuedAt() == null) {
                entity.setIssuedAt(Instant.now());
            }
        } else {
            entity.setStatus(PracticeStatus.NEEDS_REVISION);
        }

        return toResponse(practiceRepository.save(entity));
    }

    public List<PracticeAssessmentResponse> getMyEarnedCertificates() {
        User currentUser = getCurrentUser();
        return practiceRepository
                .findAllByLearner_IdAndStatusOrderByIssuedAtDesc(currentUser.getId(), PracticeStatus.PASSED)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<PracticeAssessmentResponse> getMyIssuedCertificates() {
        User currentUser = getCurrentUser();
        return practiceRepository
                .findAllByMentor_IdAndStatusOrderByIssuedAtDesc(currentUser.getId(), PracticeStatus.PASSED)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public PracticeAssessmentResponse verifyCertificateCode(String code) {
        if (code == null || code.isBlank()) {
            throw new AppException(ErrorCode.NOT_FOUND);
        }
        return practiceRepository.findByCertificateCodeIgnoreCase(code.trim())
                .filter(e -> e.getStatus() == PracticeStatus.PASSED)
                .map(this::toResponse)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));
    }

    /**
     * AI sinh tình huống thực hành Kỹ năng mềm theo tên kỹ năng của buổi hẹn.
     */
    public AiPracticeTemplateResponse generateSoftSkillTemplate(String rawSkillTitle) {
        String title = (rawSkillTitle != null && !rawSkillTitle.isBlank())
                ? rawSkillTitle.trim()
                : "Kỹ năng mềm & Giao tiếp";
        String norm = normalize(title);

        if (containsAny(norm, "thuyet trinh", "public speaking", "mc", "slide", "pitch", "dien thuyet")) {
            return AiPracticeTemplateResponse.builder()
                    .skillCategory("Kỹ năng Thuyết trình & Diễn đạt")
                    .assignmentTitle("Thực hành Elevator Pitch 2 phút: Thuyết phục bằng Cấu trúc 3 Điểm")
                    .scenarioPrompt(
                            "Tình huống thực tế: Bạn chỉ có đúng 2 phút trong thang máy/cuộc họp nhanh để trình bày một ý tưởng dự án "
                                    + "hoặc giới thiệu bản thân liên quan đến \"" + title + "\".\n"
                                    + "• Hãy viết kịch bản mở đầu thu hút (Hook 15 giây), 3 luận điểm cốt lõi và lời kêu gọi hành động (Call-to-Action).\n"
                                    + "• Có thể đính kèm link video/ghi âm 2 phút bạn tự luyện nói.")
                    .practiceCriteria(
                            "1. Giao tiếp & Diễn đạt: Mở đầu ấn tượng, cấu trúc 3 phần mạch lạc.\n"
                                    + "2. Vận dụng tình huống: Thông điệp súc tích, đúng trọng tâm trong 2 phút.\n"
                                    + "3. Tư duy & Tự tin: Ngôn ngữ tích cực, giọng điệu tự nhiên và thuyết phục.")
                    .build();
        }

        if (containsAny(norm, "phong van", "cv", "tuyen dung", "interview", "career", "huong nghiep")) {
            return AiPracticeTemplateResponse.builder()
                    .skillCategory("Kỹ năng Phỏng vấn & Định vị Bản thân")
                    .assignmentTitle("Thực hành trả lời câu hỏi hành vi theo mô hình STAR")
                    .scenarioPrompt(
                            "Tình huống thực tế: Nhà tuyển dụng hỏi bạn: \"Hãy kể về một lần bạn gặp bất đồng hoặc áp lực lớn khi làm việc "
                                    + "và cách bạn giải quyết?\".\n"
                                    + "• Hãy vận dụng kiến thức trong buổi trao đổi \"" + title + "\" để viết câu trả lời theo cấu trúc STAR "
                                    + "(Situation - Task - Action - Result).\n"
                                    + "• Nêu rõ bài học rút ra và kết quả định lượng được.")
                    .practiceCriteria(
                            "1. Giao tiếp & Diễn đạt: Trình bày rõ ràng 4 bước S-T-A-R, không lan man.\n"
                                    + "2. Vận dụng tình huống: Cách xử lý thể hiện thái độ chuyên nghiệp, cầu thị.\n"
                                    + "3. Tư duy & Tự tin: Làm nổi bật được vai trò cá nhân và kết quả thực tế.")
                    .build();
        }

        if (containsAny(norm, "tieng anh", "ielts", "toeic", "giao tiep", "tieng nhat", "tieng han", "tieng trung", "ngoai ngu", "speaking")) {
            return AiPracticeTemplateResponse.builder()
                    .skillCategory("Kỹ năng Giao tiếp & Phản xạ Ngôn ngữ")
                    .assignmentTitle("Thực hành Phản xạ Tình huống Giao tiếp Thực tế & Tự nhiên")
                    .scenarioPrompt(
                            "Tình huống thực tế: Dựa trên chủ đề của buổi học \"" + title + "\", hãy đóng vai xử lý một cuộc hội thoại "
                                    + "kéo dài 6–8 lượt lời (hoặc đoạn độc thoại 150 từ) sử dụng ít nhất 5 cấu trúc/từ vựng tự nhiên đã học.\n"
                                    + "• Viết lại kịch bản phản xạ của bạn và đính kèm link ghi âm/video phát âm (nếu có).")
                    .practiceCriteria(
                            "1. Giao tiếp & Diễn đạt: Dùng từ tự nhiên, đúng ngữ cảnh giao tiếp.\n"
                                    + "2. Vận dụng tình huống: Áp dụng được tối thiểu 5 cụm từ/cấu trúc trong buổi học.\n"
                                    + "3. Tư duy & Tự tin: Phản xạ mạch lạc, truyền tải trọn vẹn cảm xúc.")
                    .build();
        }

        if (containsAny(norm, "nhom", "teamwork", "lanh dao", "leadership", "quan ly", "dam phan", "xung dot", "thoi gian")) {
            return AiPracticeTemplateResponse.builder()
                    .skillCategory("Kỹ năng Làm việc nhóm, Quản lý & Giải quyết vấn đề")
                    .assignmentTitle("Thực hành Giải quyết Xung đột & Phân bổ Ưu tiên trong Nhóm")
                    .scenarioPrompt(
                            "Tình huống thực tế: Nhóm dự án của bạn còn 48 giờ trước hạn nộp nhưng 2 thành viên bất đồng quan điểm "
                                    + "và tiến độ đang chậm 30%.\n"
                                    + "• Hãy áp dụng khung kỹ năng từ buổi học \"" + title + "\" để đề xuất: (1) Cách lắng nghe & tháo gỡ bất đồng, "
                                    + "(2) Bảng chia lại độ ưu tiên công việc (Ma trận Eisenhower), và (3) Thông điệp khích lệ tinh thần nhóm.")
                    .practiceCriteria(
                            "1. Giao tiếp & Diễn đạt: Ngôn từ thấu cảm, tôn trọng và tập trung vào giải pháp.\n"
                                    + "2. Vận dụng tình huống: Kế hoạch hành động khả thi, phân bổ ưu tiên hợp lý.\n"
                                    + "3. Tư duy & Tự tin: Tư duy phản biện sắc bén, giữ vững tinh thần đồng đội.")
                    .build();
        }

        return AiPracticeTemplateResponse.builder()
                .skillCategory("Trao đổi Kỹ năng mềm & Ứng dụng Thực tế")
                .assignmentTitle("Thực hành Vận dụng Tình huống Thực tế: " + title)
                .scenarioPrompt(
                        "Tình huống thực tế: Sau buổi trao đổi kỹ năng \"" + title + "\", hãy chọn 1 tình huống cụ thể trong học tập "
                                + "hoặc công việc hàng ngày của bạn và trình bày:\n"
                                + "• 3 điểm cốt lõi bạn tâm đắc nhất từ buổi hướng dẫn.\n"
                                + "• Cách bạn áp dụng ngay vào thực tế để xử lý tình huống đó (kèm ví dụ hoặc link sản phẩm/minh chứng).")
                .practiceCriteria(
                        "1. Giao tiếp & Diễn đạt: Trình bày mạch lạc, dễ hiểu, có ví dụ minh họa.\n"
                                + "2. Vận dụng tình huống: Liên hệ sát với kiến thức đã trao đổi trong buổi hẹn.\n"
                                + "3. Tư duy & Tự tin: Chủ động đúc kết bài học và kế hoạch rèn luyện tiếp theo.")
                .build();
    }

    static String resolveCertificateLevel(double overallScore) {
        if (overallScore >= 8.5) return "XUẤT SẮC";
        if (overallScore >= 7.0) return "GIỎI";
        return "ĐẠT";
    }

    static String generateCertificateCode() {
        String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase(Locale.ROOT);
        return "HL-CERT-" + Year.now().getValue() + "-" + suffix;
    }

    private static boolean containsAny(String normalized, String... keywords) {
        for (String kw : keywords) {
            if (normalized.contains(kw)) return true;
        }
        return false;
    }

    private static String normalize(String text) {
        String decomposed = Normalizer.normalize(text.toLowerCase(Locale.ROOT), Normalizer.Form.NFD);
        return decomposed.replaceAll("\\p{M}", "").replace('đ', 'd').replaceAll("[^a-z0-9 ]", " ");
    }

    private PracticeAssessmentResponse toResponse(SkillPracticeAssessment e) {
        return PracticeAssessmentResponse.builder()
                .id(e.getId())
                .appointmentId(e.getAppointment().getId())
                .mentorId(e.getMentor().getId())
                .mentorName(e.getMentor().getFullName())
                .mentorAvatarUrl(e.getMentor().getAvatarUrl())
                .learnerId(e.getLearner().getId())
                .learnerName(e.getLearner().getFullName())
                .learnerAvatarUrl(e.getLearner().getAvatarUrl())
                .skillTitle(e.getSkillTitle())
                .assignmentTitle(e.getAssignmentTitle())
                .scenarioPrompt(e.getScenarioPrompt())
                .practiceCriteria(e.getPracticeCriteria())
                .submissionText(e.getSubmissionText())
                .submissionLink(e.getSubmissionLink())
                .submittedAt(e.getSubmittedAt())
                .communicationScore(e.getCommunicationScore())
                .applicationScore(e.getApplicationScore())
                .confidenceScore(e.getConfidenceScore())
                .overallScore(e.getOverallScore())
                .mentorFeedback(e.getMentorFeedback())
                .status(e.getStatus())
                .certificateCode(e.getCertificateCode())
                .certificateLevel(e.getCertificateLevel())
                .creditHours(e.getCreditHours())
                .issuedAt(e.getIssuedAt())
                .createdAt(e.getCreatedAt())
                .build();
    }
}
