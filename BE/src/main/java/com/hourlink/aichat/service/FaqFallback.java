package com.hourlink.aichat.service;

import java.text.Normalizer;
import java.util.LinkedHashMap;
import java.util.Map;

/** Bộ trả lời FAQ theo từ khóa — dùng khi chưa cấu hình GEMINI_API_KEY hoặc để demo offline. */
final class FaqFallback {

    private static final Map<String, String> FAQ = new LinkedHashMap<>();

    static {
        FAQ.put("time credit|gio tin dung|credit|tinh gio|vi",
                "Time Credit là giờ tín dụng dùng để trao đổi kỹ năng thay cho tiền mặt:\n"
                        + "- Bạn kiếm credit khi hỗ trợ người khác.\n"
                        + "- Bạn dùng credit để nhận hỗ trợ từ người khác.\n"
                        + "- Credit được chuyển sau khi buổi học được xác nhận hoàn thành.");
        FAQ.put("dang yeu cau|tao yeu cau|can hoc|tim nguoi",
                "Cách đăng yêu cầu hỗ trợ:\n"
                        + "- Vào tab Đăng bài và mô tả điều bạn cần học bằng ngôn ngữ tự nhiên.\n"
                        + "- AI sẽ tự phân loại danh mục và gợi ý tiêu đề, hình thức, thời gian.\n"
                        + "- Xem danh sách người hỗ trợ được AI xếp hạng rồi gửi lời mời.");
        FAQ.put("ai|goi y|phu hop|match",
                "AI xếp hạng người hỗ trợ theo 3 tiêu chí:\n"
                        + "- 60% độ khớp ngữ nghĩa giữa yêu cầu và kỹ năng.\n"
                        + "- 20% lịch rảnh trùng khớp.\n"
                        + "- 20% điểm uy tín (đánh giá sao).\n"
                        + "Mỗi gợi ý đều kèm lý do để bạn dễ quyết định.");
        FAQ.put("qr|otp|xac nhan|lich hen|buoi hoc",
                "Quy trình lịch hẹn:\n"
                        + "- Hai bên thống nhất thời gian trong chi tiết lịch hẹn.\n"
                        + "- Khi gặp nhau, quét mã QR hoặc nhập OTP để xác nhận bắt đầu.\n"
                        + "- Sau buổi học, credit được chuyển và hai bên đánh giá nhau.");
        FAQ.put("huy|doi lich",
                "Bạn có thể hủy lịch hẹn trong màn hình chi tiết lịch hẹn: nhập lý do rõ ràng và hủy càng sớm càng tốt "
                        + "để người còn lại chủ động sắp xếp.");
        FAQ.put("bao cao|chan|vi pham",
                "Để báo cáo hoặc chặn người dùng, mở cuộc trò chuyện và chọn menu ở góc trên. "
                        + "Báo cáo có thể kèm mô tả và bằng chứng; bạn theo dõi trạng thái ở mục Báo cáo của tôi.");
        FAQ.put("cong dong|minh chung|hoat dong",
                "Hoạt động cộng đồng: sau khi đăng ký và tham gia, bạn gửi ảnh minh chứng; "
                        + "tổ chức xác nhận số giờ đóng góp rồi hệ thống mới cộng credit.");
    }

    private static final String DEFAULT = "Mình là Trợ lý HourLink. Mình có thể giải đáp về Time Credit, "
            + "cách đăng yêu cầu hỗ trợ, gợi ý của AI, lịch hẹn QR/OTP, báo cáo và hoạt động cộng đồng. "
            + "Bạn muốn hỏi về mục nào?";

    private FaqFallback() {
    }

    static String answer(String question) {
        String q = normalize(question);
        for (Map.Entry<String, String> entry : FAQ.entrySet()) {
            for (String keyword : entry.getKey().split("\\|")) {
                if (matches(q, keyword)) {
                    return entry.getValue();
                }
            }
        }
        return DEFAULT;
    }

    /** Từ khóa ngắn (<=3 ký tự) phải khớp nguyên từ để tránh khớp nhầm trong từ khác. */
    private static boolean matches(String question, String keyword) {
        if (keyword.length() <= 3) {
            return (" " + question + " ").contains(" " + keyword + " ");
        }
        return question.contains(keyword);
    }

    private static String normalize(String text) {
        String decomposed = Normalizer.normalize(text.toLowerCase(), Normalizer.Form.NFD);
        return decomposed.replaceAll("\\p{M}", "").replace('đ', 'd').replaceAll("[^a-z0-9 ]", " ");
    }
}
