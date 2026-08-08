-- Seed Data cho bảng Users và User_Role
-- Chạy file này trên phpMyAdmin của HourLink

SET FOREIGN_KEY_CHECKS = 0;

INSERT INTO users (
        id, full_name, email, phone, password_hash, dob, region, occupation, user_type, 
        is_verified, is_locked, is_deleted, reputation_score, completed_sessions, cancel_rate, warning_count,
        created_at, updated_at
    ) VALUES (
        UUID_TO_BIN('537f1f31-965b-4fbc-9e2f-699850c26259'), 
        'Phan Thị Hà', 'user1_897@hourlink.vn', '0940000001', '$2b$10$uF4WlmUmwP5Ca8xe0w8b7.yrlZ3djORxSDm71jI17i.bsGbWL12Ja', '1994-09-22', 'Huế', 'Kỹ sư', 'individual',
        1, 0, 0, 3.3, 0, 2.4, 0,
        NOW(), NOW()
    );
INSERT INTO user_role (
        id, user_id, role_id, assigned_at
    ) VALUES (
        UUID_TO_BIN('6fde81b4-5fe9-4638-831e-20889e25a27e'),
        UUID_TO_BIN('537f1f31-965b-4fbc-9e2f-699850c26259'),
        (SELECT id FROM role WHERE role_code = 'ROLE_USER'),
        NOW()
    );

INSERT INTO users (
        id, full_name, email, phone, password_hash, dob, region, occupation, user_type, 
        is_verified, is_locked, is_deleted, reputation_score, completed_sessions, cancel_rate, warning_count,
        created_at, updated_at
    ) VALUES (
        UUID_TO_BIN('22acf721-a3fa-4a4b-a275-eb1fcd68059a'), 
        'Huỳnh Hồng Tuấn', 'user2_718@hourlink.vn', '0910000002', '$2b$10$uF4WlmUmwP5Ca8xe0w8b7.yrlZ3djORxSDm71jI17i.bsGbWL12Ja', '1988-04-14', 'Huế', 'Thiết kế đồ hoạ', 'organization',
        0, 0, 0, 4.7, 25, 0.4, 0,
        NOW(), NOW()
    );
INSERT INTO user_role (
        id, user_id, role_id, assigned_at
    ) VALUES (
        UUID_TO_BIN('b80f323f-c962-4a43-b262-737da6f95891'),
        UUID_TO_BIN('22acf721-a3fa-4a4b-a275-eb1fcd68059a'),
        (SELECT id FROM role WHERE role_code = 'ROLE_USER'),
        NOW()
    );

INSERT INTO users (
        id, full_name, email, phone, password_hash, dob, region, occupation, user_type, 
        is_verified, is_locked, is_deleted, reputation_score, completed_sessions, cancel_rate, warning_count,
        created_at, updated_at
    ) VALUES (
        UUID_TO_BIN('3a845bfe-b516-40dc-ab55-c7756e2f6deb'), 
        'Ngô Đức Dũng', 'user3_6906@hourlink.vn', '0910000003', '$2b$10$uF4WlmUmwP5Ca8xe0w8b7.yrlZ3djORxSDm71jI17i.bsGbWL12Ja', '1983-09-18', 'Hải Phòng', 'Marketing', 'individual',
        1, 0, 0, 3.1, 27, 1.3, 0,
        NOW(), NOW()
    );
INSERT INTO user_role (
        id, user_id, role_id, assigned_at
    ) VALUES (
        UUID_TO_BIN('b70de3c4-c6eb-42d0-8f14-22e91c2b3306'),
        UUID_TO_BIN('3a845bfe-b516-40dc-ab55-c7756e2f6deb'),
        (SELECT id FROM role WHERE role_code = 'ROLE_USER'),
        NOW()
    );

INSERT INTO users (
        id, full_name, email, phone, password_hash, dob, region, occupation, user_type, 
        is_verified, is_locked, is_deleted, reputation_score, completed_sessions, cancel_rate, warning_count,
        created_at, updated_at
    ) VALUES (
        UUID_TO_BIN('2a6693ee-7972-4b3e-b2db-3ed0cb14bdab'), 
        'Ngô Quang Nhung', 'user4_9055@hourlink.vn', '0910000004', '$2b$10$uF4WlmUmwP5Ca8xe0w8b7.yrlZ3djORxSDm71jI17i.bsGbWL12Ja', '1990-07-25', 'Cần Thơ', 'Kinh doanh tự do', 'organization',
        1, 0, 0, 3.5, 44, 0.8, 0,
        NOW(), NOW()
    );
INSERT INTO user_role (
        id, user_id, role_id, assigned_at
    ) VALUES (
        UUID_TO_BIN('2754b55d-8b20-4227-953f-7cc97661b17f'),
        UUID_TO_BIN('2a6693ee-7972-4b3e-b2db-3ed0cb14bdab'),
        (SELECT id FROM role WHERE role_code = 'ROLE_USER'),
        NOW()
    );

INSERT INTO users (
        id, full_name, email, phone, password_hash, dob, region, occupation, user_type, 
        is_verified, is_locked, is_deleted, reputation_score, completed_sessions, cancel_rate, warning_count,
        created_at, updated_at
    ) VALUES (
        UUID_TO_BIN('a483d142-4d6c-4169-be97-3771f8b98587'), 
        'Huỳnh Hoàng Hoa', 'user5_3129@hourlink.vn', '0900000005', '$2b$10$uF4WlmUmwP5Ca8xe0w8b7.yrlZ3djORxSDm71jI17i.bsGbWL12Ja', '1996-05-22', 'Hải Phòng', 'Lập trình viên', 'organization',
        1, 0, 0, 4.9, 10, 4.6, 0,
        NOW(), NOW()
    );
INSERT INTO user_role (
        id, user_id, role_id, assigned_at
    ) VALUES (
        UUID_TO_BIN('08298ec5-a93b-4e9d-b028-1667c6d7dfa3'),
        UUID_TO_BIN('a483d142-4d6c-4169-be97-3771f8b98587'),
        (SELECT id FROM role WHERE role_code = 'ROLE_USER'),
        NOW()
    );

INSERT INTO users (
        id, full_name, email, phone, password_hash, dob, region, occupation, user_type, 
        is_verified, is_locked, is_deleted, reputation_score, completed_sessions, cancel_rate, warning_count,
        created_at, updated_at
    ) VALUES (
        UUID_TO_BIN('66c83997-e0e1-4df5-be1a-c98c2224f006'), 
        'Hoàng Bảo Phúc', 'user6_2846@hourlink.vn', '0920000006', '$2b$10$uF4WlmUmwP5Ca8xe0w8b7.yrlZ3djORxSDm71jI17i.bsGbWL12Ja', '1994-07-12', 'Huế', 'Lập trình viên', 'individual',
        1, 0, 0, 3.8, 39, 2.2, 0,
        NOW(), NOW()
    );
INSERT INTO user_role (
        id, user_id, role_id, assigned_at
    ) VALUES (
        UUID_TO_BIN('199e62f7-2982-4f57-bf45-c36c4d387025'),
        UUID_TO_BIN('66c83997-e0e1-4df5-be1a-c98c2224f006'),
        (SELECT id FROM role WHERE role_code = 'ROLE_USER'),
        NOW()
    );

INSERT INTO users (
        id, full_name, email, phone, password_hash, dob, region, occupation, user_type, 
        is_verified, is_locked, is_deleted, reputation_score, completed_sessions, cancel_rate, warning_count,
        created_at, updated_at
    ) VALUES (
        UUID_TO_BIN('770e81fc-2322-406c-aa07-cb55c00599ea'), 
        'Đỗ Hồng Hoa', 'user7_3143@hourlink.vn', '0900000007', '$2b$10$uF4WlmUmwP5Ca8xe0w8b7.yrlZ3djORxSDm71jI17i.bsGbWL12Ja', '1985-04-06', 'Nha Trang', 'Kỹ sư', 'individual',
        1, 0, 0, 4.5, 4, 1.2, 1,
        NOW(), NOW()
    );
INSERT INTO user_role (
        id, user_id, role_id, assigned_at
    ) VALUES (
        UUID_TO_BIN('7b5744f3-a2f1-42be-9c3e-29898b8f1aa3'),
        UUID_TO_BIN('770e81fc-2322-406c-aa07-cb55c00599ea'),
        (SELECT id FROM role WHERE role_code = 'ROLE_USER'),
        NOW()
    );

INSERT INTO users (
        id, full_name, email, phone, password_hash, dob, region, occupation, user_type, 
        is_verified, is_locked, is_deleted, reputation_score, completed_sessions, cancel_rate, warning_count,
        created_at, updated_at
    ) VALUES (
        UUID_TO_BIN('0aad5567-19d5-4717-95f2-44a1ef97f39c'), 
        'Ngô Thị Tùng', 'user8_6204@hourlink.vn', '0920000008', '$2b$10$uF4WlmUmwP5Ca8xe0w8b7.yrlZ3djORxSDm71jI17i.bsGbWL12Ja', '1985-11-26', 'Huế', 'Marketing', 'individual',
        1, 0, 0, 3.9, 48, 4.0, 0,
        NOW(), NOW()
    );
INSERT INTO user_role (
        id, user_id, role_id, assigned_at
    ) VALUES (
        UUID_TO_BIN('2af9648f-ad32-46c7-8732-f2ce358d8c26'),
        UUID_TO_BIN('0aad5567-19d5-4717-95f2-44a1ef97f39c'),
        (SELECT id FROM role WHERE role_code = 'ROLE_USER'),
        NOW()
    );

INSERT INTO users (
        id, full_name, email, phone, password_hash, dob, region, occupation, user_type, 
        is_verified, is_locked, is_deleted, reputation_score, completed_sessions, cancel_rate, warning_count,
        created_at, updated_at
    ) VALUES (
        UUID_TO_BIN('7070f8a7-70b9-4008-8ddd-0819ced28f45'), 
        'Vũ Hoàng Tâm', 'user9_899@hourlink.vn', '0980000009', '$2b$10$uF4WlmUmwP5Ca8xe0w8b7.yrlZ3djORxSDm71jI17i.bsGbWL12Ja', '1995-06-06', 'TP. Hồ Chí Minh', 'Giáo viên', 'organization',
        0, 0, 0, 3.4, 33, 1.8, 1,
        NOW(), NOW()
    );
INSERT INTO user_role (
        id, user_id, role_id, assigned_at
    ) VALUES (
        UUID_TO_BIN('e5b74ac2-fb17-4b04-9cfa-f2f835ad941d'),
        UUID_TO_BIN('7070f8a7-70b9-4008-8ddd-0819ced28f45'),
        (SELECT id FROM role WHERE role_code = 'ROLE_USER'),
        NOW()
    );

INSERT INTO users (
        id, full_name, email, phone, password_hash, dob, region, occupation, user_type, 
        is_verified, is_locked, is_deleted, reputation_score, completed_sessions, cancel_rate, warning_count,
        created_at, updated_at
    ) VALUES (
        UUID_TO_BIN('6c132944-ec8f-4aab-930b-40c0d5393e76'), 
        'Trần Đức Sơn', 'user10_5538@hourlink.vn', '0960000010', '$2b$10$uF4WlmUmwP5Ca8xe0w8b7.yrlZ3djORxSDm71jI17i.bsGbWL12Ja', '1998-01-20', 'Đà Nẵng', 'Thiết kế đồ hoạ', 'organization',
        1, 0, 0, 4.8, 44, 2.3, 0,
        NOW(), NOW()
    );
INSERT INTO user_role (
        id, user_id, role_id, assigned_at
    ) VALUES (
        UUID_TO_BIN('3e3c05e5-87af-4a80-a497-93eae82d1702'),
        UUID_TO_BIN('6c132944-ec8f-4aab-930b-40c0d5393e76'),
        (SELECT id FROM role WHERE role_code = 'ROLE_USER'),
        NOW()
    );

INSERT INTO users (
        id, full_name, email, phone, password_hash, dob, region, occupation, user_type, 
        is_verified, is_locked, is_deleted, reputation_score, completed_sessions, cancel_rate, warning_count,
        created_at, updated_at
    ) VALUES (
        UUID_TO_BIN('b88cfe7f-655b-443b-b333-54b42fcc221c'), 
        'Hoàng Hồng Tâm', 'user11_3945@hourlink.vn', '0940000011', '$2b$10$uF4WlmUmwP5Ca8xe0w8b7.yrlZ3djORxSDm71jI17i.bsGbWL12Ja', '1993-08-03', 'Cần Thơ', 'Kinh doanh tự do', 'individual',
        1, 0, 0, 4.8, 16, 3.3, 0,
        NOW(), NOW()
    );
INSERT INTO user_role (
        id, user_id, role_id, assigned_at
    ) VALUES (
        UUID_TO_BIN('ff3a192f-8b8b-4eb6-b173-6728fd530112'),
        UUID_TO_BIN('b88cfe7f-655b-443b-b333-54b42fcc221c'),
        (SELECT id FROM role WHERE role_code = 'ROLE_USER'),
        NOW()
    );

INSERT INTO users (
        id, full_name, email, phone, password_hash, dob, region, occupation, user_type, 
        is_verified, is_locked, is_deleted, reputation_score, completed_sessions, cancel_rate, warning_count,
        created_at, updated_at
    ) VALUES (
        UUID_TO_BIN('340e6dc5-3f2c-4880-8cc1-43e478bcb7e5'), 
        'Phạm Văn Thảo', 'user12_2914@hourlink.vn', '0910000012', '$2b$10$uF4WlmUmwP5Ca8xe0w8b7.yrlZ3djORxSDm71jI17i.bsGbWL12Ja', '1989-06-06', 'Cần Thơ', 'Sinh viên', 'individual',
        1, 0, 0, 3.8, 15, 2.8, 0,
        NOW(), NOW()
    );
INSERT INTO user_role (
        id, user_id, role_id, assigned_at
    ) VALUES (
        UUID_TO_BIN('4025b2ef-91f0-4dfd-ac5d-c296bc75a3b0'),
        UUID_TO_BIN('340e6dc5-3f2c-4880-8cc1-43e478bcb7e5'),
        (SELECT id FROM role WHERE role_code = 'ROLE_USER'),
        NOW()
    );

INSERT INTO users (
        id, full_name, email, phone, password_hash, dob, region, occupation, user_type, 
        is_verified, is_locked, is_deleted, reputation_score, completed_sessions, cancel_rate, warning_count,
        created_at, updated_at
    ) VALUES (
        UUID_TO_BIN('d229b49f-d637-4986-b04b-19d7911163b5'), 
        'Phan Hoàng Hải', 'user13_23@hourlink.vn', '0990000013', '$2b$10$uF4WlmUmwP5Ca8xe0w8b7.yrlZ3djORxSDm71jI17i.bsGbWL12Ja', '1984-02-01', 'Đà Lạt', 'Marketing', 'individual',
        1, 0, 0, 4.0, 40, 0.3, 0,
        NOW(), NOW()
    );
INSERT INTO user_role (
        id, user_id, role_id, assigned_at
    ) VALUES (
        UUID_TO_BIN('24e9d400-1198-4b8c-b4be-a64ccd136baf'),
        UUID_TO_BIN('d229b49f-d637-4986-b04b-19d7911163b5'),
        (SELECT id FROM role WHERE role_code = 'ROLE_USER'),
        NOW()
    );

INSERT INTO users (
        id, full_name, email, phone, password_hash, dob, region, occupation, user_type, 
        is_verified, is_locked, is_deleted, reputation_score, completed_sessions, cancel_rate, warning_count,
        created_at, updated_at
    ) VALUES (
        UUID_TO_BIN('d6faf155-a8f1-4ba5-b8ed-fda36c5ff12e'), 
        'Lê Thanh Linh', 'user14_8492@hourlink.vn', '0930000014', '$2b$10$uF4WlmUmwP5Ca8xe0w8b7.yrlZ3djORxSDm71jI17i.bsGbWL12Ja', '1988-05-26', 'Đà Lạt', 'Kỹ sư', 'organization',
        1, 0, 0, 3.9, 0, 2.5, 0,
        NOW(), NOW()
    );
INSERT INTO user_role (
        id, user_id, role_id, assigned_at
    ) VALUES (
        UUID_TO_BIN('630b2669-1b79-48e4-a711-fe007764eeb9'),
        UUID_TO_BIN('d6faf155-a8f1-4ba5-b8ed-fda36c5ff12e'),
        (SELECT id FROM role WHERE role_code = 'ROLE_USER'),
        NOW()
    );

INSERT INTO users (
        id, full_name, email, phone, password_hash, dob, region, occupation, user_type, 
        is_verified, is_locked, is_deleted, reputation_score, completed_sessions, cancel_rate, warning_count,
        created_at, updated_at
    ) VALUES (
        UUID_TO_BIN('ce78dd75-5da2-4711-a346-00e2808b5e27'), 
        'Đặng Hồng Tùng', 'user15_51@hourlink.vn', '0910000015', '$2b$10$uF4WlmUmwP5Ca8xe0w8b7.yrlZ3djORxSDm71jI17i.bsGbWL12Ja', '1991-06-22', 'Hà Nội', 'Kinh doanh tự do', 'individual',
        1, 0, 0, 4.0, 21, 2.7, 0,
        NOW(), NOW()
    );
INSERT INTO user_role (
        id, user_id, role_id, assigned_at
    ) VALUES (
        UUID_TO_BIN('b6f56e05-d6b3-479b-9b10-d3e116a885ec'),
        UUID_TO_BIN('ce78dd75-5da2-4711-a346-00e2808b5e27'),
        (SELECT id FROM role WHERE role_code = 'ROLE_USER'),
        NOW()
    );

INSERT INTO users (
        id, full_name, email, phone, password_hash, dob, region, occupation, user_type, 
        is_verified, is_locked, is_deleted, reputation_score, completed_sessions, cancel_rate, warning_count,
        created_at, updated_at
    ) VALUES (
        UUID_TO_BIN('8671bb63-9203-4fa4-b4e9-35bdf0d5cf4e'), 
        'Lý Xuân Anh', 'user16_6096@hourlink.vn', '0990000016', '$2b$10$uF4WlmUmwP5Ca8xe0w8b7.yrlZ3djORxSDm71jI17i.bsGbWL12Ja', '1985-12-04', 'Hà Nội', 'Marketing', 'individual',
        1, 0, 0, 3.2, 11, 4.0, 0,
        NOW(), NOW()
    );
INSERT INTO user_role (
        id, user_id, role_id, assigned_at
    ) VALUES (
        UUID_TO_BIN('88b37822-3001-443a-a422-caf1d787a61c'),
        UUID_TO_BIN('8671bb63-9203-4fa4-b4e9-35bdf0d5cf4e'),
        (SELECT id FROM role WHERE role_code = 'ROLE_USER'),
        NOW()
    );

INSERT INTO users (
        id, full_name, email, phone, password_hash, dob, region, occupation, user_type, 
        is_verified, is_locked, is_deleted, reputation_score, completed_sessions, cancel_rate, warning_count,
        created_at, updated_at
    ) VALUES (
        UUID_TO_BIN('78a49bf8-bde9-44da-8017-4e5c7ba3ab48'), 
        'Nguyễn Hữu Yến', 'user17_3105@hourlink.vn', '0960000017', '$2b$10$uF4WlmUmwP5Ca8xe0w8b7.yrlZ3djORxSDm71jI17i.bsGbWL12Ja', '1986-02-10', 'Đà Lạt', 'Giáo viên', 'individual',
        1, 0, 0, 4.3, 41, 2.0, 0,
        NOW(), NOW()
    );
INSERT INTO user_role (
        id, user_id, role_id, assigned_at
    ) VALUES (
        UUID_TO_BIN('3e7a65b0-093e-437e-82a6-ca2adcc51343'),
        UUID_TO_BIN('78a49bf8-bde9-44da-8017-4e5c7ba3ab48'),
        (SELECT id FROM role WHERE role_code = 'ROLE_USER'),
        NOW()
    );

INSERT INTO users (
        id, full_name, email, phone, password_hash, dob, region, occupation, user_type, 
        is_verified, is_locked, is_deleted, reputation_score, completed_sessions, cancel_rate, warning_count,
        created_at, updated_at
    ) VALUES (
        UUID_TO_BIN('d277db92-f4fc-4eb2-8d99-8a5d33e71916'), 
        'Ngô Đức Đạt', 'user18_5868@hourlink.vn', '0930000018', '$2b$10$uF4WlmUmwP5Ca8xe0w8b7.yrlZ3djORxSDm71jI17i.bsGbWL12Ja', '1985-09-06', 'TP. Hồ Chí Minh', 'Sinh viên', 'organization',
        1, 0, 0, 3.8, 8, 1.7, 0,
        NOW(), NOW()
    );
INSERT INTO user_role (
        id, user_id, role_id, assigned_at
    ) VALUES (
        UUID_TO_BIN('9156318e-a92f-424f-b411-5fb09c370ad2'),
        UUID_TO_BIN('d277db92-f4fc-4eb2-8d99-8a5d33e71916'),
        (SELECT id FROM role WHERE role_code = 'ROLE_USER'),
        NOW()
    );

INSERT INTO users (
        id, full_name, email, phone, password_hash, dob, region, occupation, user_type, 
        is_verified, is_locked, is_deleted, reputation_score, completed_sessions, cancel_rate, warning_count,
        created_at, updated_at
    ) VALUES (
        UUID_TO_BIN('c9c22c12-77d1-4d8a-a7d4-1e5880e2f8e7'), 
        'Phạm Thanh Nam', 'user19_5408@hourlink.vn', '0970000019', '$2b$10$uF4WlmUmwP5Ca8xe0w8b7.yrlZ3djORxSDm71jI17i.bsGbWL12Ja', '1984-07-17', 'TP. Hồ Chí Minh', 'Kỹ sư', 'organization',
        1, 0, 0, 3.6, 14, 3.3, 0,
        NOW(), NOW()
    );
INSERT INTO user_role (
        id, user_id, role_id, assigned_at
    ) VALUES (
        UUID_TO_BIN('5d3be337-1ccf-4d96-85c4-f189f34327e7'),
        UUID_TO_BIN('c9c22c12-77d1-4d8a-a7d4-1e5880e2f8e7'),
        (SELECT id FROM role WHERE role_code = 'ROLE_USER'),
        NOW()
    );

INSERT INTO users (
        id, full_name, email, phone, password_hash, dob, region, occupation, user_type, 
        is_verified, is_locked, is_deleted, reputation_score, completed_sessions, cancel_rate, warning_count,
        created_at, updated_at
    ) VALUES (
        UUID_TO_BIN('24c6707c-3cbd-4f42-9380-2ecb54f648e3'), 
        'Phan Hoàng Trang', 'user20_173@hourlink.vn', '0980000020', '$2b$10$uF4WlmUmwP5Ca8xe0w8b7.yrlZ3djORxSDm71jI17i.bsGbWL12Ja', '1980-03-06', 'Huế', 'Sinh viên', 'organization',
        1, 0, 0, 3.9, 7, 1.4, 0,
        NOW(), NOW()
    );
INSERT INTO user_role (
        id, user_id, role_id, assigned_at
    ) VALUES (
        UUID_TO_BIN('a0833455-a532-4899-a623-7429c711b698'),
        UUID_TO_BIN('24c6707c-3cbd-4f42-9380-2ecb54f648e3'),
        (SELECT id FROM role WHERE role_code = 'ROLE_USER'),
        NOW()
    );

INSERT INTO users (
        id, full_name, email, phone, password_hash, dob, region, occupation, user_type, 
        is_verified, is_locked, is_deleted, reputation_score, completed_sessions, cancel_rate, warning_count,
        created_at, updated_at
    ) VALUES (
        UUID_TO_BIN('1cf48c38-b0d6-4aea-ba61-a74947b62121'), 
        'Lý Văn Anh', 'user21_2153@hourlink.vn', '0930000021', '$2b$10$uF4WlmUmwP5Ca8xe0w8b7.yrlZ3djORxSDm71jI17i.bsGbWL12Ja', '1992-06-16', 'Đà Nẵng', 'Kinh doanh tự do', 'organization',
        0, 0, 0, 4.0, 30, 4.1, 1,
        NOW(), NOW()
    );
INSERT INTO user_role (
        id, user_id, role_id, assigned_at
    ) VALUES (
        UUID_TO_BIN('d9cb1c83-218a-432d-a389-205cee246a37'),
        UUID_TO_BIN('1cf48c38-b0d6-4aea-ba61-a74947b62121'),
        (SELECT id FROM role WHERE role_code = 'ROLE_USER'),
        NOW()
    );

INSERT INTO users (
        id, full_name, email, phone, password_hash, dob, region, occupation, user_type, 
        is_verified, is_locked, is_deleted, reputation_score, completed_sessions, cancel_rate, warning_count,
        created_at, updated_at
    ) VALUES (
        UUID_TO_BIN('e9f823f3-5a5c-41de-a850-dbe5dd95f697'), 
        'Lý Ngọc Anh', 'user22_9855@hourlink.vn', '0970000022', '$2b$10$uF4WlmUmwP5Ca8xe0w8b7.yrlZ3djORxSDm71jI17i.bsGbWL12Ja', '1985-10-01', 'Nha Trang', 'Kỹ sư', 'individual',
        1, 0, 0, 3.5, 43, 2.9, 0,
        NOW(), NOW()
    );
INSERT INTO user_role (
        id, user_id, role_id, assigned_at
    ) VALUES (
        UUID_TO_BIN('f1a5d571-d579-40f1-a4c5-b941b4fe06f7'),
        UUID_TO_BIN('e9f823f3-5a5c-41de-a850-dbe5dd95f697'),
        (SELECT id FROM role WHERE role_code = 'ROLE_USER'),
        NOW()
    );

INSERT INTO users (
        id, full_name, email, phone, password_hash, dob, region, occupation, user_type, 
        is_verified, is_locked, is_deleted, reputation_score, completed_sessions, cancel_rate, warning_count,
        created_at, updated_at
    ) VALUES (
        UUID_TO_BIN('d58ff502-04ff-49fc-9f25-8dd08dd5cd6a'), 
        'Nguyễn Minh Trang', 'user23_6124@hourlink.vn', '0980000023', '$2b$10$uF4WlmUmwP5Ca8xe0w8b7.yrlZ3djORxSDm71jI17i.bsGbWL12Ja', '1988-06-21', 'Hải Phòng', 'Lập trình viên', 'individual',
        1, 0, 0, 3.6, 10, 4.7, 1,
        NOW(), NOW()
    );
INSERT INTO user_role (
        id, user_id, role_id, assigned_at
    ) VALUES (
        UUID_TO_BIN('56565829-f9ef-43c3-9f23-417af8ef36ef'),
        UUID_TO_BIN('d58ff502-04ff-49fc-9f25-8dd08dd5cd6a'),
        (SELECT id FROM role WHERE role_code = 'ROLE_USER'),
        NOW()
    );

INSERT INTO users (
        id, full_name, email, phone, password_hash, dob, region, occupation, user_type, 
        is_verified, is_locked, is_deleted, reputation_score, completed_sessions, cancel_rate, warning_count,
        created_at, updated_at
    ) VALUES (
        UUID_TO_BIN('3cee325f-552c-47c1-927b-1b0760934374'), 
        'Dương Thị Hoa', 'user24_775@hourlink.vn', '0970000024', '$2b$10$uF4WlmUmwP5Ca8xe0w8b7.yrlZ3djORxSDm71jI17i.bsGbWL12Ja', '1991-10-04', 'Huế', 'Lập trình viên', 'individual',
        1, 0, 0, 4.7, 27, 4.5, 0,
        NOW(), NOW()
    );
INSERT INTO user_role (
        id, user_id, role_id, assigned_at
    ) VALUES (
        UUID_TO_BIN('494e9df9-0aa9-4bab-9ab9-ac3d30421e7b'),
        UUID_TO_BIN('3cee325f-552c-47c1-927b-1b0760934374'),
        (SELECT id FROM role WHERE role_code = 'ROLE_USER'),
        NOW()
    );

INSERT INTO users (
        id, full_name, email, phone, password_hash, dob, region, occupation, user_type, 
        is_verified, is_locked, is_deleted, reputation_score, completed_sessions, cancel_rate, warning_count,
        created_at, updated_at
    ) VALUES (
        UUID_TO_BIN('898ffdeb-426b-4e8c-a803-d4bbacbd46ed'), 
        'Lê Đức Hải', 'user25_627@hourlink.vn', '0900000025', '$2b$10$uF4WlmUmwP5Ca8xe0w8b7.yrlZ3djORxSDm71jI17i.bsGbWL12Ja', '1981-09-07', 'TP. Hồ Chí Minh', 'Kế toán', 'organization',
        0, 0, 0, 3.6, 7, 0.8, 0,
        NOW(), NOW()
    );
INSERT INTO user_role (
        id, user_id, role_id, assigned_at
    ) VALUES (
        UUID_TO_BIN('9628d88d-d21f-4b58-8c33-1039db444c8e'),
        UUID_TO_BIN('898ffdeb-426b-4e8c-a803-d4bbacbd46ed'),
        (SELECT id FROM role WHERE role_code = 'ROLE_USER'),
        NOW()
    );

INSERT INTO users (
        id, full_name, email, phone, password_hash, dob, region, occupation, user_type, 
        is_verified, is_locked, is_deleted, reputation_score, completed_sessions, cancel_rate, warning_count,
        created_at, updated_at
    ) VALUES (
        UUID_TO_BIN('aaf551b6-d7f7-4c09-9b32-99c85d3da664'), 
        'Vũ Thanh Long', 'user26_143@hourlink.vn', '0910000026', '$2b$10$uF4WlmUmwP5Ca8xe0w8b7.yrlZ3djORxSDm71jI17i.bsGbWL12Ja', '1992-04-28', 'Cần Thơ', 'Lập trình viên', 'organization',
        0, 0, 0, 4.6, 9, 2.3, 0,
        NOW(), NOW()
    );
INSERT INTO user_role (
        id, user_id, role_id, assigned_at
    ) VALUES (
        UUID_TO_BIN('3699c626-4a45-4d7a-ba80-71fdfca0bb31'),
        UUID_TO_BIN('aaf551b6-d7f7-4c09-9b32-99c85d3da664'),
        (SELECT id FROM role WHERE role_code = 'ROLE_USER'),
        NOW()
    );

INSERT INTO users (
        id, full_name, email, phone, password_hash, dob, region, occupation, user_type, 
        is_verified, is_locked, is_deleted, reputation_score, completed_sessions, cancel_rate, warning_count,
        created_at, updated_at
    ) VALUES (
        UUID_TO_BIN('540d6ab5-7049-41a5-9a6b-aa8900f218b5'), 
        'Hoàng Bảo Tuấn', 'user27_8672@hourlink.vn', '0970000027', '$2b$10$uF4WlmUmwP5Ca8xe0w8b7.yrlZ3djORxSDm71jI17i.bsGbWL12Ja', '1999-10-09', 'TP. Hồ Chí Minh', 'Kinh doanh tự do', 'individual',
        1, 0, 0, 3.8, 12, 3.9, 0,
        NOW(), NOW()
    );
INSERT INTO user_role (
        id, user_id, role_id, assigned_at
    ) VALUES (
        UUID_TO_BIN('05ed91ac-2be0-403f-b77e-93c00310613b'),
        UUID_TO_BIN('540d6ab5-7049-41a5-9a6b-aa8900f218b5'),
        (SELECT id FROM role WHERE role_code = 'ROLE_USER'),
        NOW()
    );

INSERT INTO users (
        id, full_name, email, phone, password_hash, dob, region, occupation, user_type, 
        is_verified, is_locked, is_deleted, reputation_score, completed_sessions, cancel_rate, warning_count,
        created_at, updated_at
    ) VALUES (
        UUID_TO_BIN('22da9cae-5b6d-4115-b481-e2ea208599ad'), 
        'Dương Văn Thảo', 'user28_5650@hourlink.vn', '0900000028', '$2b$10$uF4WlmUmwP5Ca8xe0w8b7.yrlZ3djORxSDm71jI17i.bsGbWL12Ja', '1984-12-08', 'Huế', 'Kỹ sư', 'organization',
        1, 0, 0, 4.9, 0, 0.7, 0,
        NOW(), NOW()
    );
INSERT INTO user_role (
        id, user_id, role_id, assigned_at
    ) VALUES (
        UUID_TO_BIN('323b0991-c472-4274-bcc8-5b14072fe656'),
        UUID_TO_BIN('22da9cae-5b6d-4115-b481-e2ea208599ad'),
        (SELECT id FROM role WHERE role_code = 'ROLE_USER'),
        NOW()
    );

INSERT INTO users (
        id, full_name, email, phone, password_hash, dob, region, occupation, user_type, 
        is_verified, is_locked, is_deleted, reputation_score, completed_sessions, cancel_rate, warning_count,
        created_at, updated_at
    ) VALUES (
        UUID_TO_BIN('05ba1af5-0b83-40fc-9470-1b529ec23d15'), 
        'Bùi Bảo Nam', 'user29_2788@hourlink.vn', '0980000029', '$2b$10$uF4WlmUmwP5Ca8xe0w8b7.yrlZ3djORxSDm71jI17i.bsGbWL12Ja', '1990-01-14', 'Cần Thơ', 'Thiết kế đồ hoạ', 'organization',
        0, 0, 0, 3.5, 23, 1.7, 0,
        NOW(), NOW()
    );
INSERT INTO user_role (
        id, user_id, role_id, assigned_at
    ) VALUES (
        UUID_TO_BIN('a17f68c6-326e-4994-9c3b-d883dc18e540'),
        UUID_TO_BIN('05ba1af5-0b83-40fc-9470-1b529ec23d15'),
        (SELECT id FROM role WHERE role_code = 'ROLE_USER'),
        NOW()
    );

INSERT INTO users (
        id, full_name, email, phone, password_hash, dob, region, occupation, user_type, 
        is_verified, is_locked, is_deleted, reputation_score, completed_sessions, cancel_rate, warning_count,
        created_at, updated_at
    ) VALUES (
        UUID_TO_BIN('6730ef80-cd1c-4332-8c80-da8ba0a825f6'), 
        'Đỗ Thanh Trang', 'user30_3304@hourlink.vn', '0910000030', '$2b$10$uF4WlmUmwP5Ca8xe0w8b7.yrlZ3djORxSDm71jI17i.bsGbWL12Ja', '1984-03-25', 'Hải Phòng', 'Kinh doanh tự do', 'individual',
        1, 0, 0, 4.9, 43, 1.8, 0,
        NOW(), NOW()
    );
INSERT INTO user_role (
        id, user_id, role_id, assigned_at
    ) VALUES (
        UUID_TO_BIN('a51bc23e-d329-4d06-b3e7-e328328366a3'),
        UUID_TO_BIN('6730ef80-cd1c-4332-8c80-da8ba0a825f6'),
        (SELECT id FROM role WHERE role_code = 'ROLE_USER'),
        NOW()
    );

INSERT INTO users (
        id, full_name, email, phone, password_hash, dob, region, occupation, user_type, 
        is_verified, is_locked, is_deleted, reputation_score, completed_sessions, cancel_rate, warning_count,
        created_at, updated_at
    ) VALUES (
        UUID_TO_BIN('2a697e20-29f7-49d2-a4f2-d0e823251737'), 
        'Phạm Hữu Hoa', 'user31_9703@hourlink.vn', '0910000031', '$2b$10$uF4WlmUmwP5Ca8xe0w8b7.yrlZ3djORxSDm71jI17i.bsGbWL12Ja', '1997-11-07', 'Đà Lạt', 'Giáo viên', 'individual',
        0, 0, 0, 3.9, 18, 2.3, 0,
        NOW(), NOW()
    );
INSERT INTO user_role (
        id, user_id, role_id, assigned_at
    ) VALUES (
        UUID_TO_BIN('497fbc82-1046-4edf-81d3-36ab37f250aa'),
        UUID_TO_BIN('2a697e20-29f7-49d2-a4f2-d0e823251737'),
        (SELECT id FROM role WHERE role_code = 'ROLE_USER'),
        NOW()
    );

INSERT INTO users (
        id, full_name, email, phone, password_hash, dob, region, occupation, user_type, 
        is_verified, is_locked, is_deleted, reputation_score, completed_sessions, cancel_rate, warning_count,
        created_at, updated_at
    ) VALUES (
        UUID_TO_BIN('4dbee75e-1b2a-4e17-a3c2-4a3091fef213'), 
        'Đỗ Hồng Hoa', 'user32_2674@hourlink.vn', '0960000032', '$2b$10$uF4WlmUmwP5Ca8xe0w8b7.yrlZ3djORxSDm71jI17i.bsGbWL12Ja', '1987-05-12', 'Cần Thơ', 'Kỹ sư', 'organization',
        1, 0, 0, 4.0, 27, 4.4, 0,
        NOW(), NOW()
    );
INSERT INTO user_role (
        id, user_id, role_id, assigned_at
    ) VALUES (
        UUID_TO_BIN('cd21beca-03fa-4506-a6b1-e7b62baae8ca'),
        UUID_TO_BIN('4dbee75e-1b2a-4e17-a3c2-4a3091fef213'),
        (SELECT id FROM role WHERE role_code = 'ROLE_USER'),
        NOW()
    );

INSERT INTO users (
        id, full_name, email, phone, password_hash, dob, region, occupation, user_type, 
        is_verified, is_locked, is_deleted, reputation_score, completed_sessions, cancel_rate, warning_count,
        created_at, updated_at
    ) VALUES (
        UUID_TO_BIN('74ecc1f8-ca42-4eb8-b769-cea8d4b03f95'), 
        'Phan Xuân Nam', 'user33_8658@hourlink.vn', '0900000033', '$2b$10$uF4WlmUmwP5Ca8xe0w8b7.yrlZ3djORxSDm71jI17i.bsGbWL12Ja', '1980-12-04', 'Huế', 'Kế toán', 'individual',
        1, 1, 0, 3.8, 14, 0.8, 1,
        NOW(), NOW()
    );
INSERT INTO user_role (
        id, user_id, role_id, assigned_at
    ) VALUES (
        UUID_TO_BIN('210461d6-9849-45be-acff-4ba11755522a'),
        UUID_TO_BIN('74ecc1f8-ca42-4eb8-b769-cea8d4b03f95'),
        (SELECT id FROM role WHERE role_code = 'ROLE_USER'),
        NOW()
    );

INSERT INTO users (
        id, full_name, email, phone, password_hash, dob, region, occupation, user_type, 
        is_verified, is_locked, is_deleted, reputation_score, completed_sessions, cancel_rate, warning_count,
        created_at, updated_at
    ) VALUES (
        UUID_TO_BIN('5e6baf07-7db6-4369-8bd4-c70f1f5a11f4'), 
        'Hồ Xuân Sơn', 'user34_7105@hourlink.vn', '0990000034', '$2b$10$uF4WlmUmwP5Ca8xe0w8b7.yrlZ3djORxSDm71jI17i.bsGbWL12Ja', '1986-08-04', 'TP. Hồ Chí Minh', 'Thiết kế đồ hoạ', 'individual',
        0, 0, 0, 4.8, 39, 2.7, 0,
        NOW(), NOW()
    );
INSERT INTO user_role (
        id, user_id, role_id, assigned_at
    ) VALUES (
        UUID_TO_BIN('0fd7a634-c9a5-4de5-96c3-534dddc31b17'),
        UUID_TO_BIN('5e6baf07-7db6-4369-8bd4-c70f1f5a11f4'),
        (SELECT id FROM role WHERE role_code = 'ROLE_USER'),
        NOW()
    );

INSERT INTO users (
        id, full_name, email, phone, password_hash, dob, region, occupation, user_type, 
        is_verified, is_locked, is_deleted, reputation_score, completed_sessions, cancel_rate, warning_count,
        created_at, updated_at
    ) VALUES (
        UUID_TO_BIN('a835e7b6-e929-48c3-b38e-7153a6632dee'), 
        'Nguyễn Minh Long', 'user35_4642@hourlink.vn', '0940000035', '$2b$10$uF4WlmUmwP5Ca8xe0w8b7.yrlZ3djORxSDm71jI17i.bsGbWL12Ja', '1986-03-12', 'Hải Phòng', 'Kỹ sư', 'individual',
        1, 0, 0, 4.1, 2, 4.7, 1,
        NOW(), NOW()
    );
INSERT INTO user_role (
        id, user_id, role_id, assigned_at
    ) VALUES (
        UUID_TO_BIN('b45ee069-d27d-47a1-974f-04a6df89879d'),
        UUID_TO_BIN('a835e7b6-e929-48c3-b38e-7153a6632dee'),
        (SELECT id FROM role WHERE role_code = 'ROLE_USER'),
        NOW()
    );

INSERT INTO users (
        id, full_name, email, phone, password_hash, dob, region, occupation, user_type, 
        is_verified, is_locked, is_deleted, reputation_score, completed_sessions, cancel_rate, warning_count,
        created_at, updated_at
    ) VALUES (
        UUID_TO_BIN('0246ac27-a410-4b64-aeba-73158a2ea109'), 
        'Nguyễn Minh Nhung', 'user36_7280@hourlink.vn', '0900000036', '$2b$10$uF4WlmUmwP5Ca8xe0w8b7.yrlZ3djORxSDm71jI17i.bsGbWL12Ja', '1992-03-13', 'Hà Nội', 'Giáo viên', 'individual',
        0, 1, 0, 4.1, 44, 1.1, 0,
        NOW(), NOW()
    );
INSERT INTO user_role (
        id, user_id, role_id, assigned_at
    ) VALUES (
        UUID_TO_BIN('e0397650-dc03-45a8-b3bc-5c0b69cd2dac'),
        UUID_TO_BIN('0246ac27-a410-4b64-aeba-73158a2ea109'),
        (SELECT id FROM role WHERE role_code = 'ROLE_USER'),
        NOW()
    );

INSERT INTO users (
        id, full_name, email, phone, password_hash, dob, region, occupation, user_type, 
        is_verified, is_locked, is_deleted, reputation_score, completed_sessions, cancel_rate, warning_count,
        created_at, updated_at
    ) VALUES (
        UUID_TO_BIN('1543515c-2834-44cf-9087-a903db29fe32'), 
        'Đặng Thị Tùng', 'user37_2373@hourlink.vn', '0960000037', '$2b$10$uF4WlmUmwP5Ca8xe0w8b7.yrlZ3djORxSDm71jI17i.bsGbWL12Ja', '1996-10-17', 'TP. Hồ Chí Minh', 'Lập trình viên', 'individual',
        0, 0, 0, 4.5, 34, 2.9, 0,
        NOW(), NOW()
    );
INSERT INTO user_role (
        id, user_id, role_id, assigned_at
    ) VALUES (
        UUID_TO_BIN('0b545f43-42ff-4d47-b89e-adc1f19d1b22'),
        UUID_TO_BIN('1543515c-2834-44cf-9087-a903db29fe32'),
        (SELECT id FROM role WHERE role_code = 'ROLE_USER'),
        NOW()
    );

INSERT INTO users (
        id, full_name, email, phone, password_hash, dob, region, occupation, user_type, 
        is_verified, is_locked, is_deleted, reputation_score, completed_sessions, cancel_rate, warning_count,
        created_at, updated_at
    ) VALUES (
        UUID_TO_BIN('605bf0ee-93f5-4575-9b9f-3e72db0d7b3d'), 
        'Võ Thu Trang', 'user38_3231@hourlink.vn', '0930000038', '$2b$10$uF4WlmUmwP5Ca8xe0w8b7.yrlZ3djORxSDm71jI17i.bsGbWL12Ja', '1987-01-10', 'Nha Trang', 'Giáo viên', 'individual',
        1, 0, 0, 3.8, 40, 2.0, 0,
        NOW(), NOW()
    );
INSERT INTO user_role (
        id, user_id, role_id, assigned_at
    ) VALUES (
        UUID_TO_BIN('fe434701-d67f-42ad-a477-6c6183217d68'),
        UUID_TO_BIN('605bf0ee-93f5-4575-9b9f-3e72db0d7b3d'),
        (SELECT id FROM role WHERE role_code = 'ROLE_USER'),
        NOW()
    );

INSERT INTO users (
        id, full_name, email, phone, password_hash, dob, region, occupation, user_type, 
        is_verified, is_locked, is_deleted, reputation_score, completed_sessions, cancel_rate, warning_count,
        created_at, updated_at
    ) VALUES (
        UUID_TO_BIN('8d111516-6d5f-44d4-8270-3b3ed4b3a979'), 
        'Trần Thị Thảo', 'user39_9009@hourlink.vn', '0920000039', '$2b$10$uF4WlmUmwP5Ca8xe0w8b7.yrlZ3djORxSDm71jI17i.bsGbWL12Ja', '1987-05-23', 'Hà Nội', 'Marketing', 'organization',
        0, 0, 0, 4.2, 42, 4.1, 0,
        NOW(), NOW()
    );
INSERT INTO user_role (
        id, user_id, role_id, assigned_at
    ) VALUES (
        UUID_TO_BIN('5670c80d-1847-4c79-99fe-520a5699d3d9'),
        UUID_TO_BIN('8d111516-6d5f-44d4-8270-3b3ed4b3a979'),
        (SELECT id FROM role WHERE role_code = 'ROLE_USER'),
        NOW()
    );

INSERT INTO users (
        id, full_name, email, phone, password_hash, dob, region, occupation, user_type, 
        is_verified, is_locked, is_deleted, reputation_score, completed_sessions, cancel_rate, warning_count,
        created_at, updated_at
    ) VALUES (
        UUID_TO_BIN('916e78f8-4b56-47e2-8c38-055634e66033'), 
        'Hoàng Hữu Hà', 'user40_389@hourlink.vn', '0980000040', '$2b$10$uF4WlmUmwP5Ca8xe0w8b7.yrlZ3djORxSDm71jI17i.bsGbWL12Ja', '1980-08-06', 'Đà Lạt', 'Sinh viên', 'individual',
        1, 0, 0, 4.8, 37, 1.6, 1,
        NOW(), NOW()
    );
INSERT INTO user_role (
        id, user_id, role_id, assigned_at
    ) VALUES (
        UUID_TO_BIN('3216e6f4-46b2-458d-b2f1-ecf4dbdceb3d'),
        UUID_TO_BIN('916e78f8-4b56-47e2-8c38-055634e66033'),
        (SELECT id FROM role WHERE role_code = 'ROLE_USER'),
        NOW()
    );

INSERT INTO users (
        id, full_name, email, phone, password_hash, dob, region, occupation, user_type, 
        is_verified, is_locked, is_deleted, reputation_score, completed_sessions, cancel_rate, warning_count,
        created_at, updated_at
    ) VALUES (
        UUID_TO_BIN('ff14024d-035a-4015-8f0b-d1af3be208e9'), 
        'Phạm Thu Tuấn', 'user41_1192@hourlink.vn', '0930000041', '$2b$10$uF4WlmUmwP5Ca8xe0w8b7.yrlZ3djORxSDm71jI17i.bsGbWL12Ja', '1986-09-23', 'TP. Hồ Chí Minh', 'Kinh doanh tự do', 'individual',
        0, 0, 0, 4.9, 6, 2.6, 0,
        NOW(), NOW()
    );
INSERT INTO user_role (
        id, user_id, role_id, assigned_at
    ) VALUES (
        UUID_TO_BIN('57cc9ce5-9e83-4b76-ab0d-d106009ac3ce'),
        UUID_TO_BIN('ff14024d-035a-4015-8f0b-d1af3be208e9'),
        (SELECT id FROM role WHERE role_code = 'ROLE_USER'),
        NOW()
    );

INSERT INTO users (
        id, full_name, email, phone, password_hash, dob, region, occupation, user_type, 
        is_verified, is_locked, is_deleted, reputation_score, completed_sessions, cancel_rate, warning_count,
        created_at, updated_at
    ) VALUES (
        UUID_TO_BIN('72185cf5-6bd9-4804-af88-16e89c3c0ecb'), 
        'Vũ Thanh Hoa', 'user42_2333@hourlink.vn', '0960000042', '$2b$10$uF4WlmUmwP5Ca8xe0w8b7.yrlZ3djORxSDm71jI17i.bsGbWL12Ja', '1994-02-01', 'TP. Hồ Chí Minh', 'Thiết kế đồ hoạ', 'organization',
        1, 0, 0, 3.1, 45, 2.9, 0,
        NOW(), NOW()
    );
INSERT INTO user_role (
        id, user_id, role_id, assigned_at
    ) VALUES (
        UUID_TO_BIN('4119f2de-07b7-4fb2-ad64-7531a597b2b9'),
        UUID_TO_BIN('72185cf5-6bd9-4804-af88-16e89c3c0ecb'),
        (SELECT id FROM role WHERE role_code = 'ROLE_USER'),
        NOW()
    );

INSERT INTO users (
        id, full_name, email, phone, password_hash, dob, region, occupation, user_type, 
        is_verified, is_locked, is_deleted, reputation_score, completed_sessions, cancel_rate, warning_count,
        created_at, updated_at
    ) VALUES (
        UUID_TO_BIN('238f58a7-65d0-44c7-85ec-dc4c85e4ca5a'), 
        'Đỗ Hữu Hải', 'user43_8010@hourlink.vn', '0900000043', '$2b$10$uF4WlmUmwP5Ca8xe0w8b7.yrlZ3djORxSDm71jI17i.bsGbWL12Ja', '1983-07-02', 'Đà Lạt', 'Thiết kế đồ hoạ', 'individual',
        1, 0, 0, 4.7, 27, 5.0, 0,
        NOW(), NOW()
    );
INSERT INTO user_role (
        id, user_id, role_id, assigned_at
    ) VALUES (
        UUID_TO_BIN('216dcbf1-3e27-4a33-958d-5945457257da'),
        UUID_TO_BIN('238f58a7-65d0-44c7-85ec-dc4c85e4ca5a'),
        (SELECT id FROM role WHERE role_code = 'ROLE_USER'),
        NOW()
    );

INSERT INTO users (
        id, full_name, email, phone, password_hash, dob, region, occupation, user_type, 
        is_verified, is_locked, is_deleted, reputation_score, completed_sessions, cancel_rate, warning_count,
        created_at, updated_at
    ) VALUES (
        UUID_TO_BIN('059de159-667f-4bb0-9ed9-eb8082eeef5b'), 
        'Đặng Minh Nhung', 'user44_2236@hourlink.vn', '0970000044', '$2b$10$uF4WlmUmwP5Ca8xe0w8b7.yrlZ3djORxSDm71jI17i.bsGbWL12Ja', '1993-08-21', 'Đà Lạt', 'Kế toán', 'individual',
        1, 0, 0, 3.0, 32, 0.9, 0,
        NOW(), NOW()
    );
INSERT INTO user_role (
        id, user_id, role_id, assigned_at
    ) VALUES (
        UUID_TO_BIN('a7456a1f-67cc-4595-88a9-3942596d1112'),
        UUID_TO_BIN('059de159-667f-4bb0-9ed9-eb8082eeef5b'),
        (SELECT id FROM role WHERE role_code = 'ROLE_USER'),
        NOW()
    );

INSERT INTO users (
        id, full_name, email, phone, password_hash, dob, region, occupation, user_type, 
        is_verified, is_locked, is_deleted, reputation_score, completed_sessions, cancel_rate, warning_count,
        created_at, updated_at
    ) VALUES (
        UUID_TO_BIN('c105490b-6aa6-418b-a453-dee1c44ed090'), 
        'Hồ Quang Hoa', 'user45_1757@hourlink.vn', '0900000045', '$2b$10$uF4WlmUmwP5Ca8xe0w8b7.yrlZ3djORxSDm71jI17i.bsGbWL12Ja', '1982-01-22', 'Đà Nẵng', 'Kinh doanh tự do', 'individual',
        1, 0, 0, 4.7, 9, 0.2, 0,
        NOW(), NOW()
    );
INSERT INTO user_role (
        id, user_id, role_id, assigned_at
    ) VALUES (
        UUID_TO_BIN('9831d547-54a7-4fb8-9da0-36d7d6d4195e'),
        UUID_TO_BIN('c105490b-6aa6-418b-a453-dee1c44ed090'),
        (SELECT id FROM role WHERE role_code = 'ROLE_USER'),
        NOW()
    );

INSERT INTO users (
        id, full_name, email, phone, password_hash, dob, region, occupation, user_type, 
        is_verified, is_locked, is_deleted, reputation_score, completed_sessions, cancel_rate, warning_count,
        created_at, updated_at
    ) VALUES (
        UUID_TO_BIN('d33bbc7c-65f7-4259-96ef-1cde1e98e5d2'), 
        'Vũ Hồng Nam', 'user46_3483@hourlink.vn', '0970000046', '$2b$10$uF4WlmUmwP5Ca8xe0w8b7.yrlZ3djORxSDm71jI17i.bsGbWL12Ja', '1995-12-25', 'Huế', 'Kỹ sư', 'individual',
        1, 0, 0, 3.5, 14, 1.3, 1,
        NOW(), NOW()
    );
INSERT INTO user_role (
        id, user_id, role_id, assigned_at
    ) VALUES (
        UUID_TO_BIN('5bab8bd2-b8a5-40c4-ba15-b58c7efb8a1f'),
        UUID_TO_BIN('d33bbc7c-65f7-4259-96ef-1cde1e98e5d2'),
        (SELECT id FROM role WHERE role_code = 'ROLE_USER'),
        NOW()
    );

INSERT INTO users (
        id, full_name, email, phone, password_hash, dob, region, occupation, user_type, 
        is_verified, is_locked, is_deleted, reputation_score, completed_sessions, cancel_rate, warning_count,
        created_at, updated_at
    ) VALUES (
        UUID_TO_BIN('47ff090a-c071-43e7-b271-a80823d4c56c'), 
        'Võ Quang Nhung', 'user47_1003@hourlink.vn', '0970000047', '$2b$10$uF4WlmUmwP5Ca8xe0w8b7.yrlZ3djORxSDm71jI17i.bsGbWL12Ja', '1997-03-12', 'Hải Phòng', 'Kỹ sư', 'organization',
        1, 0, 0, 3.6, 31, 1.6, 0,
        NOW(), NOW()
    );
INSERT INTO user_role (
        id, user_id, role_id, assigned_at
    ) VALUES (
        UUID_TO_BIN('6e766421-0d19-49fe-bc6f-3e8ca17870d1'),
        UUID_TO_BIN('47ff090a-c071-43e7-b271-a80823d4c56c'),
        (SELECT id FROM role WHERE role_code = 'ROLE_USER'),
        NOW()
    );

INSERT INTO users (
        id, full_name, email, phone, password_hash, dob, region, occupation, user_type, 
        is_verified, is_locked, is_deleted, reputation_score, completed_sessions, cancel_rate, warning_count,
        created_at, updated_at
    ) VALUES (
        UUID_TO_BIN('b955f1a6-458a-4a11-81ec-847cf3109312'), 
        'Nguyễn Thanh Tâm', 'user48_3499@hourlink.vn', '0980000048', '$2b$10$uF4WlmUmwP5Ca8xe0w8b7.yrlZ3djORxSDm71jI17i.bsGbWL12Ja', '1988-01-21', 'Huế', 'Kinh doanh tự do', 'organization',
        1, 0, 0, 4.2, 10, 1.3, 0,
        NOW(), NOW()
    );
INSERT INTO user_role (
        id, user_id, role_id, assigned_at
    ) VALUES (
        UUID_TO_BIN('35b280e4-a862-4bad-91a7-b00462b3c4de'),
        UUID_TO_BIN('b955f1a6-458a-4a11-81ec-847cf3109312'),
        (SELECT id FROM role WHERE role_code = 'ROLE_USER'),
        NOW()
    );

INSERT INTO users (
        id, full_name, email, phone, password_hash, dob, region, occupation, user_type, 
        is_verified, is_locked, is_deleted, reputation_score, completed_sessions, cancel_rate, warning_count,
        created_at, updated_at
    ) VALUES (
        UUID_TO_BIN('6a38c77c-1fb7-46b3-9828-920b04e9fc47'), 
        'Trần Quang Nhung', 'user49_1919@hourlink.vn', '0960000049', '$2b$10$uF4WlmUmwP5Ca8xe0w8b7.yrlZ3djORxSDm71jI17i.bsGbWL12Ja', '1998-06-27', 'Hải Phòng', 'Marketing', 'organization',
        0, 0, 0, 3.2, 19, 1.3, 0,
        NOW(), NOW()
    );
INSERT INTO user_role (
        id, user_id, role_id, assigned_at
    ) VALUES (
        UUID_TO_BIN('6255e3c2-0a5d-4808-adc9-fdd41f481ee7'),
        UUID_TO_BIN('6a38c77c-1fb7-46b3-9828-920b04e9fc47'),
        (SELECT id FROM role WHERE role_code = 'ROLE_USER'),
        NOW()
    );

INSERT INTO users (
        id, full_name, email, phone, password_hash, dob, region, occupation, user_type, 
        is_verified, is_locked, is_deleted, reputation_score, completed_sessions, cancel_rate, warning_count,
        created_at, updated_at
    ) VALUES (
        UUID_TO_BIN('791d9dea-0425-4b9e-aa20-8cd0b7f69ab6'), 
        'Nguyễn Thị Nhung', 'user50_2296@hourlink.vn', '0970000050', '$2b$10$uF4WlmUmwP5Ca8xe0w8b7.yrlZ3djORxSDm71jI17i.bsGbWL12Ja', '1981-08-27', 'Nha Trang', 'Giáo viên', 'individual',
        1, 0, 0, 3.4, 19, 1.5, 0,
        NOW(), NOW()
    );
INSERT INTO user_role (
        id, user_id, role_id, assigned_at
    ) VALUES (
        UUID_TO_BIN('80c36320-80ae-424a-aefa-4b37faf44ba9'),
        UUID_TO_BIN('791d9dea-0425-4b9e-aa20-8cd0b7f69ab6'),
        (SELECT id FROM role WHERE role_code = 'ROLE_USER'),
        NOW()
    );

SET FOREIGN_KEY_CHECKS = 1;
