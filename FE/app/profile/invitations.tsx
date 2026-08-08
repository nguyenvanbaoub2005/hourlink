import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, Alert, Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, Radius } from '@constants/Colors';
import InvitationApi, { type InvitationResponse as InvitationType } from '@api/invitation';
import AppointmentApi from '@api/appointment';
import { openChatFromInvitation } from '@utils/chatNav';
import { formatDateTimeVi, formatLocalDateInput, getNextAppointmentSlot } from '@utils/dateTime';
import DateTimePickerModal from '@components/DateTimePickerModal';

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

// Helper tạo danh sách 14 ngày tới
const getNextDays = (count = 14) => {
  const days = [];
  const today = new Date();
  const dayNames = ['C.Nhật', 'T.Hai', 'T.Ba', 'T.Tư', 'T.Năm', 'T.Sáu', 'T.Bảy'];
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const iso = formatLocalDateInput(d);
    const dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    let label = dayNames[d.getDay()];
    if (i === 0) label = 'Hôm nay';
    if (i === 1) label = 'N.mai';
    days.push({ iso, label, dateStr });
  }
  return days;
};

const COMMON_TIMES = ['07:00', '08:00', '09:00', '10:00', '14:00', '15:00', '16:00', '19:00', '20:00', '21:00'];

const CREDIT_OPTIONS = [
  { tc: '0.5', label: '0.5 TC', desc: '(30p)', min: 30 },
  { tc: '1', label: '1.0 TC', desc: '(60p)', min: 60 },
  { tc: '1.5', label: '1.5 TC', desc: '(90p)', min: 90 },
  { tc: '2', label: '2.0 TC', desc: '(120p)', min: 120 },
];

export default function InvitationsScreen() {
  const router = useRouter();
  const { tab } = useLocalSearchParams<{ tab?: string | string[] }>();
  const requestedTab = Array.isArray(tab) ? tab[0] : tab;
  const [activeTab, setActiveTab] = useState<TabType>(requestedTab === 'SENT' ? 'SENT' : 'RECEIVED');
  const [received, setReceived] = useState<InvitationType[]>([]);
  const [sent, setSent] = useState<InvitationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Modal nhập lý do từ chối
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<InvitationType | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Modal đề xuất đổi giờ
  const [rescheduleModal, setRescheduleModal] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<InvitationType | null>(null);
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  // Modal tạo lịch hẹn
  const [aptModalVisible, setAptModalVisible] = useState(false);
  const [aptTarget, setAptTarget] = useState<InvitationType | null>(null);
  const [aptTitle, setAptTitle] = useState('');
  const [aptDate, setAptDate] = useState(() => getNextAppointmentSlot().date);
  const [aptStart, setAptStart] = useState(() => getNextAppointmentSlot().time);
  const [aptEnd, setAptEnd] = useState('10:00');
  const [aptFormat, setAptFormat] = useState<'ONLINE' | 'OFFLINE'>('ONLINE');
  const [aptLocation, setAptLocation] = useState('');
  const [aptCredit, setAptCredit] = useState('1');
  const [creatingApt, setCreatingApt] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | null>(null);

  useEffect(() => {
    setActiveTab(requestedTab === 'SENT' ? 'SENT' : 'RECEIVED');
  }, [requestedTab]);

  const updateEndTime = (start: string, creditStr: string) => {
    try {
      const tc = parseFloat(creditStr) || 1;
      const durMin = Math.round(tc * 60);
      const startH = parseInt(start.split(':')[0], 10) || 9;
      const startM = parseInt(start.split(':')[1] || '00', 10) || 0;
      const totalMin = startH * 60 + startM + durMin;
      const endH = Math.min(Math.floor(totalMin / 60), 23);
      const endM = totalMin % 60;
      setAptEnd(`${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`);
    } catch {
      setAptEnd('10:00');
    }
  };

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
          if (actionLoadingId === item.id) return;
          setActionLoadingId(item.id);
          try {
            await InvitationApi.cancel(item.id);
            setSent(prev => prev.map(i => i.id === item.id ? { ...i, status: 'CANCELLED' } : i));
          } catch (err: any) {
            Alert.alert('Lỗi', err?.response?.data?.message || 'Không thể hủy lời mời');
          } finally {
            setActionLoadingId(null);
          }
        }
      }
    ]);
  };

  // ── Helper: Respond lời mời nhận được ──────────────────────────────────────
  const handleAccept = async (item: InvitationType) => {
    if (actionLoadingId === item.id) return;
    setActionLoadingId(item.id);
    try {
      await InvitationApi.respond(item.id, { action: 'ACCEPT' });
      setReceived(prev => prev.map(i => i.id === item.id ? { ...i, status: 'ACCEPTED' } : i));
      Alert.alert('✅ Đã chấp nhận', 'Bạn đã chấp nhận lời mời. Hãy liên hệ với họ qua chat!');
    } catch (err: any) {
      Alert.alert('Lỗi', err?.response?.data?.message || 'Không thể chấp nhận lời mời');
    } finally {
      setActionLoadingId(null);
    }
  };

  const openReject = (item: InvitationType) => {
    setRejectTarget(item);
    setRejectReason('');
    setRejectModal(true);
  };

  const handleReject = async () => {
    if (!rejectTarget || actionLoadingId === rejectTarget.id) return;
    const reason = rejectReason.trim();
    if (!reason) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập lý do từ chối.');
      return;
    }

    setActionLoadingId(rejectTarget.id);
    try {
      await InvitationApi.respond(rejectTarget.id, { action: 'REJECT', rejectReason: reason });
      setReceived(prev => prev.map(i => i.id === rejectTarget.id
        ? { ...i, status: 'REJECTED', rejectReason: reason }
        : i));
      setRejectModal(false);
      setRejectTarget(null);
      setRejectReason('');
    } catch (err: any) {
      Alert.alert('Lỗi', err?.response?.data?.message || 'Không thể từ chối lời mời');
    } finally {
      setActionLoadingId(null);
    }
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
    } catch (err: any) {
      Alert.alert('Lỗi', err?.response?.data?.message || 'Không thể gửi đề xuất đổi giờ. Vui lòng thử lại.');
    } finally {
      setRescheduleLoading(false);
    }
  };

  const handleRescheduleDecision = (item: InvitationType, accept: boolean) => {
    const title = accept ? 'Đồng ý thời gian mới' : 'Yêu cầu chọn lại';
    const message = accept
      ? `Xác nhận thời gian "${item.rescheduleTime}" và tiếp tục tạo lịch hẹn?`
      : 'Lời mời sẽ quay về trạng thái chờ để người nhận đề xuất thời gian khác.';

    Alert.alert(title, message, [
      { text: 'Đóng', style: 'cancel' },
      {
        text: accept ? 'Đồng ý' : 'Chọn lại',
        style: accept ? 'default' : 'destructive',
        onPress: async () => {
          if (actionLoadingId === item.id) return;
          setActionLoadingId(item.id);
          try {
            await InvitationApi.respond(item.id, {
              action: accept ? 'ACCEPT_RESCHEDULE' : 'REJECT_RESCHEDULE',
            });
            setSent(prev => prev.map(i => i.id === item.id
              ? accept
                ? { ...i, status: 'ACCEPTED', proposedTime: i.rescheduleTime }
                : { ...i, status: 'PENDING', rescheduleTime: undefined }
              : i));
            Alert.alert(
              accept ? '✅ Đã đồng ý' : '↩️ Đã yêu cầu chọn lại',
              accept
                ? 'Bạn có thể tạo lịch hẹn với thời gian mới.'
                : 'Người nhận đã được thông báo để phản hồi lại.'
            );
          } catch (err: any) {
            Alert.alert('Lỗi', err?.response?.data?.message || 'Không thể xử lý thời gian đề xuất.');
          } finally {
            setActionLoadingId(null);
          }
        },
      },
    ]);
  };

  const openCreateAptModal = (item: InvitationType) => {
    setAptTarget(item);
    setAptTitle(item.skillName ? `Hỗ trợ: ${item.skillName}` : 'Buổi hỗ trợ kỹ năng');
    const fallbackSlot = getNextAppointmentSlot();

    // Extract valid date YYYY-MM-DD
    let validDate = fallbackSlot.date;
    if (item.proposedTime) {
      const isoMatch = item.proposedTime.match(/\b(\d{4}-\d{2}-\d{2})\b/);
      if (isoMatch) {
        validDate = isoMatch[1];
      } else {
        const dmyMatch = item.proposedTime.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/);
        if (dmyMatch) {
          validDate = `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
        }
      }
    }

    // Extract time HH:MM
    let startT = fallbackSlot.time;
    if (item.proposedTime) {
      const tMatch = item.proposedTime.match(/\b(\d{1,2}:\d{2})\b/);
      if (tMatch) {
        startT = tMatch[1].padStart(5, '0');
      }
    }
    const candidateStart = new Date(`${validDate}T${startT}:00`);
    if (Number.isNaN(candidateStart.getTime()) || candidateStart.getTime() <= Date.now()) {
      validDate = fallbackSlot.date;
      startT = fallbackSlot.time;
    }
    setAptDate(validDate);
    setAptStart(startT);

    // Chuẩn hóa duration từ phút sang Time Credit (1 TC = 60 phút, hỗ trợ mốc 0.5 TC = 30 phút)
    const durationMin = item.duration || 60;
    const tc = durationMin > 10 ? Math.max(0.5, Math.round((durationMin / 60) * 2) / 2) : durationMin;
    setAptCredit(tc.toString());
    updateEndTime(startT, tc.toString());

    setAptFormat((item.format?.toUpperCase() === 'OFFLINE' ? 'OFFLINE' : 'ONLINE') as any);
    setAptLocation('');
    setAptModalVisible(true);
  };

  const submitCreateAppointment = async () => {
    if (!aptTarget) return;
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(aptDate.trim())) {
      Alert.alert('Lỗi định dạng', 'Vui lòng nhập ngày theo định dạng YYYY-MM-DD (ví dụ: 2026-07-28)');
      return;
    }
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(aptStart.trim()) || !timeRegex.test(aptEnd.trim())) {
      Alert.alert('Lỗi định dạng', 'Vui lòng nhập giờ theo định dạng HH:MM (ví dụ: 09:00, 14:30)');
      return;
    }
    const location = aptLocation.trim();
    if (!location) {
      Alert.alert('Thiếu thông tin', aptFormat === 'ONLINE'
        ? 'Vui lòng nhập link Google Meet, Zoom hoặc phòng họp trực tuyến.'
        : 'Vui lòng nhập địa điểm gặp mặt.');
      return;
    }
    if (aptFormat === 'ONLINE' && !/^https?:\/\//i.test(location)) {
      Alert.alert('Link chưa hợp lệ', 'Link họp phải bắt đầu bằng http:// hoặc https://');
      return;
    }

    setCreatingApt(true);
    try {
      const payload = {
        invitationId: aptTarget.id,
        providerId: aptTarget.receiverId || aptTarget.senderId,
        receiverId: aptTarget.senderId || aptTarget.receiverId,
        skillId: aptTarget.skillId,
        title: aptTitle.trim() || 'Buổi hỗ trợ kỹ năng',
        description: aptTarget.content || aptTarget.message,
        appointmentDate: aptDate.trim(),
        startTime: `${aptStart.trim()}:00`,
        endTime: `${aptEnd.trim()}:00`,
        meetingType: aptFormat,
        locationOrLink: location,
        timeCreditAmount: parseFloat(aptCredit) || 1,
      };
      const response = await AppointmentApi.create(payload);
      const created = response.data?.data;
      if (created?.id) {
        const markActive = (i: InvitationType): InvitationType => i.id === aptTarget.id
          ? {
              ...i,
              activeAppointmentId: created.id,
              activeAppointmentStatus: created.status,
              canCreateAppointment: false,
            }
          : i;
        setReceived(prev => prev.map(markActive));
        setSent(prev => prev.map(markActive));
      }
      setAptModalVisible(false);
      Alert.alert('Thành công', 'Đã tạo buổi học tiếp theo!', [
        { text: 'Xem lịch hẹn', onPress: () => router.push(`/(tabs)/appointments` as any) },
        { text: 'Đóng', style: 'cancel' }
      ]);
    } catch (err: any) {
      Alert.alert('Lỗi', err?.response?.data?.message || 'Không thể tạo lịch hẹn. Vui lòng thử lại.');
    } finally {
      setCreatingApt(false);
    }
  };

  // ── Render Item ─────────────────────────────────────────────────────────────
  const renderItem = ({ item }: { item: InvitationType }) => {
    const isSentTab = activeTab === 'SENT';
    const otherName = isSentTab ? item.receiverName : item.senderName;
    const otherAvatar = isSentTab ? item.receiverAvatarUrl : item.senderAvatarUrl;
    const otherLetter = otherName ? otherName.charAt(0).toUpperCase() : '?';
    const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.PENDING;
    const isPending = item.status === 'PENDING';
    const isBusy = actionLoadingId === item.id;

    return (
      <View style={styles.card}>
        {/* Header: Avatar + Name + Status */}
        <View style={styles.cardHeader}>
          {otherAvatar ? (
            <Image source={{ uri: otherAvatar }} style={{ width: 44, height: 44, borderRadius: 22 }} />
          ) : (
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarLetter}>{otherLetter}</Text>
            </View>
          )}

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

        <View style={styles.createdTimeRow}>
          <Ionicons name={isSentTab ? 'send-outline' : 'time-outline'} size={14} color="#64748B" />
          <Text style={styles.createdTimeText}>
            {isSentTab ? 'Đã gửi lúc' : 'Nhận lúc'} {formatDateTimeVi(item.createdAt)}
          </Text>
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
            <TouchableOpacity
              style={[styles.btnReject, isBusy && styles.btnDisabled]}
              onPress={() => openReject(item)}
              disabled={isBusy}
            >
              <Ionicons name="close" size={15} color="#DC2626" />
              <Text style={styles.btnRejectText}>Từ chối</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnReschedule, isBusy && styles.btnDisabled]}
              onPress={() => openReschedule(item)}
              disabled={isBusy}
            >
              <Ionicons name="calendar-outline" size={15} color="#2563EB" />
              <Text style={styles.btnRescheduleText}>Đổi giờ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnAccept, isBusy && styles.btnDisabled]}
              onPress={() => handleAccept(item)}
              disabled={isBusy}
            >
              {isBusy ? <ActivityIndicator size="small" color="#fff" /> : (
                <>
                  <Ionicons name="checkmark" size={15} color="#fff" />
                  <Text style={styles.btnAcceptText}>Chấp nhận</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Action Buttons — Sender tab PENDING */}
        {isPending && activeTab === 'SENT' && (
          <TouchableOpacity
            style={[styles.btnCancel, isBusy && styles.btnDisabled]}
            onPress={() => handleCancel(item)}
            disabled={isBusy}
          >
            {isBusy ? <ActivityIndicator size="small" color="#DC2626" /> : (
              <>
                <Ionicons name="close-circle-outline" size={16} color="#DC2626" />
                <Text style={styles.btnCancelText}>Hủy lời mời</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Sender quyết định thời gian mới */}
        {item.status === 'RESCHEDULED' && activeTab === 'SENT' && (
          <>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.btnReschedule, isBusy && styles.btnDisabled]}
                onPress={() => handleRescheduleDecision(item, false)}
                disabled={isBusy}
              >
                <Ionicons name="refresh-outline" size={15} color="#2563EB" />
                <Text style={styles.btnRescheduleText}>Chọn giờ khác</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnAccept, isBusy && styles.btnDisabled]}
                onPress={() => handleRescheduleDecision(item, true)}
                disabled={isBusy}
              >
                {isBusy ? <ActivityIndicator size="small" color="#fff" /> : (
                  <>
                    <Ionicons name="checkmark" size={15} color="#fff" />
                    <Text style={styles.btnAcceptText}>Đồng ý giờ mới</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.btnCancel, isBusy && styles.btnDisabled]}
              onPress={() => handleCancel(item)}
              disabled={isBusy}
            >
              <Ionicons name="close-circle-outline" size={16} color="#DC2626" />
              <Text style={styles.btnCancelText}>Hủy lời mời</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Lời mời đã chấp nhận → mở cuộc trò chuyện & tạo lịch hẹn */}
        {(item.status === 'ACCEPTED' || item.status === 'RESCHEDULED') && (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <TouchableOpacity
              style={[styles.btnOpenChat, { flex: 1, marginTop: 0 }]}
              onPress={() => openChatFromInvitation(router, item.id)}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={16} color="#0D9488" />
              <Text style={styles.btnOpenChatText}>Nhắn tin</Text>
            </TouchableOpacity>
            {item.status === 'ACCEPTED' && item.activeAppointmentId ? (
              <TouchableOpacity
                style={[styles.btnOpenChat, { flex: 1, marginTop: 0, backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}
                onPress={() => router.push(`/appointment/${item.activeAppointmentId}` as any)}
              >
                <Ionicons name="calendar" size={16} color="#2563EB" />
                <Text style={[styles.btnOpenChatText, { color: '#2563EB' }]}>Xem lịch hẹn</Text>
              </TouchableOpacity>
            ) : item.status === 'ACCEPTED' ? (
              <TouchableOpacity
                style={[styles.btnOpenChat, { flex: 1, marginTop: 0, backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}
                onPress={() => openCreateAptModal(item)}
              >
                <Ionicons name="calendar-outline" size={16} color="#2563EB" />
                <Text style={[styles.btnOpenChatText, { color: '#2563EB' }]}>Tạo buổi học</Text>
              </TouchableOpacity>
            ) : null}
          </View>
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

      {/* ── Modal nhập lý do từ chối ──────────────────────────────────── */}
      <Modal
        visible={rejectModal}
        transparent
        animationType="slide"
        onRequestClose={() => setRejectModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.rescheduleModalBox}>
            <View style={styles.modalHandle} />
            <View style={styles.modalTitleRow}>
              <Ionicons name="close-circle-outline" size={22} color="#DC2626" style={{ marginRight: 8 }} />
              <Text style={styles.modalTitle}>Từ chối lời mời</Text>
            </View>
            <Text style={styles.modalSubtitle}>
              Hãy cho {rejectTarget?.senderName ?? 'người gửi'} biết lý do để họ có thể điều chỉnh yêu cầu.
            </Text>
            <Text style={styles.inputLabel}>Lý do từ chối *</Text>
            <TextInput
              style={styles.rescheduleInput}
              placeholder="Ví dụ: Tôi chưa sắp xếp được thời gian phù hợp..."
              placeholderTextColor="#94A3B8"
              value={rejectReason}
              onChangeText={setRejectReason}
              maxLength={500}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{rejectReason.length} / 500</Text>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setRejectModal(false)}
                disabled={Boolean(rejectTarget && actionLoadingId === rejectTarget.id)}
              >
                <Text style={styles.modalBtnCancelText}>Đóng</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtnConfirm,
                  { backgroundColor: '#DC2626' },
                  rejectTarget && actionLoadingId === rejectTarget.id && styles.btnDisabled,
                ]}
                onPress={handleReject}
                disabled={Boolean(rejectTarget && actionLoadingId === rejectTarget.id)}
              >
                {rejectTarget && actionLoadingId === rejectTarget.id ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalBtnConfirmText}>Xác nhận từ chối</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
              maxLength={200}
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

      {/* Modal Tạo Lịch Hẹn */}
      <Modal visible={aptModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.rescheduleModalBox, { maxHeight: '92%' }]}>
            <View style={[styles.modalTitleRow, { justifyContent: 'space-between' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="calendar-outline" size={22} color="#0D9488" style={{ marginRight: 8 }} />
                <Text style={styles.modalTitle}>Tạo Lịch Hẹn Chính Thức</Text>
              </View>
              <TouchableOpacity onPress={() => setAptModalVisible(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSubtitle, { marginBottom: 12 }]}>
              Chọn nhanh ngày giờ bên dưới để tạo lịch hẹn chính xác tuyệt đối.
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ flexShrink: 1 }}>

            <Text style={styles.inputLabel}>Tiêu đề lịch hẹn *</Text>
            <TextInput
              style={[styles.rescheduleInput, { height: 42, minHeight: 42, marginBottom: 12 }]}
              placeholder="Tiêu đề..."
              placeholderTextColor="#94A3B8"
              value={aptTitle}
              onChangeText={setAptTitle}
            />

            {/* Chọn Ngày (Mở lịch hẹn) */}
            <Text style={styles.inputLabel}>Chọn ngày hẹn (YYYY-MM-DD) *</Text>
            <TouchableOpacity
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10,
                borderWidth: 1.5, borderColor: '#0D9488', backgroundColor: '#F0FDFA', marginBottom: 12
              }}
              onPress={() => setPickerMode('date')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="calendar-outline" size={20} color="#0D9488" style={{ marginRight: 10 }} />
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#0F172A' }}>{aptDate || 'Chọn ngày'}</Text>
              </View>
              <Ionicons name="chevron-down" size={20} color="#0D9488" />
            </TouchableOpacity>

            {/* Chọn Time Credit */}
            <Text style={styles.inputLabel}>Số Time Credit (1 TC = 1 giờ) *</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
              {CREDIT_OPTIONS.map((opt) => {
                const active = aptCredit === opt.tc;
                return (
                  <TouchableOpacity
                    key={opt.tc}
                    style={{
                      flex: 1, paddingVertical: 8, borderRadius: 10,
                      borderWidth: 1.5, borderColor: active ? '#0D9488' : '#E2E8F0',
                      backgroundColor: active ? '#0D9488' : '#F8FAFC',
                      alignItems: 'center'
                    }}
                    onPress={() => {
                      setAptCredit(opt.tc);
                      updateEndTime(aptStart, opt.tc);
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: active ? '#fff' : '#334155' }}>{opt.label}</Text>
                    <Text style={{ fontSize: 10, color: active ? '#CCFBF1' : '#64748B' }}>{opt.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Chọn Khung Giờ Bắt Đầu (Mở bộ chọn) */}
            <Text style={styles.inputLabel}>Khung giờ bắt đầu *</Text>
            <TouchableOpacity
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10,
                borderWidth: 1.5, borderColor: '#0D9488', backgroundColor: '#F0FDFA', marginBottom: 12
              }}
              onPress={() => setPickerMode('time')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="time-outline" size={20} color="#0D9488" style={{ marginRight: 10 }} />
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#0F172A' }}>{aptStart || 'Chọn giờ'}</Text>
              </View>
              <Ionicons name="chevron-down" size={20} color="#0D9488" />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDFA', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#CCFBF1', marginBottom: 16 }}>
              <Ionicons name="time" size={16} color="#0D9488" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 12, color: '#0F172A' }}>
                Khung giờ hỗ trợ: <Text style={{ fontWeight: 'bold', color: '#0D9488' }}>{aptStart} ➔ {aptEnd}</Text> ({aptCredit} Time Credit)
              </Text>
            </View>

            <Text style={styles.inputLabel}>
              {aptFormat === 'ONLINE' ? 'Link họp trực tuyến *' : 'Địa điểm gặp mặt *'}
            </Text>
            <TextInput
              style={[styles.rescheduleInput, { height: 46, minHeight: 46, marginBottom: 12 }]}
              placeholder={aptFormat === 'ONLINE' ? 'https://meet.google.com/...' : 'Nhập địa chỉ gặp mặt'}
              placeholderTextColor="#94A3B8"
              value={aptLocation}
              onChangeText={setAptLocation}
              autoCapitalize="none"
              autoCorrect={false}
            />
            </ScrollView>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setAptModalVisible(false)}
              >
                <Text style={styles.modalBtnCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtnConfirm, { backgroundColor: '#0D9488' }, creatingApt && { opacity: 0.6 }]}
                onPress={submitCreateAppointment}
                disabled={creatingApt}
              >
                {creatingApt ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={styles.modalBtnConfirmText}>Xác nhận tạo</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>

        <DateTimePickerModal
          visible={pickerMode !== null}
          mode={pickerMode || 'date'}
          initialValue={pickerMode === 'date' ? aptDate : aptStart}
          onClose={() => setPickerMode(null)}
          onSelect={(val) => {
            if (pickerMode === 'date') {
              setAptDate(val);
            } else {
              setAptStart(val);
              updateEndTime(val, aptCredit);
            }
          }}
        />
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

  createdTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  createdTimeText: { fontSize: 12, color: '#64748B', fontWeight: '500' },

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
  charCount: { fontSize: 11, color: '#94A3B8', textAlign: 'right', marginTop: -4, marginBottom: 14 },

  actionRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  btnDisabled: { opacity: 0.55 },

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
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 44 : 24,
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

  modalBtnRow: { flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 4 },
  modalBtnCancel: {
    flex: 1, height: 48, borderRadius: Radius.lg,
    backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center',
  },
  modalBtnCancelText: { fontSize: 15, fontWeight: '600', color: '#64748B' },
  modalBtnConfirm: {
    flex: 2, height: 48, flexDirection: 'row', borderRadius: Radius.lg,
    backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center',
  },
  modalBtnConfirmText: { fontSize: 15, fontWeight: 'bold', color: '#fff' },
});
