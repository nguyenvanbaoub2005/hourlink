-- =============================================================
-- HourLink — Cấu trúc cơ sở dữ liệu
-- =============================================================
--
-- Sinh bằng: mysqldump --no-data  (MySQL 8.0.40)
-- Ngày kết xuất: 26/07/2026
-- Cơ sở dữ liệu: hourlink_db
--
-- LƯU Ý QUAN TRỌNG:
-- File này được sinh TỰ ĐỘNG từ database do Hibernate tạo ra
-- (spring.jpa.hibernate.ddl-auto: update). Nó KHÔNG phải là bản
-- thiết kế và KHÔNG phải nguồn sự thật — nguồn sự thật là các
-- Entity trong BE/src/main/java/com/hourlink/**/entity/.
-- Dự án không dùng Flyway/Liquibase; chạy ứng dụng là schema tự
-- cập nhật. Hãy kết xuất lại file này sau mỗi lần đổi Entity.
--
-- Các bảng chỉ có 3 cột (id, created_at, updated_at) là những
-- module CHƯA triển khai — Entity của chúng vẫn còn là stub:
--   appointment, appointment_completion, appointment_verification,
--   wallet, wallet_transaction, rating, report, dispute,
--   community_activity, activity_participant, ai_match_suggestion,
--   admin_action_log, system_stat_snapshot, badge, user_badge,
--   organization_profile
--
-- Các module đã hoàn thiện: users, role, user_role, skill,
-- skill_category, skill_attachment, help_request, invitation,
-- notification, và chat (conversation, chat_message, user_block,
-- chat_report — chức năng 9.10).
-- =============================================================

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `activity_participant`
--

DROP TABLE IF EXISTS `activity_participant`;
CREATE TABLE `activity_participant` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `admin_action_log`
--

DROP TABLE IF EXISTS `admin_action_log`;
CREATE TABLE `admin_action_log` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `ai_match_suggestion`
--

DROP TABLE IF EXISTS `ai_match_suggestion`;
CREATE TABLE `ai_match_suggestion` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `appointment`
--

DROP TABLE IF EXISTS `appointment`;
CREATE TABLE `appointment` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `appointment_completion`
--

DROP TABLE IF EXISTS `appointment_completion`;
CREATE TABLE `appointment_completion` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `appointment_verification`
--

DROP TABLE IF EXISTS `appointment_verification`;
CREATE TABLE `appointment_verification` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `badge`
--

DROP TABLE IF EXISTS `badge`;
CREATE TABLE `badge` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `chat_message`
--

DROP TABLE IF EXISTS `chat_message`;
CREATE TABLE `chat_message` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `attachment_url` text COLLATE utf8mb4_unicode_ci,
  `content` text COLLATE utf8mb4_unicode_ci,
  `file_size` bigint DEFAULT NULL,
  `is_read` bit(1) NOT NULL,
  `latitude` double DEFAULT NULL,
  `location_label` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `meeting_link` text COLLATE utf8mb4_unicode_ci,
  `original_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `proposed_time` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `public_id` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` enum('TEXT','IMAGE','DOCUMENT','LOCATION','MEETING_LINK','RESCHEDULE_PROPOSAL','SYSTEM','APPOINTMENT_CARD') COLLATE utf8mb4_unicode_ci NOT NULL,
  `conversation_id` binary(16) NOT NULL,
  `sender_id` binary(16) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_msg_conversation` (`conversation_id`),
  KEY `idx_msg_sender` (`sender_id`),
  KEY `idx_msg_is_read` (`is_read`),
  CONSTRAINT `FK5f82aoyy0jiwpj08qapfrxbh6` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKkxe2b8q35d0baph3krucvraif` FOREIGN KEY (`conversation_id`) REFERENCES `conversation` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `chat_report`
--

DROP TABLE IF EXISTS `chat_report`;
CREATE TABLE `chat_report` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `message_snapshot` text COLLATE utf8mb4_unicode_ci,
  `reason` enum('OFFENSIVE','HARASSMENT','SPAM','SCAM','OUTSIDE_PAYMENT','ASK_CREDENTIALS','OTHER') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('PENDING','REVIEWED','DISMISSED','ACTIONED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `message_id` binary(16) NOT NULL,
  `reported_user_id` binary(16) NOT NULL,
  `reporter_id` binary(16) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_chat_report_reporter` (`reporter_id`),
  KEY `idx_chat_report_message` (`message_id`),
  KEY `idx_chat_report_status` (`status`),
  KEY `FK1u1ml6efyho1l3e77sjnijvfm` (`reported_user_id`),
  CONSTRAINT `FK1u1ml6efyho1l3e77sjnijvfm` FOREIGN KEY (`reported_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKj1mswcysssrv1tplcmux6059f` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKp9f4qt34860jkeqgatjujb3f4` FOREIGN KEY (`message_id`) REFERENCES `chat_message` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `community_activity`
--

DROP TABLE IF EXISTS `community_activity`;
CREATE TABLE `community_activity` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `conversation`
--

DROP TABLE IF EXISTS `conversation`;
CREATE TABLE `conversation` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `is_active` bit(1) NOT NULL,
  `last_message_at` datetime(6) DEFAULT NULL,
  `last_message_preview` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_message_type` enum('TEXT','IMAGE','DOCUMENT','LOCATION','MEETING_LINK','RESCHEDULE_PROPOSAL','SYSTEM','APPOINTMENT_CARD') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `invitation_id` binary(16) NOT NULL,
  `user_one_id` binary(16) NOT NULL,
  `user_two_id` binary(16) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_byi48c9ila505ym91070w8p8w` (`invitation_id`),
  KEY `idx_conv_user_one` (`user_one_id`),
  KEY `idx_conv_user_two` (`user_two_id`),
  KEY `idx_conv_last_msg_at` (`last_message_at`),
  CONSTRAINT `FK8slpnuw5t8h7txstf14mjf8rm` FOREIGN KEY (`user_one_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKc8qbn14nnh1aibcvklpisgemu` FOREIGN KEY (`user_two_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKe2nmbb7o1eb9krcciq7t4gy8u` FOREIGN KEY (`invitation_id`) REFERENCES `invitation` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `dispute`
--

DROP TABLE IF EXISTS `dispute`;
CREATE TABLE `dispute` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `help_request`
--

DROP TABLE IF EXISTS `help_request`;
CREATE TABLE `help_request` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `current_level` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `desired_time` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duration` int DEFAULT NULL,
  `format` enum('ONLINE','OFFLINE','BOTH') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `region` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('SEARCHING','ASSIGNED','COMPLETED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `time_credit_amount` int NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category_id` binary(16) DEFAULT NULL,
  `requester_id` binary(16) NOT NULL,
  `response_count` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK7sb0yb2j9qmxl72b9s7tmsebn` (`category_id`),
  KEY `FKax766wi8rq1c0m6tmtucn6u8f` (`requester_id`),
  CONSTRAINT `FK7sb0yb2j9qmxl72b9s7tmsebn` FOREIGN KEY (`category_id`) REFERENCES `skill_category` (`id`),
  CONSTRAINT `FKax766wi8rq1c0m6tmtucn6u8f` FOREIGN KEY (`requester_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `invalidated_token`
--

DROP TABLE IF EXISTS `invalidated_token`;
CREATE TABLE `invalidated_token` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiry_time` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `invitation`
--

DROP TABLE IF EXISTS `invitation`;
CREATE TABLE `invitation` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `duration` int DEFAULT NULL,
  `format` enum('ONLINE','OFFLINE','BOTH') COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci,
  `proposed_time` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reject_reason` text COLLATE utf8mb4_unicode_ci,
  `reschedule_time` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('PENDING','ACCEPTED','REJECTED','CANCELLED','RESCHEDULED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `help_request_id` binary(16) DEFAULT NULL,
  `receiver_id` binary(16) NOT NULL,
  `sender_id` binary(16) NOT NULL,
  `skill_id` binary(16) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_invitation_sender` (`sender_id`),
  KEY `idx_invitation_receiver` (`receiver_id`),
  KEY `idx_invitation_status` (`status`),
  KEY `FKls6ef5l46odhf81s8pxmdvi0w` (`help_request_id`),
  KEY `FKmffv4xjo5j1d3re3034fpblop` (`skill_id`),
  CONSTRAINT `FK8qamsp0em5ub7edqfww44h3ix` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKgnf21don63dhi6kd84yy9uqx2` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKls6ef5l46odhf81s8pxmdvi0w` FOREIGN KEY (`help_request_id`) REFERENCES `help_request` (`id`),
  CONSTRAINT `FKmffv4xjo5j1d3re3034fpblop` FOREIGN KEY (`skill_id`) REFERENCES `skill` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `notification`
--

DROP TABLE IF EXISTS `notification`;
CREATE TABLE `notification` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `body` text COLLATE utf8mb4_unicode_ci,
  `is_read` bit(1) NOT NULL,
  `reference_id` binary(16) DEFAULT NULL,
  `title` varchar(200) NOT NULL,
  `type` enum('INVITATION_RECEIVED','INVITATION_ACCEPTED','INVITATION_REJECTED','INVITATION_RESCHEDULED','INVITATION_CANCELLED','APPOINTMENT_REMINDER','NEW_RATING','NEW_MESSAGE','CHAT_RESCHEDULE_PROPOSED','APPOINTMENT_CREATED','APPOINTMENT_CONFIRMED','APPOINTMENT_CANCELLED','APPOINTMENT_RESCHEDULED','APPOINTMENT_COMPLETED') NOT NULL,
  `actor_id` binary(16) DEFAULT NULL,
  `user_id` binary(16) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_notif_user` (`user_id`),
  KEY `idx_notif_is_read` (`is_read`),
  CONSTRAINT `FKnk4ftb5am9ubmkv1661h15ds9` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `organization_profile`
--

DROP TABLE IF EXISTS `organization_profile`;
CREATE TABLE `organization_profile` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `rating`
--

DROP TABLE IF EXISTS `rating`;
CREATE TABLE `rating` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `report`
--

DROP TABLE IF EXISTS `report`;
CREATE TABLE `report` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `role`
--

DROP TABLE IF EXISTS `role`;
CREATE TABLE `role` (
  `role_id` binary(16) NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`role_id`),
  UNIQUE KEY `UK_sdrtot4l6mbqfv3s0xp4x8eay` (`role_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `skill`
--

DROP TABLE IF EXISTS `skill`;
CREATE TABLE `skill` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `duration` int DEFAULT NULL,
  `format` enum('ONLINE','OFFLINE','BOTH') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `level` enum('BEGINNER','INTERMEDIATE','ADVANCED','EXPERT') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `region` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('VISIBLE','HIDDEN') COLLATE utf8mb4_unicode_ci NOT NULL,
  `category_id` binary(16) DEFAULT NULL,
  `user_id` binary(16) NOT NULL,
  `free_time` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK9aoaclqrmkwbv9umbbwlo5x9s` (`category_id`),
  KEY `FKohg89pau976dm4s904dadgqhl` (`user_id`),
  CONSTRAINT `FK9aoaclqrmkwbv9umbbwlo5x9s` FOREIGN KEY (`category_id`) REFERENCES `skill_category` (`id`),
  CONSTRAINT `FKohg89pau976dm4s904dadgqhl` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `skill_attachment`
--

DROP TABLE IF EXISTS `skill_attachment`;
CREATE TABLE `skill_attachment` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `file_size` bigint DEFAULT NULL,
  `file_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_url` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `public_id` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `skill_id` binary(16) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKimdg793mi11j0s4x4uspxebfs` (`skill_id`),
  CONSTRAINT `FKimdg793mi11j0s4x4uspxebfs` FOREIGN KEY (`skill_id`) REFERENCES `skill` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `skill_category`
--

DROP TABLE IF EXISTS `skill_category`;
CREATE TABLE `skill_category` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `system_stat_snapshot`
--

DROP TABLE IF EXISTS `system_stat_snapshot`;
CREATE TABLE `system_stat_snapshot` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `user_badge`
--

DROP TABLE IF EXISTS `user_badge`;
CREATE TABLE `user_badge` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `user_block`
--

DROP TABLE IF EXISTS `user_block`;
CREATE TABLE `user_block` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci,
  `blocked_id` binary(16) NOT NULL,
  `blocker_id` binary(16) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_block_pair` (`blocker_id`,`blocked_id`),
  KEY `idx_block_blocker` (`blocker_id`),
  KEY `idx_block_blocked` (`blocked_id`),
  CONSTRAINT `FKcq98e7xnnyx515oob3gi6p4ig` FOREIGN KEY (`blocker_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKisl1bda7awqgr4u3t6fkjgeyi` FOREIGN KEY (`blocked_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `user_role`
--

DROP TABLE IF EXISTS `user_role`;
CREATE TABLE `user_role` (
  `id` binary(16) NOT NULL,
  `assigned_at` datetime(6) DEFAULT NULL,
  `role_id` binary(16) NOT NULL,
  `user_id` binary(16) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKa68196081fvovjhkek5m97n3y` (`role_id`),
  KEY `FKj345gk1bovqvfame88rcx7yyx` (`user_id`),
  CONSTRAINT `FKa68196081fvovjhkek5m97n3y` FOREIGN KEY (`role_id`) REFERENCES `role` (`role_id`),
  CONSTRAINT `FKj345gk1bovqvfame88rcx7yyx` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `user_verification`
--

DROP TABLE IF EXISTS `user_verification`;
CREATE TABLE `user_verification` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `avatar_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bio` text COLLATE utf8mb4_unicode_ci,
  `cancel_rate` double NOT NULL,
  `completed_sessions` int NOT NULL,
  `dob` date DEFAULT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_locked` bit(1) NOT NULL,
  `is_verified` bit(1) NOT NULL,
  `languages` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `occupation` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `region` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reputation_score` double NOT NULL,
  `user_type` enum('individual','organization','admin') COLLATE utf8mb4_unicode_ci NOT NULL,
  `auth_provider` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `provider_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_email` (`email`),
  UNIQUE KEY `idx_user_phone` (`phone`),
  KEY `idx_user_type` (`user_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `wallet`
--

DROP TABLE IF EXISTS `wallet`;
CREATE TABLE `wallet` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `wallet_transaction`
--

DROP TABLE IF EXISTS `wallet_transaction`;
CREATE TABLE `wallet_transaction` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
