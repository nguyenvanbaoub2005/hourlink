package com.hourlink.chat.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Bảo trì nhẹ dữ liệu chat sau khi Hibernate đã cập nhật schema.
 *
 * <p>Bản cũ tạo một phòng cho mỗi lời mời nên cùng một người xuất hiện nhiều
 * lần. Tác vụ này chạy idempotent: lần đầu hợp nhất, các lần sau không đổi gì.</p>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ChatConversationStartupMaintenance {

    private final ChatService chatService;

    @EventListener(ApplicationReadyEvent.class)
    public void consolidatePersonalConversations() {
        try {
            int archived = chatService.consolidateDuplicatePersonalConversations();
            if (archived > 0) {
                log.info("Archived {} duplicate personal chat rooms at startup", archived);
            }
        } catch (Exception exception) {
            // Không chặn ứng dụng khởi động; API vẫn có lớp khử trùng dự phòng ở FE.
            log.error("Could not consolidate duplicate personal chat rooms: {}",
                    exception.getMessage(), exception);
        }
    }
}
