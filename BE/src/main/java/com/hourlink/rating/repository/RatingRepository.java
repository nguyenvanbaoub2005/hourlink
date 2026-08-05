package com.hourlink.rating.repository;

import com.hourlink.rating.entity.Rating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RatingRepository extends JpaRepository<Rating, UUID> {

    /** Kiểm tra user đã đánh giá appointment đó chưa */
    boolean existsByAppointmentIdAndFromUserId(UUID appointmentId, UUID fromUserId);

    /** Lấy danh sách đánh giá của một người (nhận đánh giá) */
    List<Rating> findByToUserIdOrderByCreatedAtDesc(UUID toUserId);

    /** Tính điểm trung bình của user */
    @Query("SELECT COALESCE(AVG(r.score), 0.0) FROM Rating r WHERE r.toUser.id = :userId")
    double calculateAverageScore(@Param("userId") UUID userId);

    /** Đếm số rating của một appointment */
    long countByAppointmentId(UUID appointmentId);

    /** Đếm tổng số đánh giá mà user nhận được */
    long countByToUserId(UUID toUserId);

    /** Lấy đánh giá cụ thể (by appointment + from user) để kiểm tra hasRated */
    boolean existsByAppointmentIdAndFromUserIdAndToUserId(UUID appointmentId, UUID fromUserId, UUID toUserId);
}
