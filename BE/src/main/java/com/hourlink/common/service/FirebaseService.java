package com.hourlink.common.service;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.SetOptions;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.cloud.FirestoreClient;
import com.hourlink.config.FirebaseConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * FirebaseService — Cầu nối sang Firebase phục vụ chat realtime (chức năng 9.10).
 *
 * <p>Kiến trúc: MySQL là nguồn sự thật và là bằng chứng khi xử lý tranh chấp
 * (mục 9.23); Firestore chỉ là <b>kênh đẩy realtime</b>. Sau khi lưu tin nhắn
 * vào MySQL, service này mirror bản sao sang Firestore để client đang mở
 * {@code onSnapshot} nhận được ngay lập tức.</p>
 *
 * <p>Cấu trúc dữ liệu trên Firestore:</p>
 * <pre>
 * conversations/{conversationId}                 ← tóm tắt hội thoại (tin cuối, unread)
 * conversations/{conversationId}/messages/{id}   ← từng tin nhắn
 * </pre>
 *
 * <p>Mọi phương thức đều <b>fail-soft</b>: nếu Firebase chưa cấu hình hoặc lỗi,
 * chỉ ghi log chứ không ném exception — luồng nghiệp vụ chính không được phép
 * hỏng chỉ vì mất realtime.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FirebaseService {

    private static final String COLLECTION_CONVERSATIONS = "conversations";
    private static final String SUBCOLLECTION_MESSAGES = "messages";

    private final FirebaseConfig firebaseConfig;

    /** Firebase đã sẵn sàng chưa */
    public boolean isEnabled() {
        return firebaseConfig.isEnabled();
    }

    /**
     * Sinh Firebase Custom Token để client đăng nhập vào Firebase.
     * uid dùng chính UUID người dùng trong MySQL nên Firestore Rules có thể
     * đối chiếu {@code request.auth.uid} với mảng {@code participants}.
     *
     * @return custom token, hoặc null nếu Firebase chưa cấu hình
     */
    public String createCustomToken(String userId, String email) {
        if (!isEnabled()) return null;
        try {
            return FirebaseAuth.getInstance()
                    .createCustomToken(userId, Map.of("email", email));
        } catch (Exception e) {
            log.error("Không tạo được Firebase custom token cho {}: {}", email, e.getMessage());
            return null;
        }
    }

    /**
     * Tạo / cập nhật document tóm tắt của một cuộc trò chuyện.
     * Dùng merge để không ghi đè các field đã có (ví dụ unread của người kia).
     */
    public void upsertConversation(String conversationId, Map<String, Object> data) {
        if (!isEnabled()) return;
        try {
            firestore().collection(COLLECTION_CONVERSATIONS)
                    .document(conversationId)
                    .set(data, SetOptions.merge());
        } catch (Exception e) {
            log.error("Mirror hội thoại {} sang Firestore thất bại: {}", conversationId, e.getMessage());
        }
    }

    /**
     * Đẩy một tin nhắn sang Firestore. Dùng chính ID của MySQL làm document ID
     * để hai bên không bao giờ lệch nhau và client dễ khử trùng lặp.
     */
    public void pushMessage(String conversationId, String messageId, Map<String, Object> data) {
        if (!isEnabled()) return;
        try {
            firestore().collection(COLLECTION_CONVERSATIONS)
                    .document(conversationId)
                    .collection(SUBCOLLECTION_MESSAGES)
                    .document(messageId)
                    .set(data);
        } catch (Exception e) {
            log.error("Đẩy tin nhắn {} sang Firestore thất bại: {}", messageId, e.getMessage());
        }
    }

    /** Cập nhật số tin chưa đọc của một người trong hội thoại */
    public void updateUnread(String conversationId, String userId, long unreadCount) {
        if (!isEnabled()) return;
        try {
            firestore().collection(COLLECTION_CONVERSATIONS)
                    .document(conversationId)
                    .set(Map.of("unread", Map.of(userId, unreadCount)), SetOptions.merge());
        } catch (Exception e) {
            log.error("Cập nhật unread cho hội thoại {} thất bại: {}", conversationId, e.getMessage());
        }
    }

    /**
     * Bật / tắt cờ chặn trên document hội thoại để Firestore Rules chặn luôn
     * việc đọc realtime, không chỉ chặn ở tầng REST.
     */
    public void setBlocked(String conversationId, boolean blocked) {
        if (!isEnabled()) return;
        try {
            firestore().collection(COLLECTION_CONVERSATIONS)
                    .document(conversationId)
                    .set(Map.of("blocked", blocked), SetOptions.merge());
        } catch (Exception e) {
            log.error("Cập nhật cờ chặn cho hội thoại {} thất bại: {}", conversationId, e.getMessage());
        }
    }

    private Firestore firestore() {
        return FirestoreClient.getFirestore();
    }
}
