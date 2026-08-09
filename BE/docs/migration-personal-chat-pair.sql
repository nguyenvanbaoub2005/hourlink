-- =============================================================
-- Một chat cá nhân duy nhất cho mỗi cặp người dùng
-- =============================================================
-- Chỉ cần chạy thủ công nếu môi trường production tắt ddl-auto=update.
-- Với cấu hình hiện tại, Hibernate tự thêm cột và unique key này.
-- Dữ liệu cũ được ChatConversationStartupMaintenance hợp nhất an toàn khi BE chạy.

ALTER TABLE conversation
    ADD COLUMN personal_pair_key VARCHAR(73) NULL;

ALTER TABLE conversation
    ADD CONSTRAINT uq_conv_personal_pair UNIQUE (personal_pair_key);

-- Chat SKILL_INVITATION sẽ có khóa; chat COMMUNITY_ACTIVITY luôn để NULL.
