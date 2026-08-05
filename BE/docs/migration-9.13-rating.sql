-- =============================================================
-- migration-9.13-rating.sql
-- Bổ sung các cột cho bảng rating (Task 32 - Rating form/API)
-- =============================================================

-- Thêm các cột cần thiết vào bảng rating
ALTER TABLE `rating`
  ADD COLUMN `appointment_id` binary(16) NOT NULL,
  ADD COLUMN `from_user_id`   binary(16) NOT NULL,
  ADD COLUMN `to_user_id`     binary(16) NOT NULL,
  ADD COLUMN `score`          INT NOT NULL COMMENT '1–5 sao',
  ADD COLUMN `comment`        TEXT,
  ADD CONSTRAINT `uq_rating_appointment_from` UNIQUE (`appointment_id`, `from_user_id`),
  ADD CONSTRAINT `fk_rating_appointment` FOREIGN KEY (`appointment_id`) REFERENCES `appointment`(`id`),
  ADD CONSTRAINT `fk_rating_from_user`  FOREIGN KEY (`from_user_id`)   REFERENCES `users`(`id`),
  ADD CONSTRAINT `fk_rating_to_user`    FOREIGN KEY (`to_user_id`)     REFERENCES `users`(`id`);

-- Kiểm tra kết quả
DESC `rating`;
