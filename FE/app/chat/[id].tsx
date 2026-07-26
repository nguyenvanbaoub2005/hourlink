import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Location from 'expo-location';
import ChatApi from '@api/chat';
import { useChatStore } from '@store/chatStore';
import { initFirebaseAuth, isRealtimeReady, listenToMessages } from '@lib/firebase';
import { Colors } from '@constants/Colors';
import {
  formatTime,
  formatDateSeparator,
  formatBytes,
  initialsOf,
  avatarColorOf,
  fileIconOf,
} from '@utils/chatFormat';
import type { ChatMessage, ChatReportReason } from '@types';

/** Lý do báo cáo tin nhắn — khớp enum ChatReportReason ở backend */
const REPORT_REASONS: { value: ChatReportReason; label: string; icon: string }[] = [
  { value: 'OFFENSIVE', label: 'Nội dung xúc phạm', icon: 'warning-outline' },
  { value: 'HARASSMENT', label: 'Quấy rối', icon: 'hand-left-outline' },
  { value: 'SPAM', label: 'Spam, làm phiền', icon: 'repeat-outline' },
  { value: 'SCAM', label: 'Lừa đảo', icon: 'alert-circle-outline' },
  { value: 'OUTSIDE_PAYMENT', label: 'Đòi thanh toán ngoài hệ thống', icon: 'cash-outline' },
  { value: 'ASK_CREDENTIALS', label: 'Hỏi mật khẩu / mã OTP', icon: 'key-outline' },
  { value: 'OTHER', label: 'Lý do khác', icon: 'ellipsis-horizontal' },
];

/** Khoảng thời gian poll khi Firebase chưa cấu hình (chế độ dự phòng) */
const POLL_INTERVAL_MS = 4000;

export default function ChatRoomScreen() {
  const router = useRouter();
  const { id, otherName, otherUserId, skillName } = useLocalSearchParams<{
    id: string;
    otherName?: string;
    otherUserId?: string;
    skillName?: string;
  }>();

  const { clearUnread } = useChatStore();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState('');
  const [realtime, setRealtime] = useState(false);

  // Modal
  const [menuVisible, setMenuVisible] = useState(false);
  const [reportTarget, setReportTarget] = useState<ChatMessage | null>(null);
  const [reportReason, setReportReason] = useState<ChatReportReason | null>(null);
  const [reportNote, setReportNote] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [rescheduleVisible, setRescheduleVisible] = useState(false);
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [meetingVisible, setMeetingVisible] = useState(false);
  const [meetingLink, setMeetingLink] = useState('');

  const unsubscribeRef = useRef<null | (() => void)>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const avatarColor = avatarColorOf(otherName);

  // ─── Tải lịch sử tin nhắn qua REST ──────────────────────────────────────
  const fetchMessages = useCallback(async () => {
    if (!id) return;
    try {
      const res = await ChatApi.getMessages(id, 0, 50);
      setMessages(res.data?.data?.content ?? []);
    } catch (e) {
      console.log('Lỗi tải tin nhắn:', e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // ─── Đánh dấu đã đọc ────────────────────────────────────────────────────
  const markRead = useCallback(async () => {
    if (!id) return;
    try {
      await ChatApi.markAsRead(id);
      clearUnread(id);
    } catch {
      // không quan trọng — bỏ qua
    }
  }, [id, clearUnread]);

  // ─── Thiết lập realtime (Firestore) hoặc polling dự phòng ───────────────
  useEffect(() => {
    let cancelled = false;

    const setup = async () => {
      await fetchMessages();
      await markRead();

      await initFirebaseAuth();
      if (cancelled || !id) return;

      if (isRealtimeReady()) {
        const unsub = listenToMessages(id, (docs) => {
          // Firestore trả về mới nhất trước, đúng thứ tự FlatList inverted
          setMessages(docs as ChatMessage[]);
          markRead();
        });
        if (unsub) {
          unsubscribeRef.current = unsub;
          setRealtime(true);
          return;
        }
      }

      // Dự phòng: Firebase chưa cấu hình → poll định kỳ
      setRealtime(false);
      pollRef.current = setInterval(fetchMessages, POLL_INTERVAL_MS);
    };

    setup();

    return () => {
      cancelled = true;
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [id, fetchMessages, markRead]);

  useFocusEffect(
    useCallback(() => {
      markRead();
    }, [markRead])
  );

  // ─── Gửi tin nhắn ───────────────────────────────────────────────────────
  const afterSend = async () => {
    setInput('');
    if (!realtime) await fetchMessages();
  };

  const handleError = (e: any, fallback: string) => {
    const msg = e?.response?.data?.message ?? fallback;
    Alert.alert('Lỗi', msg);
  };

  const sendText = async () => {
    const content = input.trim();
    if (!content || !id || sending) return;

    setSending(true);
    try {
      await ChatApi.sendMessage(id, { type: 'TEXT', content });
      await afterSend();
    } catch (e: any) {
      handleError(e, 'Không gửi được tin nhắn. Vui lòng thử lại.');
    } finally {
      setSending(false);
    }
  };

  const sendImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Cần quyền truy cập', 'Vui lòng cho phép HourLink truy cập thư viện ảnh.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    await uploadFile(
      asset.uri,
      asset.fileName ?? `image_${Date.now()}.jpg`,
      asset.mimeType ?? 'image/jpeg'
    );
  };

  const sendDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      ],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    await uploadFile(
      asset.uri,
      asset.name ?? `file_${Date.now()}`,
      asset.mimeType ?? 'application/octet-stream'
    );
  };

  const uploadFile = async (uri: string, name: string, type: string) => {
    if (!id) return;
    setSending(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name,
        type,
      } as any);
      await ChatApi.sendAttachment(id, formData);
      await afterSend();
    } catch (e: any) {
      handleError(e, 'Không gửi được tệp. Vui lòng thử lại.');
    } finally {
      setSending(false);
    }
  };

  const sendLocation = async () => {
    if (!id) return;
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Cần quyền vị trí', 'Vui lòng cho phép HourLink truy cập vị trí để chia sẻ.');
      return;
    }

    setSending(true);
    try {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Chỉ chia sẻ khu vực gần đúng, không lộ địa chỉ chính xác (mục 9.13)
      let label: string | undefined;
      try {
        const places = await Location.reverseGeocodeAsync(pos.coords);
        const p = places?.[0];
        if (p) label = [p.district ?? p.subregion, p.city ?? p.region].filter(Boolean).join(', ');
      } catch {
        // reverse geocode có thể thất bại — không sao, vẫn gửi toạ độ
      }

      await ChatApi.sendMessage(id, {
        type: 'LOCATION',
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        locationLabel: label,
      });
      await afterSend();
    } catch (e: any) {
      handleError(e, 'Không lấy được vị trí. Vui lòng thử lại.');
    } finally {
      setSending(false);
    }
  };

  const sendMeetingLink = async () => {
    const link = meetingLink.trim();
    if (!link || !id) return;

    setSending(true);
    try {
      await ChatApi.sendMessage(id, { type: 'MEETING_LINK', meetingLink: link });
      setMeetingVisible(false);
      setMeetingLink('');
      await afterSend();
    } catch (e: any) {
      handleError(e, 'Không gửi được link họp. Vui lòng thử lại.');
    } finally {
      setSending(false);
    }
  };

  const submitReschedule = async () => {
    const time = rescheduleTime.trim();
    if (!time || !id) return;

    setSending(true);
    try {
      await ChatApi.proposeReschedule(id, { proposedTime: time });
      setRescheduleVisible(false);
      setRescheduleTime('');
      await afterSend();
      Alert.alert('📅 Đã gửi', 'Đề xuất đổi lịch đã được gửi tới người kia.');
    } catch (e: any) {
      handleError(e, 'Không gửi được đề xuất. Vui lòng thử lại.');
    } finally {
      setSending(false);
    }
  };

  // ─── Menu đính kèm ──────────────────────────────────────────────────────
  const openAttachMenu = () => {
    Alert.alert('📎 Đính kèm', 'Chọn nội dung muốn gửi', [
      { text: '🖼️  Hình ảnh', onPress: sendImage },
      { text: '📄  Tài liệu', onPress: sendDocument },
      { text: '📍  Vị trí của tôi', onPress: sendLocation },
      { text: '🔗  Link họp online', onPress: () => setMeetingVisible(true) },
      { text: '📅  Đề xuất đổi lịch', onPress: () => setRescheduleVisible(true) },
      { text: 'Hủy', style: 'cancel' },
    ]);
  };

  // ─── Báo cáo & chặn ─────────────────────────────────────────────────────
  const onLongPressMessage = (msg: ChatMessage) => {
    if (!msg.senderId || msg.senderId === otherUserId) {
      // Chỉ báo cáo được tin của người kia
      if (!msg.senderId) return;
      Alert.alert('Tin nhắn', undefined, [
        {
          text: '🚩 Báo cáo tin nhắn',
          style: 'destructive',
          onPress: () => {
            setReportTarget(msg);
            setReportReason(null);
            setReportNote('');
          },
        },
        { text: 'Hủy', style: 'cancel' },
      ]);
    }
  };

  const submitReport = async () => {
    if (!reportTarget || !reportReason) return;
    setSending(true);
    try {
      await ChatApi.reportMessage(reportTarget.id, {
        reason: reportReason,
        description: reportNote.trim() || undefined,
      });
      setReportTarget(null);
      Alert.alert('✅ Đã gửi báo cáo', 'Quản trị viên sẽ xem xét trong thời gian sớm nhất.');
    } catch (e: any) {
      handleError(e, 'Không gửi được báo cáo. Vui lòng thử lại.');
    } finally {
      setSending(false);
    }
  };

  const confirmBlock = () => {
    setMenuVisible(false);
    if (!otherUserId) return;

    Alert.alert(
      'Chặn người dùng',
      `Sau khi chặn, bạn và ${otherName ?? 'người này'} sẽ không gửi được tin nhắn cho nhau nữa.`,
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Chặn',
          style: 'destructive',
          onPress: async () => {
            try {
              await ChatApi.blockUser({ userId: otherUserId });
              Alert.alert('🚫 Đã chặn', 'Bạn sẽ không nhận tin nhắn mới từ người này.', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (e: any) {
              handleError(e, 'Không chặn được người dùng. Vui lòng thử lại.');
            }
          },
        },
      ]
    );
  };

  // ─── Render một bong bóng tin nhắn ──────────────────────────────────────
  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    if (item.type === 'SYSTEM') {
      return (
        <View style={styles.systemWrap}>
          <Text style={styles.systemText}>{item.content}</Text>
        </View>
      );
    }

    const isMine = item.senderId !== otherUserId;

    // Dải ngày — messages sắp xếp mới nhất trước nên so với phần tử kế tiếp
    const next = messages[index + 1];
    const showDate =
      !next ||
      new Date(item.createdAt).toDateString() !== new Date(next.createdAt).toDateString();

    const bubbleBody = (
      <>
        {item.type === 'TEXT' && (
          <Text style={[styles.msgText, isMine && styles.msgTextMine]}>{item.content}</Text>
        )}

        {item.type === 'IMAGE' && (
          <TouchableOpacity onPress={() => setPreviewImage(item.attachmentUrl ?? null)}>
            <Image source={{ uri: item.attachmentUrl }} style={styles.msgImage} />
            {!!item.content && (
              <Text style={[styles.msgText, isMine && styles.msgTextMine, { marginTop: 6 }]}>
                {item.content}
              </Text>
            )}
          </TouchableOpacity>
        )}

        {item.type === 'DOCUMENT' && (
          <TouchableOpacity
            style={styles.fileRow}
            onPress={() => item.attachmentUrl && Linking.openURL(item.attachmentUrl)}
          >
            <Ionicons
              name={fileIconOf(item.originalName) as any}
              size={26}
              color={isMine ? '#FFFFFF' : Colors.secondary}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.fileName, isMine && styles.msgTextMine]} numberOfLines={1}>
                {item.originalName ?? 'Tài liệu'}
              </Text>
              <Text style={[styles.fileMeta, isMine && { color: '#D1FAE5' }]}>
                {formatBytes(item.fileSize)}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {item.type === 'LOCATION' && (
          <TouchableOpacity
            style={styles.cardRow}
            onPress={() =>
              Linking.openURL(
                `https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`
              )
            }
          >
            <Ionicons name="location" size={24} color={isMine ? '#FFFFFF' : Colors.danger} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.fileName, isMine && styles.msgTextMine]}>
                {item.locationLabel || 'Vị trí được chia sẻ'}
              </Text>
              <Text style={[styles.fileMeta, isMine && { color: '#D1FAE5' }]}>
                Nhấn để mở bản đồ
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {item.type === 'MEETING_LINK' && (
          <TouchableOpacity
            style={styles.cardRow}
            onPress={() => item.meetingLink && Linking.openURL(item.meetingLink)}
          >
            <Ionicons name="videocam" size={24} color={isMine ? '#FFFFFF' : Colors.secondary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.fileName, isMine && styles.msgTextMine]}>Phòng họp online</Text>
              <Text
                style={[styles.fileMeta, isMine && { color: '#D1FAE5' }]}
                numberOfLines={1}
              >
                {item.meetingLink}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {item.type === 'RESCHEDULE_PROPOSAL' && (
          <View style={{ gap: 4 }}>
            <View style={styles.cardRow}>
              <Ionicons name="calendar" size={24} color={isMine ? '#FFFFFF' : Colors.warning} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.fileName, isMine && styles.msgTextMine]}>
                  Đề xuất đổi lịch
                </Text>
                <Text style={[styles.fileMeta, isMine && { color: '#D1FAE5' }]}>
                  {item.proposedTime}
                </Text>
              </View>
            </View>
            {!!item.content && (
              <Text style={[styles.msgText, isMine && styles.msgTextMine]}>{item.content}</Text>
            )}
          </View>
        )}

        <Text style={[styles.msgTime, isMine && styles.msgTimeMine]}>
          {formatTime(item.createdAt)}
        </Text>
      </>
    );

    return (
      <>
        {showDate && (
          <View style={styles.dateWrap}>
            <Text style={styles.dateText}>{formatDateSeparator(item.createdAt)}</Text>
          </View>
        )}

        <View style={[styles.msgRow, isMine ? styles.msgRowMine : styles.msgRowTheirs]}>
          {!isMine && (
            <View style={[styles.msgAvatar, { backgroundColor: avatarColor.bg }]}>
              <Text style={[styles.msgAvatarText, { color: avatarColor.fg }]}>
                {initialsOf(otherName)}
              </Text>
            </View>
          )}

          <TouchableOpacity
            activeOpacity={0.9}
            onLongPress={() => onLongPressMessage(item)}
            style={{ maxWidth: '78%' }}
          >
            {isMine ? (
              <LinearGradient
                colors={[Colors.secondary, Colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.bubble, styles.bubbleMine]}
              >
                {bubbleBody}
              </LinearGradient>
            ) : (
              <View style={[styles.bubble, styles.bubbleTheirs]}>{bubbleBody}</View>
            )}
          </TouchableOpacity>
        </View>
      </>
    );
  };

  // ─── UI ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={26} color={Colors.textPrimary} />
        </TouchableOpacity>

        <View style={[styles.headerAvatar, { backgroundColor: avatarColor.bg }]}>
          <Text style={[styles.headerAvatarText, { color: avatarColor.fg }]}>
            {initialsOf(otherName)}
          </Text>
          <View style={styles.headerDot} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerName} numberOfLines={1}>
            {otherName ?? 'Cuộc trò chuyện'}
          </Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {skillName || (realtime ? 'Đang hoạt động' : 'Chế độ ngoại tuyến')}
          </Text>
        </View>

        <TouchableOpacity style={styles.headerBtn} onPress={() => setMeetingVisible(true)}>
          <Ionicons name="videocam-outline" size={23} color={Colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerBtn} onPress={() => setMenuVisible(true)}>
          <Ionicons name="ellipsis-vertical" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* ── Danh sách tin nhắn ─────────────────────────────────── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            inverted
            contentContainerStyle={{ paddingVertical: 12, paddingHorizontal: 12 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>
                  Chưa có tin nhắn nào. Hãy gửi lời chào đầu tiên!
                </Text>
              </View>
            }
          />
        )}

        {/* ── Ô soạn tin ───────────────────────────────────────── */}
        <View style={styles.composer}>
          <TouchableOpacity onPress={openAttachMenu} style={styles.attachBtn} disabled={sending}>
            <Ionicons name="attach" size={24} color={Colors.textMuted} />
          </TouchableOpacity>

          <TextInput
            style={styles.composerInput}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor={Colors.textMuted}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={2000}
          />

          <TouchableOpacity
            onPress={sendText}
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
            disabled={!input.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Ionicons
                name="send"
                size={20}
                color={input.trim() ? Colors.primary : Colors.textMuted}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* ── Menu ⋮ ─────────────────────────────────────────────── */}
      <Modal visible={menuVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuSheet}>
            <View style={styles.modalHandle} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                setRescheduleVisible(true);
              }}
            >
              <Ionicons name="calendar-outline" size={22} color={Colors.textPrimary} />
              <Text style={styles.menuText}>Đề xuất đổi lịch</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={confirmBlock}>
              <Ionicons name="ban-outline" size={22} color={Colors.danger} />
              <Text style={[styles.menuText, { color: Colors.danger }]}>Chặn người dùng</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Bottom sheet: báo cáo tin nhắn ─────────────────────── */}
      <Modal visible={!!reportTarget} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.sheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.sheetTitle}>🚩 Báo cáo tin nhắn</Text>
            <Text style={styles.sheetDesc}>Chọn lý do để quản trị viên xem xét</Text>

            {REPORT_REASONS.map((r) => (
              <TouchableOpacity
                key={r.value}
                style={[styles.reasonRow, reportReason === r.value && styles.reasonRowActive]}
                onPress={() => setReportReason(r.value)}
              >
                <Ionicons
                  name={r.icon as any}
                  size={20}
                  color={reportReason === r.value ? Colors.primary : Colors.textMuted}
                />
                <Text
                  style={[styles.reasonText, reportReason === r.value && styles.reasonTextActive]}
                >
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}

            {reportReason === 'OTHER' && (
              <TextInput
                style={styles.sheetInput}
                placeholder="Mô tả chi tiết vấn đề..."
                placeholderTextColor={Colors.textMuted}
                value={reportNote}
                onChangeText={setReportNote}
                multiline
                textAlignVertical="top"
              />
            )}

            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={[styles.sheetBtn, styles.sheetBtnGhost]}
                onPress={() => setReportTarget(null)}
              >
                <Text style={styles.sheetBtnGhostText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sheetBtn, styles.sheetBtnPrimary, !reportReason && { opacity: 0.5 }]}
                onPress={submitReport}
                disabled={!reportReason || sending}
              >
                <Text style={styles.sheetBtnPrimaryText}>Gửi báo cáo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Bottom sheet: đề xuất đổi lịch ─────────────────────── */}
      <Modal visible={rescheduleVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.sheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.sheetTitle}>📅 Đề xuất đổi lịch</Text>
            <Text style={styles.sheetDesc}>
              Thời gian đề xuất sẽ được gửi vào cuộc trò chuyện và cập nhật vào lời mời
            </Text>
            <TextInput
              style={styles.sheetInput}
              placeholder="VD: Tối thứ Bảy 19:00"
              placeholderTextColor={Colors.textMuted}
              value={rescheduleTime}
              onChangeText={setRescheduleTime}
            />
            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={[styles.sheetBtn, styles.sheetBtnGhost]}
                onPress={() => setRescheduleVisible(false)}
              >
                <Text style={styles.sheetBtnGhostText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sheetBtn,
                  styles.sheetBtnPrimary,
                  !rescheduleTime.trim() && { opacity: 0.5 },
                ]}
                onPress={submitReschedule}
                disabled={!rescheduleTime.trim() || sending}
              >
                <Text style={styles.sheetBtnPrimaryText}>Gửi đề xuất</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Bottom sheet: link họp online ──────────────────────── */}
      <Modal visible={meetingVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.sheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.sheetTitle}>🔗 Gửi link phòng họp</Text>
            <Text style={styles.sheetDesc}>Dán link Google Meet, Zoom hoặc nền tảng bạn dùng</Text>
            <TextInput
              style={styles.sheetInput}
              placeholder="https://meet.google.com/..."
              placeholderTextColor={Colors.textMuted}
              value={meetingLink}
              onChangeText={setMeetingLink}
              autoCapitalize="none"
              keyboardType="url"
            />
            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={[styles.sheetBtn, styles.sheetBtnGhost]}
                onPress={() => setMeetingVisible(false)}
              >
                <Text style={styles.sheetBtnGhostText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sheetBtn,
                  styles.sheetBtnPrimary,
                  !meetingLink.trim() && { opacity: 0.5 },
                ]}
                onPress={sendMeetingLink}
                disabled={!meetingLink.trim() || sending}
              >
                <Text style={styles.sheetBtnPrimaryText}>Gửi link</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Xem ảnh toàn màn hình ──────────────────────────────── */}
      <Modal visible={!!previewImage} transparent animationType="fade">
        <View style={styles.imageOverlay}>
          <TouchableOpacity style={styles.imageClose} onPress={() => setPreviewImage(null)}>
            <Ionicons name="close" size={30} color="#FFFFFF" />
          </TouchableOpacity>
          {!!previewImage && (
            <Image
              source={{ uri: previewImage }}
              style={{ width: '95%', height: '80%' }}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 6,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  headerAvatarText: { fontSize: 13, fontWeight: '700' },
  headerDot: {
    position: 'absolute',
    right: -1,
    bottom: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  headerName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  headerSub: { fontSize: 12, color: Colors.primary },

  // Dải ngày
  dateWrap: { alignItems: 'center', marginVertical: 10 },
  dateText: {
    fontSize: 11,
    color: Colors.textMuted,
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: 'hidden',
  },

  // Tin hệ thống
  systemWrap: { alignItems: 'center', marginVertical: 10, paddingHorizontal: 30 },
  systemText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    lineHeight: 18,
  },

  // Bong bóng
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 10 },
  msgRowMine: { justifyContent: 'flex-end' },
  msgRowTheirs: { justifyContent: 'flex-start' },
  msgAvatar: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  msgAvatarText: { fontSize: 10, fontWeight: '700' },

  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  bubbleMine: { borderBottomRightRadius: 6 },
  bubbleTheirs: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  msgText: { fontSize: 14, color: '#1E293B', lineHeight: 20 },
  msgTextMine: { color: '#FFFFFF' },
  msgTime: { fontSize: 10, color: Colors.textMuted, alignSelf: 'flex-end', marginTop: 4 },
  msgTimeMine: { color: '#D1FAE5' },

  msgImage: { width: 210, height: 210, borderRadius: 12, backgroundColor: '#E2E8F0' },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 180 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 190 },
  fileName: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
  fileMeta: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },

  emptyWrap: { paddingVertical: 40, alignItems: 'center', transform: [{ scaleY: -1 }] },
  emptyText: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },

  // Ô soạn tin
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  attachBtn: { width: 38, height: 38, justifyContent: 'center', alignItems: 'center' },
  composerInput: {
    flex: 1,
    maxHeight: 110,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  sendBtn: { width: 38, height: 38, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { opacity: 0.6 },

  // Modal chung
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
  modalHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 14,
  },
  menuSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 15 },
  menuText: { fontSize: 15, fontWeight: '600', color: '#0F172A' },

  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  sheetDesc: { fontSize: 13, color: Colors.textMuted, marginTop: 4, marginBottom: 14, lineHeight: 18 },
  sheetInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
    marginTop: 10,
    minHeight: 46,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  reasonRowActive: { backgroundColor: '#ECFDF5', borderColor: Colors.primary },
  reasonText: { fontSize: 14, color: '#334155' },
  reasonTextActive: { color: Colors.secondary, fontWeight: '600' },

  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  sheetBtn: { flex: 1, paddingVertical: 13, borderRadius: 14, alignItems: 'center' },
  sheetBtnGhost: { backgroundColor: '#F1F5F9' },
  sheetBtnGhostText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  sheetBtnPrimary: { backgroundColor: Colors.primary },
  sheetBtnPrimaryText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

  imageOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageClose: { position: 'absolute', top: 52, right: 20, zIndex: 10 },
});
