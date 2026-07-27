import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, Alert, Modal, TextInput, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Spacing, Radius } from '@constants/Colors';
import InvitationApi from '@api/invitation';
import { openChatFromInvitation } from '@utils/chatNav';

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

  // Modal đề xuất đổi giờ
  const [rescheduleModal, setRescheduleModal] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<InvitationType | null>(null);
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

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

  // ── Helper: Mở modal đề xuất đổi giờ ──────────────────────────────────────
  const openReschedule = (item: InvitationType) => {
    setRescheduleTarget(item);
    setRescheduleTime(item.proposedTime ?? '');
    setRescheduleModal(true);
  };

  const handleReschedule = async () => {
    if (!rescheduleTarget) return;
    const trimmed = rescheduleTime.trim();
    if (!trimmed) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập thời gian đề xuất.');
      return;
    }
    setRescheduleLoading(true);
    try {
      await InvitationApi.respond(rescheduleTarget.id, {
        action: 'RESCHEDULE',
        rescheduleTime: trimmed,
      });
      setReceived(prev => prev.map(i =>
        i.id === rescheduleTarget.id
          ? { ...i, status: 'RESCHEDULED', rescheduleTime: trimmed }
          : i
      ));
      setRescheduleModal(false);
      Alert.alert('📅 Đã gửi đề xuất', 'Người gửi sẽ nhận được thông báo đề xuất đổi lịch của bạn.');
    } catch {
      Alert.alert('Lỗi', 'Không thể gửi đề xuất đổi giờ. Vui lòng thử lại.');
    } finally {
      setRescheduleLoading(false);
    }
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
            <Ionicons name="calendar-outline" size={15} color="#1D4ED8" style={{ marginRight: 6 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rescheduleLabel}>Đề xuất đổi sang:</Text>
              <Text style={styles.rescheduleTime}>{item.rescheduleTime}</Text>
            </View>
          </View>
        ) : null}

        {/* Reject reason */}
        {item.status === 'REJECTED' && item.rejectReason ? (
          <View style={styles.rejectBox}>
            <Text style={styles.rejectText}>💬 Lý do: {item.rejectReason}</Text>
          </View>
        ) : null}

        {/* Action Buttons — Receiver tab PENDING */}
        {isPending && activeTab === 'RECEIVED' && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.btnReject} onPress={() => handleReject(item)}>
              <Ionicons name="close" size={15} color="#DC2626" />
              <Text style={styles.btnRejectText}>Từ chối</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnReschedule} onPress={() => openReschedule(item)}>
              <Ionicons name="calendar-outline" size={15} color="#2563EB" />
              <Text style={styles.btnRescheduleText}>Đổi giờ</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnAccept} onPress={() => handleAccept(item)}>
              <Ionicons name="checkmark" size={15} color="#fff" />
              <Text style={styles.btnAcceptText}>Chấp nhận</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Action Buttons — Sender tab PENDING */}
        {isPending && activeTab === 'SENT' && (
          <TouchableOpacity style={styles.btnCancel} onPress={() => handleCancel(item)}>
            <Ionicons name="close-circle-outline" size={16} color="#DC2626" />
            <Text style={styles.btnCancelText}>Hủy lời mời</Text>
          </TouchableOpacity>
        )}

        {/* Sender nhận RESCHEDULED → có thể hủy */}
        {item.status === 'RESCHEDULED' && activeTab === 'SENT' && (
          <TouchableOpacity style={styles.btnCancel} onPress={() => handleCancel(item)}>
            <Ionicons name="close-circle-outline" size={16} color="#DC2626" />
            <Text style={styles.btnCancelText}>Hủy lời mời</Text>
          </TouchableOpacity>
        )}

        {/* Lời mời đã chấp nhận → mở cuộc trò chuyện (chức năng 9.10) */}
        {(item.status === 'ACCEPTED' || item.status === 'RESCHEDULED') && (
          <TouchableOpacity
            style={styles.btnOpenChat}
            onPress={() => openChatFromInvitation(router, item.id)}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={16} color="#0D9488" />
            <Text style={styles.btnOpenChatText}>Nhắn tin</Text>
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

      {/* ── Modal Đề xuất đổi giờ ──────────────────────────────────────── */}
      <Modal
        visible={rescheduleModal}
        transparent
        animationType="slide"
        onRequestClose={() => setRescheduleModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.rescheduleModalBox}>
            {/* Handle */}
            <View style={styles.modalHandle} />

            {/* Title */}
            <View style={styles.modalTitleRow}>
              <Ionicons name="calendar-outline" size={22} color="#2563EB" style={{ marginRight: 8 }} />
              <Text style={styles.modalTitle}>Đề xuất đổi thời gian</Text>
            </View>

            {rescheduleTarget ? (
              <Text style={styles.modalSubtitle}>
                Lời mời từ <Text style={{ fontWeight: 'bold' }}>{rescheduleTarget.senderName}</Text>
                {rescheduleTarget.skillName ? ` về "${rescheduleTarget.skillName}"` : ''}
              </Text>
            ) : null}

            {/* Original proposed time */}
            {rescheduleTarget?.proposedTime ? (
              <View style={styles.originalTimeBox}>
                <Text style={styles.originalTimeLabel}>⏰ Giờ đề xuất ban đầu:</Text>
                <Text style={styles.originalTimeVal}>{rescheduleTarget.proposedTime}</Text>
              </View>
            ) : null}

            {/* Input */}
            <Text style={styles.inputLabel}>Thời gian đề xuất mới của bạn *</Text>
            <TextInput
              style={styles.rescheduleInput}
              placeholder="Ví dụ: Tối thứ Bảy 19:00 hoặc 28/7 buổi sáng"
              placeholderTextColor="#94A3B8"
              value={rescheduleTime}
              onChangeText={setRescheduleTime}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />

            <Text style={styles.inputHint}>
              💡 Nhập thời gian bạn có thể, người gửi sẽ nhận được thông báo ngay.
            </Text>

            {/* Buttons */}
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setRescheduleModal(false)}
              >
                <Text style={styles.modalBtnCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtnConfirm, rescheduleLoading && { opacity: 0.6 }]}
                onPress={handleReschedule}
                disabled={rescheduleLoading}
              >
                {rescheduleLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="send" size={15} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={styles.modalBtnConfirmText}>Gửi đề xuất</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#EFF6FF', padding: 12, borderRadius: 12, marginBottom: 10,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  rescheduleLabel: { fontSize: 12, color: '#3B82F6', fontWeight: '500' },
  rescheduleTime: { fontSize: 14, color: '#1D4ED8', fontWeight: 'bold', marginTop: 2 },

  rejectBox: {
    backgroundColor: '#FFF1F2', padding: 10, borderRadius: 10, marginBottom: 10,
    borderWidth: 1, borderColor: '#FECDD3',
  },
  rejectText: { fontSize: 13, color: '#BE123C' },

  actionRow: { flexDirection: 'row', gap: 8, marginTop: 4 },

  btnReject: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 10, borderRadius: Radius.lg,
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
  },
  btnRejectText: { fontSize: 13, fontWeight: '600', color: '#DC2626' },

  btnReschedule: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 10, borderRadius: Radius.lg,
    backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE',
  },
  btnRescheduleText: { fontSize: 13, fontWeight: '600', color: '#2563EB' },

  btnAccept: {
    flex: 1.2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 10, borderRadius: Radius.lg, backgroundColor: Colors.primary,
  },
  btnAcceptText: { fontSize: 13, fontWeight: '600', color: '#fff' },

  btnCancel: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, marginTop: 4,
    borderRadius: Radius.lg, backgroundColor: '#FEF2F2',
    borderWidth: 1, borderColor: '#FECACA',
  },
  btnCancelText: { fontSize: 14, fontWeight: '600', color: '#DC2626' },

  btnOpenChat: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, marginTop: 8,
    borderRadius: Radius.lg, backgroundColor: '#F0FDFA',
    borderWidth: 1.5, borderColor: '#0D9488',
  },
  btnOpenChatText: { fontSize: 14, fontWeight: '600', color: '#0D9488' },

  // ── Reschedule Modal ────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end',
  },
  rescheduleModalBox: {
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 36,
  },
  modalHandle: {
    width: 40, height: 5, borderRadius: 3, backgroundColor: '#CBD5E1',
    alignSelf: 'center', marginBottom: 20,
  },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  modalSubtitle: { fontSize: 13, color: '#64748B', marginBottom: 14, lineHeight: 20 },

  originalTimeBox: {
    backgroundColor: '#FFF7ED', padding: 12, borderRadius: 12,
    borderWidth: 1, borderColor: '#FED7AA', marginBottom: 16,
  },
  originalTimeLabel: { fontSize: 12, color: '#92400E', marginBottom: 4 },
  originalTimeVal: { fontSize: 14, fontWeight: 'bold', color: '#92400E' },

  inputLabel: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 8 },
  rescheduleInput: {
    borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 14,
    padding: 14, fontSize: 14, color: '#0F172A',
    backgroundColor: '#F8FAFC', minHeight: 70,
    marginBottom: 10,
  },
  inputHint: { fontSize: 12, color: '#94A3B8', lineHeight: 18, marginBottom: 20 },

  modalBtnRow: { flexDirection: 'row', gap: 12 },
  modalBtnCancel: {
    flex: 1, paddingVertical: 14, borderRadius: Radius.lg,
    backgroundColor: '#F1F5F9', alignItems: 'center',
  },
  modalBtnCancelText: { fontSize: 15, fontWeight: '600', color: '#64748B' },
  modalBtnConfirm: {
    flex: 2, flexDirection: 'row', paddingVertical: 14, borderRadius: Radius.lg,
    backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center',
  },
  modalBtnConfirmText: { fontSize: 15, fontWeight: 'bold', color: '#fff' },
});
