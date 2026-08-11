import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Pressable } from 'react-native';
import { Colors, Spacing, Radius } from '@constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@store/authStore';
import { useNotificationStore } from '@store/notificationStore';
import { useChatStore } from '@store/chatStore';
import { useWalletStore } from '@store/walletStore';
import ChatApi from '@api/chat';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import HelpRequestApi from '@api/helprequest';
import UserApi from '@api/user';
import AppointmentApi from '@api/appointment';
import Logo from '@components/Logo';
import InvitationApi, { type InvitationResponse } from '@api/invitation';
import Avatar from '@components/Avatar';
import { formatDateTimeVi } from '@utils/dateTime';
import type { AppointmentItem } from '@types';

// ─── Types ─────────────────────────────────────────────────────────────────
type HelpRequestItem = {
  id: string;
  title: string;
  description: string;
  status: string;
  duration: number;
  categoryName?: string;
  format?: string;
  responseCount?: number;
  createdAt: string;
};

// ─── Time greeting ─────────────────────────────────────────────────────────
function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Chào buổi sáng';
  if (h >= 12 && h < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function IndividualHomeScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { unreadCount } = useNotificationStore();
  const { totalUnread: chatUnread, setTotalUnread: setChatUnread } = useChatStore();
  const [myRequests, setMyRequests] = useState<HelpRequestItem[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<AppointmentItem[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<InvitationResponse[]>([]);
  const [firstName, setFirstName] = useState<string>('Bạn');
  const [refreshing, setRefreshing] = useState(false);
  const { wallet, fetchWallet } = useWalletStore();

  const fetchData = async () => {
    const [requestResult, profileResult, appointmentResult, , invitationResult] = await Promise.allSettled([
      HelpRequestApi.getMyRequests(),
      UserApi.getMyProfile(),
      AppointmentApi.getMyAppointments('UPCOMING', 0, 1),
      fetchWallet(),
      InvitationApi.getReceived(),
    ]);

    if (requestResult.status === 'fulfilled') {
      setMyRequests(requestResult.value.data.data ?? []);
    } else {
      setMyRequests([]);
    }

    if (appointmentResult.status === 'fulfilled') {
      setUpcomingAppointments(appointmentResult.value.data.data?.content ?? []);
    } else {
      setUpcomingAppointments([]);
    }

    if (profileResult.status === 'fulfilled' && profileResult.value.data.data?.fullName) {
      setFirstName(profileResult.value.data.data.fullName.split(' ').pop() ?? 'Bạn');
    } else if (user?.fullName) {
      setFirstName(user.fullName.split(' ').pop() ?? 'Bạn');
    }

    if (invitationResult.status === 'fulfilled') {
      setPendingInvitations((invitationResult.value.data.data ?? []).filter(item => item.status === 'PENDING'));
    } else {
      setPendingInvitations([]);
    }

    // Badge tin nhắn chưa đọc — tách riêng để lỗi chat không làm hỏng màn hình
    try {
      const unreadRes = await ChatApi.getUnreadCount();
      setChatUnread(unreadRes.data?.data ?? 0);
    } catch {
      // bỏ qua
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const activeRequests = myRequests.filter(r => r.status === 'SEARCHING' || r.status === 'ASSIGNED');
  const openReceivedInvitations = () => router.push({
    pathname: '/profile/invitations',
    params: { tab: 'RECEIVED' },
  });
  const openHelpRequests = () => router.push('/profile/help-requests' as any);
  const openRequestDetail = (requestId: string) => router.push({
    pathname: '/profile/help-request/[id]',
    params: { id: requestId },
  } as any);
  const openAiSuggestions = (requestId: string) => router.push({
    pathname: '/profile/ai-suggest',
    params: { helpRequestId: requestId },
  });
  const openAppointment = (appointmentId: string) => {
    const normalizedId = appointmentId?.trim();
    if (!normalizedId) {
      router.push('/(tabs)/appointments');
      return;
    }

    router.push(`/appointment/${encodeURIComponent(normalizedId)}` as any);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <View style={styles.logo}>
          <Logo size={32} style={{ marginRight: 8 }} />
          <Text style={styles.brandName}>HourLink</Text>
        </View>
        <View style={styles.topRight}>
          <TouchableOpacity
            style={[styles.iconBtn, { position: 'relative' }]}
            onPress={() => router.push('/chat' as any)}
          >
            <Ionicons name="chatbubble-outline" size={24} color={Colors.textPrimary} />
            {chatUnread > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>
                  {chatUnread > 9 ? '9+' : String(chatUnread)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, { position: 'relative' }]}
            onPress={openReceivedInvitations}
            accessibilityLabel="Lời mời hỗ trợ"
          >
            <Ionicons
              name={pendingInvitations.length > 0 ? 'mail-unread-outline' : 'mail-outline'}
              size={24}
              color={Colors.textPrimary}
            />
            {pendingInvitations.length > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>
                  {pendingInvitations.length > 9 ? '9+' : String(pendingInvitations.length)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, { position: 'relative' }]}
            onPress={() => router.push('/notifications' as any)}
          >
            <Ionicons name="notifications-outline" size={24} color={Colors.textPrimary} />
            {unreadCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>
                  {unreadCount > 9 ? '9+' : String(unreadCount)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Wallet Card ──────────────────────────────────────────────────── */}
      <LinearGradient
        colors={['#0D9488', '#1D4ED8']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <Text style={styles.greeting}>{getGreeting()}</Text>
        <Text style={styles.greetingName}>{firstName} ơi, có gì mới?</Text>

        <View style={styles.balanceRow}>
          <View>
            <Text style={styles.balanceLabel}>Số dư hiện tại</Text>
            <Text style={styles.balanceValue}>
              {wallet?.balance?.toFixed(1) ?? '0.0'} <Text style={styles.balanceUnit}>Time Credit</Text>
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.walletBtn}
            onPress={() => router.push('/(tabs)/wallet' as any)}
          >
            <Text style={styles.walletBtnText}>Ví tiền</Text>
            <Ionicons name="chevron-forward" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.stats}>
          {[
            { label: 'Đã cho', icon: 'arrow-up-outline', val: `${wallet?.totalUsed?.toFixed(1) ?? '0.0'}h` },
            { label: 'Đã nhận', icon: 'arrow-down-outline', val: `${wallet?.totalEarned?.toFixed(1) ?? '0.0'}h` },
            { label: 'Đang giữ', icon: 'hourglass-outline', val: `${wallet?.heldAmount?.toFixed(1) ?? '0.0'}h` },
          ].map(s => (
            <View key={s.label} style={styles.statBox}>
              <Text style={styles.statLabel}>{s.label}</Text>
              <View style={styles.statVal}>
                <Ionicons name={s.icon as any} size={14} color="#fff" />
                <Text style={styles.statText}>{s.val}</Text>
              </View>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* ── Action Buttons ───────────────────────────────────────────────── */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push({ pathname: '/(tabs)/post', params: { tab: 'shareSkill' } } as any)}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#CCFBF1' }]}>
            <Ionicons name="school-outline" size={26} color="#0F766E" />
          </View>
          <Text style={styles.actionTitle}>Đăng kỹ năng</Text>
          <Text style={styles.actionSub}>Chia sẻ với cộng đồng</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push({ pathname: '/(tabs)/post', params: { tab: 'needHelp' } } as any)}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="help-buoy-outline" size={26} color="#B45309" />
          </View>
          <Text style={styles.actionTitle}>Cần hỗ trợ</Text>
          <Text style={styles.actionSub}>Đặt yêu cầu giúp đỡ</Text>
        </TouchableOpacity>
      </View>

      {/* ── Lời mời mới ────────────────────────────────────────────────── */}
      {pendingInvitations.length > 0 && (
        <View style={styles.invitationPanel}>
          <View style={styles.invitationHeader}>
            <View style={styles.invitationTitleRow}>
              <View style={styles.invitationIcon}>
                <Ionicons name="mail-unread-outline" size={19} color="#047857" />
              </View>
              <View>
                <Text style={styles.invitationTitle}>Lời mời mới</Text>
                <Text style={styles.invitationSubtitle}>Đang chờ bạn phản hồi</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.invitationCountButton}
              onPress={openReceivedInvitations}
            >
              <Text style={styles.invitationCountText}>{pendingInvitations.length}</Text>
              <Ionicons name="chevron-forward" size={16} color="#047857" />
            </TouchableOpacity>
          </View>

          {pendingInvitations.slice(0, 3).map((invitation, index) => (
            <TouchableOpacity
              key={invitation.id}
              style={[styles.invitationItem, index > 0 && styles.invitationItemBorder]}
              activeOpacity={0.7}
              onPress={openReceivedInvitations}
            >
              <Avatar uri={invitation.senderAvatarUrl} name={invitation.senderName} size={42} />
              <View style={styles.invitationContent}>
                <Text style={styles.invitationSender} numberOfLines={1}>{invitation.senderName}</Text>
                <Text style={styles.invitationSkill} numberOfLines={1}>
                  {invitation.skillName ? `Muốn bạn hỗ trợ · ${invitation.skillName}` : invitation.content}
                </Text>
                <View style={styles.invitationTimeRow}>
                  <Ionicons name="time-outline" size={12} color="#64748B" />
                  <Text style={styles.invitationTime}>Nhận lúc {formatDateTimeVi(invitation.createdAt)}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={19} color="#94A3B8" />
            </TouchableOpacity>
          ))}

          {pendingInvitations.length > 3 && (
            <TouchableOpacity
              style={styles.invitationMoreButton}
              onPress={openReceivedInvitations}
            >
              <Text style={styles.invitationMoreText}>Xem thêm {pendingInvitations.length - 3} lời mời</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── Lịch hẹn ─────────────────────────────────────────────────────── */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Lịch hẹn sắp tới</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/appointments' as any)}>
          <Text style={styles.seeAll}>Xem tất cả</Text>
        </TouchableOpacity>
      </View>

      {upcomingAppointments.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="calendar-outline" size={32} color={Colors.textMuted} />
          <Text style={styles.emptyText}>Chưa có lịch hẹn nào</Text>
        </View>
      ) : (
        upcomingAppointments.map(apt => (
          <TouchableOpacity 
            key={apt.id} 
            style={styles.requestCard}
            onPress={() => openAppointment(apt.id)}
          >
            <View style={styles.requestTopRow}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={[styles.badge, { backgroundColor: '#DBEAFE' }]}>
                  <Ionicons name="calendar-outline" size={14} color="#1D4ED8" style={{ marginRight: 4 }} />
                  <Text style={[styles.badgeText, { color: '#1D4ED8' }]}>
                    {apt.appointmentDate} • {apt.startTime?.slice(0, 5)}
                  </Text>
                </View>
              </View>
            </View>
            <Text style={styles.requestTitle}>{apt.title || 'Lịch hẹn'}</Text>
            {apt.skillName ? (
              <Text style={styles.requestDesc} numberOfLines={1}>
                Kỹ năng: {apt.skillName}
              </Text>
            ) : null}
            <View style={styles.cardDivider} />
            <View style={styles.requestBottomRow}>
              <Text style={styles.requestBottomText}>
                {apt.providerName && apt.receiverName ? 
                  `Giữa ${apt.providerName} & ${apt.receiverName}` : 
                  'Với người dùng khác'}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      )}

      {/* ── Yêu cầu đang hoạt động ───────────────────────────────────────── */}
      <View style={styles.activeRequestSection}>
        <TouchableOpacity
          style={styles.activeRequestHeader}
          activeOpacity={0.7}
          onPress={openHelpRequests}
          accessibilityRole="button"
          accessibilityLabel={`Xem tất cả ${activeRequests.length} yêu cầu đang hoạt động`}
        >
          <View style={styles.activeRequestHeading}>
            <View style={styles.activeRequestHeadingIcon}>
              <Ionicons name="pulse-outline" size={20} color="#047857" />
            </View>
            <View style={styles.activeRequestHeadingText}>
              <View style={styles.activeRequestTitleRow}>
                <Text style={styles.activeRequestSectionTitle} numberOfLines={1}>Yêu cầu đang hoạt động</Text>
                {activeRequests.length > 0 && (
                  <View style={styles.activeRequestCount}>
                    <Text style={styles.activeRequestCountText}>{activeRequests.length}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.activeRequestSubtitle}>Theo dõi phản hồi và tìm người hỗ trợ phù hợp</Text>
            </View>
          </View>
          <View style={styles.activeRequestSeeAll}>
            <Text style={styles.activeRequestSeeAllText}>Tất cả</Text>
            <Ionicons name="chevron-forward" size={16} color="#047857" />
          </View>
        </TouchableOpacity>

        {activeRequests.length === 0 ? (
          <View style={styles.activeRequestEmpty}>
            <View style={styles.activeRequestEmptyIcon}>
              <Ionicons name="document-text-outline" size={28} color="#0D9488" />
            </View>
            <Text style={styles.activeRequestEmptyTitle}>Bạn chưa có yêu cầu đang mở</Text>
            <Text style={styles.activeRequestEmptyText}>Đăng nhu cầu để cộng đồng có thể tìm thấy và hỗ trợ bạn.</Text>
            <TouchableOpacity
              style={styles.activeRequestCreateButton}
              activeOpacity={0.8}
              onPress={() => router.push({ pathname: '/(tabs)/post', params: { tab: 'needHelp' } } as any)}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.activeRequestCreateText}>Tạo yêu cầu</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.activeRequestList}>
            {activeRequests.slice(0, 3).map(req => {
              const isSearching = req.status === 'SEARCHING';
              const formatLabel = req.format === 'OFFLINE'
                ? 'Trực tiếp'
                : req.format === 'BOTH'
                  ? 'Linh hoạt'
                  : 'Trực tuyến';

              return (
                <Pressable
                  key={req.id}
                  style={({ pressed }) => [
                    styles.activeRequestCard,
                    isSearching ? styles.activeRequestCardSearching : styles.activeRequestCardMatched,
                    pressed && styles.activeRequestCardPressed,
                  ]}
                  onPress={() => openRequestDetail(req.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Xem chi tiết yêu cầu ${req.title}`}
                >
                  <View style={styles.activeRequestCardTop}>
                    <View style={styles.activeRequestBadges}>
                      <View style={[
                        styles.activeRequestStatus,
                        isSearching ? styles.activeRequestStatusSearching : styles.activeRequestStatusMatched,
                      ]}>
                        <View style={[
                          styles.activeRequestStatusDot,
                          { backgroundColor: isSearching ? '#D97706' : '#059669' },
                        ]} />
                        <Text style={[
                          styles.activeRequestStatusText,
                          { color: isSearching ? '#92400E' : '#065F46' },
                        ]}>
                          {isSearching ? 'Đang tìm người hỗ trợ' : 'Đã kết nối'}
                        </Text>
                      </View>
                      {req.categoryName ? (
                        <View style={styles.activeRequestCategory}>
                          <Text style={styles.activeRequestCategoryText} numberOfLines={1}>{req.categoryName}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                  </View>

                  <Text style={styles.activeRequestCardTitle} numberOfLines={2}>{req.title}</Text>
                  {req.description ? (
                    <Text style={styles.activeRequestCardDescription} numberOfLines={2}>{req.description}</Text>
                  ) : null}

                  <View style={styles.activeRequestMetaRow}>
                    <View style={styles.activeRequestMetaPill}>
                      <Ionicons name="time-outline" size={14} color="#475569" />
                      <Text style={styles.activeRequestMetaText}>{req.duration || 60} phút</Text>
                    </View>
                    <View style={styles.activeRequestMetaPill}>
                      <Ionicons name={req.format === 'OFFLINE' ? 'people-outline' : 'videocam-outline'} size={14} color="#475569" />
                      <Text style={styles.activeRequestMetaText}>{formatLabel}</Text>
                    </View>
                    <View style={styles.activeRequestMetaPill}>
                      <Ionicons name="chatbubble-ellipses-outline" size={14} color="#475569" />
                      <Text style={styles.activeRequestMetaText}>{req.responseCount ?? 0}</Text>
                    </View>
                  </View>

                  <View style={styles.activeRequestCardFooter}>
                    <View style={styles.activeRequestDetailHint}>
                      <Ionicons name="eye-outline" size={16} color="#475569" />
                      <Text style={styles.activeRequestDetailHintText}>Xem chi tiết</Text>
                    </View>
                    <Pressable
                      style={({ pressed }) => [styles.activeRequestAiButton, pressed && styles.activeRequestAiButtonPressed]}
                      onPress={(event) => {
                        event.stopPropagation();
                        openAiSuggestions(req.id);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Xem AI gợi ý cho yêu cầu ${req.title}`}
                    >
                      <Ionicons name="sparkles" size={16} color="#047857" />
                      <Text style={styles.activeRequestAiText}>AI gợi ý</Text>
                      <Ionicons name="arrow-forward" size={14} color="#047857" />
                    </Pressable>
                  </View>
                </Pressable>
              );
            })}

            {activeRequests.length > 3 && (
              <TouchableOpacity style={styles.activeRequestMoreButton} onPress={openHelpRequests}>
                <Text style={styles.activeRequestMoreText}>Xem thêm {activeRequests.length - 3} yêu cầu</Text>
                <Ionicons name="arrow-forward" size={16} color="#047857" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:    { flexGrow: 1, backgroundColor: '#F8FAFC', paddingHorizontal: Spacing.md },

  topBar:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.md },
  logo:         { flexDirection: 'row', alignItems: 'center' },
  logoIcon:     { backgroundColor: '#0F766E', width: 34, height: 34, borderRadius: 9, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  logoLetter:   { color: '#fff', fontWeight: 'bold', fontSize: 20 },
  brandName:    { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary },
  topRight:     { flexDirection: 'row' },
  iconBtn:      { marginLeft: Spacing.md },

  // Notification badge
  notifBadge: {
    position: 'absolute', top: -4, right: -6,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 4, borderWidth: 2, borderColor: '#F8FAFC',
  },
  notifBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

  card:         { borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.lg },
  greeting:     { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 4 },
  greetingName: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: Spacing.lg },
  balanceRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: Spacing.lg },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 4 },
  balanceValue: { color: '#fff', fontSize: 34, fontWeight: 'bold' },
  balanceUnit:  { fontSize: 16, fontWeight: '500' },
  walletBtn:    { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  walletBtnText:{ color: '#fff', fontWeight: '500', marginRight: 4 },

  stats:        { flexDirection: 'row', justifyContent: 'space-between' },
  statBox:      { flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: Radius.md, padding: Spacing.sm, marginHorizontal: 4, alignItems: 'center' },
  statLabel:    { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginBottom: 4 },
  statVal:      { flexDirection: 'row', alignItems: 'center' },
  statText:     { color: '#fff', fontWeight: 'bold', fontSize: 15, marginLeft: 3 },

  actions:      { flexDirection: 'row', gap: 12, marginBottom: Spacing.xl },
  actionCard:   { flex: 1, backgroundColor: '#fff', padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border },
  actionIcon:   { width: 50, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm },
  actionTitle:  { fontSize: 15, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 2 },
  actionSub:    { fontSize: 12, color: Colors.textMuted },

  invitationPanel: {
    backgroundColor: '#FFFFFF', borderRadius: Radius.lg, borderWidth: 1,
    borderColor: '#A7F3D0', marginBottom: Spacing.lg, overflow: 'hidden',
  },
  invitationHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#ECFDF5', paddingHorizontal: 14, paddingVertical: 12,
  },
  invitationTitleRow: { flexDirection: 'row', alignItems: 'center' },
  invitationIcon: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#D1FAE5',
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  invitationTitle: { fontSize: 16, fontWeight: 'bold', color: '#065F46' },
  invitationSubtitle: { fontSize: 12, color: '#047857', marginTop: 1 },
  invitationCountButton: {
    minWidth: 42, height: 32, paddingHorizontal: 9, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#D1FAE5',
  },
  invitationCountText: { fontSize: 14, fontWeight: 'bold', color: '#047857' },
  invitationItem: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  invitationItemBorder: { borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  invitationContent: { flex: 1, marginHorizontal: 11 },
  invitationSender: { fontSize: 14, fontWeight: 'bold', color: Colors.textPrimary },
  invitationSkill: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  invitationTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  invitationTime: { fontSize: 11, color: '#64748B' },
  invitationMoreButton: {
    alignItems: 'center', paddingVertical: 11, borderTopWidth: 1,
    borderTopColor: '#D1FAE5', backgroundColor: '#F0FDFA',
  },
  invitationMoreText: { fontSize: 13, fontWeight: '600', color: '#047857' },

  sectionRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: Colors.textPrimary },
  seeAll:       { color: Colors.secondary, fontWeight: '500', fontSize: 14 },

  emptyBox:     { backgroundColor: '#fff', padding: Spacing.xl, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.lg, gap: 8 },
  emptyText:    { color: Colors.textMuted, fontStyle: 'italic' },
  createBtn:    { marginTop: 4, backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  createBtnText:{ color: '#fff', fontWeight: 'bold' },

  requestCard:  { backgroundColor: '#fff', borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm },
  requestTopRow:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badge:        { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  iconBadge:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  badgeText:    { fontSize: 12, fontWeight: '600' },
  creditText:   { fontSize: 13, color: Colors.accent, fontWeight: 'bold' },
  requestTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 4 },
  requestDesc:  { fontSize: 14, color: Colors.textMuted, lineHeight: 22 },

  cardDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 12 },
  requestBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  requestBottomText: { fontSize: 13, color: Colors.textMuted },
  requestMetaGroup: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 5 },
  requestMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  aiSuggestBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 8 },
  aiSuggestText: { fontSize: 13, fontWeight: 'bold', color: '#059669' },

  activeRequestSection: {
    backgroundColor: '#F0FDFA', borderWidth: 1, borderColor: '#CCFBF1',
    borderRadius: Radius.xl, padding: 14, marginBottom: Spacing.lg,
  },
  activeRequestHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 13,
  },
  activeRequestHeading: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  activeRequestHeadingIcon: {
    width: 40, height: 40, borderRadius: 13, backgroundColor: '#CCFBF1',
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  activeRequestHeadingText: { flex: 1 },
  activeRequestTitleRow: { flexDirection: 'row', alignItems: 'center' },
  activeRequestSectionTitle: { flexShrink: 1, color: '#0F172A', fontSize: 15, fontWeight: '800' },
  activeRequestCount: {
    minWidth: 22, height: 22, borderRadius: 11, backgroundColor: '#0F766E',
    paddingHorizontal: 6, marginLeft: 7, alignItems: 'center', justifyContent: 'center',
  },
  activeRequestCountText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  activeRequestSubtitle: { color: '#64748B', fontSize: 11, marginTop: 3, lineHeight: 15 },
  activeRequestSeeAll: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    paddingLeft: 10, paddingRight: 6, paddingVertical: 7, borderRadius: Radius.full,
    borderWidth: 1, borderColor: '#A7F3D0', marginLeft: 8,
  },
  activeRequestSeeAllText: { color: '#047857', fontSize: 12, fontWeight: '700' },
  activeRequestList: { gap: 10 },
  activeRequestCard: {
    backgroundColor: '#FFFFFF', borderRadius: Radius.lg, padding: 14,
    borderWidth: 1, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  activeRequestCardSearching: { borderColor: '#FDE68A' },
  activeRequestCardMatched: { borderColor: '#A7F3D0' },
  activeRequestCardPressed: { opacity: 0.78, transform: [{ scale: 0.992 }] },
  activeRequestCardTop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10,
  },
  activeRequestBadges: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, marginRight: 8 },
  activeRequestStatus: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9,
    paddingVertical: 5, borderRadius: Radius.full,
  },
  activeRequestStatusSearching: { backgroundColor: '#FEF3C7' },
  activeRequestStatusMatched: { backgroundColor: '#D1FAE5' },
  activeRequestStatusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  activeRequestStatusText: { fontSize: 11, fontWeight: '700' },
  activeRequestCategory: {
    flexShrink: 1, backgroundColor: '#F1F5F9', paddingHorizontal: 9,
    paddingVertical: 5, borderRadius: Radius.full,
  },
  activeRequestCategoryText: { color: '#475569', fontSize: 11, fontWeight: '600' },
  activeRequestCardTitle: { color: '#0F172A', fontSize: 16, lineHeight: 22, fontWeight: '800' },
  activeRequestCardDescription: { color: '#64748B', fontSize: 13, lineHeight: 19, marginTop: 5 },
  activeRequestMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  activeRequestMetaPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F8FAFC',
    borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 8, paddingVertical: 5,
    borderRadius: Radius.full,
  },
  activeRequestMetaText: { color: '#475569', fontSize: 11, fontWeight: '600' },
  activeRequestCardFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 11, marginTop: 12,
  },
  activeRequestDetailHint: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  activeRequestDetailHintText: { color: '#475569', fontSize: 12, fontWeight: '600' },
  activeRequestAiButton: {
    flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#ECFDF5',
    paddingHorizontal: 11, paddingVertical: 8, borderRadius: 11,
    borderWidth: 1, borderColor: '#A7F3D0',
  },
  activeRequestAiButtonPressed: { backgroundColor: '#D1FAE5', opacity: 0.82 },
  activeRequestAiText: { color: '#047857', fontSize: 12, fontWeight: '800' },
  activeRequestMoreButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 9,
  },
  activeRequestMoreText: { color: '#047857', fontSize: 13, fontWeight: '700' },
  activeRequestEmpty: {
    backgroundColor: '#FFFFFF', borderRadius: Radius.lg, padding: 20,
    alignItems: 'center', borderWidth: 1, borderColor: '#CCFBF1',
  },
  activeRequestEmptyIcon: {
    width: 52, height: 52, borderRadius: 18, backgroundColor: '#CCFBF1',
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  activeRequestEmptyTitle: { color: '#0F172A', fontSize: 15, fontWeight: '800', textAlign: 'center' },
  activeRequestEmptyText: {
    color: '#64748B', fontSize: 12, lineHeight: 18, textAlign: 'center',
    marginTop: 5, maxWidth: 280,
  },
  activeRequestCreateButton: {
    flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#0F766E',
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginTop: 14,
  },
  activeRequestCreateText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});
