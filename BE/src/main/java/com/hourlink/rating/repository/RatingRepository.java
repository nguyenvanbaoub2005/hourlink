package com.hourlink.rating.repository;

import com.hourlink.rating.entity.Rating;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RatingRepository extends JpaRepository<Rating, UUID> {

    /** Kiểm tra reviewer đã đánh giá cho appointment này chưa */
    boolean existsByAppointmentIdAndReviewerId(UUID appointmentId, UUID reviewerId);

    /** Lấy đánh giá theo appointment + reviewer */
    Optional<Rating> findByAppointmentIdAndReviewerId(UUID appointmentId, UUID reviewerId);

    /** Lấy tất cả đánh giá mà người dùng nhận được (reviewee), có phân trang */
    Page<Rating> findByRevieweeIdOrderByCreatedAtDesc(UUID revieweeId, Pageable pageable);

    /** Lấy tất cả đánh giá mà người dùng đã gửi (reviewer), có phân trang */
    Page<Rating> findByReviewerIdOrderByCreatedAtDesc(UUID reviewerId, Pageable pageable);

    /** Tính trung bình cộng overallStars của 1 người dùng (để cập nhật reputationScore) */
    @Query("SELECT AVG(r.overallStars) FROM Rating r WHERE r.reviewee.id = :userId")
    Double calculateAverageScoreByUserId(@Param("userId") UUID userId);

    /** Đếm tổng số đánh giá một người nhận được */
    long countByRevieweeId(UUID revieweeId);
}
