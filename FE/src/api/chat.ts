import api from './axiosInstance';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import {
  createUploadTask,
  FileSystemUploadType,
  type FileSystemUploadResult,
} from 'expo-file-system/legacy';
import Config from '@constants/Config';
import { TOKEN_KEY } from './axiosInstance';

export type ChatAttachmentUpload = {
  uri: string;
  mimeType: string;
  webFile?: Blob;
  fileName?: string;
};

const ATTACHMENT_TIMEOUT_MS = 120000;

const uploadStageError = (message: string, stage: 'prepare' | 'upload', cause?: unknown) => {
  const error: any = new Error(message);
  error.uploadStage = stage;
  error.cause = cause;
  return error;
};

const uploadAttachmentOnWeb = async (
  convId: string,
  upload: ChatAttachmentUpload,
  token: string | null
): Promise<FileSystemUploadResult> => {
  if (!upload.webFile) {
    throw uploadStageError('Trình duyệt không đọc được tệp đã chọn.', 'prepare');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ATTACHMENT_TIMEOUT_MS);
  try {
    const formData = new FormData();
    formData.append('file', upload.webFile, upload.fileName);
    const response = await fetch(
      `${Config.API_URL}/chat/conversations/${convId}/messages/attachment`,
      {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
        signal: controller.signal,
      }
    );
    return {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      mimeType: response.headers.get('content-type'),
      body: await response.text(),
    };
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw uploadStageError('Tải tệp quá thời gian chờ. Vui lòng thử lại.', 'upload', error);
    }
    throw uploadStageError('Không thể kết nối máy chủ để tải tệp.', 'upload', error);
  } finally {
    clearTimeout(timeoutId);
  }
};

const uploadAttachmentOnNative = async (
  convId: string,
  upload: ChatAttachmentUpload,
  token: string | null
): Promise<FileSystemUploadResult> => {
  const uploadTask = createUploadTask(
    `${Config.API_URL}/chat/conversations/${convId}/messages/attachment`,
    upload.uri,
    {
      httpMethod: 'POST',
      uploadType: FileSystemUploadType.MULTIPART,
      fieldName: 'file',
      mimeType: upload.mimeType,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }
  );

  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    void uploadTask.cancelAsync().catch(() => undefined);
  }, ATTACHMENT_TIMEOUT_MS);

  try {
    const result = await uploadTask.uploadAsync();
    if (!result) {
      throw uploadStageError(
        timedOut ? 'Tải tệp quá thời gian chờ. Vui lòng thử lại.' : 'Tải tệp đã bị hủy.',
        'upload'
      );
    }
    return result;
  } catch (error: any) {
    if (error?.uploadStage) throw error;
    throw uploadStageError(
      timedOut
        ? 'Tải tệp quá thời gian chờ. Vui lòng thử lại.'
        : 'Không thể kết nối máy chủ để tải tệp.',
      'upload',
      error
    );
  } finally {
    clearTimeout(timeoutId);
  }
};

const uploadAttachmentOnce = (
  convId: string,
  upload: ChatAttachmentUpload,
  token: string | null
) => Platform.OS === 'web'
  ? uploadAttachmentOnWeb(convId, upload, token)
  : uploadAttachmentOnNative(convId, upload, token);

const attachmentUploadError = (status: number, data: any) => {
  const error: any = new Error(data?.message ?? 'Không gửi được tệp đính kèm.');
  error.response = { status, data };
  error.uploadStage = 'server';
  return error;
};

const sendAttachment = async (convId: string, upload: ChatAttachmentUpload) => {
  let token = await SecureStore.getItemAsync(TOKEN_KEY);
  let response = await uploadAttachmentOnce(convId, upload, token);

  // Upload native không đi qua interceptor Axios. Nếu access token vừa hết hạn,
  // gọi một request Axios nhẹ để refresh rồi thử lại đúng một lần.
  if (response.status === 401) {
    await api.get('/chat/unread-count');
    token = await SecureStore.getItemAsync(TOKEN_KEY);
    response = await uploadAttachmentOnce(convId, upload, token);
  }

  let payload: any = null;
  try {
    payload = response.body ? JSON.parse(response.body) : null;
  } catch {
    // Giữ payload null để trả về lỗi rõ ràng nếu server không trả JSON.
  }
  if (response.status < 200 || response.status >= 300) {
    throw attachmentUploadError(response.status, payload);
  }
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
