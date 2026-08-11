import { Alert } from 'react-native';
import ChatApi from '@api/chat';
import type { Conversation } from '@types';

type Router = { push: (target: any) => void };

/**
 * Mở cuộc trò chuyện với một người dùng (chức năng 9.10).
 *
 * Ràng buộc nghiệp vụ: chỉ trò chuyện được sau khi một lời mời hỗ trợ giữa hai
 * bên đã được chấp nhận. Nếu chưa có, hướng người dùng đi gửi lời mời trước
 * thay vì báo lỗi cụt.
 *
 * @param onNeedInvitation gọi khi chưa có cuộc trò chuyện — thường là điều hướng
 *                         sang màn gửi lời mời
 */
export async function openChatWithUser(
  router: Router,
  otherUserId: string,
  otherUserName: string,
  onNeedInvitation?: () => void
): Promise<void> {
  try {
    const res = await ChatApi.getConversations();
    const list: Conversation[] = res.data?.data ?? [];
    const found = list.find(
      (c) => c.otherUserId === otherUserId && c.sourceType === 'SKILL_INVITATION'
    );

    if (found) {
      router.push({
        pathname: '/chat/[id]' as any,
        params: {
          id: found.id,
          otherName: found.otherUserName,
          otherUserId: found.otherUserId,
          otherAvatarUrl: found.otherUserAvatarUrl ?? '',
          skillName: found.skillName ?? '',
          sourceType: found.sourceType,
        },
      });
      return;
    }

    Alert.alert(
      'Chưa thể nhắn tin',
      `Bạn cần gửi lời mời hỗ trợ và được ${otherUserName} chấp nhận trước khi bắt đầu trò chuyện.`,
      onNeedInvitation
        ? [
            { text: 'Để sau', style: 'cancel' },
            { text: 'Gửi lời mời', onPress: onNeedInvitation },
          ]
        : [{ text: 'Đã hiểu' }]
    );
  } catch (e: any) {
    const msg = e?.response?.data?.message ?? 'Không mở được cuộc trò chuyện. Vui lòng thử lại.';
    Alert.alert('Lỗi', msg);
  }
}

/**
 * Mở cuộc trò chuyện từ một lời mời đã được chấp nhận.
 * Backend đảm bảo idempotent — gọi nhiều lần vẫn ra cùng một hội thoại.
 */
export async function openChatFromInvitation(
  router: Router,
  invitationId: string
): Promise<void> {
  try {
    const res = await ChatApi.openFromInvitation(invitationId);
    const conv: Conversation | undefined = res.data?.data;
    if (!conv) return;

    router.push({
      pathname: '/chat/[id]' as any,
      params: {
        id: conv.id,
        otherName: conv.otherUserName,
        otherUserId: conv.otherUserId,
        otherAvatarUrl: conv.otherUserAvatarUrl ?? '',
        skillName: conv.skillName ?? '',
        sourceType: conv.sourceType,
      },
    });
  } catch (e: any) {
    const msg = e?.response?.data?.message ?? 'Không mở được cuộc trò chuyện. Vui lòng thử lại.';
    Alert.alert('Lỗi', msg);
  }
}

/**
 * Mở cuộc trò chuyện riêng của một lượt đăng ký hoạt động cộng đồng.
 * Backend kiểm tra quyền tham gia và đảm bảo gọi lại vẫn trả cùng hội thoại.
 */
export async function openCommunityChat(
  router: Router,
  activityId: string
): Promise<void> {
  try {
    const res = await ChatApi.openFromCommunity(activityId);
    const conv: Conversation | undefined = res.data?.data;
    if (!conv) return;

    router.push({
      pathname: '/chat/[id]' as any,
      params: {
        id: conv.id,
        otherName: conv.otherUserName,
        otherUserId: conv.otherUserId,
        otherAvatarUrl: conv.otherUserAvatarUrl ?? '',
        skillName: conv.communityActivityTitle ?? '',
        sourceType: conv.sourceType,
      },
    });
  } catch (e: any) {
    const msg = e?.response?.data?.message
      ?? 'Không mở được cuộc trò chuyện với tổ chức. Vui lòng thử lại.';
    Alert.alert('Chưa thể nhắn tin', msg);
  }
}
