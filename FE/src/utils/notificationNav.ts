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

  if (['INVITATION_ACCEPTED', 'INVITATION_REJECTED', 'INVITATION_RESCHEDULED'].includes(type)) {
    return { pathname: '/profile/invitations', params: { tab: 'SENT' } };
  }

  if ([
    'INVITATION_RECEIVED',
    'INVITATION_CANCELLED',
    'INVITATION_RESCHEDULE_ACCEPTED',
    'INVITATION_RESCHEDULE_REJECTED',
  ].includes(type)) {
    return { pathname: '/profile/invitations', params: { tab: 'RECEIVED' } };
  }

  if ([
    'APPOINTMENT_CREATED',
    'APPOINTMENT_CONFIRMED',
    'APPOINTMENT_CANCELLED',
    'APPOINTMENT_RESCHEDULED',
    'APPOINTMENT_COMPLETED',
    'APPOINTMENT_REMINDER',
  ].includes(type)) {
    return referenceId
      ? { pathname: '/appointment/[id]', params: { id: referenceId } }
      : { pathname: '/(tabs)/appointments' };
  }

  if (['COMMUNITY_CREDIT_AWARDED', 'COMMUNITY_PARTICIPANT_ABSENT', 'COMMUNITY_ACTIVITY_CANCELLED', 'COMMUNITY_NEW_ACTIVITY'].includes(type)) {
    return referenceId
      ? { pathname: '/community/[id]', params: { id: referenceId } }
      : { pathname: '/community/registrations' };
  }

  if (type === 'WALLET_ADJUSTED') {
    return { pathname: '/(tabs)/wallet' };
  }

  // Loại chưa hỗ trợ điều hướng riêng → về danh sách thông báo
  return { pathname: '/notifications' };
}
