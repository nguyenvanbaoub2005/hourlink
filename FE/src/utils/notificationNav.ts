/**
 * Xác định màn hình cần mở khi bấm vào một thông báo.
 *
 * Dùng chung cho toast nổi ({@link NotificationToast}) và màn danh sách thông
 * báo, để hai nơi luôn điều hướng giống nhau.
 *
 * Quy ước `referenceId` theo từng loại thông báo (do backend đặt):
 *  - NEW_MESSAGE, CHAT_RESCHEDULE_PROPOSED → conversationId
 *  - INVITATION_*                          → invitationId
 */
export type NotificationLike = {
  type: string;
  referenceId?: string;
};

export function notificationTarget(
  notif: NotificationLike
): { pathname: string; params?: Record<string, string> } | null {
  const { type, referenceId } = notif;

  // Tin nhắn → mở thẳng cuộc trò chuyện.
  // Chỉ cần truyền id: màn chat tự gọi API lấy tên và ảnh người kia.
  if (type === 'NEW_MESSAGE' || type === 'CHAT_RESCHEDULE_PROPOSED') {
    return referenceId
      ? { pathname: '/chat/[id]', params: { id: referenceId } }
      : { pathname: '/chat' };
  }

  if (type.startsWith('INVITATION_')) {
    return { pathname: '/profile/invitations' };
  }

  if (type === 'APPOINTMENT_REMINDER') {
    return { pathname: '/(tabs)/appointments' };
  }

  // Loại chưa hỗ trợ điều hướng riêng → về danh sách thông báo
  return { pathname: '/notifications' };
}
