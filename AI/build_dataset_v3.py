"""Build the cleaned, app-aligned HourLink text classification dataset.

The original v2 file is kept as an immutable source.  This builder fixes the
known cross-category label noise by using each skill's dominant label, maps the
legacy taxonomy to the eight categories exposed by the mobile app, balances the
classes, and adds natural Vietnamese user questions.
"""

from __future__ import annotations

import csv
import random
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
SOURCE_PATH = BASE_DIR / "docs" / "hourlink_skill_dataset_v2.csv"
OUTPUT_PATH = BASE_DIR / "docs" / "hourlink_skill_dataset_v3.csv"
RANDOM_SEED = 20260811
LEGACY_ROWS_PER_CATEGORY = 720

CATEGORIES = {
    "Lập trình": 1,
    "Ngôn ngữ": 2,
    "Thiết kế": 3,
    "Kinh doanh": 4,
    "Giáo dục": 5,
    "Sức khỏe": 6,
    "Nghệ thuật": 7,
    "Khác": 8,
}

LEGACY_TO_APP_CATEGORY = {
    "Lập trình phần mềm": "Lập trình",
    "AI & Data Science": "Lập trình",
    "Ngoại ngữ": "Ngôn ngữ",
    "Thiết kế đồ họa": "Thiết kế",
    "UI/UX": "Thiết kế",
    "Marketing & Kinh doanh": "Kinh doanh",
    "Gia sư & Học tập": "Giáo dục",
    "Thể thao": "Sức khỏe",
    "Âm nhạc": "Nghệ thuật",
    "Nghệ thuật": "Nghệ thuật",
    "Sửa chữa": "Khác",
    "Nấu ăn": "Khác",
}

LEVEL_MAPPING = {
    "Cơ bản": "Mới bắt đầu",
    "Trung bình": "Trung bình",
    "Nâng cao": "Nâng cao",
    "Không xác định": "Không xác định",
    "Định kỳ": "Không xác định",
    "Khẩn cấp": "Không xác định",
}

# Ten real-world topics per category.  Eight distinct utterance styles are
# generated for every topic, yielding 80 natural questions per category.
TOPICS = {
    "Lập trình": [
        ("Spring Security", "sửa lỗi 403 khi xác thực JWT", "Trung bình"),
        ("React Native", "làm màn hình và điều hướng cho ứng dụng đầu tiên", "Mới bắt đầu"),
        ("MySQL", "tối ưu truy vấn JOIN đang chạy chậm", "Trung bình"),
        ("Git và GitHub", "xử lý conflict trước khi làm việc nhóm", "Mới bắt đầu"),
        ("Python Pandas", "đọc và làm sạch dữ liệu từ file Excel", "Mới bắt đầu"),
        ("Docker", "đóng gói và chạy dự án Spring Boot", "Trung bình"),
        ("Node.js", "xây dựng API đăng nhập an toàn", "Trung bình"),
        ("Flutter", "tạo ứng dụng quản lý công việc đơn giản", "Mới bắt đầu"),
        ("HTML CSS", "sửa giao diện bị vỡ trên điện thoại", "Mới bắt đầu"),
        ("Kiểm thử phần mềm", "viết unit test cho một dự án Java", "Nâng cao"),
    ],
    "Ngôn ngữ": [
        ("Tiếng Anh giao tiếp", "luyện phản xạ cho buổi phỏng vấn IT", "Trung bình"),
        ("IELTS Writing", "sửa bài Task 2 và giải thích lỗi ngữ pháp", "Trung bình"),
        ("Tiếng Nhật N5", "học bảng chữ cái và phát âm từ đầu", "Mới bắt đầu"),
        ("Tiếng Hàn", "luyện các câu giao tiếp khi đi du lịch", "Mới bắt đầu"),
        ("Tiếng Trung HSK", "ôn từ vựng và hội thoại cấp độ 2", "Mới bắt đầu"),
        ("Tiếng Pháp", "nắm cách chia động từ và phát âm cơ bản", "Mới bắt đầu"),
        ("TOEIC", "lập kế hoạch ôn nghe đọc để đạt 650 điểm", "Trung bình"),
        ("Phát âm tiếng Anh", "sửa các âm cuối mình thường đọc sai", "Trung bình"),
        ("Email tiếng Anh", "viết thư trao đổi công việc lịch sự", "Trung bình"),
        ("Tiếng Anh cho trẻ em", "xây dựng buổi học vui và dễ nhớ", "Mới bắt đầu"),
    ],
    "Thiết kế": [
        ("Figma", "góp ý prototype ứng dụng đặt lịch", "Trung bình"),
        ("Canva", "làm poster truyền thông cho sự kiện", "Mới bắt đầu"),
        ("Photoshop", "tách nền và chỉnh màu ảnh sản phẩm", "Trung bình"),
        ("Thiết kế logo", "hoàn thiện nhận diện cho quán cà phê", "Nâng cao"),
        ("UX Research", "thiết kế bộ câu hỏi phỏng vấn người dùng", "Nâng cao"),
        ("Premiere", "cắt video ngắn và thêm phụ đề", "Mới bắt đầu"),
        ("Blender 3D", "dựng một mô hình sản phẩm đơn giản", "Mới bắt đầu"),
        ("Typography", "chọn và phối font cho giao diện mobile", "Trung bình"),
        ("Vẽ minh họa", "luyện bố cục và phối màu cơ bản", "Mới bắt đầu"),
        ("Design System", "xây dựng component dùng chung trong Figma", "Nâng cao"),
    ],
    "Kinh doanh": [
        ("Facebook Ads", "kiểm tra chiến dịch quảng cáo đầu tiên", "Trung bình"),
        ("SEO", "lập kế hoạch từ khóa cho cửa hàng nhỏ", "Trung bình"),
        ("Tài chính cá nhân", "làm bảng ngân sách chi tiêu hàng tháng", "Mới bắt đầu"),
        ("Kế hoạch kinh doanh", "hoàn thiện mô hình bán đồ thủ công", "Nâng cao"),
        ("Định giá sản phẩm", "tính giá bán có lợi nhuận hợp lý", "Trung bình"),
        ("Kỹ năng bán hàng", "tư vấn khách mà không gây khó chịu", "Trung bình"),
        ("Content Marketing", "xây lịch đăng bài trong một tháng", "Mới bắt đầu"),
        ("Excel cho công việc", "làm báo cáo doanh thu bằng PivotTable", "Trung bình"),
        ("Thương hiệu cá nhân", "xây dựng nội dung chuyên nghiệp trên mạng xã hội", "Trung bình"),
        ("Nghiên cứu thị trường", "khảo sát nhu cầu trước khi ra mắt sản phẩm", "Nâng cao"),
    ],
    "Giáo dục": [
        ("Toán lớp 12", "ôn đạo hàm và khảo sát hàm số", "Trung bình"),
        ("Vật lý", "giải bài điện xoay chiều từng bước", "Trung bình"),
        ("Hóa học", "học cách cân bằng phản ứng cơ bản", "Mới bắt đầu"),
        ("Ngữ văn", "lập dàn ý bài nghị luận xã hội", "Trung bình"),
        ("Thuyết trình", "trình bày slide bảo vệ đồ án tự tin hơn", "Trung bình"),
        ("Phương pháp học", "lập thời gian biểu ôn thi hiệu quả", "Mới bắt đầu"),
        ("PowerPoint", "thiết kế slide bài giảng dễ theo dõi", "Trung bình"),
        ("Xác suất thống kê", "hiểu kiểm định giả thuyết qua ví dụ", "Nâng cao"),
        ("Lịch sử", "hệ thống các mốc sự kiện để dễ ghi nhớ", "Mới bắt đầu"),
        ("Toán tiểu học", "hướng dẫn trẻ giải bài toán có lời văn", "Mới bắt đầu"),
    ],
    "Sức khỏe": [
        ("Yoga", "tập giãn lưng cho người ngồi nhiều", "Mới bắt đầu"),
        ("Gym", "chỉnh tư thế squat và deadlift an toàn", "Trung bình"),
        ("Chạy bộ", "lập giáo án hoàn thành cự ly 5 km", "Mới bắt đầu"),
        ("Bơi lội", "tập thở đúng và bơi liên tục 25 mét", "Mới bắt đầu"),
        ("Dinh dưỡng", "xây thực đơn cân bằng trong bảy ngày", "Trung bình"),
        ("Thiền", "thực hành tập trung và giảm căng thẳng", "Mới bắt đầu"),
        ("Giãn cơ", "khắc phục tình trạng cứng vai gáy", "Mới bắt đầu"),
        ("Đạp xe", "điều chỉnh tư thế để tránh đau đầu gối", "Trung bình"),
        ("Bóng đá", "luyện kiểm soát bóng và chuyền ngắn", "Mới bắt đầu"),
        ("Thói quen ngủ", "xây dựng lịch nghỉ ngơi đều đặn hơn", "Mới bắt đầu"),
    ],
    "Nghệ thuật": [
        ("Guitar đệm hát", "học bốn hợp âm cho người mới", "Mới bắt đầu"),
        ("Piano", "đọc nốt và chơi một bản nhạc đơn giản", "Mới bắt đầu"),
        ("Luyện thanh", "lấy hơi và hát đúng cao độ", "Trung bình"),
        ("Vẽ màu nước", "pha màu và vẽ phong cảnh cơ bản", "Mới bắt đầu"),
        ("Nhiếp ảnh", "chụp chân dung đẹp bằng điện thoại", "Trung bình"),
        ("Ukulele", "đệm một bài hát trong cuối tuần", "Mới bắt đầu"),
        ("Nhảy hiện đại", "học một bài nhảy ngắn từ đầu", "Mới bắt đầu"),
        ("Vẽ chân dung", "dựng hình khuôn mặt đúng tỷ lệ", "Trung bình"),
        ("Sáo trúc", "thổi đúng cao độ và giữ hơi lâu", "Mới bắt đầu"),
        ("Sáng tác", "phát triển giai điệu thành một bài hát", "Nâng cao"),
    ],
    "Khác": [
        ("Nấu ăn gia đình", "nấu ba món cơm đơn giản", "Mới bắt đầu"),
        ("Sửa máy giặt", "kiểm tra máy không xả được nước", "Trung bình"),
        ("Notion", "tạo trang quản lý lịch học cá nhân", "Mới bắt đầu"),
        ("Trồng rau ban công", "chọn đất và chăm rau thơm", "Mới bắt đầu"),
        ("May vá", "sửa đường chỉ và lên gấu quần", "Mới bắt đầu"),
        ("Sắp xếp nhà cửa", "tổ chức góc học tập gọn gàng", "Mới bắt đầu"),
        ("Chăm sóc thú cưng", "xây lịch ăn và vận động cho mèo", "Mới bắt đầu"),
        ("Tổ chức sự kiện", "lập checklist cho buổi sinh hoạt nhỏ", "Trung bình"),
        ("Sửa xe đạp", "chỉnh phanh và thay săm tại nhà", "Mới bắt đầu"),
        ("Làm bánh", "nướng bánh bông lan không bị xẹp", "Trung bình"),
    ],
}


def without_accents(text: str) -> str:
    normalized = unicodedata.normalize("NFD", text)
    return "".join(char for char in normalized if unicodedata.category(char) != "Mn").replace("đ", "d").replace("Đ", "D")


def natural_descriptions(skill: str, need: str) -> list[str]:
    return [
        f"Có ai rành {skill} giúp mình {need} không? Mình học được vào buổi tối.",
        f"Mình đang cần {need}, ai có thể hướng dẫn một buổi được không ạ?",
        f"{skill} nên bắt đầu từ đâu? Mình muốn {need} nhưng chưa biết làm thế nào.",
        f"Ở Đà Nẵng có người nào biết {skill} và có thể {need} trực tiếp không?",
        f"Mình tự học {skill} nhưng đang bị vướng, cần người hướng dẫn {need} vào cuối tuần.",
        f"Cần mentor về {skill} để {need}, ưu tiên học online sau 19 giờ.",
        without_accents(f"Ai biet {skill} giup minh {need} dc khong, minh cam on nhieu."),
        f"{skill}: cần {need}, mong tìm người giải thích chậm và dễ hiểu.",
    ]


def read_source_rows() -> list[dict[str, str]]:
    # v2 has a UTF-8 BOM; utf-8-sig keeps the first header as "description".
    with SOURCE_PATH.open(encoding="utf-8-sig", newline="") as source_file:
        return list(csv.DictReader(source_file))


def dominant_legacy_categories(rows: list[dict[str, str]]) -> dict[str, str]:
    counts: dict[str, Counter[str]] = defaultdict(Counter)
    for row in rows:
        counts[row["skill_name"]][row["category_name"]] += 1
    return {skill: labels.most_common(1)[0][0] for skill, labels in counts.items()}


def cleaned_legacy_rows(rows: list[dict[str, str]]) -> dict[str, list[dict[str, str]]]:
    dominant = dominant_legacy_categories(rows)
    grouped: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in rows:
        app_category = LEGACY_TO_APP_CATEGORY[dominant[row["skill_name"]]]
        grouped[app_category].append({
            "description": row["description"].strip(),
            "category_id": str(CATEGORIES[app_category]),
            "category_name": app_category,
            "skill_name": row["skill_name"].strip(),
            "level": LEVEL_MAPPING.get(row["level"].strip(), "Không xác định"),
            "source": "legacy_cleaned",
            "group_id": f"skill:{row['skill_name'].strip().lower()}",
        })
    return grouped


def augmented_rows() -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for category_name, topics in TOPICS.items():
        for topic_index, (skill, need, level) in enumerate(topics, start=1):
            for description in natural_descriptions(skill, need):
                rows.append({
                    "description": description,
                    "category_id": str(CATEGORIES[category_name]),
                    "category_name": category_name,
                    "skill_name": skill,
                    "level": level,
                    "source": "natural_question",
                    "group_id": f"natural:{CATEGORIES[category_name]}:{topic_index}",
                })
    return rows


def validate(rows: list[dict[str, str]]) -> None:
    expected_per_category = LEGACY_ROWS_PER_CATEGORY + 80
    category_counts = Counter(row["category_name"] for row in rows)
    source_counts = Counter(row["source"] for row in rows)
    descriptions = [row["description"] for row in rows]

    if set(category_counts) != set(CATEGORIES):
        raise ValueError(f"Unexpected categories: {sorted(category_counts)}")
    if any(count != expected_per_category for count in category_counts.values()):
        raise ValueError(f"Dataset is not balanced: {category_counts}")
    if len(descriptions) != len(set(descriptions)):
        raise ValueError("Duplicate descriptions detected")
    if source_counts["natural_question"] != len(CATEGORIES) * 80:
        raise ValueError(f"Natural query count is invalid: {source_counts}")
    if any(row["level"] not in {"Mới bắt đầu", "Trung bình", "Nâng cao", "Không xác định"} for row in rows):
        raise ValueError("Invalid level detected")

    print(f"Validated {len(rows)} rows")
    print("Category counts:", dict(sorted(category_counts.items())))
    print("Source counts:", dict(sorted(source_counts.items())))


def build() -> None:
    source_rows = read_source_rows()
    grouped = cleaned_legacy_rows(source_rows)
    rng = random.Random(RANDOM_SEED)
    output_rows: list[dict[str, str]] = []

    for category_name in CATEGORIES:
        candidates = grouped[category_name]
        if len(candidates) < LEGACY_ROWS_PER_CATEGORY:
            raise ValueError(f"Not enough legacy rows for {category_name}: {len(candidates)}")
        output_rows.extend(rng.sample(candidates, LEGACY_ROWS_PER_CATEGORY))

    output_rows.extend(augmented_rows())
    output_rows.sort(key=lambda row: (int(row["category_id"]), row["source"], row["group_id"], row["description"]))
    validate(output_rows)

    fieldnames = ["description", "category_id", "category_name", "skill_name", "level", "source", "group_id"]
    with OUTPUT_PATH.open("w", encoding="utf-8", newline="") as output_file:
        writer = csv.DictWriter(output_file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(output_rows)
    print(f"Wrote {OUTPUT_PATH}")


if __name__ == "__main__":
    build()
