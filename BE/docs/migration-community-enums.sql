-- Chạy script này để vá lỗi kiểu dữ liệu ENUM cứng trong MySQL do Hibernate sinh ra từ trước.
-- Hibernate 6+ tự động tạo ENUM trong MySQL, khi đổi giá trị Enum trong Java, MySQL sẽ báo lỗi Data truncated.
-- Script này chuyển đổi các cột status liên quan đến Community sang VARCHAR(20) để an toàn và đồng bộ với @Enumerated(EnumType.STRING).

ALTER TABLE community_activity MODIFY status VARCHAR(20) NOT NULL;
ALTER TABLE activity_participant MODIFY status VARCHAR(20) NOT NULL;
