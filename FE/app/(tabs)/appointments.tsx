import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Radius, Spacing } from '@constants/Colors';
import AppointmentApi from '@api/appointment';
import Avatar from '@components/Avatar';
import type { AppointmentItem } from '@types';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  PENDING:     { label: 'Chờ xác nhận', color: '#D97706', bg: '#FEF3C7', icon: 'time-outline' },
  CONFIRMED:   { label: 'Đã xác nhận',  color: '#15803D', bg: '#DCFCE7', icon: 'checkmark-circle-outline' },
  UPCOMING:    { label: 'Sắp diễn ra',  color: '#0284C7', bg: '#E0F2FE', icon: 'calendar-outline' },
  IN_PROGRESS: { label: 'Đang diễn ra', color: '#0D9488', bg: '#CCFBF1', icon: 'play-circle-outline' },
  COMPLETED:   { label: 'Hoàn thành',   color: '#9333EA', bg: '#F3E8FF', icon: 'ribbon-outline' },
  CANCELLED:   { label: 'Đã hủy',       color: '#64748B', bg: '#F1F5F9', icon: 'close-circle-outline' },
  DISPUTED:    { label: 'Có tranh chấp',color: '#DC2626', bg: '#FEE2E2', icon: 'alert-circle-outline' },
  RESCHEDULED: { label: 'Đề xuất đổi lịch', color: '#F97316', bg: '#FFEDD5', icon: 'repeat-outline' },
};

const TABS = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'UPCOMING', label: 'Sắp tới' },
  { id: 'IN_PROGRESS', label: 'Đang diễn ra' },
  { id: 'HISTORY', label: 'Lịch sử' },
];

export default function AppointmentsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('UPCOMING');
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAppointments = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await AppointmentApi.getMyAppointments(activeTab, 0, 50);
      if (res.data?.data?.content) {
        setAppointments(res.data.data.content);
      } else if (Array.isArray(res.data?.data)) {
        setAppointments(res.data.data as any);
      } else {
        setAppointments([]);
      }
    } catch (error: any) {
      console.error('Failed to fetch appointments:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách lịch hẹn. Vui lòng thử lại.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useFocusEffect(
    useCallback(() => {
      fetchAppointments();
    }, [fetchAppointments])
  );

  const handleRespond = async (id: string, action: 'CONFIRM' | 'CANCEL', title: string) => {
    const actionText = action === 'CONFIRM' ? 'xác nhận' : 'hủy';
    Alert.alert(
      `${action === 'CONFIRM' ? 'Xác nhận' : 'Hủy'} lịch hẹn`,
      `Bạn có chắc chắn muốn ${actionText} buổi hẹn "${title}" không?`,
      [
        { text: 'Bỏ qua', style: 'cancel' },
        {
          text: action === 'CONFIRM' ? 'Đồng ý' : 'Hủy lịch',
          style: action === 'CANCEL' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              setActionLoading(id);
              await AppointmentApi.respond(id, { action, reason: action === 'CANCEL' ? 'Người dùng hủy lịch' : undefined });
              Alert.alert('Thành công', `Đã ${actionText} lịch hẹn.`);
              fetchAppointments();
            } catch (err: any) {
              Alert.alert('Lỗi', err?.response?.data?.message || `Không thể ${actionText} lịch hẹn.`);
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleVerify = (item: AppointmentItem) => {
    const isOffline = item.meetingType?.toUpperCase() === 'OFFLINE' || (item as any).format === 'offline';
    if (isOffline) {
      router.push(`/appointment/qr?id=${item.id}` as any);
    } else {
      router.push(`/appointment/otp?id=${item.id}` as any);
    }
  };

  const renderCard = ({ item }: { item: AppointmentItem }) => {
    const statusStr = (item.status || 'PENDING').toUpperCase();
    const statusCfg = STATUS_CONFIG[statusStr] || STATUS_CONFIG.PENDING;
    const isLoading = actionLoading === item.id;
    const titleStr = item.title || (item as any).content || 'Buổi hỗ trợ kỹ năng';
    const tcAmount = item.timeCreditAmount || (item as any).timeCredit || 1;
    const isOffline = item.meetingType?.toUpperCase() === 'OFFLINE' || (item as any).format === 'offline';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => router.push(`/appointment/${item.id}` as any)}
      >
        {/* Top Row: Date & Status Badge */}
        <View style={styles.cardHeader}>
          <View style={styles.dateBadge}>
            <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.dateText}>
              {item.appointmentDate} • {item.startTime?.slice(0, 5)} - {item.endTime?.slice(0, 5)}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
            <Ionicons name={statusCfg.icon} size={13} color={statusCfg.color} style={{ marginRight: 4 }} />
            <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
          </View>
        </View>

        {/* Title and Skill */}
        <Text style={styles.title} numberOfLines={2}>{titleStr}</Text>
        {!!item.skillName && (
          <View style={styles.skillTag}>
            <Ionicons name="ribbon-outline" size={13} color="#0284C7" />
            <Text style={styles.skillText}>{item.skillName}</Text>
          </View>
        )}

        {/* Users Info */}
        <View style={styles.usersContainer}>
          <View style={styles.userCol}>
            <Text style={styles.userRole}>Người hỗ trợ</Text>
            <View style={styles.userRow}>
              <Avatar uri={item.providerAvatarUrl || (item as any).helper?.avatarUrl} name={item.providerName || (item as any).helper?.fullName} size={28} />
              <Text style={styles.userName} numberOfLines={1}>
                {item.providerName || (item as any).helper?.fullName || 'Người hỗ trợ'}
              </Text>
            </View>
          </View>

          <Ionicons name="arrow-forward-outline" size={16} color={Colors.textMuted} style={styles.arrowIcon} />

          <View style={styles.userCol}>
            <Text style={styles.userRole}>Người nhận</Text>
            <View style={styles.userRow}>
              <Avatar uri={item.receiverAvatarUrl || (item as any).receiver?.avatarUrl} name={item.receiverName || (item as any).receiver?.fullName} size={28} />
              <Text style={styles.userName} numberOfLines={1}>
                {item.receiverName || (item as any).receiver?.fullName || 'Người nhận'}
              </Text>
            </View>
          </View>
        </View>

        {/* Format & Location */}
        <View style={styles.metaRow}>
          <View style={styles.metaBadge}>
            <Ionicons
              name={isOffline ? 'location-outline' : 'videocam-outline'}
              size={14}
              color={isOffline ? Colors.accent : '#0284C7'}
            />
            <Text style={styles.metaText}>{isOffline ? 'Trực tiếp' : 'Online (Video Call)'}</Text>
          </View>

          <View style={styles.creditBadge}>
            <Ionicons name="time" size={14} color={Colors.credit} />
            <Text style={styles.creditText}>{tcAmount} TC</Text>
          </View>
        </View>

        {/* Actions Row */}
        <View style={styles.actionsContainer}>
          {(statusStr === 'PENDING' || statusStr === 'RESCHEDULED') && (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.btn, styles.btnConfirm]}
                onPress={() => handleRespond(item.id, 'CONFIRM', titleStr)}
                disabled={isLoading}
              >
                {isLoading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.btnTextWhite}>Chấp nhận</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnCancel]}
                onPress={() => handleRespond(item.id, 'CANCEL', titleStr)}
                disabled={isLoading}
              >
                <Text style={styles.btnTextCancel}>Từ chối</Text>
              </TouchableOpacity>
            </View>
          )}

          {(statusStr === 'CONFIRMED' || statusStr === 'UPCOMING') && (
            <TouchableOpacity
              style={[styles.btn, styles.btnVerify]}
              onPress={() => handleVerify(item)}
            >
              <Ionicons name={isOffline ? 'qr-code' : 'keypad'} size={16} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.btnTextWhite}>Xác thực {isOffline ? 'QR Code' : 'Mã OTP'}</Text>
            </TouchableOpacity>
          )}

          {statusStr === 'IN_PROGRESS' && (
            <TouchableOpacity
              style={[styles.btn, styles.btnComplete]}
              onPress={() => router.push(`/appointment/${item.id}` as any)}
            >
              <Ionicons name="checkmark-done-circle" size={16} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.btnTextWhite}>Xác nhận hoàn thành</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.btn, styles.btnDetail]}
            onPress={() => router.push(`/appointment/${item.id}` as any)}
          >
            <Text style={styles.btnTextDetail}>Chi tiết</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lịch Hẹn</Text>
        <TouchableOpacity style={styles.refreshIcon} onPress={() => fetchAppointments(true)}>
          <Ionicons name="refresh-outline" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'UPCOMING' && styles.tabItemActive]}
          onPress={() => setActiveTab('UPCOMING')}
        >
          <Text style={[styles.tabText, activeTab === 'UPCOMING' && styles.tabTextActive]}>
            Sắp tới
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'IN_PROGRESS' && styles.tabItemActive]}
          onPress={() => setActiveTab('IN_PROGRESS')}
        >
          <Text style={[styles.tabText, activeTab === 'IN_PROGRESS' && styles.tabTextActive]}>
            Đang diễn ra
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'HISTORY' && styles.tabItemActive]}
          onPress={() => setActiveTab('HISTORY')}
        >
          <Text style={[styles.tabText, activeTab === 'HISTORY' && styles.tabTextActive]}>
            Lịch sử
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Đang tải lịch hẹn...</Text>
        </View>
      ) : appointments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-clear-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Chưa có lịch hẹn nào</Text>
          <Text style={styles.emptySub}>Các lịch hẹn trong mục này sẽ xuất hiện tại đây sau khi được tạo hoặc xác nhận.</Text>
        </View>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchAppointments(true)} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgScreen },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#FFF',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  refreshIcon: { padding: 4 },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: Colors.textSecondary, fontSize: 14 },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary, marginTop: 16 },
  emptySub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', marginTop: 6, lineHeight: 18 },

  listContainer: { padding: Spacing.md, paddingBottom: 32 },

  card: {
    backgroundColor: '#FFF',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 4,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  statusText: { fontSize: 11, fontWeight: '600' },

  title: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  skillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    marginBottom: 12,
  },
  skillText: { fontSize: 12, color: '#0284C7', fontWeight: '600', marginLeft: 4 },

  usersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgCard,
    padding: 10,
    borderRadius: Radius.md,
    marginBottom: 12,
  },
  userCol: { flex: 1 },
  userRole: { fontSize: 11, color: Colors.textSecondary, marginBottom: 4 },
  userRow: { flexDirection: 'row', alignItems: 'center' },
  userName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, marginLeft: 6, flexShrink: 1 },
  arrowIcon: { marginHorizontal: 8 },

  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginBottom: 12,
  },
  metaBadge: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 12, color: Colors.textSecondary, marginLeft: 4, fontWeight: '500' },
  creditBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  creditText: { fontSize: 12, fontWeight: '700', color: Colors.credit, marginLeft: 4 },

  actionsContainer: { flexDirection: 'column', gap: 8 },
  buttonRow: { flexDirection: 'row', gap: 8 },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  btnConfirm: { backgroundColor: Colors.success },
  btnCancel: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA' },
  btnVerify: { backgroundColor: '#0D9488' },
  btnComplete: { backgroundColor: '#9333EA' },
  btnDetail: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: Colors.border },

  btnTextWhite: { color: '#FFF', fontWeight: '600', fontSize: 13 },
  btnTextCancel: { color: '#DC2626', fontWeight: '600', fontSize: 13 },
  btnTextDetail: { color: Colors.textPrimary, fontWeight: '600', fontSize: 13 },
});
