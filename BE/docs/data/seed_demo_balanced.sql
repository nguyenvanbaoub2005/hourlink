-- ============================================================================
-- HourLink - Bo du lieu demo can bang cho man Kham pha va Quan tri
-- MySQL 8.0+
--
-- Tao moi (khong xoa/ghi de du lieu nguoi dung hien co):
--   - 12 tai khoan demo co ROLE_USER, vi 5 TC va giao dich thuong khoi tao
--   - 24 ky nang VISIBLE: 3 nguoi ho tro khac nhau cho moi trong 8 danh muc
--   - 16 yeu cau SEARCHING: 2 yeu cau cho moi danh muc
--
-- Tat ca tai khoan demo dung chung mat khau: Demo@123
-- Vi du dang nhap: demo.khoa@hourlink.vn / Demo@123
--
-- Script idempotent: moi ban ghi co UUID/email/idempotency key rieng. Chay lai
-- se khong nhan doi. Script khong xoa va khong sua cac ban ghi ngoai bo demo.
-- ============================================================================

SET NAMES utf8mb4;

-- Dung ngay neu schema chua du 8 danh muc chuan hoac chua co ROLE_USER.
DROP PROCEDURE IF EXISTS hourlink_assert_balanced_demo_seed;
DELIMITER $$
CREATE PROCEDURE hourlink_assert_balanced_demo_seed()
BEGIN
    IF (
        SELECT COUNT(*)
        FROM skill_category
        WHERE is_deleted = 0
          AND name IN ('Lập trình', 'Ngôn ngữ', 'Thiết kế', 'Kinh doanh',
                       'Giáo dục', 'Sức khỏe', 'Nghệ thuật', 'Khác')
    ) <> 8 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Demo seed can dung dung 8 danh muc chuan, moi ten xuat hien mot lan';
    END IF;

    IF (SELECT COUNT(*) FROM role WHERE role_code = 'ROLE_USER') <> 1 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Demo seed can dung mot role ROLE_USER';
    END IF;
END$$
DELIMITER ;

CALL hourlink_assert_balanced_demo_seed();
DROP PROCEDURE hourlink_assert_balanced_demo_seed;

START TRANSACTION;

-- BCrypt cua mat khau Demo@123.
SET @demo_password_hash = '$2y$10$SrH7yizfMPTvMh1FNp9EV.K/Xlql6KtMoEyCEeczV5mGT3U46ye16';

SET @demo_users = JSON_ARRAY(
    JSON_OBJECT('id', 'd0010000-0000-4000-8000-000000000001', 'email', 'demo.khoa@hourlink.vn',
        'phone', '0899000101', 'fullName', 'Nguyễn Minh Khoa', 'dob', '1997-04-12',
        'region', 'Hà Nội', 'occupation', 'Lập trình viên Backend',
        'languages', 'Tiếng Việt, Tiếng Anh',
        'bio', 'Backend developer yêu thích chia sẻ kiến thức qua các ví dụ thực tế và dễ áp dụng.',
        'reputation', 4.9, 'sessions', 28, 'cancelRate', 1.2),
    JSON_OBJECT('id', 'd0010000-0000-4000-8000-000000000002', 'email', 'demo.baongoc@hourlink.vn',
        'phone', '0899000102', 'fullName', 'Trần Bảo Ngọc', 'dob', '1999-09-23',
        'region', 'TP. HCM', 'occupation', 'Lập trình viên Mobile',
        'languages', 'Tiếng Việt, Tiếng Anh',
        'bio', 'Phát triển ứng dụng di động và hướng dẫn người mới làm sản phẩm đầu tiên.',
        'reputation', 4.8, 'sessions', 21, 'cancelRate', 1.8),
    JSON_OBJECT('id', 'd0010000-0000-4000-8000-000000000003', 'email', 'demo.khanhlinh@hourlink.vn',
        'phone', '0899000103', 'fullName', 'Lê Khánh Linh', 'dob', '1996-01-16',
        'region', 'Đà Nẵng', 'occupation', 'Chuyên viên phân tích dữ liệu',
        'languages', 'Tiếng Việt, Tiếng Anh',
        'bio', 'Thích biến dữ liệu và ngoại ngữ thành những bài học ngắn gọn, có mục tiêu rõ ràng.',
        'reputation', 4.9, 'sessions', 25, 'cancelRate', 0.8),
    JSON_OBJECT('id', 'd0010000-0000-4000-8000-000000000004', 'email', 'demo.thuhuong@hourlink.vn',
        'phone', '0899000104', 'fullName', 'Phạm Thu Hương', 'dob', '1995-07-08',
        'region', 'Hà Nội', 'occupation', 'Biên phiên dịch tiếng Nhật',
        'languages', 'Tiếng Việt, Tiếng Nhật, Tiếng Anh',
        'bio', 'Đồng hành cùng người mới học tiếng Nhật bằng lộ trình vừa sức và phản hồi chi tiết.',
        'reputation', 4.7, 'sessions', 18, 'cancelRate', 2.1),
    JSON_OBJECT('id', 'd0010000-0000-4000-8000-000000000005', 'email', 'demo.giahan@hourlink.vn',
        'phone', '0899000105', 'fullName', 'Đỗ Gia Hân', 'dob', '1998-11-30',
        'region', 'Huế', 'occupation', 'Thiết kế UI/UX',
        'languages', 'Tiếng Việt, Tiếng Anh',
        'bio', 'Thiết kế giao diện tối giản, chú trọng trải nghiệm và luôn giải thích rõ lý do của từng lựa chọn.',
        'reputation', 4.8, 'sessions', 16, 'cancelRate', 1.4),
    JSON_OBJECT('id', 'd0010000-0000-4000-8000-000000000006', 'email', 'demo.ducanh@hourlink.vn',
        'phone', '0899000106', 'fullName', 'Vũ Đức Anh', 'dob', '1994-05-19',
        'region', 'TP. HCM', 'occupation', 'Video Editor',
        'languages', 'Tiếng Việt, Tiếng Anh',
        'bio', 'Có kinh nghiệm sản xuất video ngắn và nội dung số cho thương hiệu nhỏ.',
        'reputation', 4.7, 'sessions', 14, 'cancelRate', 2.5),
    JSON_OBJECT('id', 'd0010000-0000-4000-8000-000000000007', 'email', 'demo.quocbao@hourlink.vn',
        'phone', '0899000107', 'fullName', 'Nguyễn Quốc Bảo', 'dob', '1993-02-14',
        'region', 'Cần Thơ', 'occupation', 'Chuyên viên Digital Marketing',
        'languages', 'Tiếng Việt, Tiếng Anh',
        'bio', 'Ưu tiên cách làm đo lường được, phù hợp với cửa hàng và nhóm khởi nghiệp nhỏ.',
        'reputation', 4.6, 'sessions', 19, 'cancelRate', 2.8),
    JSON_OBJECT('id', 'd0010000-0000-4000-8000-000000000008', 'email', 'demo.ngocmai@hourlink.vn',
        'phone', '0899000108', 'fullName', 'Trần Ngọc Mai', 'dob', '1992-10-05',
        'region', 'Đà Nẵng', 'occupation', 'Giáo viên THPT',
        'languages', 'Tiếng Việt',
        'bio', 'Giảng bài theo từng bước, tập trung củng cố nền tảng và thói quen học chủ động.',
        'reputation', 4.9, 'sessions', 32, 'cancelRate', 0.6),
    JSON_OBJECT('id', 'd0010000-0000-4000-8000-000000000009', 'email', 'demo.minhduc@hourlink.vn',
        'phone', '0899000109', 'fullName', 'Lê Minh Đức', 'dob', '1995-12-21',
        'region', 'TP. HCM', 'occupation', 'Huấn luyện viên cá nhân',
        'languages', 'Tiếng Việt, Tiếng Anh',
        'bio', 'Hướng dẫn vận động an toàn và xây dựng thói quen phù hợp với lịch sinh hoạt bận rộn.',
        'reputation', 4.8, 'sessions', 24, 'cancelRate', 1.1),
    JSON_OBJECT('id', 'd0010000-0000-4000-8000-000000000010', 'email', 'demo.thaovy@hourlink.vn',
        'phone', '0899000110', 'fullName', 'Phan Thảo Vy', 'dob', '1998-06-11',
        'region', 'Nha Trang', 'occupation', 'Huấn luyện viên Yoga',
        'languages', 'Tiếng Việt',
        'bio', 'Yêu Yoga, chuyển động và những phương pháp thư giãn đơn giản cho dân văn phòng.',
        'reputation', 4.7, 'sessions', 17, 'cancelRate', 1.9),
    JSON_OBJECT('id', 'd0010000-0000-4000-8000-000000000011', 'email', 'demo.tuankiet@hourlink.vn',
        'phone', '0899000111', 'fullName', 'Hoàng Tuấn Kiệt', 'dob', '1996-03-27',
        'region', 'Huế', 'occupation', 'Giảng viên Guitar',
        'languages', 'Tiếng Việt',
        'bio', 'Chia sẻ âm nhạc theo hướng thực hành, giúp người mới chơi được bài yêu thích sớm nhất.',
        'reputation', 4.9, 'sessions', 30, 'cancelRate', 0.9),
    JSON_OBJECT('id', 'd0010000-0000-4000-8000-000000000012', 'email', 'demo.haiyen@hourlink.vn',
        'phone', '0899000112', 'fullName', 'Đặng Hải Yến', 'dob', '1994-08-02',
        'region', 'Hà Nội', 'occupation', 'Chuyên viên hướng nghiệp',
        'languages', 'Tiếng Việt, Tiếng Anh',
        'bio', 'Hỗ trợ sinh viên và người trẻ chuẩn bị hồ sơ nghề nghiệp, phỏng vấn và thương hiệu cá nhân.',
        'reputation', 4.8, 'sessions', 22, 'cancelRate', 1.3)
);

INSERT INTO users (
    id, created_at, updated_at, full_name, email, phone, password_hash, dob,
    region, occupation, user_type, avatar_url, bio, languages, is_verified,
    is_locked, is_deleted, reputation_score, completed_sessions, cancel_rate,
    warning_count
)
SELECT
    UUID_TO_BIN(j.id), DATE_SUB(NOW(), INTERVAL (30 - j.row_no) DAY), NOW(),
    j.full_name, j.email, j.phone, @demo_password_hash, j.dob,
    j.region, j.occupation, 'individual', NULL, j.bio, j.languages,
    1, 0, 0, j.reputation, j.sessions, j.cancel_rate, 0
FROM JSON_TABLE(@demo_users, '$[*]' COLUMNS (
    row_no FOR ORDINALITY,
    id VARCHAR(36) PATH '$.id',
    email VARCHAR(150) PATH '$.email',
    phone VARCHAR(20) PATH '$.phone',
    full_name VARCHAR(150) PATH '$.fullName',
    dob DATE PATH '$.dob',
    region VARCHAR(200) PATH '$.region',
    occupation VARCHAR(150) PATH '$.occupation',
    languages VARCHAR(255) PATH '$.languages',
    bio TEXT PATH '$.bio',
    reputation DOUBLE PATH '$.reputation',
    sessions INT PATH '$.sessions',
    cancel_rate DOUBLE PATH '$.cancelRate'
)) AS j
WHERE NOT EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = UUID_TO_BIN(j.id) OR u.email = j.email OR u.phone = j.phone
);

-- Gan quyen ROLE_USER cho tai khoan demo con thieu quyen.
INSERT INTO user_role (id, user_id, role_id, assigned_at)
SELECT UUID_TO_BIN(UUID()), u.id, r.role_id, NOW()
FROM JSON_TABLE(@demo_users, '$[*]' COLUMNS (
    email VARCHAR(150) PATH '$.email'
)) AS j
JOIN users u ON u.email = j.email
JOIN role r ON r.role_code = 'ROLE_USER'
WHERE NOT EXISTS (
    SELECT 1 FROM user_role ur
    WHERE ur.user_id = u.id AND ur.role_id = r.role_id
);

-- Moi tai khoan demo co vi hop le 5 TC.
INSERT INTO wallet (
    id, created_at, updated_at, user_id, balance, held_amount, total_earned, total_used
)
SELECT UUID_TO_BIN(UUID()), NOW(), NOW(), u.id, 5.0, 0.0, 5.0, 0.0
FROM JSON_TABLE(@demo_users, '$[*]' COLUMNS (
    email VARCHAR(150) PATH '$.email'
)) AS j
JOIN users u ON u.email = j.email
WHERE NOT EXISTS (SELECT 1 FROM wallet w WHERE w.user_id = u.id);

-- Giao dich BONUS khoi tao de tab lich su vi khong bi rong va doi soat dung.
INSERT INTO wallet_transaction (
    id, created_at, updated_at, wallet_id, appointment_id, type, amount,
    balance_after, description, reference_type, reference_id, idempotency_key
)
SELECT
    UUID_TO_BIN(UUID()), NOW(), NOW(), w.id, NULL, 'BONUS', 5.0, 5.0,
    'Tặng 5 Time Credit khởi đầu cho tài khoản demo', 'DEMO_SEED', u.id,
    CONCAT('DEMO_SIGNUP:', j.email)
FROM JSON_TABLE(@demo_users, '$[*]' COLUMNS (
    email VARCHAR(150) PATH '$.email'
)) AS j
JOIN users u ON u.email = j.email
JOIN wallet w ON w.user_id = u.id
WHERE NOT EXISTS (
    SELECT 1 FROM wallet_transaction wt
    WHERE wt.idempotency_key = CONCAT('DEMO_SIGNUP:', j.email)
);

-- --------------------------------------------------------------------------
-- 24 ky nang: moi danh muc co dung 3 nguoi ho tro demo khac nhau.
-- --------------------------------------------------------------------------
SET @demo_skills = JSON_ARRAY(
    JSON_OBJECT('id', 'd0020000-0000-4000-8000-000000000001', 'email', 'demo.khoa@hourlink.vn',
        'category', 'Lập trình', 'name', 'Xây dựng REST API với Java Spring Boot',
        'description', 'Hướng dẫn thiết kế API, validation, JWT và xử lý lỗi theo cấu trúc của một dự án thực tế.',
        'level', 'ADVANCED', 'format', 'ONLINE', 'duration', 90, 'region', 'Toàn quốc',
        'freeTime', 'Tối thứ 2 và thứ 4 sau 19:00', 'ageDays', 26),
    JSON_OBJECT('id', 'd0020000-0000-4000-8000-000000000002', 'email', 'demo.khoa@hourlink.vn',
        'category', 'Thiết kế', 'name', 'Thiết kế dashboard rõ ràng bằng Figma',
        'description', 'Cùng dựng wireframe, hệ thống khoảng cách và component cơ bản cho dashboard web hoặc mobile.',
        'level', 'INTERMEDIATE', 'format', 'ONLINE', 'duration', 60, 'region', 'Toàn quốc',
        'freeTime', 'Tối thứ 2 và thứ 4 sau 19:00', 'ageDays', 20),
    JSON_OBJECT('id', 'd0020000-0000-4000-8000-000000000003', 'email', 'demo.baongoc@hourlink.vn',
        'category', 'Lập trình', 'name', 'Làm ứng dụng đầu tiên với React Native và Expo',
        'description', 'Đi từ cấu trúc màn hình, điều hướng đến gọi API và chạy thử ứng dụng trên điện thoại thật.',
        'level', 'ADVANCED', 'format', 'BOTH', 'duration', 90, 'region', 'TP. HCM',
        'freeTime', 'Tối thứ 3, thứ 5 và sáng chủ nhật', 'ageDays', 18),
    JSON_OBJECT('id', 'd0020000-0000-4000-8000-000000000004', 'email', 'demo.baongoc@hourlink.vn',
        'category', 'Giáo dục', 'name', 'Kèm nhập môn tư duy lập trình cho sinh viên',
        'description', 'Giải thích biến, điều kiện, vòng lặp và cách chia nhỏ bài toán bằng ví dụ gần gũi.',
        'level', 'INTERMEDIATE', 'format', 'ONLINE', 'duration', 60, 'region', 'Toàn quốc',
        'freeTime', 'Tối thứ 3, thứ 5 và sáng chủ nhật', 'ageDays', 14),
    JSON_OBJECT('id', 'd0020000-0000-4000-8000-000000000005', 'email', 'demo.khanhlinh@hourlink.vn',
        'category', 'Lập trình', 'name', 'Python phân tích dữ liệu với Pandas',
        'description', 'Làm sạch dữ liệu, tổng hợp bảng và trực quan hóa một bộ dữ liệu nhỏ bằng Python.',
        'level', 'INTERMEDIATE', 'format', 'BOTH', 'duration', 90, 'region', 'Đà Nẵng',
        'freeTime', 'Chiều thứ 7 và tối thứ 5', 'ageDays', 23),
    JSON_OBJECT('id', 'd0020000-0000-4000-8000-000000000006', 'email', 'demo.khanhlinh@hourlink.vn',
        'category', 'Ngôn ngữ', 'name', 'Tiếng Anh phỏng vấn ngành công nghệ',
        'description', 'Luyện giới thiệu bản thân, mô tả dự án và trả lời các câu hỏi phỏng vấn thường gặp.',
        'level', 'ADVANCED', 'format', 'ONLINE', 'duration', 60, 'region', 'Toàn quốc',
        'freeTime', 'Chiều thứ 7 và tối thứ 5', 'ageDays', 16),
    JSON_OBJECT('id', 'd0020000-0000-4000-8000-000000000007', 'email', 'demo.thuhuong@hourlink.vn',
        'category', 'Ngôn ngữ', 'name', 'Tiếng Nhật N5 cho người mới bắt đầu',
        'description', 'Học bảng chữ, phát âm, mẫu câu giao tiếp và từ vựng nền tảng theo lộ trình bốn tuần.',
        'level', 'INTERMEDIATE', 'format', 'BOTH', 'duration', 60, 'region', 'Hà Nội',
        'freeTime', 'Tối thứ 3, thứ 6 và cuối tuần', 'ageDays', 25),
    JSON_OBJECT('id', 'd0020000-0000-4000-8000-000000000008', 'email', 'demo.thuhuong@hourlink.vn',
        'category', 'Giáo dục', 'name', 'Lập kế hoạch tự học và ôn thi JLPT',
        'description', 'Cùng xác định mục tiêu, chia lịch học theo tuần và chọn tài liệu phù hợp với trình độ hiện tại.',
        'level', 'ADVANCED', 'format', 'ONLINE', 'duration', 60, 'region', 'Toàn quốc',
        'freeTime', 'Tối thứ 3, thứ 6 và cuối tuần', 'ageDays', 12),
    JSON_OBJECT('id', 'd0020000-0000-4000-8000-000000000009', 'email', 'demo.giahan@hourlink.vn',
        'category', 'Thiết kế', 'name', 'Thiết kế UI/UX ứng dụng mobile bằng Figma',
        'description', 'Từ user flow đến prototype có thể bấm thử, phù hợp cho đồ án hoặc sản phẩm đầu tay.',
        'level', 'ADVANCED', 'format', 'BOTH', 'duration', 90, 'region', 'Huế',
        'freeTime', 'Tối thứ 4 và chiều cuối tuần', 'ageDays', 28),
    JSON_OBJECT('id', 'd0020000-0000-4000-8000-000000000010', 'email', 'demo.giahan@hourlink.vn',
        'category', 'Nghệ thuật', 'name', 'Vẽ màu nước phong cảnh căn bản',
        'description', 'Hướng dẫn pha màu, tạo mảng sáng tối và hoàn thiện một bức phong cảnh khổ nhỏ.',
        'level', 'INTERMEDIATE', 'format', 'OFFLINE', 'duration', 90, 'region', 'Huế',
        'freeTime', 'Tối thứ 4 và chiều cuối tuần', 'ageDays', 11),
    JSON_OBJECT('id', 'd0020000-0000-4000-8000-000000000011', 'email', 'demo.ducanh@hourlink.vn',
        'category', 'Thiết kế', 'name', 'Dựng video ngắn bằng Adobe Premiere',
        'description', 'Thực hành cắt nhịp, xử lý âm thanh, chèn chữ và xuất video đúng chuẩn mạng xã hội.',
        'level', 'ADVANCED', 'format', 'ONLINE', 'duration', 90, 'region', 'Toàn quốc',
        'freeTime', 'Sau 19:30 các ngày trong tuần', 'ageDays', 21),
    JSON_OBJECT('id', 'd0020000-0000-4000-8000-000000000012', 'email', 'demo.ducanh@hourlink.vn',
        'category', 'Kinh doanh', 'name', 'Xây dựng nội dung video ngắn cho cửa hàng',
        'description', 'Lên ý tưởng, kịch bản ngắn và lịch đăng bảy ngày để nội dung có mục tiêu rõ ràng.',
        'level', 'INTERMEDIATE', 'format', 'BOTH', 'duration', 60, 'region', 'TP. HCM',
        'freeTime', 'Sau 19:30 các ngày trong tuần', 'ageDays', 9),
    JSON_OBJECT('id', 'd0020000-0000-4000-8000-000000000013', 'email', 'demo.quocbao@hourlink.vn',
        'category', 'Kinh doanh', 'name', 'Thiết lập chiến dịch Facebook Ads đầu tiên',
        'description', 'Hướng dẫn chọn mục tiêu, tệp khách hàng, ngân sách và đọc các chỉ số quan trọng.',
        'level', 'ADVANCED', 'format', 'BOTH', 'duration', 90, 'region', 'Cần Thơ',
        'freeTime', 'Tối thứ 2, thứ 5 và sáng thứ 7', 'ageDays', 24),
    JSON_OBJECT('id', 'd0020000-0000-4000-8000-000000000014', 'email', 'demo.quocbao@hourlink.vn',
        'category', 'Khác', 'name', 'Excel và Google Sheets cho công việc',
        'description', 'Thực hành hàm cơ bản, lọc dữ liệu, pivot table và tạo báo cáo theo dõi đơn giản.',
        'level', 'INTERMEDIATE', 'format', 'ONLINE', 'duration', 60, 'region', 'Toàn quốc',
        'freeTime', 'Tối thứ 2, thứ 5 và sáng thứ 7', 'ageDays', 13),
    JSON_OBJECT('id', 'd0020000-0000-4000-8000-000000000015', 'email', 'demo.ngocmai@hourlink.vn',
        'category', 'Giáo dục', 'name', 'Ôn Toán 12 theo chuyên đề',
        'description', 'Củng cố đạo hàm, khảo sát hàm số và xác suất bằng bài tập từ cơ bản đến vận dụng.',
        'level', 'EXPERT', 'format', 'BOTH', 'duration', 90, 'region', 'Đà Nẵng',
        'freeTime', 'Tối thứ 3, thứ 5 và sáng chủ nhật', 'ageDays', 27),
    JSON_OBJECT('id', 'd0020000-0000-4000-8000-000000000016', 'email', 'demo.ngocmai@hourlink.vn',
        'category', 'Sức khỏe', 'name', 'Giãn cơ và chỉnh tư thế khi ngồi học lâu',
        'description', 'Chuỗi vận động nhẹ tại bàn giúp giảm mỏi cổ vai gáy và xây dựng thói quen ngồi đúng.',
        'level', 'INTERMEDIATE', 'format', 'ONLINE', 'duration', 30, 'region', 'Toàn quốc',
        'freeTime', 'Tối thứ 3, thứ 5 và sáng chủ nhật', 'ageDays', 8),
    JSON_OBJECT('id', 'd0020000-0000-4000-8000-000000000017', 'email', 'demo.minhduc@hourlink.vn',
        'category', 'Sức khỏe', 'name', 'Gym đúng kỹ thuật cho người mới',
        'description', 'Kiểm tra tư thế squat, deadlift, press và xây lịch tập ba buổi mỗi tuần an toàn.',
        'level', 'ADVANCED', 'format', 'OFFLINE', 'duration', 90, 'region', 'TP. HCM',
        'freeTime', 'Sáng thứ 7 và chủ nhật', 'ageDays', 19),
    JSON_OBJECT('id', 'd0020000-0000-4000-8000-000000000018', 'email', 'demo.minhduc@hourlink.vn',
        'category', 'Khác', 'name', 'Quản lý thói quen cá nhân bằng Notion',
        'description', 'Tạo dashboard theo dõi thói quen, mục tiêu tuần và ghi chú học tập dễ duy trì.',
        'level', 'INTERMEDIATE', 'format', 'ONLINE', 'duration', 60, 'region', 'Toàn quốc',
        'freeTime', 'Tối thứ 4 và sáng cuối tuần', 'ageDays', 7),
    JSON_OBJECT('id', 'd0020000-0000-4000-8000-000000000019', 'email', 'demo.thaovy@hourlink.vn',
        'category', 'Sức khỏe', 'name', 'Yoga giãn lưng cho dân văn phòng',
        'description', 'Bài tập nhẹ tập trung vào lưng, hông và vai, có thể thực hiện tại nhà không cần dụng cụ.',
        'level', 'ADVANCED', 'format', 'BOTH', 'duration', 60, 'region', 'Nha Trang',
        'freeTime', 'Sau 19:00 và sáng chủ nhật', 'ageDays', 22),
    JSON_OBJECT('id', 'd0020000-0000-4000-8000-000000000020', 'email', 'demo.thaovy@hourlink.vn',
        'category', 'Nghệ thuật', 'name', 'Nhảy hiện đại căn bản theo nhạc',
        'description', 'Làm quen nhịp, body isolation và hoàn thành một tổ hợp ngắn phù hợp người mới.',
        'level', 'INTERMEDIATE', 'format', 'OFFLINE', 'duration', 90, 'region', 'Nha Trang',
        'freeTime', 'Sau 19:00 và sáng chủ nhật', 'ageDays', 10),
    JSON_OBJECT('id', 'd0020000-0000-4000-8000-000000000021', 'email', 'demo.tuankiet@hourlink.vn',
        'category', 'Nghệ thuật', 'name', 'Guitar đệm hát với bốn hợp âm cơ bản',
        'description', 'Luyện chuyển hợp âm, quạt chả và hoàn thiện một bài hát do người học lựa chọn.',
        'level', 'EXPERT', 'format', 'BOTH', 'duration', 60, 'region', 'Huế',
        'freeTime', 'Tối thứ 3, thứ 6 và cuối tuần', 'ageDays', 30),
    JSON_OBJECT('id', 'd0020000-0000-4000-8000-000000000022', 'email', 'demo.tuankiet@hourlink.vn',
        'category', 'Khác', 'name', 'Nấu các món cơm gia đình kiểu Huế',
        'description', 'Chuẩn bị nguyên liệu, nêm nếm và hoàn thành một bữa cơm ba món vừa ngon vừa tiết kiệm.',
        'level', 'ADVANCED', 'format', 'OFFLINE', 'duration', 120, 'region', 'Huế',
        'freeTime', 'Sáng thứ 7 và chủ nhật', 'ageDays', 15),
    JSON_OBJECT('id', 'd0020000-0000-4000-8000-000000000023', 'email', 'demo.haiyen@hourlink.vn',
        'category', 'Ngôn ngữ', 'name', 'Viết CV tiếng Anh và luyện phỏng vấn',
        'description', 'Chỉnh cách diễn đạt trong CV và luyện trả lời phỏng vấn phù hợp vị trí ứng tuyển.',
        'level', 'ADVANCED', 'format', 'ONLINE', 'duration', 60, 'region', 'Toàn quốc',
        'freeTime', 'Tối thứ 2, thứ 4 và chiều thứ 7', 'ageDays', 17),
    JSON_OBJECT('id', 'd0020000-0000-4000-8000-000000000024', 'email', 'demo.haiyen@hourlink.vn',
        'category', 'Kinh doanh', 'name', 'Xây dựng thương hiệu cá nhân trên LinkedIn',
        'description', 'Xác định thông điệp, tối ưu hồ sơ và lên kế hoạch nội dung chuyên môn trong hai tuần.',
        'level', 'ADVANCED', 'format', 'BOTH', 'duration', 60, 'region', 'Hà Nội',
        'freeTime', 'Tối thứ 2, thứ 4 và chiều thứ 7', 'ageDays', 6)
);

INSERT INTO skill (
    id, created_at, updated_at, name, description, level, format, duration,
    free_time, region, status, category_id, user_id
)
SELECT
    UUID_TO_BIN(j.id), DATE_SUB(NOW(), INTERVAL j.age_days DAY), NOW(),
    j.skill_name, j.description, j.skill_level, j.session_format, j.duration,
    j.free_time, j.region, 'VISIBLE', c.id, u.id
FROM JSON_TABLE(@demo_skills, '$[*]' COLUMNS (
    id VARCHAR(36) PATH '$.id',
    email VARCHAR(150) PATH '$.email',
    category_name VARCHAR(100) PATH '$.category',
    skill_name VARCHAR(150) PATH '$.name',
    description TEXT PATH '$.description',
    skill_level VARCHAR(50) PATH '$.level',
    session_format VARCHAR(50) PATH '$.format',
    duration INT PATH '$.duration',
    free_time VARCHAR(200) PATH '$.freeTime',
    region VARCHAR(200) PATH '$.region',
    age_days INT PATH '$.ageDays'
)) AS j
JOIN users u ON u.email = j.email AND u.is_deleted = 0
JOIN skill_category c ON c.name = j.category_name AND c.is_deleted = 0
WHERE NOT EXISTS (SELECT 1 FROM skill s WHERE s.id = UUID_TO_BIN(j.id));

-- --------------------------------------------------------------------------
-- 16 yeu cau dang tim kiem: moi danh muc co dung 2 yeu cau demo.
-- response_count luon bang 0 vi fixture nay khong tao loi moi gia.
-- --------------------------------------------------------------------------
SET @demo_requests = JSON_ARRAY(
    JSON_OBJECT('id', 'd0030000-0000-4000-8000-000000000001', 'email', 'demo.giahan@hourlink.vn',
        'category', 'Lập trình', 'title', 'Cần gỡ lỗi Spring Security JWT bị 403',
        'description', 'API đăng nhập đã trả token nhưng các endpoint bảo vệ vẫn bị 403. Mình cần được xem lại filter, phân quyền và cách gửi Bearer token.',
        'currentLevel', 'Đã biết Java và Spring Boot cơ bản', 'format', 'ONLINE',
        'desiredTime', 'Tối thứ 3 hoặc thứ 5 sau 19:30', 'duration', 90,
        'region', 'Toàn quốc', 'credit', 1.5, 'ageDays', 2),
    JSON_OBJECT('id', 'd0030000-0000-4000-8000-000000000002', 'email', 'demo.tuankiet@hourlink.vn',
        'category', 'Lập trình', 'title', 'Hướng dẫn làm màn hình React Native đầu tiên',
        'description', 'Mình mới học mobile và muốn hoàn thiện màn danh sách có gọi API, loading, lỗi và điều hướng sang trang chi tiết.',
        'currentLevel', 'Mới bắt đầu với JavaScript', 'format', 'ONLINE',
        'desiredTime', 'Sáng thứ 7 hoặc chủ nhật', 'duration', 60,
        'region', 'Toàn quốc', 'credit', 1.0, 'ageDays', 5),
    JSON_OBJECT('id', 'd0030000-0000-4000-8000-000000000003', 'email', 'demo.khoa@hourlink.vn',
        'category', 'Ngôn ngữ', 'title', 'Luyện phỏng vấn tiếng Anh ngành IT',
        'description', 'Mình cần luyện phần giới thiệu bản thân, mô tả dự án Spring Boot và phản xạ với các câu hỏi thường gặp.',
        'currentLevel', 'Giao tiếp tương đương B1', 'format', 'ONLINE',
        'desiredTime', '19:30 thứ 4 hoặc thứ 6', 'duration', 60,
        'region', 'Toàn quốc', 'credit', 1.0, 'ageDays', 1),
    JSON_OBJECT('id', 'd0030000-0000-4000-8000-000000000004', 'email', 'demo.minhduc@hourlink.vn',
        'category', 'Ngôn ngữ', 'title', 'Học bảng chữ và phát âm tiếng Nhật N5',
        'description', 'Mình chưa từng học tiếng Nhật, cần được hướng dẫn bảng chữ, cách phát âm và một số mẫu câu chào hỏi cơ bản.',
        'currentLevel', 'Mới bắt đầu', 'format', 'BOTH',
        'desiredTime', 'Tối thứ 6 hoặc chiều chủ nhật', 'duration', 60,
        'region', 'Hà Nội', 'credit', 1.0, 'ageDays', 4),
    JSON_OBJECT('id', 'd0030000-0000-4000-8000-000000000005', 'email', 'demo.khanhlinh@hourlink.vn',
        'category', 'Thiết kế', 'title', 'Cần góp ý prototype ứng dụng trên Figma',
        'description', 'Mình đã có wireframe cho ứng dụng quản lý học tập nhưng luồng còn rối. Mong được góp ý về điều hướng, khoảng cách và tính nhất quán.',
        'currentLevel', 'Đã biết các công cụ Figma cơ bản', 'format', 'ONLINE',
        'desiredTime', 'Tối thứ 4 sau 20:00', 'duration', 90,
        'region', 'Toàn quốc', 'credit', 1.5, 'ageDays', 3),
    JSON_OBJECT('id', 'd0030000-0000-4000-8000-000000000006', 'email', 'demo.thaovy@hourlink.vn',
        'category', 'Thiết kế', 'title', 'Hướng dẫn làm poster sự kiện bằng Canva',
        'description', 'Cần hoàn thiện poster cho buổi workshop, ưu tiên bố cục dễ đọc, màu tươi và đúng kích thước đăng mạng xã hội.',
        'currentLevel', 'Chỉ mới dùng mẫu có sẵn', 'format', 'OFFLINE',
        'desiredTime', 'Chiều thứ 7 tuần này', 'duration', 60,
        'region', 'Nha Trang', 'credit', 1.0, 'ageDays', 6),
    JSON_OBJECT('id', 'd0030000-0000-4000-8000-000000000007', 'email', 'demo.baongoc@hourlink.vn',
        'category', 'Kinh doanh', 'title', 'Lập bảng ngân sách cá nhân hàng tháng',
        'description', 'Thu nhập và chi tiêu của mình chưa được theo dõi rõ. Mình muốn có một bảng đơn giản để lập quỹ và kiểm soát chi phí.',
        'currentLevel', 'Chưa từng lập kế hoạch tài chính', 'format', 'ONLINE',
        'desiredTime', 'Tối thứ 2 sau 19:00', 'duration', 60,
        'region', 'Toàn quốc', 'credit', 1.0, 'ageDays', 2),
    JSON_OBJECT('id', 'd0030000-0000-4000-8000-000000000008', 'email', 'demo.ngocmai@hourlink.vn',
        'category', 'Kinh doanh', 'title', 'Kiểm tra chiến dịch Facebook Ads đầu tiên',
        'description', 'Mình đã tạo fanpage và nội dung nhưng chưa biết chọn mục tiêu, tệp khách hàng và ngân sách cho chiến dịch thử nghiệm.',
        'currentLevel', 'Đã biết quản trị fanpage cơ bản', 'format', 'BOTH',
        'desiredTime', 'Tối thứ 5 hoặc sáng chủ nhật', 'duration', 90,
        'region', 'Đà Nẵng', 'credit', 1.5, 'ageDays', 7),
    JSON_OBJECT('id', 'd0030000-0000-4000-8000-000000000009', 'email', 'demo.ducanh@hourlink.vn',
        'category', 'Giáo dục', 'title', 'Ôn đạo hàm và khảo sát hàm số lớp 12',
        'description', 'Mình cần hệ thống lại công thức, cách lập bảng biến thiên và luyện một số câu vận dụng cho kỳ thi sắp tới.',
        'currentLevel', 'Nắm kiến thức ở mức trung bình', 'format', 'ONLINE',
        'desiredTime', 'Tối thứ 3 và thứ 5', 'duration', 90,
        'region', 'Toàn quốc', 'credit', 1.5, 'ageDays', 1),
    JSON_OBJECT('id', 'd0030000-0000-4000-8000-000000000010', 'email', 'demo.haiyen@hourlink.vn',
        'category', 'Giáo dục', 'title', 'Giải bài tập điện xoay chiều lớp 12',
        'description', 'Mình nhớ công thức nhưng hay nhầm khi xác định pha và đọc đồ thị. Cần được chữa bài theo từng bước.',
        'currentLevel', 'Đã học phần lý thuyết cơ bản', 'format', 'BOTH',
        'desiredTime', 'Chiều thứ 7 hoặc chủ nhật', 'duration', 90,
        'region', 'Hà Nội', 'credit', 1.5, 'ageDays', 8),
    JSON_OBJECT('id', 'd0030000-0000-4000-8000-000000000011', 'email', 'demo.thuhuong@hourlink.vn',
        'category', 'Sức khỏe', 'title', 'Chỉnh tư thế Squat và Deadlift cho người mới',
        'description', 'Mình tập được một tháng nhưng chưa tự tin về lưng và đầu gối. Muốn được quan sát và chỉnh kỹ thuật an toàn.',
        'currentLevel', 'Người mới, tập ba buổi mỗi tuần', 'format', 'OFFLINE',
        'desiredTime', 'Sáng thứ 7 tuần này', 'duration', 90,
        'region', 'Hà Nội', 'credit', 1.5, 'ageDays', 4),
    JSON_OBJECT('id', 'd0030000-0000-4000-8000-000000000012', 'email', 'demo.quocbao@hourlink.vn',
        'category', 'Sức khỏe', 'title', 'Xây thực đơn ăn uống lành mạnh trong 7 ngày',
        'description', 'Mình thường ăn bên ngoài và muốn có thực đơn dễ chuẩn bị, đủ chất, phù hợp lịch làm việc bận rộn.',
        'currentLevel', 'Chưa biết tính khẩu phần, không có dị ứng', 'format', 'ONLINE',
        'desiredTime', 'Tối thứ 4 sau 20:00', 'duration', 60,
        'region', 'Toàn quốc', 'credit', 1.0, 'ageDays', 9),
    JSON_OBJECT('id', 'd0030000-0000-4000-8000-000000000013', 'email', 'demo.ngocmai@hourlink.vn',
        'category', 'Nghệ thuật', 'title', 'Học bốn hợp âm Guitar để đệm hát',
        'description', 'Mình có đàn nhưng chưa biết bấm hợp âm. Mục tiêu là chơi được một bài đơn giản sau buổi hướng dẫn.',
        'currentLevel', 'Mới bắt đầu', 'format', 'BOTH',
        'desiredTime', 'Chiều chủ nhật', 'duration', 60,
        'region', 'Đà Nẵng', 'credit', 1.0, 'ageDays', 3),
    JSON_OBJECT('id', 'd0030000-0000-4000-8000-000000000014', 'email', 'demo.minhduc@hourlink.vn',
        'category', 'Nghệ thuật', 'title', 'Vẽ phong cảnh màu nước căn bản',
        'description', 'Mình đã có màu và giấy nhưng chưa biết pha màu, lên lớp và tạo chiều sâu cho một bức phong cảnh nhỏ.',
        'currentLevel', 'Mới thử vẽ theo video', 'format', 'OFFLINE',
        'desiredTime', 'Sáng thứ 7 hoặc chủ nhật', 'duration', 90,
        'region', 'TP. HCM', 'credit', 1.5, 'ageDays', 10),
    JSON_OBJECT('id', 'd0030000-0000-4000-8000-000000000015', 'email', 'demo.giahan@hourlink.vn',
        'category', 'Khác', 'title', 'Thiết lập Notion để quản lý lịch học',
        'description', 'Mình cần một trang tổng quan có thời khóa biểu, deadline và theo dõi tiến độ nhưng chưa biết tổ chức database.',
        'currentLevel', 'Mới dùng Notion', 'format', 'ONLINE',
        'desiredTime', 'Tối thứ 2 hoặc thứ 4', 'duration', 60,
        'region', 'Toàn quốc', 'credit', 1.0, 'ageDays', 5),
    JSON_OBJECT('id', 'd0030000-0000-4000-8000-000000000016', 'email', 'demo.thaovy@hourlink.vn',
        'category', 'Khác', 'title', 'Góp ý CV cho sinh viên mới tốt nghiệp',
        'description', 'Mình đã có CV một trang nhưng phần kinh nghiệm còn dài và chưa thể hiện rõ dự án. Cần góp ý trước khi ứng tuyển.',
        'currentLevel', 'Đã chuẩn bị CV PDF và mô tả công việc', 'format', 'ONLINE',
        'desiredTime', 'Linh hoạt sau 19:00', 'duration', 60,
        'region', 'Toàn quốc', 'credit', 1.0, 'ageDays', 2)
);

INSERT INTO help_request (
    id, created_at, updated_at, title, description, current_level, format,
    desired_time, duration, region, time_credit_amount, status,
    response_count, category_id, requester_id
)
SELECT
    UUID_TO_BIN(j.id), DATE_SUB(NOW(), INTERVAL j.age_days DAY), NOW(),
    j.title, j.description, j.current_level, j.session_format,
    j.desired_time, j.duration, j.region, j.credit, 'SEARCHING', 0, c.id, u.id
FROM JSON_TABLE(@demo_requests, '$[*]' COLUMNS (
    id VARCHAR(36) PATH '$.id',
    email VARCHAR(150) PATH '$.email',
    category_name VARCHAR(100) PATH '$.category',
    title VARCHAR(255) PATH '$.title',
    description TEXT PATH '$.description',
    current_level VARCHAR(100) PATH '$.currentLevel',
    session_format VARCHAR(50) PATH '$.format',
    desired_time VARCHAR(150) PATH '$.desiredTime',
    duration INT PATH '$.duration',
    region VARCHAR(200) PATH '$.region',
    credit DOUBLE PATH '$.credit',
    age_days INT PATH '$.ageDays'
)) AS j
JOIN users u ON u.email = j.email AND u.is_deleted = 0
JOIN skill_category c ON c.name = j.category_name AND c.is_deleted = 0
WHERE NOT EXISTS (SELECT 1 FROM help_request hr WHERE hr.id = UUID_TO_BIN(j.id));

COMMIT;

-- --------------------------------------------------------------------------
-- Ket qua mong doi rieng cho fixture demo:
--   users = 12, skills = 24, requests = 16
--   moi danh muc: 3 supporters / 3 skills / 2 SEARCHING requests
-- --------------------------------------------------------------------------
SELECT
    'DEMO_TOTALS' AS report,
    (SELECT COUNT(*) FROM users WHERE email LIKE 'demo.%@hourlink.vn') AS demo_users,
    (SELECT COUNT(*)
       FROM skill s JOIN users u ON u.id = s.user_id
      WHERE u.email LIKE 'demo.%@hourlink.vn') AS demo_skills,
    (SELECT COUNT(*)
       FROM help_request hr JOIN users u ON u.id = hr.requester_id
      WHERE u.email LIKE 'demo.%@hourlink.vn') AS demo_requests;

SELECT
    c.name AS category,
    COUNT(DISTINCT CASE WHEN s.status = 'VISIBLE' THEN s.user_id END) AS demo_supporters,
    COUNT(DISTINCT CASE WHEN s.status = 'VISIBLE' THEN s.id END) AS demo_skills,
    COUNT(DISTINCT CASE WHEN hr.status = 'SEARCHING' THEN hr.id END) AS demo_searching_requests
FROM skill_category c
LEFT JOIN skill s
       ON s.category_id = c.id
      AND s.user_id IN (SELECT id FROM users WHERE email LIKE 'demo.%@hourlink.vn')
LEFT JOIN help_request hr
       ON hr.category_id = c.id
      AND hr.requester_id IN (SELECT id FROM users WHERE email LIKE 'demo.%@hourlink.vn')
WHERE c.is_deleted = 0
  AND c.name IN ('Lập trình', 'Ngôn ngữ', 'Thiết kế', 'Kinh doanh',
                 'Giáo dục', 'Sức khỏe', 'Nghệ thuật', 'Khác')
GROUP BY c.id, c.name
ORDER BY FIELD(c.name, 'Lập trình', 'Ngôn ngữ', 'Thiết kế', 'Kinh doanh',
                      'Giáo dục', 'Sức khỏe', 'Nghệ thuật', 'Khác');
