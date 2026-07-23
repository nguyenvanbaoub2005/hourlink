-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Máy chủ: mysql_db:3306
-- Thời gian đã tạo: Th7 23, 2026 lúc 12:49 PM
-- Phiên bản máy phục vụ: 8.0.40
-- Phiên bản PHP: 8.3.31

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `hourlink_db`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `activity_participant`
--

CREATE TABLE `activity_participant` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `admin_action_log`
--

CREATE TABLE `admin_action_log` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `ai_match_suggestion`
--

CREATE TABLE `ai_match_suggestion` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `appointment`
--

CREATE TABLE `appointment` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `appointment_completion`
--

CREATE TABLE `appointment_completion` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `appointment_verification`
--

CREATE TABLE `appointment_verification` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `badge`
--

CREATE TABLE `badge` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `chat_message`
--

CREATE TABLE `chat_message` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `chat_report`
--

CREATE TABLE `chat_report` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `community_activity`
--

CREATE TABLE `community_activity` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `conversation`
--

CREATE TABLE `conversation` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `dispute`
--

CREATE TABLE `dispute` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `help_request`
--

CREATE TABLE `help_request` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `invalidated_token`
--

CREATE TABLE `invalidated_token` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiry_time` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `invitation`
--

CREATE TABLE `invitation` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `notification`
--

CREATE TABLE `notification` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `organization_profile`
--

CREATE TABLE `organization_profile` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `rating`
--

CREATE TABLE `rating` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `report`
--

CREATE TABLE `report` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `role`
--

CREATE TABLE `role` (
  `role_id` binary(16) NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `role`
--

INSERT INTO `role` (`role_id`, `description`, `role_code`, `role_name`) VALUES
(0x4107dd7176f748f6b64c4d6cdabd69fa, 'Quyền người dùng cá nhân (Individual)', 'ROLE_USER', 'USER'),
(0x5138a9ca46224184813cc48a40144622, 'Quyền quản trị viên hệ thống', 'ROLE_ADMIN', 'ADMIN'),
(0x7885969a572a4ae6a15ebf70afb5898e, 'Quyền tổ chức / CLB / Trường học', 'ROLE_ORGANIZATION', 'ORGANIZATION');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `skill`
--

CREATE TABLE `skill` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `skill_attachment`
--

CREATE TABLE `skill_attachment` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `skill_category`
--

CREATE TABLE `skill_category` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `system_stat_snapshot`
--

CREATE TABLE `system_stat_snapshot` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `users`
--

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
  `user_type` enum('individual','organization','admin') COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `users`
--

INSERT INTO `users` (`id`, `created_at`, `updated_at`, `avatar_url`, `bio`, `cancel_rate`, `completed_sessions`, `dob`, `email`, `full_name`, `is_locked`, `is_verified`, `languages`, `occupation`, `password_hash`, `phone`, `region`, `reputation_score`, `user_type`) VALUES
(0x136897af6f7b4994a0ae246fc2e4b3d6, '2026-07-22 17:31:45.204020', '2026-07-22 17:31:45.204020', NULL, NULL, 0, 0, NULL, 'huuviet199@gmail.com', 'Nguyễn Văn A', b'0', b'0', NULL, NULL, '$2a$10$KbphlgTkW0y88r/8Vswj8uQjADLxhsHvyKz8Q/.Equ7DEry69q1Te', '0123456789', NULL, 5, 'individual'),
(0x69ee44a7efb04b90b91c402047ecd8c7, '2026-07-22 17:28:34.174450', '2026-07-22 17:28:34.174450', NULL, NULL, 0, 0, NULL, 'admin@hourlink.vn', 'Admin Hệ Thống', b'0', b'0', NULL, NULL, '$2a$10$J4eKqP3el5YLf.iUYUvHs.vMjClYsnIllrJIkzIODeJtWMmYsK.7i', '0999999999', NULL, 5, 'individual');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `user_badge`
--

CREATE TABLE `user_badge` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `user_block`
--

CREATE TABLE `user_block` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `user_role`
--

CREATE TABLE `user_role` (
  `id` binary(16) NOT NULL,
  `assigned_at` datetime(6) DEFAULT NULL,
  `role_id` binary(16) NOT NULL,
  `user_id` binary(16) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `user_role`
--

INSERT INTO `user_role` (`id`, `assigned_at`, `role_id`, `user_id`) VALUES
(0x060bf97dc2b940b8bf454a935fb77328, '2026-07-23 00:28:34.203240', 0x5138a9ca46224184813cc48a40144622, 0x69ee44a7efb04b90b91c402047ecd8c7),
(0x87156da23eb04948b833482ecc733c95, '2026-07-23 00:31:45.223563', 0x4107dd7176f748f6b64c4d6cdabd69fa, 0x136897af6f7b4994a0ae246fc2e4b3d6);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `user_verification`
--

CREATE TABLE `user_verification` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `wallet`
--

CREATE TABLE `wallet` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `wallet_transaction`
--

CREATE TABLE `wallet_transaction` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `activity_participant`
--
ALTER TABLE `activity_participant`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `admin_action_log`
--
ALTER TABLE `admin_action_log`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `ai_match_suggestion`
--
ALTER TABLE `ai_match_suggestion`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `appointment`
--
ALTER TABLE `appointment`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `appointment_completion`
--
ALTER TABLE `appointment_completion`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `appointment_verification`
--
ALTER TABLE `appointment_verification`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `badge`
--
ALTER TABLE `badge`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `chat_message`
--
ALTER TABLE `chat_message`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `chat_report`
--
ALTER TABLE `chat_report`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `community_activity`
--
ALTER TABLE `community_activity`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `conversation`
--
ALTER TABLE `conversation`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `dispute`
--
ALTER TABLE `dispute`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `help_request`
--
ALTER TABLE `help_request`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `invalidated_token`
--
ALTER TABLE `invalidated_token`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `invitation`
--
ALTER TABLE `invitation`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `notification`
--
ALTER TABLE `notification`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `organization_profile`
--
ALTER TABLE `organization_profile`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `rating`
--
ALTER TABLE `rating`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `report`
--
ALTER TABLE `report`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `role`
--
ALTER TABLE `role`
  ADD PRIMARY KEY (`role_id`),
  ADD UNIQUE KEY `UK_sdrtot4l6mbqfv3s0xp4x8eay` (`role_code`);

--
-- Chỉ mục cho bảng `skill`
--
ALTER TABLE `skill`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `skill_attachment`
--
ALTER TABLE `skill_attachment`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `skill_category`
--
ALTER TABLE `skill_category`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `system_stat_snapshot`
--
ALTER TABLE `system_stat_snapshot`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_user_email` (`email`),
  ADD UNIQUE KEY `idx_user_phone` (`phone`),
  ADD KEY `idx_user_type` (`user_type`);

--
-- Chỉ mục cho bảng `user_badge`
--
ALTER TABLE `user_badge`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `user_block`
--
ALTER TABLE `user_block`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `user_role`
--
ALTER TABLE `user_role`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FKa68196081fvovjhkek5m97n3y` (`role_id`),
  ADD KEY `FKj345gk1bovqvfame88rcx7yyx` (`user_id`);

--
-- Chỉ mục cho bảng `user_verification`
--
ALTER TABLE `user_verification`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `wallet`
--
ALTER TABLE `wallet`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `wallet_transaction`
--
ALTER TABLE `wallet_transaction`
  ADD PRIMARY KEY (`id`);

--
-- Ràng buộc đối với các bảng kết xuất
--

--
-- Ràng buộc cho bảng `user_role`
--
ALTER TABLE `user_role`
  ADD CONSTRAINT `FKa68196081fvovjhkek5m97n3y` FOREIGN KEY (`role_id`) REFERENCES `role` (`role_id`),
  ADD CONSTRAINT `FKj345gk1bovqvfame88rcx7yyx` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
