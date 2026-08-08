-- =============================================================
-- Chat trực tiếp giữa người tham gia và tổ chức hoạt động cộng đồng
-- Chạy một lần trên CSDL hiện có trước khi dùng endpoint mới.
-- =============================================================

-- Hội thoại cộng đồng không có invitation.
ALTER TABLE conversation
    MODIFY COLUMN invitation_id BINARY(16) NULL;

-- Phân biệt nguồn hội thoại; dữ liệu cũ mặc định là chat kỹ năng.
ALTER TABLE conversation
    ADD COLUMN source_type VARCHAR(30) NOT NULL DEFAULT 'SKILL_INVITATION',
    ADD COLUMN community_activity_id BINARY(16) NULL;

UPDATE conversation
SET source_type = 'SKILL_INVITATION'
WHERE source_type IS NULL;

ALTER TABLE conversation
    ADD KEY idx_conv_community_activity (community_activity_id),
    ADD CONSTRAINT fk_conv_community_activity
        FOREIGN KEY (community_activity_id) REFERENCES community_activity (id),
    ADD CONSTRAINT uq_conv_community_participant
        UNIQUE (community_activity_id, user_two_id);
