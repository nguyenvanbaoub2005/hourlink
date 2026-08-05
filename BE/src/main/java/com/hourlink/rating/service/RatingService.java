package com.hourlink.rating.service;

import com.hourlink.appointment.entity.Appointment;
import com.hourlink.appointment.enums.AppointmentStatus;
import com.hourlink.appointment.repository.AppointmentRepository;
import com.hourlink.common.exception.AppException;
import com.hourlink.common.exception.ErrorCode;
import com.hourlink.rating.dto.request.RatingRequest;
import com.hourlink.rating.dto.response.BadgeResponse;
import com.hourlink.rating.dto.response.RatingResponse;
import com.hourlink.rating.entity.Rating;
import com.hourlink.rating.repository.RatingRepository;
import com.hourlink.user.entity.Badge;
import com.hourlink.user.entity.User;
import com.hourlink.user.entity.UserBadge;
import com.hourlink.user.repository.BadgeRepository;
import com.hourlink.user.repository.UserBadgeRepository;
import com.hourlink.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * RatingService — Business logic cho module Rating, Reputation và Badge.
 *
 * Luồng chính sau khi Appointment COMPLETED:
 *   1. Người dùng gọi submitRating() → tạo Rating record.
 *   2. Service tính lại reputationScore của reviewee (trung bình cộng overallStars).
 *   3. Service kiểm tra điều kiện → trao Badge nếu đủ điều kiện.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RatingService {

    private final RatingRepository ratingRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final BadgeRepository badgeRepository;
    private final UserBadgeRepository userBadgeRepository;

    // ─── Badge codes — phải khớp với dữ liệu seed trong bảng badge ───────────
    private static final String BADGE_SESSION_10      = "SESSION_10";       // Hoàn thành >= 10 buổi
    private static final String BADGE_SESSION_50      = "SESSION_50";       // Hoàn thành >= 50 buổi
    private static final String BADGE_TOP_RATED       = "TOP_RATED";        // AvgScore >= 4.5 && >= 5 đánh giá
    private static final String BADGE_ACTIVE_SUPPORTER = "ACTIVE_SUPPORTER"; // completedSessions >= 5

    // ─── Submit Rating ─────────────────────────────────────────────────────────

    /**
     * Người dùng (currentUserEmail) gửi đánh giá sau buổi hẹn.
     * - Appointment phải ở trạng thái COMPLETED.
     * - Reviewer phải là provider hoặc receiver của appointment đó.
     * - Mỗi người chỉ được đánh giá 1 lần cho mỗi appointment.
     */
    @Transactional
    public RatingResponse submitRating(String currentUserEmail, RatingRequest request) {
        // 1. Lấy thông tin người đang đăng nhập
        User reviewer = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

        // 2. Lấy appointment
        UUID appointmentId = UUID.fromString(request.getAppointmentId());
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new AppException(ErrorCode.APPOINTMENT_NOT_FOUND));

        // 3. Appointment phải đã COMPLETED
        if (appointment.getStatus() != AppointmentStatus.COMPLETED) {
            throw new AppException(ErrorCode.APPOINTMENT_INVALID_STATUS,
                    "Chỉ có thể đánh giá sau khi buổi hỗ trợ hoàn thành");
        }

        // 4. Reviewer phải là một trong hai bên của appointment
        boolean isProvider = appointment.getProvider().getId().equals(reviewer.getId());
        boolean isReceiver = appointment.getReceiver().getId().equals(reviewer.getId());
        if (!isProvider && !isReceiver) {
            throw new AppException(ErrorCode.ACCESS_DENIED, "Bạn không thuộc lịch hẹn này");
        }

        // 5. Kiểm tra đã đánh giá chưa
        if (ratingRepository.existsByAppointmentIdAndReviewerId(appointmentId, reviewer.getId())) {
            throw new AppException(ErrorCode.ALREADY_RATED);
        }

        // 6. Xác định người được đánh giá
        UUID revieweeId = UUID.fromString(request.getRevieweeId());
        User reviewee = userRepository.findById(revieweeId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        // reviewee phải là người còn lại trong appointment
        boolean revieweeIsProvider = appointment.getProvider().getId().equals(revieweeId);
        boolean revieweeIsReceiver = appointment.getReceiver().getId().equals(revieweeId);
        if (!revieweeIsProvider && !revieweeIsReceiver) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Người được đánh giá không thuộc lịch hẹn này");
        }
        if (reviewer.getId().equals(revieweeId)) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Bạn không thể tự đánh giá bản thân");
        }

        // 7. Lưu Rating
        Rating rating = Rating.builder()
                .appointment(appointment)
                .reviewer(reviewer)
                .reviewee(reviewee)
                .punctualityScore(request.getPunctualityScore())
                .attitudeScore(request.getAttitudeScore())
                .communicationScore(request.getCommunicationScore())
                .qualityScore(request.getQualityScore())
                .overallStars(request.getOverallStars())
                .comment(request.getComment())
                .build();

        Rating saved = ratingRepository.save(rating);
        log.info("Rating saved: id={} reviewer={} reviewee={}", saved.getId(), reviewer.getId(), reviewee.getId());

        // 8. Cập nhật reputationScore cho reviewee (trung bình cộng)
        updateReputationScore(reviewee);

        // 9. Kiểm tra và trao Badge
        checkAndAwardBadges(reviewee);

        return toResponse(saved);
    }

    // ─── Lấy thông tin ─────────────────────────────────────────────────────────

    /** Lấy đánh giá của người dùng hiện tại (reviewer) cho một buổi hẹn cụ thể */
    @Transactional(readOnly = true)
    public RatingResponse getRatingForAppointment(String currentUserEmail, UUID appointmentId) {
        User reviewer = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

        return ratingRepository.findByAppointmentIdAndReviewerId(appointmentId, reviewer.getId())
                .map(this::toResponse)
                .orElse(null); // Trả về null nếu chưa đánh giá thay vì ném exception
    }

    /** Lấy các đánh giá mà người dùng nhận được (reviewee), phân trang */
    @Transactional(readOnly = true)
    public Page<RatingResponse> getRatingsReceived(UUID userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ratingRepository.findByRevieweeIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::toResponse);
    }

    /** Lấy các đánh giá mà người dùng đã gửi (reviewer), phân trang */
    @Transactional(readOnly = true)
    public Page<RatingResponse> getRatingsGiven(UUID userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ratingRepository.findByReviewerIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::toResponse);
    }

    /** Lấy tất cả huy hiệu của người dùng */
    @Transactional(readOnly = true)
    public List<BadgeResponse> getUserBadges(UUID userId) {
        return userBadgeRepository.findByUserIdOrderByAwardedAtDesc(userId)
                .stream()
                .map(ub -> BadgeResponse.builder()
                        .id(ub.getBadge().getId().toString())
                        .code(ub.getBadge().getCode())
                        .name(ub.getBadge().getName())
                        .description(ub.getBadge().getDescription())
                        .iconUrl(ub.getBadge().getIconUrl())
                        .awardedAt(ub.getAwardedAt())
                        .build())
                .collect(Collectors.toList());
    }

    // ─── Private helpers ───────────────────────────────────────────────────────

    /**
     * Tính lại reputationScore = trung bình cộng overallStars của tất cả ratings nhận được.
     * Lưu vào User.reputationScore (thang 1.0–5.0).
     */
    private void updateReputationScore(User reviewee) {
        Double avg = ratingRepository.calculateAverageScoreByUserId(reviewee.getId());
        if (avg != null) {
            double rounded = Math.round(avg * 10.0) / 10.0;
            reviewee.setReputationScore(rounded);
            userRepository.save(reviewee);
            log.info("Updated reputationScore for user={}: {}", reviewee.getId(), rounded);
        }
    }

    /**
     * Kiểm tra điều kiện và trao Badge cho user nếu đủ điều kiện.
     */
    private void checkAndAwardBadges(User user) {
        int sessions = user.getCompletedSessions();
        double score = user.getReputationScore();
        long totalRatings = ratingRepository.countByRevieweeId(user.getId());

        // Badge: Người hỗ trợ tích cực (>= 5 buổi)
        if (sessions >= 5) {
            awardBadgeIfNotExists(user, BADGE_ACTIVE_SUPPORTER);
        }
        // Badge: Hoàn thành >= 10 buổi
        if (sessions >= 10) {
            awardBadgeIfNotExists(user, BADGE_SESSION_10);
        }
        // Badge: Hoàn thành >= 50 buổi
        if (sessions >= 50) {
            awardBadgeIfNotExists(user, BADGE_SESSION_50);
        }
        // Badge: Được đánh giá cao (avg >= 4.5 và >= 5 đánh giá)
        if (score >= 4.5 && totalRatings >= 5) {
            awardBadgeIfNotExists(user, BADGE_TOP_RATED);
        }
    }

    /** Trao badge cho user nếu chưa có. Bỏ qua nếu badge code không tồn tại trong DB. */
    private void awardBadgeIfNotExists(User user, String badgeCode) {
        badgeRepository.findByCode(badgeCode).ifPresent(badge -> {
            if (!userBadgeRepository.existsByUserIdAndBadgeId(user.getId(), badge.getId())) {
                UserBadge ub = UserBadge.builder()
                        .user(user)
                        .badge(badge)
                        .build();
                userBadgeRepository.save(ub);
                log.info("Awarded badge '{}' to user={}", badgeCode, user.getId());
            }
        });
    }

    /** Map Rating entity → RatingResponse DTO */
    private RatingResponse toResponse(Rating r) {
        return RatingResponse.builder()
                .id(r.getId().toString())
                .appointmentId(r.getAppointment().getId().toString())
                .reviewerId(r.getReviewer().getId().toString())
                .reviewerName(r.getReviewer().getFullName())
                .reviewerAvatarUrl(r.getReviewer().getAvatarUrl())
                .revieweeId(r.getReviewee().getId().toString())
                .revieweeName(r.getReviewee().getFullName())
                .punctualityScore(r.getPunctualityScore())
                .attitudeScore(r.getAttitudeScore())
                .communicationScore(r.getCommunicationScore())
                .qualityScore(r.getQualityScore())
                .overallStars(r.getOverallStars())
                .comment(r.getComment())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
