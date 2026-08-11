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

const conversationTime = (conversation: Conversation) =>
  new Date(conversation.lastMessageAt ?? conversation.createdAt).getTime();

const sortByRecent = (list: Conversation[]) =>
  [...list].sort((a, b) => {
    return conversationTime(b) - conversationTime(a);
  });

/**
 * Lớp bảo vệ cho dữ liệu cũ trước khi BE hoàn tất hợp nhất.
 * Chat cá nhân gộp theo người còn lại; chat cộng đồng vẫn tách theo hoạt động.
 */
const deduplicateConversations = (list: Conversation[]) => {
  const grouped = new Map<string, Conversation>();

  list.forEach((conversation) => {
    const key = conversation.sourceType === 'COMMUNITY_ACTIVITY'
      ? `community:${conversation.communityActivityId ?? conversation.id}`
      : `personal:${conversation.otherUserId}`;
    const current = grouped.get(key);
    if (!current) {
      grouped.set(key, conversation);
      return;
    }

    const newest = conversationTime(conversation) > conversationTime(current)
      ? conversation
      : current;
    grouped.set(key, {
      ...newest,
      unreadCount: (current.unreadCount ?? 0) + (conversation.unreadCount ?? 0),
    });
  });

  return sortByRecent([...grouped.values()]);
};

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  totalUnread: 0,
  realtimeReady: false,

  setConversations: (conversations) =>
    set(() => {
      const next = deduplicateConversations(conversations);
      return { conversations: next, totalUnread: sumUnread(next) };
    }),

  upsertConversation: (conversation) =>
    set((state) => {
      const exists = state.conversations.some((c) => c.id === conversation.id);
      const next = exists
        ? state.conversations.map((c) => (c.id === conversation.id ? conversation : c))
        : [conversation, ...state.conversations];
      const deduplicated = deduplicateConversations(next);
      return { conversations: deduplicated, totalUnread: sumUnread(deduplicated) };
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
