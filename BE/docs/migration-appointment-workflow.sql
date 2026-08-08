-- =============================================================
-- Đồng bộ quyền đề xuất và tính duy nhất của xác nhận lịch hẹn.
-- Có thể chạy lại an toàn trên CSDL đã được Hibernate bổ sung một phần schema.
-- =============================================================

SET @has_proposed_by := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'appointment'
      AND column_name = 'proposed_by'
);
SET @appointment_ddl := IF(
    @has_proposed_by = 0,
    'ALTER TABLE appointment ADD COLUMN proposed_by BINARY(16) NULL, ADD KEY idx_appointment_proposed_by (proposed_by), ADD CONSTRAINT fk_appointment_proposed_by FOREIGN KEY (proposed_by) REFERENCES users (id)',
    'SELECT 1'
);
PREPARE appointment_stmt FROM @appointment_ddl;
EXECUTE appointment_stmt;
DEALLOCATE PREPARE appointment_stmt;

SET @has_generated_by := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'appointment_verification'
      AND column_name = 'generated_by'
);
SET @verification_ddl := IF(
    @has_generated_by = 0,
    'ALTER TABLE appointment_verification ADD COLUMN generated_by BINARY(16) NULL, ADD KEY idx_verification_generated_by (generated_by), ADD CONSTRAINT fk_verification_generated_by FOREIGN KEY (generated_by) REFERENCES users (id)',
    'SELECT 1'
);
PREPARE verification_stmt FROM @verification_ddl;
EXECUTE verification_stmt;
DEALLOCATE PREPARE verification_stmt;

-- Card lịch hẹn lưu đúng người tạo đề xuất, dùng để backfill dữ liệu cũ.
UPDATE appointment a
JOIN (
    SELECT appointment_id, sender_id
    FROM (
        SELECT appointment_id, sender_id,
               ROW_NUMBER() OVER (PARTITION BY appointment_id ORDER BY created_at, id) AS row_num
        FROM chat_message
        WHERE type = 'APPOINTMENT_CARD'
          AND appointment_id IS NOT NULL
    ) ranked_cards
    WHERE row_num = 1
) first_card ON first_card.appointment_id = a.id
SET a.proposed_by = first_card.sender_id
WHERE a.proposed_by IS NULL
  AND first_card.sender_id IN (a.provider_id, a.receiver_id);

-- Giữ bản xác nhận đầu tiên nếu dữ liệu cũ từng bị ghi trùng.
DELETE duplicate_completion
FROM appointment_completion duplicate_completion
JOIN appointment_completion original_completion
  ON original_completion.appointment_id = duplicate_completion.appointment_id
 AND original_completion.user_id = duplicate_completion.user_id
 AND (
      original_completion.created_at < duplicate_completion.created_at
      OR (
          original_completion.created_at = duplicate_completion.created_at
          AND original_completion.id < duplicate_completion.id
      )
 );

SET @has_completion_unique := (
    SELECT COUNT(*) FROM information_schema.table_constraints
    WHERE table_schema = DATABASE()
      AND table_name = 'appointment_completion'
      AND constraint_name = 'uq_completion_appointment_user'
      AND constraint_type = 'UNIQUE'
);
SET @completion_ddl := IF(
    @has_completion_unique = 0,
    'ALTER TABLE appointment_completion ADD CONSTRAINT uq_completion_appointment_user UNIQUE (appointment_id, user_id)',
    'SELECT 1'
);
PREPARE completion_stmt FROM @completion_ddl;
EXECUTE completion_stmt;
DEALLOCATE PREPARE completion_stmt;
