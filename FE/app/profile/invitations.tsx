import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Spacing, Radius } from '@constants/Colors';
import InvitationApi from '@api/invitation';

type InvitationType = {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string;
  receiverId: string;
  receiverName: string;
  receiverAvatarUrl?: string;
  skillId?: string;
  skillName?: string;
  content: string;
  message?: string;
  proposedTime?: string;
  duration?: number;
  format: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'RESCHEDULED';
  rejectReason?: string;
  rescheduleTime?: string;
  createdAt: string;
};

type TabType = 'RECEIVED' | 'SENT';

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; icon: string }> = {
  PENDING:     { label: 'Chờ phản hồi',    bg: '#FEF3C7', color: '#D97706', icon: 'time-outline' },
  ACCEPTED:    { label: 'Đã chấp nhận',    bg: '#DCFCE7', color: '#15803D', icon: 'checkmark-circle-outline' },
  REJECTED:    { label: 'Đã từ chối',      bg: '#FEE2E2', color: '#DC2626', icon: 'close-circle-outline' },
  CANCELLED:   { label: 'Đã hủy',          bg: '#F1F5F9', color: '#64748B', icon: 'ban-outline' },
  RESCHEDULED: { label: 'Đề xuất đổi giờ', bg: '#EFF6FF', color: '#2563EB', icon: 'calendar-outline' },
};

const FORMAT_LABEL: Record<string, string> = {
  ONLINE:  'Trực tuyến 💻',
  OFFLINE: 'Trực tiếp 🤝',
  BOTH:    'Cả hai 🌐',
};

export default function InvitationsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('RECEIVED');
  const [received, setReceived] = useState<InvitationType[]>([]);
  const [sent, setSent] = useState<InvitationType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [recRes, sentRes] = await Promise.all([
        InvitationApi.getReceived(),
        InvitationApi.getSent(),
      ]);
      setReceived(recRes.data?.data ?? []);
      setSent(sentRes.data?.data ?? []);
    } catch (e) {
      console.error('Lỗi tải lời mời:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchAll(); }, [fetchAll]));

  // ── Helper: Cancel lời mời đã gửi ──────────────────────────────────────────
  const handleCancel = (item: InvitationType) => {
    Alert.alert('Hủy lời mời', 'Bạn có chắc muốn hủy lời mời này?', [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Hủy lời mời', style: 'destructive',
        onPress: async () => {
          try {
            await InvitationApi.cancel(item.id);
            setSent(prev => prev.map(i => i.id === item.id ? { ...i, status: 'CANCELLED' } : i));
          } catch {
            Alert.alert('Lỗi', 'Không thể hủy lời mời');
          }
        }
      }
    ]);
  };

  // ── Helper: Respond lời mời nhận được ──────────────────────────────────────
  const handleAccept = async (item: InvitationType) => {
    try {
      await InvitationApi.respond(item.id, { action: 'ACCEPT' });
      setReceived(prev => prev.map(i => i.id === item.id ? { ...i, status: 'ACCEPTED' } : i));
      Alert.alert('✅ Đã chấp nhận', 'Bạn đã chấp nhận lời mời. Hãy liên hệ với họ qua chat!');
    } catch {
      Alert.alert('Lỗi', 'Không thể chấp nhận lời mời');
    }
  };

  const handleReject = (item: InvitationType) => {
    Alert.alert('Từ chối lời mời', 'Bạn có chắc muốn từ chối lời mời này?', [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Từ chối', style: 'destructive',
        onPress: async () => {
          try {
            await InvitationApi.respond(item.id, { action: 'REJECT', rejectReason: 'Không phù hợp lịch' });
            setReceived(prev => prev.map(i => i.id === item.id ? { ...i, status: 'REJECTED' } : i));
          } catch {
            Alert.alert('Lỗi', 'Không thể từ chối lời mời');
          }
        }
      }
    ]);
  };

  // ── Render Item ─────────────────────────────────────────────────────────────
  const renderItem = ({ item }: { item: InvitationType }) => {
    const isSentTab = activeTab === 'SENT';
    const otherName = isSentTab ? item.receiverName : item.senderName;
    const otherLetter = otherName ? otherName.charAt(0).toUpperCase() : '?';
    const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.PENDING;
    const isPending = item.status === 'PENDING';

    return (
      <View style={styles.card}>
        {/* Header: Avatar + Name + Status */}
        <View style={styles.cardHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>{otherLetter}</Text>
          </View>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.otherName}>{otherName}</Text>
            {item.skillName ? (
              <Text style={styles.skillTag}>📚 {item.skillName}</Text>
            ) : null}
          </View>

          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon as any} size={13} color={cfg.color} style={{ marginRight: 3 }} />
            <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>

        {/* Content */}
        <Text style={styles.content} numberOfLines={3}>{item.content}</Text>

        {/* Meta info */}
        <View style={styles.metaRow}>
          <View style={styles.metaPill}>
            <Ionicons name="laptop-outline" size={13} color="#0284C7" />
            <Text style={styles.metaText}>{FORMAT_LABEL[item.format] ?? item.format}</Text>
          </View>
          {item.proposedTime ? (
            <View style={styles.metaPill}>
              <Ionicons name="calendar-outline" size={13} color="#7C3AED" />
              <Text style={styles.metaText}>{item.proposedTime}</Text>
            </View>
          ) : null}
          {item.duration ? (
            <View style={styles.metaPill}>
              <Ionicons name="timer-outline" size={13} color="#059669" />
              <Text style={styles.metaText}>{item.duration} phút</Text>
            </View>
          ) : null}
        </View>

        {/* Tin nhắn giới thiệu */}
        {item.message ? (
          <View style={styles.messageBox}>
            <Ionicons name="chatbubble-ellipses-outline" size={14} color="#64748B" style={{ marginRight: 6 }} />
            <Text style={styles.messageText} numberOfLines={2}>"{item.message}"</Text>
          </View>
        ) : null}

        {/* Reschedule info */}
        {item.status === 'RESCHEDULED' && item.rescheduleTime ? (
          <View style={styles.rescheduleBox}>
            <Text style={styles.rescheduleText}>📅 Đề xuất đổi sang: {item.rescheduleTime}</Text>
          </View>
        ) : null}

        {/* Reject reason */}
        {item.status === 'REJECTED' && item.rejectReason ? (
          <View style={styles.rejectBox}>
            <Text style={styles.rejectText}>💬 Lý do: {item.rejectReason}</Text>
          </View>
        ) : null}

        {/* Action Buttons */}
        {isPending && activeTab === 'RECEIVED' && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.btnReject} onPress={() => handleReject(item)}>
              <Ionicons name="close" size={16} color="#DC2626" />
              <Text style={styles.btnRejectText}>Từ chối</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnAccept} onPress={() => handleAccept(item)}>
              <Ionicons name="checkmark" size={16} color="#fff" />
              <Text style={styles.btnAcceptText}>Chấp nhận</Text>
            </TouchableOpacity>
          </View>
        )}
        {isPending && activeTab === 'SENT' && (
          <TouchableOpacity style={styles.btnCancel} onPress={() => handleCancel(item)}>
            <Ionicons name="close-circle-outline" size={16} color="#DC2626" />
            <Text style={styles.btnCancelText}>Hủy lời mời</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const displayList = activeTab === 'RECEIVED' ? received : sent;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navIcon}>
          <Ionicons name="chevron-back" size={26} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lời mời hỗ trợ</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'RECEIVED' && styles.tabItemActive]}
          onPress={() => setActiveTab('RECEIVED')}
        >
          <Ionicons
            name="mail-unread-outline"
            size={16}
            color={activeTab === 'RECEIVED' ? Colors.primary : Colors.textMuted}
            style={{ marginRight: 5 }}
          />
          <Text style={[styles.tabText, activeTab === 'RECEIVED' && styles.tabTextActive]}>
            Nhận được ({received.filter(i => i.status === 'PENDING').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'SENT' && styles.tabItemActive]}
          onPress={() => setActiveTab('SENT')}
        >
          <Ionicons
            name="send-outline"
            size={16}
            color={activeTab === 'SENT' ? Colors.primary : Colors.textMuted}
            style={{ marginRight: 5 }}
          />
          <Text style={[styles.tabText, activeTab === 'SENT' && styles.tabTextActive]}>
            Đã gửi ({sent.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : displayList.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="mail-outline" size={52} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>
            {activeTab === 'RECEIVED' ? 'Chưa có lời mời nào' : 'Bạn chưa gửi lời mời nào'}
          </Text>
          <Text style={styles.emptyDesc}>
            {activeTab === 'RECEIVED'
              ? 'Khi ai đó muốn bạn hỗ trợ, lời mời sẽ xuất hiện ở đây.'
              : 'Hãy khám phá người hỗ trợ và gửi lời mời để bắt đầu!'}
          </Text>
          {activeTab === 'SENT' && (
            <TouchableOpacity
              style={styles.exploreBtn}
              onPress={() => router.push('/(tabs)/explore' as any)}
            >
              <Ionicons name="search-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.exploreBtnText}>Khám phá ngay</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={displayList}
          keyExtractor={i => i.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 12 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  navIcon: { padding: 4 },

  tabBar: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  tabItem: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14,
  },
  tabItemActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabText: { fontSize: 14, fontWeight: '500', color: Colors.textMuted },
  tabTextActive: { color: Colors.primary, fontWeight: 'bold' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 17, fontWeight: 'bold', color: '#0F172A', marginTop: 14, textAlign: 'center' },
  emptyDesc: { fontSize: 13, color: Colors.textMuted, marginTop: 8, textAlign: 'center', lineHeight: 20, maxWidth: 280 },
  exploreBtn: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 20, backgroundColor: Colors.primary,
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: Radius.lg,
  },
  exploreBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  card: {
    backgroundColor: '#fff', marginHorizontal: 16, marginVertical: 7,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#E2E8F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },

  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatarCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  avatarLetter: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  otherName: { fontSize: 15, fontWeight: 'bold', color: '#0F172A' },
  skillTag: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },

  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12,
  },
  statusText: { fontSize: 11, fontWeight: '600' },

  content: { fontSize: 14, color: '#334155', lineHeight: 21, marginBottom: 10 },

  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  metaPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F8FAFC', paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0',
  },
  metaText: { fontSize: 12, color: '#475569', fontWeight: '500' },

  messageBox: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#F8FAFC', padding: 10, borderRadius: 10,
    borderLeftWidth: 3, borderLeftColor: Colors.primary,
    marginBottom: 10,
  },
  messageText: { flex: 1, fontSize: 13, color: '#475569', fontStyle: 'italic', lineHeight: 18 },

  rescheduleBox: {
    backgroundColor: '#EFF6FF', padding: 10, borderRadius: 10, marginBottom: 10,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  rescheduleText: { fontSize: 13, color: '#1D4ED8', fontWeight: '500' },

  rejectBox: {
    backgroundColor: '#FFF1F2', padding: 10, borderRadius: 10, marginBottom: 10,
    borderWidth: 1, borderColor: '#FECDD3',
  },
  rejectText: { fontSize: 13, color: '#BE123C' },

  actionRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btnReject: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 11, borderRadius: Radius.lg,
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
  },
  btnRejectText: { fontSize: 14, fontWeight: '600', color: '#DC2626' },

  btnAccept: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 11, borderRadius: Radius.lg, backgroundColor: Colors.primary,
  },
  btnAcceptText: { fontSize: 14, fontWeight: '600', color: '#fff' },

  btnCancel: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, marginTop: 4,
    borderRadius: Radius.lg, backgroundColor: '#FEF2F2',
    borderWidth: 1, borderColor: '#FECACA',
  },
  btnCancelText: { fontSize: 14, fontWeight: '600', color: '#DC2626' },
});
