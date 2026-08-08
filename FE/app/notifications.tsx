import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Radius } from '@constants/Colors';
import NotificationApi from '@api/notification';
import { useNotificationStore } from '@store/notificationStore';
import Avatar from '@components/Avatar';
import { notificationTarget } from '@utils/notificationNav';

type NotifItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  referenceId?: string;
  /** Người gây ra thông báo — dùng để hiện ảnh đại diện */
  actorId?: string;
  actorName?: string;
  actorAvatarUrl?: string;
  isRead: boolean;
  createdAt: string;
};

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  INVITATION_RECEIVED:     { icon: 'mail-outline',          color: '#0284C7', bg: '#E0F2FE' },
  INVITATION_ACCEPTED:     { icon: 'checkmark-circle-outline', color: '#15803D', bg: '#DCFCE7' },
  INVITATION_REJECTED:     { icon: 'close-circle-outline',  color: '#DC2626', bg: '#FEE2E2' },
  INVITATION_RESCHEDULED:  { icon: 'calendar-outline',      color: '#2563EB', bg: '#EFF6FF' },
  INVITATION_CANCELLED:    { icon: 'ban-outline',           color: '#64748B', bg: '#F1F5F9' },
  APPOINTMENT_REMINDER:    { icon: 'alarm-outline',         color: '#D97706', bg: '#FEF3C7' },
  NEW_RATING:              { icon: 'star-outline',          color: '#9333EA', bg: '#F3E8FF' },
  NEW_MESSAGE:             { icon: 'chatbubble-ellipses',   color: '#0D9488', bg: '#CCFBF1' },
  CHAT_RESCHEDULE_PROPOSED:{ icon: 'calendar-outline',      color: '#D97706', bg: '#FEF3C7' },
  COMMUNITY_CREDIT_AWARDED:{ icon: 'leaf-outline',          color: '#059669', bg: '#D1FAE5' },
  COMMUNITY_PARTICIPANT_ABSENT:{ icon: 'close-circle-outline', color: '#DC2626', bg: '#FEE2E2' },
  COMMUNITY_ACTIVITY_CANCELLED:{ icon: 'ban-outline',        color: '#64748B', bg: '#F1F5F9' },
};

/** Huy hiệu nhỏ ở góc avatar cho biết loại thông báo — giống Facebook */
const TYPE_BADGE: Record<string, { icon: string; color: string }> = {
  NEW_MESSAGE:             { icon: 'chatbubble', color: '#0D9488' },
  CHAT_RESCHEDULE_PROPOSED:{ icon: 'calendar',   color: '#D97706' },
  INVITATION_RECEIVED:     { icon: 'mail',       color: '#0284C7' },
  INVITATION_ACCEPTED:     { icon: 'checkmark',  color: '#15803D' },
  INVITATION_REJECTED:     { icon: 'close',      color: '#DC2626' },
  INVITATION_RESCHEDULED:  { icon: 'calendar',   color: '#2563EB' },
  INVITATION_CANCELLED:    { icon: 'ban',        color: '#64748B' },
  COMMUNITY_CREDIT_AWARDED:{ icon: 'leaf',       color: '#059669' },
  COMMUNITY_PARTICIPANT_ABSENT:{ icon: 'close',  color: '#DC2626' },
  COMMUNITY_ACTIVITY_CANCELLED:{ icon: 'ban',    color: '#64748B' },
};

function timeAgo(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Date(isoStr).toLocaleDateString('vi-VN');
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { setUnreadCount } = useNotificationStore();

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await NotificationApi.getAll();
      const data: NotifItem[] = res.data?.data ?? [];
      setItems(data);
      // Cập nhật store
      const unread = data.filter(n => !n.isRead).length;
      setUnreadCount(unread);
    } catch (e) {
      console.error('Lỗi tải thông báo:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchNotifications(); }, [fetchNotifications]));

  const handleMarkRead = async (item: NotifItem) => {
    if (item.isRead) {
      // Navigate ngay nếu đã đọc
      navigateToRef(item);
      return;
    }
    try {
      await NotificationApi.markRead(item.id);
      setItems(prev => prev.map(n => n.id === item.id ? { ...n, isRead: true } : n));
      setUnreadCount(Math.max(0, items.filter(n => !n.isRead).length - 1));
      navigateToRef(item);
    } catch {
      navigateToRef(item);
    }
  };

  const navigateToRef = (item: NotifItem) => {
    // Dùng chung logic điều hướng với toast nổi
    const target = notificationTarget(item);
    if (!target) return;
    router.push(
      (target.params
        ? { pathname: target.pathname, params: target.params }
        : target.pathname) as any
    );
  };

  const handleMarkAllRead = async () => {
    try {
      await NotificationApi.markAllRead();
      setItems(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      Alert.alert('Lỗi', 'Không thể đánh dấu đã đọc. Vui lòng thử lại.');
    }
  };

  const unreadCount = items.filter(n => !n.isRead).length;

  const renderItem = ({ item }: { item: NotifItem }) => {
    const cfg = TYPE_CONFIG[item.type] ?? { icon: 'notifications-outline', color: '#64748B', bg: '#F1F5F9' };
    const badge = TYPE_BADGE[item.type];
    const hasActor = Boolean(item.actorAvatarUrl || item.actorName);
    return (
      <TouchableOpacity
        style={[styles.card, !item.isRead && styles.cardUnread]}
        onPress={() => handleMarkRead(item)}
        activeOpacity={0.7}
      >
        {/* Unread dot */}
        {!item.isRead && <View style={styles.unreadDot} />}

        {/* Ảnh đại diện người gửi — không có thì rơi về icon theo loại */}
        {hasActor ? (
          <View style={styles.avatarWrap}>
            <Avatar uri={item.actorAvatarUrl} name={item.actorName} size={46} />
            {badge && (
              <View style={[styles.badge, { backgroundColor: badge.color }]}>
                <Ionicons name={badge.icon as any} size={10} color="#fff" />
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon as any} size={22} color={cfg.color} />
          </View>
        )}

        {/* Content */}
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.notifTitle, !item.isRead && styles.notifTitleBold]}>
            {item.title}
          </Text>
          <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
          <Text style={styles.notifTime}>{timeAgo(item.createdAt)}</Text>
        </View>

        {/* Arrow */}
        <Ionicons name="chevron-forward" size={16} color="#CBD5E1" style={{ marginLeft: 4 }} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navIcon}>
          <Ionicons name="chevron-back" size={26} color="#0F172A" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 4 }}>
          <Text style={styles.headerTitle}>Thông báo</Text>
          {unreadCount > 0 && (
            <Text style={styles.headerSub}>{unreadCount} thông báo chưa đọc</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead}>
            <Ionicons name="checkmark-done-outline" size={17} color={Colors.primary} style={{ marginRight: 4 }} />
            <Text style={styles.markAllText}>Đọc tất cả</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="notifications-off-outline" size={52} color="#CBD5E1" />
          </View>
          <Text style={styles.emptyTitle}>Chưa có thông báo nào</Text>
          <Text style={styles.emptyDesc}>
            Khi bạn nhận được lời mời hoặc có cập nhật mới, thông báo sẽ xuất hiện ở đây.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={i => i.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 8 }}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 16 }} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  navIcon: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  headerSub: { fontSize: 12, color: Colors.primary, marginTop: 1 },
  markAllBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, backgroundColor: '#F0FDF4',
    borderWidth: 1, borderColor: '#A7F3D0',
  },
  markAllText: { fontSize: 13, fontWeight: '600', color: Colors.primary },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyIconWrap: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 17, fontWeight: 'bold', color: '#0F172A', textAlign: 'center' },
  emptyDesc: {
    fontSize: 13, color: '#94A3B8', textAlign: 'center',
    lineHeight: 20, maxWidth: 280, marginTop: 8,
  },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14,
    position: 'relative',
  },
  cardUnread: { backgroundColor: '#F0F9FF' },
  unreadDot: {
    position: 'absolute', left: 6, top: '50%',
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.primary,
    transform: [{ translateY: -4 }],
  },
  iconWrap: {
    width: 46, height: 46, borderRadius: 23,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarWrap: { position: 'relative' },
  badge: {
    position: 'absolute',
    right: -2, bottom: -2,
    width: 19, height: 19, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  notifTitle: { fontSize: 14, color: '#334155', lineHeight: 20, marginBottom: 2 },
  notifTitleBold: { fontWeight: '700', color: '#0F172A' },
  notifBody: { fontSize: 13, color: '#64748B', lineHeight: 18, marginBottom: 4 },
  notifTime: { fontSize: 11, color: '#94A3B8' },
});
