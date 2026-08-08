package com.hourlink.chat.controller;

import com.hourlink.chat.dto.request.BlockUserRequest;
import com.hourlink.chat.dto.request.ProposeRescheduleRequest;
import com.hourlink.chat.dto.request.ReportMessageRequest;
import com.hourlink.chat.dto.request.SendMessageRequest;
import com.hourlink.chat.dto.request.UpdateChatReportStatusRequest;
import com.hourlink.chat.dto.response.BlockedUserResponse;
import com.hourlink.chat.dto.response.ChatMessageResponse;
import com.hourlink.chat.dto.response.ChatReportResponse;
import com.hourlink.chat.dto.response.ConversationResponse;
import com.hourlink.chat.dto.response.FirebaseTokenResponse;
import com.hourlink.chat.service.ChatService;
import com.hourlink.common.constant.AppConstants;
import com.hourlink.common.response.ApiResponse;
import com.hourlink.common.response.PagedResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

/**
 * ChatController — REST API cho chức năng 9.10 Chat.
 *
 * <p>REST là đường ghi duy nhất: mọi tin nhắn đều được validate và lưu vào
 * MySQL tại đây, sau đó service mirror sang Firestore để client nhận realtime.
 * Client chỉ <b>đọc</b> realtime từ Firestore, không ghi trực tiếp.</p>
 */
@Tag(name = "Chat Management", description = "Quản lý trò chuyện (chức năng 9.10)")
@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChatController {

    ChatService chatService;

    // ─── Đăng nhập Firebase (realtime) ──────────────────────────────────────

    @Operation(summary = "Lấy Firebase custom token",
            description = "Client dùng token này để signInWithCustomToken rồi nghe tin nhắn realtime từ Firestore")
    @GetMapping("/firebase-token")
    public ApiResponse<FirebaseTokenResponse> getFirebaseToken() {
        return ApiResponse.success(chatService.createFirebaseToken());
    }

    // ─── Cuộc trò chuyện ────────────────────────────────────────────────────

    @Operation(summary = "Mở cuộc trò chuyện từ lời mời đã chấp nhận",
            description = "Idempotent — gọi nhiều lần vẫn trả về cùng một cuộc trò chuyện")
    @PostMapping("/conversations/from-invitation/{invitationId}")
    public ApiResponse<ConversationResponse> openConversation(@PathVariable UUID invitationId) {
        return ApiResponse.success(chatService.getOrCreateConversation(invitationId));
    }

    @Operation(summary = "Mở cuộc trò chuyện với tổ chức từ hoạt động cộng đồng",
            description = "Dành cho người đã đăng ký; không yêu cầu lời mời kỹ năng và có tính idempotent")
    @PostMapping("/conversations/from-community/{activityId}")
    public ApiResponse<ConversationResponse> openCommunityConversation(@PathVariable UUID activityId) {
        return ApiResponse.success(chatService.getOrCreateCommunityConversation(activityId));
    }

    @Operation(summary = "Danh sách cuộc trò chuyện của tôi")
    @GetMapping("/conversations")
    public ApiResponse<List<ConversationResponse>> getMyConversations() {
        return ApiResponse.success(chatService.getMyConversations());
    }

    @Operation(summary = "Chi tiết một cuộc trò chuyện")
    @GetMapping("/conversations/{id}")
    public ApiResponse<ConversationResponse> getConversationDetail(@PathVariable UUID id) {
        return ApiResponse.success(chatService.getConversationDetail(id));
    }

    // ─── Tin nhắn ───────────────────────────────────────────────────────────

    @Operation(summary = "Lịch sử tin nhắn", description = "Phân trang, mới nhất trước")
    @GetMapping("/conversations/{id}/messages")
    public ApiResponse<PagedResponse<ChatMessageResponse>> getMessages(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "" + AppConstants.DEFAULT_PAGE_SIZE) int size) {
        return ApiResponse.success(chatService.getMessages(id, page, size));
    }

    @Operation(summary = "Gửi tin nhắn",
            description = "Hỗ trợ TEXT, LOCATION và MEETING_LINK. Ảnh/tài liệu dùng endpoint đính kèm.")
    @PostMapping("/conversations/{id}/messages")
    public ApiResponse<ChatMessageResponse> sendMessage(
            @PathVariable UUID id,
            @RequestBody @Valid SendMessageRequest request) {
        return ApiResponse.created("Đã gửi tin nhắn", chatService.sendMessage(id, request));
    }

    @Operation(summary = "Gửi hình ảnh hoặc tài liệu",
            description = "Tối đa 20MB. Ảnh: jpeg/png/gif/webp. Tài liệu: pdf/doc/docx/ppt/pptx.")
    @PostMapping(value = "/conversations/{id}/messages/attachment",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<ChatMessageResponse> sendAttachment(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "caption", required = false) String caption) {
        return ApiResponse.created("Đã gửi tệp đính kèm",
                chatService.sendAttachment(id, file, caption));
    }

    @Operation(summary = "Đề xuất đổi lịch trong cuộc trò chuyện",
            description = "Cập nhật luôn trạng thái lời mời sang RESCHEDULED")
    @PostMapping("/conversations/{id}/reschedule")
    public ApiResponse<ChatMessageResponse> proposeReschedule(
            @PathVariable UUID id,
            @RequestBody @Valid ProposeRescheduleRequest request) {
        return ApiResponse.created("Đã gửi đề xuất đổi lịch",
                chatService.proposeReschedule(id, request));
    }

    @Operation(summary = "Đánh dấu đã đọc toàn bộ tin nhắn trong cuộc trò chuyện")
    @PutMapping("/conversations/{id}/read")
    public ApiResponse<Void> markAsRead(@PathVariable UUID id) {
        chatService.markAsRead(id);
        return ApiResponse.noContent("Đã đánh dấu đã đọc");
    }

    @Operation(summary = "Tổng số tin nhắn chưa đọc", description = "Dùng cho badge trên tab")
    @GetMapping("/unread-count")
    public ApiResponse<Long> getUnreadCount() {
        return ApiResponse.success(chatService.getTotalUnreadCount());
    }

    // ─── Báo cáo tin nhắn ───────────────────────────────────────────────────

    @Operation(summary = "Báo cáo một tin nhắn vi phạm")
    @PostMapping("/messages/{messageId}/report")
    public ApiResponse<ChatReportResponse> reportMessage(
            @PathVariable UUID messageId,
            @RequestBody @Valid ReportMessageRequest request) {
        return ApiResponse.created("Đã gửi báo cáo, quản trị viên sẽ xem xét",
                chatService.reportMessage(messageId, request));
    }

    @Operation(summary = "Danh sách báo cáo tin nhắn tôi đã gửi")
    @GetMapping("/reports/my")
    public ApiResponse<List<ChatReportResponse>> getMyMessageReports() {
        return ApiResponse.success(chatService.getMyMessageReports());
    }

    @Operation(summary = "Chi tiết báo cáo tin nhắn tôi đã gửi")
    @GetMapping("/reports/my/{reportId}")
    public ApiResponse<ChatReportResponse> getMyMessageReport(@PathVariable UUID reportId) {
        return ApiResponse.success(chatService.getMyMessageReport(reportId));
    }

    @Operation(summary = "Admin: danh sách báo cáo tin nhắn")
    @GetMapping("/reports/admin")
    public ApiResponse<List<ChatReportResponse>> getAllMessageReports() {
        return ApiResponse.success(chatService.getAllMessageReports());
    }

    @Operation(summary = "Admin: cập nhật trạng thái báo cáo tin nhắn")
    @PatchMapping("/reports/admin/{reportId}/status")
    public ApiResponse<ChatReportResponse> updateMessageReportStatus(
            @PathVariable UUID reportId,
            @Valid @RequestBody UpdateChatReportStatusRequest request) {
        return ApiResponse.success("Đã cập nhật trạng thái báo cáo",
                chatService.updateMessageReportStatus(reportId, request.getStatus()));
    }

    // ─── Chặn người dùng ────────────────────────────────────────────────────

    @Operation(summary = "Chặn một người dùng",
            description = "Sau khi chặn, hai bên đều không gửi được tin nhắn mới cho nhau")
    @PostMapping("/block")
    public ApiResponse<BlockedUserResponse> blockUser(@RequestBody @Valid BlockUserRequest request) {
        return ApiResponse.created("Đã chặn người dùng", chatService.blockUser(request));
    }

    @Operation(summary = "Bỏ chặn một người dùng")
    @DeleteMapping("/block/{blockedUserId}")
    public ApiResponse<Void> unblockUser(@PathVariable UUID blockedUserId) {
        chatService.unblockUser(blockedUserId);
        return ApiResponse.noContent("Đã bỏ chặn người dùng");
    }

    // ─── Nâng cao (Thu hồi, Xóa, Ẩn) ────────────────────────────────────────

    @Operation(summary = "Thu hồi tin nhắn (chỉ người gửi, trong vòng 10 phút)")
    @PutMapping("/messages/{messageId}/recall")
    public ApiResponse<Void> recallMessage(@PathVariable UUID messageId) {
        chatService.recallMessage(messageId);
        return ApiResponse.noContent("Đã thu hồi tin nhắn");
    }

    @Operation(summary = "Xóa tin nhắn ở phía tôi (ẩn trên giao diện của mình)")
    @PutMapping("/messages/{messageId}/delete-for-me")
    public ApiResponse<Void> deleteMessageForMe(@PathVariable UUID messageId) {
        chatService.deleteMessageForMe(messageId);
        return ApiResponse.noContent("Đã xóa tin nhắn khỏi máy bạn");
    }

    @Operation(summary = "Ẩn cuộc trò chuyện khỏi danh sách")
    @PutMapping("/conversations/{id}/hide")
    public ApiResponse<Void> hideConversation(@PathVariable UUID id) {
        chatService.hideConversation(id);
        return ApiResponse.noContent("Đã ẩn cuộc trò chuyện");
    }

    @Operation(summary = "Danh sách người dùng tôi đã chặn")
    @GetMapping("/blocked")
    public ApiResponse<List<BlockedUserResponse>> getBlockedUsers() {
        return ApiResponse.success(chatService.getBlockedUsers());
    }
}
