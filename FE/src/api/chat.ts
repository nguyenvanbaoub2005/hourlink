import api from './axiosInstance';
import * as SecureStore from 'expo-secure-store';
import { fetch as expoFetch } from 'expo/fetch';
import Config from '@constants/Config';
import { TOKEN_KEY } from './axiosInstance';

const uploadAttachmentOnce = async (convId: string, formData: FormData, token: string | null) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000);
  try {
    return await expoFetch(
      `${Config.API_URL}/chat/conversations/${convId}/messages/attachment`,
      {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        // expo/fetch tự dựng multipart boundary cho File/Blob thật.
        body: formData,
        signal: controller.signal,
      }
    );
  } finally {
    clearTimeout(timeoutId);
  }
};

const attachmentUploadError = (status: number, data: any) => {
  const error: any = new Error(data?.message ?? 'Không gửi được tệp đính kèm.');
  error.response = { status, data };
  return error;
};

const sendAttachment = async (convId: string, formData: FormData) => {
  let token = await SecureStore.getItemAsync(TOKEN_KEY);
  let response = await uploadAttachmentOnce(convId, formData, token);

  // Upload đi qua expo/fetch nên không dùng trực tiếp interceptor Axios. Nếu
  // access token vừa hết hạn, gọi một request Axios nhẹ để luồng refresh token
  // hiện có chạy, sau đó thử upload lại đúng một lần.
  if (response.status === 401) {
    await api.get('/chat/unread-count');
    token = await SecureStore.getItemAsync(TOKEN_KEY);
    response = await uploadAttachmentOnce(convId, formData, token);
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) throw attachmentUploadError(response.status, payload);
  return { data: payload, status: response.status };
};

/**
 * ChatApi — API calls cho module chat (chức năng 9.10).
 * Base URL: /chat
 *
 * REST là đường ghi duy nhất: mọi tin nhắn đều gửi qua đây để backend validate
 * (kiểm tra thành viên, kiểm tra chặn) rồi mới mirror sang Firestore. App chỉ
 * ĐỌC realtime từ Firestore, không ghi trực tiếp.
 */
const ChatApi = {
  // ─── Firebase ────────────────────────────────────────────────
  /** Lấy custom token để đăng nhập Firebase và nghe realtime */
  getFirebaseToken: () => api.get('/chat/firebase-token'),

  // ─── Cuộc trò chuyện ─────────────────────────────────────────
  /** Mở (hoặc lấy) cuộc trò chuyện từ một lời mời đã được chấp nhận */
  openFromInvitation: (invitationId: string) =>
    api.post(`/chat/conversations/from-invitation/${invitationId}`),

  /** Mở chat giữa người đã đăng ký hoạt động cộng đồng và tổ chức */
  openFromCommunity: (activityId: string) =>
    api.post(`/chat/conversations/from-community/${activityId}`),

  /** Danh sách cuộc trò chuyện của tôi */
  getConversations: () => api.get('/chat/conversations'),

  /** Chi tiết một cuộc trò chuyện */
  getConversation: (convId: string) => api.get(`/chat/conversations/${convId}`),

  // ─── Tin nhắn ────────────────────────────────────────────────
  /** Lịch sử tin nhắn (phân trang, mới nhất trước) */
  getMessages: (convId: string, page = 0, size = 30) =>
    api.get(`/chat/conversations/${convId}/messages`, { params: { page, size } }),

  /** Gửi tin nhắn TEXT / LOCATION / MEETING_LINK */
  sendMessage: (
    convId: string,
    data: {
      type: 'TEXT' | 'LOCATION' | 'MEETING_LINK';
      content?: string;
      meetingLink?: string;
      latitude?: number;
      longitude?: number;
      locationLabel?: string;
    }
  ) => api.post(`/chat/conversations/${convId}/messages`, data),

  /** Gửi hình ảnh hoặc tài liệu (multipart) */
  sendAttachment,

  /** Đề xuất đổi lịch ngay trong cuộc trò chuyện */
  proposeReschedule: (convId: string, data: { proposedTime: string; note?: string }) =>
    api.post(`/chat/conversations/${convId}/reschedule`, data),

  /** Đánh dấu đã đọc toàn bộ tin nhắn */
  markAsRead: (convId: string) => api.put(`/chat/conversations/${convId}/read`),

  /** Tổng số tin nhắn chưa đọc (badge) */
  getUnreadCount: () => api.get('/chat/unread-count'),

  /** Thu hồi tin nhắn */
  recallMessage: (messageId: string) => api.put(`/chat/messages/${messageId}/recall`),

  /** Xóa tin nhắn (chỉ ẩn ở phía người gọi) */
  deleteMessageForMe: (messageId: string) => api.put(`/chat/messages/${messageId}/delete-for-me`),

  /** Ẩn cuộc trò chuyện */
  hideConversation: (convId: string) => api.put(`/chat/conversations/${convId}/hide`),

  // ─── Báo cáo & chặn ──────────────────────────────────────────
  /** Báo cáo một tin nhắn vi phạm */
  reportMessage: (
    messageId: string,
    data: { reason: string; description?: string }
  ) => api.post(`/chat/messages/${messageId}/report`, data),

  /** Danh sách/chi tiết báo cáo tin nhắn tôi đã gửi */
  getMyMessageReports: () => api.get('/chat/reports/my'),
  getMyMessageReport: (reportId: string) => api.get(`/chat/reports/my/${reportId}`),

  /** Chặn một người dùng */
  blockUser: (data: { userId: string; reason?: string }) =>
    api.post('/chat/block', data),

  /** Bỏ chặn một người dùng */
  unblockUser: (userId: string) => api.delete(`/chat/block/${userId}`),

  /** Danh sách người tôi đã chặn */
  getBlockedUsers: () => api.get('/chat/blocked'),
};

export default ChatApi;
