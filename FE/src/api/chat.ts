import api from './axiosInstance';
import type { ApiResponse, PagedResponse } from '@types';
// TODO: import request/response types as they are implemented

/**
 * ChatApi — API calls cho module chat.
 * Base URL: /chat
 */
const ChatApi = {
  getConversations: () => api.get('/chat/conversations'),
  getMessages: (convId: string) => api.get(`/chat/{convId}/messages`),
  sendMessage: (data: any) => api.post(`/chat/{convId}/messages`, data),
  blockUser: (data: any) => api.post('/chat/block', data),
};

export default ChatApi;
