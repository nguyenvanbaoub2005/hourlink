-- =============================================================
-- Đồng bộ bảng community_activity với entity/DTO hiện tại.
-- Cho phép hoạt động không giới hạn số người hoặc chưa có địa điểm.
-- =============================================================

ALTER TABLE community_activity
    MODIFY COLUMN title VARCHAR(200) NOT NULL,
    MODIFY COLUMN location VARCHAR(500) NULL,
    MODIFY COLUMN max_participants INT NULL;
