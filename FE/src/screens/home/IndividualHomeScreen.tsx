import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
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
  if (h >= 5 && h < 12)  return 'Chào buổi sáng ☀️';
  if (h >= 12 && h < 18) return 'Chào buổi chiều 🌤';
  return 'Chào buổi tối 🌙';
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function IndividualHomeScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { unreadCount } = useNotificationStore();
  const { totalUnread: chatUnread, setTotalUnread: setChatUnread } = useChatStore();
  const [myRequests, setMyRequests] = useState<HelpRequestItem[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [firstName, setFirstName] = useState<string>('Bạn');
  const [refreshing, setRefreshing] = useState(false);
  const { wallet, fetchWallet } = useWalletStore();

  const fetchData = async () => {
    try {
      const [reqRes, profileRes, aptRes] = await Promise.all([
        HelpRequestApi.getMyRequests(),
        UserApi.getMyProfile(),
        AppointmentApi.getMyAppointments('UPCOMING', 0, 1),
        fetchWallet()
      ]);
      setMyRequests(reqRes.data.data ?? []);
      setUpcomingAppointments(aptRes.data.data?.content ?? []);
      
      if (profileRes.data.data?.fullName) {
        setFirstName(profileRes.data.data.fullName.split(' ').pop() ?? 'Bạn');
      } else if (user?.fullName) {
        setFirstName(user.fullName.split(' ').pop() ?? 'Bạn');
      }
    } catch {
      setMyRequests([]);
      setUpcomingAppointments([]);
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

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <View style={styles.logo}>
          <View style={styles.logoIcon}><Text style={styles.logoLetter}>H</Text></View>
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
            <Text style={{ fontSize: 26 }}>🤝</Text>
          </View>
          <Text style={styles.actionTitle}>Đăng kỹ năng</Text>
          <Text style={styles.actionSub}>Chia sẻ với cộng đồng</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push({ pathname: '/(tabs)/post', params: { tab: 'needHelp' } } as any)}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
            <Text style={{ fontSize: 26 }}>🙋</Text>
          </View>
          <Text style={styles.actionTitle}>Cần hỗ trợ</Text>
          <Text style={styles.actionSub}>Đặt yêu cầu giúp đỡ</Text>
        </TouchableOpacity>
      </View>

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
        upcomingAppointments.map((apt: any) => (
          <TouchableOpacity 
            key={apt.id} 
            style={styles.requestCard}
            onPress={() => router.push(`/(tabs)/appointments/${apt.id}` as any)}
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
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Yêu cầu đang hoạt động</Text>
        <TouchableOpacity onPress={() => router.push('/profile/help-requests' as any)}>
          <Text style={styles.seeAll}>Xem thêm</Text>
        </TouchableOpacity>
      </View>

      {activeRequests.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="help-circle-outline" size={32} color={Colors.textMuted} />
          <Text style={styles.emptyText}>Chưa có yêu cầu nào</Text>
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => router.push('/(tabs)/post' as any)}
          >
            <Text style={styles.createBtnText}>+ Đăng yêu cầu ngay</Text>
          </TouchableOpacity>
        </View>
      ) : (
        activeRequests.map(req => (
          <View key={req.id} style={styles.requestCard}>
            <View style={styles.requestTopRow}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={[
                  styles.badge,
                  req.status === 'SEARCHING' ? { backgroundColor: '#FEF3C7' } : { backgroundColor: '#D1FAE5' }
                ]}>
                  <Text style={[
                    styles.badgeText,
                    req.status === 'SEARCHING' ? { color: '#92400E' } : { color: '#065F46' }
                  ]}>
                    {req.status === 'SEARCHING' ? 'Đang tìm kiếm' : 'Đã ghép'}
                  </Text>
                </View>
                {req.duration ? (
                  <View style={[styles.badge, { backgroundColor: '#FFEDD5' }]}>
                    <Text style={[styles.badgeText, { color: '#C2410C' }]}>⏱ {Number((req.duration / 60).toFixed(1))} TC</Text>
                  </View>
                ) : null}
              </View>
            </View>
            <Text style={styles.requestTitle}>{req.title}</Text>
            {req.description ? (
              <Text style={styles.requestDesc} numberOfLines={2}>{req.description}</Text>
            ) : null}

            <View style={styles.cardDivider} />
            
            <View style={styles.requestBottomRow}>
              <Text style={styles.requestBottomText}>
                🕒 {req.duration || 60} phút · {
                  req.format === 'OFFLINE' ? 'Trực tiếp' : 
                  req.format === 'BOTH' ? 'Cả hai' : 'Online'
                } 📈 {req.responseCount ?? 0} phản hồi
              </Text>
              <Text style={styles.aiSuggestText}>⚡ AI gợi ý</Text>
            </View>
          </View>
        ))
      )}

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
  badgeText:    { fontSize: 12, fontWeight: '600' },
  creditText:   { fontSize: 13, color: Colors.accent, fontWeight: 'bold' },
  requestTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 4 },
  requestDesc:  { fontSize: 14, color: Colors.textMuted, lineHeight: 22 },

  cardDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 12 },
  requestBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  requestBottomText: { fontSize: 13, color: Colors.textMuted },
  aiSuggestText: { fontSize: 13, fontWeight: 'bold', color: '#059669' },
});
