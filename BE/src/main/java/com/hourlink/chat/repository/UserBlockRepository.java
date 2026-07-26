package com.hourlink.chat.repository;

import com.hourlink.chat.entity.UserBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * UserBlockRepository — Truy vấn DB cho chức năng chặn người dùng (9.10).
 */
@Repository
public interface UserBlockRepository extends JpaRepository<UserBlock, UUID> {

    /** Tôi có đang chặn người này không */
    boolean existsByBlocker_IdAndBlocked_Id(UUID blockerId, UUID blockedId);

    /** Lấy bản ghi chặn cụ thể (dùng khi bỏ chặn) */
    Optional<UserBlock> findByBlocker_IdAndBlocked_Id(UUID blockerId, UUID blockedId);

    /** Danh sách người tôi đã chặn */
    List<UserBlock> findAllByBlocker_EmailOrderByCreatedAtDesc(String blockerEmail);

    /**
     * Kiểm tra chặn HAI CHIỀU giữa hai người dùng.
     * Trả về true nếu một trong hai đã chặn người còn lại — khi đó không ai
     * gửi được tin nhắn mới, đúng yêu cầu "chặn và không nhận tin nhắn mới".
     */
    @Query("""
            SELECT COUNT(b) > 0 FROM UserBlock b
            WHERE (b.blocker.id = :userA AND b.blocked.id = :userB)
               OR (b.blocker.id = :userB AND b.blocked.id = :userA)
            """)
    boolean existsBlockBetween(@Param("userA") UUID userA, @Param("userB") UUID userB);
}
