package com.hourlink.rating.service;

import com.hourlink.appointment.entity.Appointment;
import com.hourlink.appointment.enums.AppointmentStatus;
import com.hourlink.appointment.repository.AppointmentRepository;
import com.hourlink.common.exception.AppException;
import com.hourlink.common.exception.ErrorCode;
import com.hourlink.common.util.SecurityUtil;
import com.hourlink.notification.enums.NotificationType;
import com.hourlink.notification.service.NotificationService;
import com.hourlink.rating.dto.request.RatingRequest;
import com.hourlink.rating.dto.response.RatingResponse;
import com.hourlink.rating.dto.response.RatingSummaryResponse;
import com.hourlink.rating.entity.Rating;
import com.hourlink.rating.repository.RatingRepository;
import com.hourlink.user.entity.User;
import com.hourlink.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * RatingService — Business logic cho module Rating (Task 32) và cập nhật Reputation (Task 33).
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RatingService {

    private final RatingRepository ratingRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    // ─── Task 32: Tạo đánh giá ────────────────────────────────────────────────

    @Transactional
    public RatingResponse createRating(RatingRequest req) {
        String currentEmail = SecurityUtil.getCurrentUserEmail();
        User fromUser = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        User toUser = userRepository.findById(req.getToUserId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        Appointment appointment = appointmentRepository.findById(req.getAppointmentId())
                .orElseThrow(() -> new AppException(ErrorCode.APPOINTMENT_NOT_FOUND));

        // Chỉ có thể đánh giá sau khi hoàn thành
        if (appointment.getStatus() != AppointmentStatus.COMPLETED) {
            throw new AppException(ErrorCode.APPOINTMENT_INVALID_STATUS,
                    "Chỉ có thể đánh giá sau khi buổi hỗ trợ hoàn thành.");
        }

        // Người đánh giá phải là 1 trong 2 bên
        boolean isParticipant = fromUser.getId().equals(appointment.getProvider().getId())
                || fromUser.getId().equals(appointment.getReceiver().getId());
        if (!isParticipant) {
            throw new AppException(ErrorCode.ACCESS_DENIED, "Bạn không tham gia buổi hỗ trợ này.");
        }

        // Người được đánh giá cũng phải là 1 trong 2 bên, và phải khác người đánh giá
        boolean toIsParticipant = toUser.getId().equals(appointment.getProvider().getId())
                || toUser.getId().equals(appointment.getReceiver().getId());
        if (!toIsParticipant || toUser.getId().equals(fromUser.getId())) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Người được đánh giá không hợp lệ.");
        }

        // Kiểm tra đã đánh giá chưa
        if (ratingRepository.existsByAppointmentIdAndFromUserId(appointment.getId(), fromUser.getId())) {
            throw new AppException(ErrorCode.ALREADY_RATED);
        }

        Rating rating = Rating.builder()
                .appointment(appointment)
                .fromUser(fromUser)
                .toUser(toUser)
                .score(req.getScore())
                .comment(req.getComment())
                .build();

        rating = ratingRepository.save(rating);
        log.info("User [{}] rated user [{}] with score [{}] for appointment [{}]",
                fromUser.getEmail(), toUser.getEmail(), req.getScore(), appointment.getId());

        // ─── Task 33: Cập nhật Reputation sau khi lưu đánh giá ───────────────
        updateReputation(toUser);

        // Thông báo cho người được đánh giá
        notificationService.createNotification(toUser, fromUser, NotificationType.NEW_RATING,
                "Bạn vừa nhận được đánh giá mới!",
                fromUser.getFullName() + " đã đánh giá bạn " + req.getScore() + " sao.",
                appointment.getId());

        return RatingResponse.fromEntity(rating);
    }

    // ─── Task 33: Cập nhật điểm uy tín ───────────────────────────────────────

    /**
     * Tính lại và cập nhật reputation_score của người dùng.
     * Công thức: trung bình cộng của tất cả đánh giá nhận được, nhân 20 → thang điểm 100.
     */
    @Transactional
    public void updateReputation(User user) {
        double avgScore = ratingRepository.calculateAverageScore(user.getId());
        // Chuyển từ thang 1-5 sang thang 0-100
        double reputationScore = avgScore * 20.0;
        user.setReputationScore(reputationScore);
        userRepository.save(user);
        log.info("Updated reputation_score of user [{}] to [{}] (avg rating: {})",
                user.getEmail(), reputationScore, avgScore);
    }

    // ─── Xem danh sách đánh giá của một người ────────────────────────────────

    public List<RatingResponse> getRatingsByUser(UUID userId) {
        return ratingRepository.findByToUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(RatingResponse::fromEntity)
                .toList();
    }

    public List<RatingResponse> getMyRatings() {
        String currentEmail = SecurityUtil.getCurrentUserEmail();
        User user = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return getRatingsByUser(user.getId());
    }

    // ─── Kiểm tra đã đánh giá chưa ───────────────────────────────────────────────────────

    /**
     * Kiểm tra user hiện tại đã đánh giá người kia trong appointment chưa.
     * Được gọi từ FE để ẩn/hiện nút Đánh Giá trên AppointmentDetailScreen.
     */
    public boolean hasRated(UUID appointmentId, UUID toUserId) {
        String currentEmail = SecurityUtil.getCurrentUserEmail();
        User me = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return ratingRepository.existsByAppointmentIdAndFromUserIdAndToUserId(
                appointmentId, me.getId(), toUserId);
    }

    // ─── Thống kê tổng hợp ───────────────────────────────────────────────────────────

    /**
     * Thống kê tổng hợp: average rating, số lượng, reputation, completedSessions, cancelRate.
     */
    public RatingSummaryResponse getSummaryByUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        double avg = ratingRepository.calculateAverageScore(userId);
        long total = ratingRepository.countByToUserId(userId);
        return RatingSummaryResponse.builder()
                .userId(user.getId())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .averageScore(avg)
                .totalRatings(total)
                .reputationScore(user.getReputationScore())
                .completedSessions(user.getCompletedSessions())
                .cancelRate(user.getCancelRate())
                .build();
    }

    /** Thống kê của chính mình. */
    public RatingSummaryResponse getMySummary() {
        String email = SecurityUtil.getCurrentUserEmail();
        User me = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return getSummaryByUser(me.getId());
    }
}
