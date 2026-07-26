package com.hourlink.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.DefaultResourceLoader;
import org.springframework.core.io.Resource;

import java.io.InputStream;

/**
 * FirebaseConfig — Khởi tạo Firebase Admin SDK cho chat realtime (chức năng 9.10).
 *
 * <p>Credentials đọc từ {@code FIREBASE_CREDENTIALS} — đường dẫn tới file
 * service-account JSON, hỗ trợ cả tiền tố {@code classpath:} lẫn {@code file:}.</p>
 *
 * <p><b>Cố ý KHÔNG fail-fast:</b> nếu chưa cấu hình Firebase thì
 * {@link #isEnabled()} trả về {@code false} và toàn bộ chat vẫn chạy bình
 * thường qua REST — chỉ mất khả năng đẩy realtime. Nhờ vậy có thể chạy dự án
 * ngay mà chưa cần tạo Firebase project.</p>
 *
 * <p>Không khai báo {@code @Bean FirebaseApp} vì bean trả về {@code null} sẽ
 * làm hỏng việc inject; thay vào đó khởi tạo bằng {@code @PostConstruct} và
 * truy cập qua {@link com.hourlink.common.service.FirebaseService}.</p>
 */
@Slf4j
@Getter
@Configuration
public class FirebaseConfig {

    @Value("${firebase.credentials:}")
    private String credentialsLocation;

    @Value("${firebase.database-url:}")
    private String databaseUrl;

    /** Firebase đã sẵn sàng hay chưa — quyết định có mirror sang Firestore không */
    private boolean enabled = false;

    @PostConstruct
    public void init() {
        if (credentialsLocation == null || credentialsLocation.isBlank()) {
            log.warn("""
                    ⚠️  Firebase chưa được cấu hình (thiếu biến FIREBASE_CREDENTIALS).
                        Chat vẫn hoạt động qua REST nhưng KHÔNG có realtime.
                        Xem hướng dẫn tại BE/docs/FIREBASE_SETUP.md""");
            return;
        }

        try {
            if (!FirebaseApp.getApps().isEmpty()) {
                enabled = true;
                return;
            }

            Resource resource = new DefaultResourceLoader().getResource(credentialsLocation);

            if (!resource.exists()) {
                log.warn("""
                        ⚠️  Chưa tìm thấy file Firebase service account tại: {}
                            Chat vẫn hoạt động qua REST nhưng KHÔNG có realtime.
                            Cách bật: tải khoá từ Firebase Console → Project settings →
                            Service accounts → Generate new private key, rồi đặt file vào
                            BE/src/main/resources/firebase-service-account.json
                            Chi tiết: BE/docs/FIREBASE_SETUP.md""", credentialsLocation);
                return;
            }

            try (InputStream serviceAccount = resource.getInputStream()) {
                FirebaseOptions.Builder builder = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(serviceAccount));

                if (databaseUrl != null && !databaseUrl.isBlank()) {
                    builder.setDatabaseUrl(databaseUrl);
                }

                FirebaseApp.initializeApp(builder.build());
                enabled = true;
                log.info("✅ Firebase Admin SDK đã khởi tạo — chat realtime sẵn sàng");
            }
        } catch (Exception e) {
            log.error("❌ Không khởi tạo được Firebase ({}). Chat sẽ chạy ở chế độ REST-only.",
                    e.getMessage());
        }
    }
}
