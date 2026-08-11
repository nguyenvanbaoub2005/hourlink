-- =============================================================
-- Migration cho chức năng 9.10 Chat
-- =============================================================
--
-- CHẠY FILE NÀY MỘT LẦN trên database đã tồn tại từ trước.
-- Database mới tinh thì KHÔNG cần — Hibernate sẽ tự tạo đúng.
--
-- LÝ DO CẦN MIGRATION:
-- `spring.jpa.hibernate.ddl-auto: update` chỉ THÊM bảng/cột mới,
-- nó KHÔNG BAO GIỜ sửa định nghĩa của cột đã tồn tại. Hibernate 6
-- sinh cột @Enumerated(EnumType.STRING) thành MySQL ENUM, nên khi
-- thêm giá trị mới vào enum Java mà không ALTER, MySQL sẽ báo:
--
--     Data truncated for column 'type' at row 1
--
-- Cách chạy:
--   docker exec -i hourlink_mysql mysql -uroot -proot hourlink_db < BE/docs/migration-9.10-chat.sql
--
-- =============================================================

-- -------------------------------------------------------------
-- notification.type — bổ sung 2 loại thông báo của module Chat
-- -------------------------------------------------------------
--
-- QUAN TRỌNG: hai giá trị mới được NỐI VÀO CUỐI, giữ nguyên thứ tự
-- các giá trị cũ. MySQL lưu ENUM theo chỉ số nội bộ, nên nếu đảo
-- thứ tự thì các bản ghi đang có sẽ bị ánh xạ sang giá trị khác.

ALTER TABLE `notification`
  MODIFY COLUMN `type` ENUM(
    'INVITATION_RECEIVED',
    'INVITATION_ACCEPTED',
    'INVITATION_REJECTED',
    'INVITATION_RESCHEDULED',
    'INVITATION_CANCELLED',
    'APPOINTMENT_REMINDER',
    'NEW_RATING',
    -- ↓ thêm mới cho chức năng 9.10
    'NEW_MESSAGE',
    'CHAT_RESCHEDULE_PROPOSED'
  ) COLLATE utf8mb4_unicode_ci NOT NULL;

-- -------------------------------------------------------------
-- Kiểm tra kết quả
-- -------------------------------------------------------------
-- Phải thấy đủ 9 giá trị, trong đó có NEW_MESSAGE và CHAT_RESCHEDULE_PROPOSED:

SELECT COLUMN_TYPE AS notification_type_sau_migration
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'notification'
  AND COLUMN_NAME = 'type';

-- -------------------------------------------------------------
-- chat_message.type & conversation.last_message_type
-- Bổ sung APPOINTMENT_CARD (Thẻ lịch hẹn)
-- -------------------------------------------------------------
ALTER TABLE `chat_message`
  MODIFY COLUMN `type` ENUM(
    'TEXT', 'IMAGE', 'DOCUMENT', 'LOCATION', 'MEETING_LINK', 'RESCHEDULE_PROPOSAL', 'SYSTEM',
    'APPOINTMENT_CARD' -- ↓ Thêm mới cho tính năng gửi thẻ lịch hẹn
  ) COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE `conversation`
  MODIFY COLUMN `last_message_type` ENUM(
    'TEXT', 'IMAGE', 'DOCUMENT', 'LOCATION', 'MEETING_LINK', 'RESCHEDULE_PROPOSAL', 'SYSTEM',
    'APPOINTMENT_CARD' -- ↓ Thêm mới cho tính năng gửi thẻ lịch hẹn
  ) COLLATE utf8mb4_unicode_ci DEFAULT NULL;

-- Ghi chú: Hãy cẩn thận khi thêm giá trị mới vào ENUM, phải luôn NỐI VÀO CUỐI cùng.
-- -------------------------------------------------------------
