-- =============================================================
-- Migration cho tính năng quản lý Chat (9.10 nâng cao)
-- Thêm cờ Xóa/Thu hồi tin nhắn và Ẩn cuộc trò chuyện
-- =============================================================

-- 1. Bảng conversation
ALTER TABLE conversation
ADD COLUMN hidden_by_user_one BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN hidden_by_user_two BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Bảng chat_message
ALTER TABLE chat_message
ADD COLUMN is_recalled BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN hidden_by_sender BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN hidden_by_receiver BOOLEAN NOT NULL DEFAULT FALSE;
