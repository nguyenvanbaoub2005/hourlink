-- =============================================================
-- Migration cho module Wallet (chức năng 9.16 & 9.17)
-- =============================================================
--
-- CHẠY FILE NÀY MỘT LẦN trên database đang chạy.
-- Database mới tinh thì KHÔNG cần — Hibernate tự tạo đúng.
--
-- LÝ DO:
--   `ddl-auto: update` chỉ THÊM cột mới, không sửa ENUM hay xóa cột.
--   Bảng `wallet` và `wallet_transaction` hiện chỉ có 3 cột stub
--   (id, created_at, updated_at). Cần ALTER để thêm các cột nghiệp vụ.
--
-- Cách chạy:
--   docker exec -i hourlink_mysql mysql -uroot -proot hourlink_db < BE/docs/migration-wallet.sql
-- =============================================================

-- ─── wallet ──────────────────────────────────────────────────────────────────

ALTER TABLE `wallet`
  ADD COLUMN IF NOT EXISTS `user_id`      binary(16)     NOT NULL,
  ADD COLUMN IF NOT EXISTS `balance`      double         NOT NULL DEFAULT 5.0,
  ADD COLUMN IF NOT EXISTS `held_amount`  double         NOT NULL DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS `total_earned` double         NOT NULL DEFAULT 5.0,
  ADD COLUMN IF NOT EXISTS `total_used`   double         NOT NULL DEFAULT 0.0;

-- Index unique trên user_id (1 user = 1 wallet)
ALTER TABLE `wallet`
  ADD UNIQUE INDEX IF NOT EXISTS `idx_wallet_user` (`user_id`);

-- FK đến bảng users
ALTER TABLE `wallet`
  ADD CONSTRAINT IF NOT EXISTS `fk_wallet_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

-- ─── wallet_transaction ───────────────────────────────────────────────────────

ALTER TABLE `wallet_transaction`
  ADD COLUMN IF NOT EXISTS `wallet_id`      binary(16)     NOT NULL,
  ADD COLUMN IF NOT EXISTS `appointment_id` binary(16)     DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `type`           ENUM(
    'EARN', 'SPEND', 'HOLD', 'RELEASE', 'REFUND', 'BONUS', 'ADJUSTMENT'
  ) COLLATE utf8mb4_unicode_ci NOT NULL,
  ADD COLUMN IF NOT EXISTS `amount`         double         NOT NULL,
  ADD COLUMN IF NOT EXISTS `balance_after`  double         NOT NULL,
  ADD COLUMN IF NOT EXISTS `description`    text           COLLATE utf8mb4_unicode_ci DEFAULT NULL;

-- Indexes
ALTER TABLE `wallet_transaction`
  ADD INDEX IF NOT EXISTS `idx_wallet_tx_wallet`      (`wallet_id`),
  ADD INDEX IF NOT EXISTS `idx_wallet_tx_type`        (`type`),
  ADD INDEX IF NOT EXISTS `idx_wallet_tx_appointment` (`appointment_id`);

-- FK đến wallet và appointment
ALTER TABLE `wallet_transaction`
  ADD CONSTRAINT IF NOT EXISTS `fk_wallet_tx_wallet`
    FOREIGN KEY (`wallet_id`) REFERENCES `wallet` (`id`),
  ADD CONSTRAINT IF NOT EXISTS `fk_wallet_tx_appointment`
    FOREIGN KEY (`appointment_id`) REFERENCES `appointment` (`id`);

-- ─── Kiểm tra kết quả ────────────────────────────────────────────────────────

SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('wallet', 'wallet_transaction')
ORDER BY TABLE_NAME, ORDINAL_POSITION;
