import { create } from 'zustand';
import type { Conversation } from '@types';

interface ChatState {
  conversations: Conversation[];
  totalUnread: number;
  /** Firebase realtime đã sẵn sàng chưa — false thì màn chat tự lùi về polling */
  realtimeReady: boolean;

  setConversations: (conversations: Conversation[]) => void;
  /** Chèn hoặc cập nhật một hội thoại, giữ thứ tự mới nhất trước */
  upsertConversation: (conversation: Conversation) => void;
  /** Đặt lại số chưa đọc của một hội thoại (khi mở phòng chat) */
  clearUnread: (conversationId: string) => void;
  setTotalUnread: (totalUnread: number) => void;
  setRealtimeReady: (realtimeReady: boolean) => void;
}

const sumUnread = (list: Conversation[]) =>
  list.reduce((total, c) => total + (c.unreadCount ?? 0), 0);

const sortByRecent = (list: Conversation[]) =>
  [...list].sort((a, b) => {
    const ta = new Date(a.lastMessageAt ?? a.createdAt).getTime();
    const tb = new Date(b.lastMessageAt ?? b.createdAt).getTime();
    return tb - ta;
  });

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  totalUnread: 0,
  realtimeReady: false,

  setConversations: (conversations) =>
    set({
      conversations: sortByRecent(conversations),
      totalUnread: sumUnread(conversations),
    }),

  upsertConversation: (conversation) =>
    set((state) => {
      const exists = state.conversations.some((c) => c.id === conversation.id);
      const next = exists
        ? state.conversations.map((c) => (c.id === conversation.id ? conversation : c))
        : [conversation, ...state.conversations];
      return { conversations: sortByRecent(next), totalUnread: sumUnread(next) };
    }),

  clearUnread: (conversationId) =>
    set((state) => {
      const next = state.conversations.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      );
      return { conversations: next, totalUnread: sumUnread(next) };
    }),

  setTotalUnread: (totalUnread) => set({ totalUnread }),
  setRealtimeReady: (realtimeReady) => set({ realtimeReady }),
}));
