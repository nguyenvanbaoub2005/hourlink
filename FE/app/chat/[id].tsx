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
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Location from 'expo-location';
import * as Clipboard from 'expo-clipboard';
import ChatApi from '@api/chat';
import AppointmentApi from '@api/appointment';
import Avatar from '@components/Avatar';
import UserProfileSheet from '@components/UserProfileSheet';
import DateTimePickerModal from '@components/DateTimePickerModal';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import MapPickerModal from '@components/MapPickerModal';
import { useChatStore } from '@store/chatStore';
import { useAuthStore } from '@store/authStore';
import { initFirebaseAuth, isRealtimeReady, listenToMessages } from '@lib/firebase';
import { Colors } from '@constants/Colors';
import {
  formatTime,
  formatDateSeparator,
  formatBytes,
  fileIconOf,
} from '@utils/chatFormat';
import type { ChatMessage, ChatReportReason, Conversation } from '@types';

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

// Helper tạo danh sách 14 ngày tới
const getNextDays = (count = 14) => {
  const days = [];
  const today = new Date();
  const dayNames = ['C.Nhật', 'T.Hai', 'T.Ba', 'T.Tư', 'T.Năm', 'T.Sáu', 'T.Bảy'];
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
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

export default function ChatRoomScreen() {
  const router = useRouter();
  const { id, otherName, otherUserId, otherAvatarUrl, skillName } = useLocalSearchParams<{
    id: string;
    otherName?: string;
    otherUserId?: string;
    otherAvatarUrl?: string;
    skillName?: string;
  }>();

  const { clearUnread } = useChatStore();
  const { user } = useAuthStore();

  /**
   * Thông tin hội thoại lấy từ server. Cần thiết khi màn này được mở từ thông
   * báo (chỉ có mỗi conversationId, không có tham số tên/avatar đi kèm).
   * Tham số điều hướng chỉ dùng để hiển thị ngay lập tức trong lúc chờ tải.
   */
  const [conversation, setConversation] = useState<Conversation | null>(null);

  const peerName = conversation?.otherUserName ?? otherName;
  const peerAvatar = conversation?.otherUserAvatarUrl ?? (otherAvatarUrl || undefined);
  const peerId = conversation?.otherUserId ?? otherUserId;
  const peerSkill = conversation?.skillName ?? skillName;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState('');
  const [realtime, setRealtime] = useState(false);

  // Set lưu ID tin nhắn đã xóa / thu hồi local — ngăn Firebase listener restore lại
  const hiddenMsgIds = useRef<Set<string>>(new Set());
  const recalledMsgIds = useRef<Set<string>>(new Set());
  // Ground truth từ REST: IDs hợp lệ + thời điểm fetch
  // Firebase listener dùng để phân biệt "tin ẩn" vs "tin mới"
  const restValidIds = useRef<Set<string>>(new Set());
  const restFetchedAt = useRef<number>(0);

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
  
  const [attachSheetVisible, setAttachSheetVisible] = useState(false);
  const [messageActionMsg, setMessageActionMsg] = useState<ChatMessage | null>(null);
  const [profileVisible, setProfileVisible] = useState(false);
  const [aptDetailsModalVisible, setAptDetailsModalVisible] = useState(false);
  const [selectedAptDetails, setSelectedAptDetails] = useState<any>(null);
  const [mapPickerVisible, setMapPickerVisible] = useState(false);

  // Modal Tạo lịch hẹn
  const [aptModalVisible, setAptModalVisible] = useState(false);
  const [aptTitle, setAptTitle] = useState('');
  const [aptDate, setAptDate] = useState(new Date().toISOString().slice(0, 10));
  const [aptStart, setAptStart] = useState('09:00');
  const [aptEnd, setAptEnd] = useState('10:00');
  const [aptFormat, setAptFormat] = useState<'ONLINE' | 'OFFLINE'>('ONLINE');
  const [aptCredit, setAptCredit] = useState('1');
  const [aptLocation, setAptLocation] = useState('');
  const [creatingApt, setCreatingApt] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | null>(null);

  // Lấy thông tin invitation từ conversation để xác định provider/receiver
  const invitationId = conversation?.invitationId;
  const convProviderId = conversation?.invitationProviderId; // nếu có
  const convReceiverId = conversation?.invitationReceiverId; // nếu có

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

  const unsubscribeRef = useRef<null | (() => void)>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Tải lịch sử tin nhắn qua REST ──────────────────────────────────────
  const fetchMessages = useCallback(async () => {
    if (!id) return;
    try {
      const res = await ChatApi.getMessages(id, 0, 50);
      const raw: any[] = res.data?.data?.content ?? [];
      const normalised = raw.map((m: any) => ({
        ...m,
        isRecalled: m.isRecalled || m.recalled || false,
      }));
      // Ghi lại ground truth từ REST: chỉ những tin này mới hợp lệ
      // Firebase listener sẽ dùng để lọc bỏ tin đã ẩn
      restValidIds.current = new Set(normalised.map((m: any) => m.id));
      restFetchedAt.current = Date.now();
      // Merge local hidden/recall state vào REST result
      recalledMsgIds.current.forEach(rid => {
        const idx = normalised.findIndex((m: any) => m.id === rid);
        if (idx >= 0) normalised[idx] = { ...normalised[idx], isRecalled: true };
      });
      setMessages(normalised.filter((m: any) => !hiddenMsgIds.current.has(m.id)));
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
      // Lấy thông tin hội thoại trước — khi mở từ thông báo, đây là nguồn duy
      // nhất biết được người kia là ai (dùng để phân biệt tin của mình/của họ)
      try {
        const res = await ChatApi.getConversation(id);
        if (!cancelled) setConversation(res.data?.data ?? null);
      } catch (e) {
        console.log('Lỗi tải hội thoại:', e);
      }

      await fetchMessages();
      await markRead();

      await initFirebaseAuth();
      if (cancelled || !id) return;

      if (isRealtimeReady()) {
        const unsub = listenToMessages(id, (docs) => {
          // Firestore trả về mới nhất trước, đúng thứ tự FlatList inverted
          const normalised = docs
            .filter((m: any) => {
              // Bị ẩn trong session này → lọc bỏ
              if (hiddenMsgIds.current.has(m.id)) return false;
              // Tin đã có trong REST result → hợp lệ, hiển thị
              if (restValidIds.current.has(m.id)) return true;
              // Tin mới hơn thời điểm REST fetch (tin nhắn mới gửi đến) → hiển thị
              const msgTs = typeof m.createdAt === 'number'
                ? m.createdAt
                : new Date(m.createdAt ?? 0).getTime();
              return msgTs >= restFetchedAt.current - 15000;
              // Nếu không thuộc 3 trường hợp trên → tin đã bị ẩn/xóa → lọc bỏ
            })
            .map((m: any) => ({
              ...m,
              isRecalled: m.isRecalled || m.recalled || recalledMsgIds.current.has(m.id) || false,
            }));
          // Cập nhật restValidIds với tin mới nhận được
          normalised.forEach((m: any) => restValidIds.current.add(m.id));
          setMessages(normalised as ChatMessage[]);
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

  const openCreateAppointmentModal = () => {
    setAptTitle(peerSkill ? `Hỗ trợ: ${peerSkill}` : 'Buổi hỗ trợ kỹ năng');

    // Tìm tin nhắn chứa link họp gần nhất (MEETING_LINK) để điền tự động
    const lastLinkMsg = [...messages].reverse().find(m => m.type === 'MEETING_LINK');
    if (lastLinkMsg && lastLinkMsg.meetingLink) {
      setAptFormat('ONLINE');
      setAptLocation(lastLinkMsg.meetingLink);
    } else {
      setAptLocation('');
    }

    setAptModalVisible(true);
  };

  const submitCreateAppointment = async () => {
    if (!user?.id || !peerId) {
      Alert.alert('Lỗi', 'Không thể xác định thông tin người dùng.');
      return;
    }
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
    if (aptFormat === 'ONLINE' && !aptLocation.trim()) {
      Alert.alert('Thiếu thông tin', 'Hình thức Online yêu cầu cung cấp link họp (Google Meet, Zoom...).');
      return;
    }

    // Xác định provider/receiver từ invitation (để đúng nghiệp vụ)
    // conversation.invitationProviderId là người hỗ trợ (skill owner)
    // Nếu không có thông tin này, dùng peerId làm provider (quy ước tạm)
    const invData = conversation?.invitationSenderId;
    const invRecv = conversation?.invitationReceiverId;
    // Provider = người gửi lời mời (invitation sender = người offer kỹ năng)
    // Receiver = người nhận lời mời
    let providerId = peerId;  // mặc định peer là provider
    let receiverId = user.id; // mặc định mình là receiver
    if (invData && invRecv) {
      providerId = invData; // sender invitation thường là người offer kỹ năng
      receiverId = invRecv;
    }

    setCreatingApt(true);
    try {
      const payload = {
        providerId,
        receiverId,
        invitationId: invitationId || undefined,
        title: aptTitle.trim() || 'Buổi hỗ trợ kỹ năng',
        appointmentDate: aptDate.trim(),
        startTime: `${aptStart.trim()}:00`,
        endTime: `${aptEnd.trim()}:00`,
        meetingType: aptFormat,
        locationOrLink: aptFormat === 'OFFLINE'
          ? (aptLocation.trim() || 'Gặp mặt trực tiếp')
          : aptLocation.trim(),
        timeCreditAmount: parseFloat(aptCredit) || 1,
      };
      await AppointmentApi.create(payload);
      setAptModalVisible(false);
      setAptLocation('');
      Alert.alert('✅ Đã gửi đề xuất', 'Lịch hẹn đã được gửi vào cuộc trò chuyện. Hãy đợi người kia xác nhận!', [
        { text: 'OK', style: 'default' }
      ]);
      if (!realtime) await fetchMessages();
    } catch (err: any) {
      Alert.alert('Lỗi', err?.response?.data?.message || 'Không thể tạo lịch hẹn. Vui lòng thử lại.');
    } finally {
      setCreatingApt(false);
    }
  };

  // ─── Menu đính kèm ──────────────────────────────────────────────────────
  const openAttachMenu = () => {
    setAttachSheetVisible(true);
  };

  // ─── Báo cáo & chặn ─────────────────────────────────────────────────────
  const onLongPressMessage = (msg: ChatMessage) => {
    setMessageActionMsg(msg);
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
    if (!peerId) return;

    Alert.alert(
      'Chặn người dùng',
      `Sau khi chặn, bạn và ${peerName ?? 'người này'} sẽ không gửi được tin nhắn cho nhau nữa.`,
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Chặn',
          style: 'destructive',
          onPress: async () => {
            try {
              await ChatApi.blockUser({ userId: peerId });
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

    const isMine = item.senderId !== peerId;

    // Dải ngày — messages sắp xếp mới nhất trước nên so với phần tử kế tiếp
    const next = messages[index + 1]; // Tin nhắn cũ hơn
    const prev = messages[index - 1]; // Tin nhắn mới hơn
    
    const showDate =
      !next ||
      new Date(item.createdAt).toDateString() !== new Date(next.createdAt).toDateString();

    const isNextSame = next && next.senderId === item.senderId && next.type !== 'SYSTEM';
    const isPrevSame = prev && prev.senderId === item.senderId && prev.type !== 'SYSTEM';

    const isRecalled = item.isRecalled || item.recalled;
    
    const bubbleBody = isRecalled ? (
      <>
       <Text style={[styles.msgText, { fontStyle: 'italic', color: '#64748B' }]}>
         Tin nhắn đã bị thu hồi
       </Text>
       <Text style={[styles.msgTime, { color: '#94A3B8' }]}>
         {formatTime(item.createdAt)}
       </Text>
      </>
    ) : (
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

        {item.type === 'APPOINTMENT_CARD' && (() => {
          let aptData: any = {};
          try { aptData = item.appointmentData ? JSON.parse(item.appointmentData) : {}; } catch {}
          const isPending = aptData.status === 'PENDING';
          const isOtherPerson = !isMine; // người không tạo lịch
          return (
            <View style={{
              backgroundColor: isMine ? '#F0FDFA' : '#FFFFFF',
              borderRadius: 12, padding: 12, minWidth: 220,
              borderWidth: 1, borderColor: isMine ? '#14B8A6' : '#E2E8F0'
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <Ionicons name="calendar" size={18} color="#0D9488" style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A', flex: 1 }} numberOfLines={2}>
                  {aptData.title || 'Lịch hẹn mới'}
                </Text>
              </View>
              <View style={{ gap: 4, marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="calendar-outline" size={13} color="#0D9488" />
                  <Text style={{ fontSize: 12, color: '#334155' }}>
                    {aptData.date} · {aptData.start?.slice(0,5)} → {aptData.end?.slice(0,5)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name={aptData.meetingType === 'ONLINE' ? 'videocam-outline' : 'location-outline'} size={13} color="#0D9488" />
                  <Text style={{ fontSize: 12, color: '#334155' }} numberOfLines={1}>
                    {aptData.meetingType === 'ONLINE' ? 'Trực tuyến' : 'Trực tiếp'}{aptData.locationOrLink ? ` · ${aptData.locationOrLink}` : ''}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="time-outline" size={13} color="#0D9488" />
                  <Text style={{ fontSize: 12, color: '#334155' }}>
                    {aptData.timeCreditAmount} Time Credit
                  </Text>
                </View>
              </View>
              {isPending && isOtherPerson && item.appointmentId && (
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: '#0D9488', borderRadius: 8, paddingVertical: 7, alignItems: 'center' }}
                    onPress={async () => {
                      try {
                        await AppointmentApi.respond(item.appointmentId!.toString(), { action: 'CONFIRM' });
                        await fetchMessages();
                        Alert.alert('✅ Đã xác nhận', 'Lịch hẹn đã được xác nhận thành công!');
                      } catch (e: any) {
                        Alert.alert('Lỗi', e?.response?.data?.message || 'Không thể xác nhận lịch hẹn.');
                      }
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>✓ Đồng ý</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: '#FEE2E2', borderRadius: 8, paddingVertical: 7, alignItems: 'center', borderWidth: 1, borderColor: '#FECACA' }}
                    onPress={() => {
                      Alert.alert('Từ chối lịch hẹn', 'Bạn có chắc muốn từ chối lịch hẹn này?', [
                        { text: 'Không', style: 'cancel' },
                        { text: 'Từ chối', style: 'destructive', onPress: async () => {
                          try {
                            await AppointmentApi.respond(item.appointmentId!.toString(), { action: 'CANCEL', reason: 'Từ chối lịch hẹn' });
                            await fetchMessages();
                          } catch (e: any) {
                            Alert.alert('Lỗi', e?.response?.data?.message || 'Không thể từ chối lịch hẹn.');
                          }
                        }}
                      ]);
                    }}
                  >
                    <Text style={{ color: '#DC2626', fontWeight: '700', fontSize: 12 }}>✗ Từ chối</Text>
                  </TouchableOpacity>
                </View>
              )}
              {!isPending && (
                <View style={{ backgroundColor: aptData.status === 'CONFIRMED' ? '#DCFCE7' : '#FEE2E2', borderRadius: 6, paddingVertical: 4, paddingHorizontal: 8, alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: aptData.status === 'CONFIRMED' ? '#15803D' : '#DC2626' }}>
                    {aptData.status === 'CONFIRMED' ? '✓ Đã xác nhận' : aptData.status === 'CANCELLED' ? '✗ Đã hủy' : aptData.status}
                  </Text>
                </View>
              )}
              {item.appointmentId && (
                <TouchableOpacity
                  style={{ marginTop: 8, backgroundColor: isMine ? '#CCFBF1' : '#F1F5F9', borderRadius: 6, paddingVertical: 6, alignItems: 'center' }}
                  onPress={() => {
                    setSelectedAptDetails(aptData);
                    setAptDetailsModalVisible(true);
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: isMine ? '#0D9488' : '#475569' }}>Xem chi tiết</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })()}

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
            <View style={{ width: 28 }}>
              {!isPrevSame && (
                <TouchableOpacity onPress={() => setProfileVisible(true)} activeOpacity={0.7}>
                  <Avatar
                    uri={item.senderAvatarUrl || peerAvatar}
                    name={item.senderName || peerName}
                    size={28}
                  />
                </TouchableOpacity>
              )}
            </View>
          )}

          <TouchableOpacity
            activeOpacity={0.9}
            onLongPress={() => onLongPressMessage(item)}
            style={{ maxWidth: '78%' }}
          >
            {isMine ? (
              (!isRecalled && ((item.type === 'IMAGE' && !item.content) || item.type === 'APPOINTMENT_CARD')) ? (
                <View style={[styles.bubble, styles.bubbleMine, { paddingHorizontal: 0, paddingVertical: 0, backgroundColor: 'transparent' }]}>
                  {bubbleBody}
                </View>
              ) : (
                <LinearGradient
                  colors={isRecalled ? ['#F1F5F9', '#F1F5F9'] : [Colors.secondary, Colors.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.bubble, { borderTopRightRadius: isNextSame ? 4 : 18, borderBottomRightRadius: isPrevSame ? 4 : 18 }]}
                >
                  {bubbleBody}
                </LinearGradient>
              )
            ) : (
              <View style={[
                styles.bubble, 
                styles.bubbleTheirs, 
                (!isRecalled && ((item.type === 'IMAGE' && !item.content) || item.type === 'APPOINTMENT_CARD')) ? { paddingHorizontal: 0, paddingVertical: 0, borderWidth: 0, backgroundColor: 'transparent' } : {},
                { borderTopLeftRadius: isNextSame ? 4 : 18, borderBottomLeftRadius: isPrevSame ? 4 : 18 }
              ]}>
                {bubbleBody}
              </View>
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

        {/* Bấm vào avatar hoặc tên để xem hồ sơ chi tiết */}
        <TouchableOpacity
          style={styles.headerPerson}
          activeOpacity={0.6}
          onPress={() => setProfileVisible(true)}
        >
          <Avatar uri={peerAvatar} name={peerName} size={38} showDot />

          <View style={{ flex: 1 }}>
            <View style={styles.headerNameRow}>
              <Text style={styles.headerName} numberOfLines={1}>
                {peerName ?? 'Cuộc trò chuyện'}
              </Text>
              <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
            </View>
            <Text style={styles.headerSub} numberOfLines={1}>
              {peerSkill || (realtime ? 'Đang hoạt động' : 'Chế độ ngoại tuyến')}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerBtn}
          onPress={openCreateAppointmentModal}
        >
          <Ionicons name="calendar-outline" size={23} color={Colors.primary} />
        </TouchableOpacity>
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

      {/* ── Modal Chi tiết lịch hẹn ────────────────────────────────────── */}
      <Modal visible={aptDetailsModalVisible} transparent animationType="slide">
        <View style={styles.overlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setAptDetailsModalVisible(false)} />
          <View style={styles.sheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.sheetTitle}>Thông tin chi tiết</Text>
            {selectedAptDetails && (
              <ScrollView style={{ marginTop: 16, maxHeight: 400 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 12 }}>
                  {selectedAptDetails.title || 'Lịch hẹn'}
                </Text>
                
                <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                  <Text style={{ flex: 1, color: Colors.textMuted, fontSize: 14 }}>Ngày hẹn:</Text>
                  <Text style={{ flex: 2, color: '#0F172A', fontSize: 14, fontWeight: '500' }}>{selectedAptDetails.date}</Text>
                </View>

                <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                  <Text style={{ flex: 1, color: Colors.textMuted, fontSize: 14 }}>Thời gian:</Text>
                  <Text style={{ flex: 2, color: '#0F172A', fontSize: 14, fontWeight: '500' }}>{selectedAptDetails.start?.slice(0,5)} - {selectedAptDetails.end?.slice(0,5)}</Text>
                </View>

                <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                  <Text style={{ flex: 1, color: Colors.textMuted, fontSize: 14 }}>Hình thức:</Text>
                  <Text style={{ flex: 2, color: '#0F172A', fontSize: 14, fontWeight: '500' }}>{selectedAptDetails.meetingType === 'ONLINE' ? 'Trực tuyến' : 'Trực tiếp'}</Text>
                </View>

                <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                  <Text style={{ flex: 1, color: Colors.textMuted, fontSize: 14 }}>{selectedAptDetails.meetingType === 'ONLINE' ? 'Link/Phòng:' : 'Địa điểm:'}</Text>
                  <Text style={{ flex: 2, color: '#0F172A', fontSize: 14, fontWeight: '500' }} selectable>{selectedAptDetails.locationOrLink || 'Chưa cung cấp'}</Text>
                </View>

                <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                  <Text style={{ flex: 1, color: Colors.textMuted, fontSize: 14 }}>Tín dụng:</Text>
                  <Text style={{ flex: 2, color: '#0F172A', fontSize: 14, fontWeight: '500' }}>{selectedAptDetails.timeCreditAmount} Time Credit</Text>
                </View>

                <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                  <Text style={{ flex: 1, color: Colors.textMuted, fontSize: 14 }}>Trạng thái:</Text>
                  <Text style={{ flex: 2, color: selectedAptDetails.status === 'CONFIRMED' ? '#15803D' : (selectedAptDetails.status === 'CANCELLED' ? '#DC2626' : '#0F172A'), fontSize: 14, fontWeight: '700' }}>
                    {selectedAptDetails.status === 'PENDING' ? 'Chờ xác nhận' :
                     selectedAptDetails.status === 'CONFIRMED' ? 'Đã xác nhận' :
                     selectedAptDetails.status === 'UPCOMING' ? 'Sắp diễn ra' :
                     selectedAptDetails.status === 'IN_PROGRESS' ? 'Đang diễn ra' :
                     selectedAptDetails.status === 'COMPLETED' ? 'Đã hoàn thành' :
                     selectedAptDetails.status === 'CANCELLED' ? 'Đã hủy' :
                     selectedAptDetails.status === 'DISPUTED' ? 'Đang tranh chấp' :
                     selectedAptDetails.status === 'RESCHEDULED' ? 'Đổi lịch' :
                     selectedAptDetails.status}
                  </Text>
                </View>
              </ScrollView>
            )}
            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={[styles.sheetBtn, styles.sheetBtnPrimary]}
                onPress={() => setAptDetailsModalVisible(false)}
              >
                <Text style={styles.sheetBtnPrimaryText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
                setProfileVisible(true);
              }}
            >
              <Ionicons name="person-outline" size={22} color={Colors.textPrimary} />
              <Text style={styles.menuText}>Xem hồ sơ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                openCreateAppointmentModal();
              }}
            >
              <Ionicons name="calendar" size={22} color={Colors.primary} />
              <Text style={[styles.menuText, { color: Colors.primary, fontWeight: '700' }]}>Tạo lịch hẹn mới</Text>
            </TouchableOpacity>
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

      {/* ── Bottom sheet: Đính kèm (Messenger style) ─────────────────────── */}
      <Modal visible={attachSheetVisible} transparent animationType="slide">
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setAttachSheetVisible(false)}
        >
          <View style={styles.sheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.sheetTitle}>📎 Thêm nội dung</Text>
            
            <View style={{ marginTop: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 20, justifyContent: 'center' }}>
              <TouchableOpacity style={styles.attachOption} onPress={() => { setAttachSheetVisible(false); sendImage(); }}>
                <View style={[styles.attachOptionIcon, { backgroundColor: '#E0F2FE' }]}>
                  <Ionicons name="image" size={26} color="#0284C7" />
                </View>
                <Text style={styles.attachOptionText}>Hình ảnh</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.attachOption} onPress={() => { setAttachSheetVisible(false); sendDocument(); }}>
                <View style={[styles.attachOptionIcon, { backgroundColor: '#F3E8FF' }]}>
                  <Ionicons name="document-text" size={26} color="#9333EA" />
                </View>
                <Text style={styles.attachOptionText}>Tài liệu</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.attachOption} onPress={() => { setAttachSheetVisible(false); sendLocation(); }}>
                <View style={[styles.attachOptionIcon, { backgroundColor: '#DCFCE7' }]}>
                  <Ionicons name="location" size={26} color="#16A34A" />
                </View>
                <Text style={styles.attachOptionText}>Vị trí</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.attachOption} onPress={() => { setAttachSheetVisible(false); setMeetingVisible(true); }}>
                <View style={[styles.attachOptionIcon, { backgroundColor: '#FFEDD5' }]}>
                  <Ionicons name="videocam" size={26} color="#EA580C" />
                </View>
                <Text style={styles.attachOptionText}>Phòng họp</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.attachOption} onPress={() => { setAttachSheetVisible(false); openCreateAppointmentModal(); }}>
                <View style={[styles.attachOptionIcon, { backgroundColor: '#FEF9C3' }]}>
                  <Ionicons name="calendar" size={26} color="#CA8A04" />
                </View>
                <Text style={styles.attachOptionText}>Lịch hẹn</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Modal Tùy chỉnh tin nhắn (Xóa, Thu hồi, Copy) ─────────────────── */}
      <Modal visible={!!messageActionMsg} transparent animationType="fade">
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setMessageActionMsg(null)}>
          <View style={styles.menuSheet}>
            <View style={styles.modalHandle} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                if (messageActionMsg?.content) {
                  Clipboard.setString(messageActionMsg.content);
                  Alert.alert('Đã sao chép');
                }
                setMessageActionMsg(null);
              }}
            >
              <Ionicons name="copy-outline" size={22} color={Colors.textPrimary} />
              <Text style={styles.menuText}>Sao chép nội dung</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={async () => {
                const msgId = messageActionMsg?.id;
                setMessageActionMsg(null);
                if (!msgId) return;
                try {
                  await ChatApi.deleteMessageForMe(msgId);
                  hiddenMsgIds.current.add(msgId); // Lưu local — Firebase listener sẽ lọc bỏ
                  setMessages(prev => prev.filter(m => m.id !== msgId));
                } catch (e) {
                  Alert.alert('Lỗi', 'Không thể xóa tin nhắn.');
                }
              }}
            >
              <Ionicons name="trash-bin-outline" size={22} color={Colors.textPrimary} />
              <Text style={styles.menuText}>Xóa ở phía tôi</Text>
            </TouchableOpacity>

            {messageActionMsg?.senderId === user?.id && !(messageActionMsg?.isRecalled || messageActionMsg?.recalled) && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={async () => {
                  const msgId = messageActionMsg?.id;
                  setMessageActionMsg(null);
                  if (!msgId) return;
                  try {
                    await ChatApi.recallMessage(msgId);
                    recalledMsgIds.current.add(msgId); // Lưu local — Firebase listener sẽ áp dụng
                    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isRecalled: true, content: 'Tin nhắn đã bị thu hồi' } : m));
                  } catch (e: any) {
                    Alert.alert('Lỗi', e?.response?.data?.message || 'Không thể thu hồi tin nhắn.');
                  }
                }}
              >
                <Ionicons name="arrow-undo-outline" size={22} color={Colors.danger} />
                <Text style={[styles.menuText, { color: Colors.danger }]}>Thu hồi tin nhắn</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Modal Đặt lịch (Appointment Modal) ───────────────────────────────── */}
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

      {/* ── Hồ sơ người đang trò chuyện ────────────────────────── */}
      <UserProfileSheet
        visible={profileVisible}
        userId={peerId}
        onClose={() => setProfileVisible(false)}
      />

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

      {/* ── Bottom sheet: Tạo Lịch Hẹn Nhanh ─────────────────────── */}
      <Modal visible={aptModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.sheet, { maxHeight: '90%', paddingBottom: 24 }]}>
            <View style={styles.modalHandle} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <Text style={styles.sheetTitle}>🗓️ Đề xuất lịch hẹn</Text>
              <TouchableOpacity onPress={() => setAptModalVisible(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={22} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={styles.sheetDesc}>Điền thông tin bên dưới, người kia sẽ thấy và có thể phản hồi trong chat</Text>

            <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 4 }}>Tiêu đề *</Text>
            <TextInput
              style={[styles.sheetInput, { marginBottom: 12 }]}
              placeholder="VD: Học lập trình Java buổi 1..."
              placeholderTextColor={Colors.textMuted}
              value={aptTitle}
              onChangeText={setAptTitle}
            />

            {/* Chọn Ngày */}
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 }}>Ngày hẹn *</Text>
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
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 }}>Số Time Credit (1 TC = 1 giờ) *</Text>
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

            {/* Chọn Khung Giờ */}
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 }}>Khung giờ bắt đầu *</Text>
            <TouchableOpacity
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10,
                borderWidth: 1.5, borderColor: '#0D9488', backgroundColor: '#F0FDFA', marginBottom: 8
              }}
              onPress={() => setPickerMode('time')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="time-outline" size={20} color="#0D9488" style={{ marginRight: 10 }} />
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#0F172A' }}>{aptStart || 'Chọn giờ'}</Text>
              </View>
              <Ionicons name="chevron-down" size={20} color="#0D9488" />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDFA', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#CCFBF1', marginBottom: 12 }}>
              <Ionicons name="time" size={16} color="#0D9488" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 12, color: '#0F172A' }}>
                Khung giờ: <Text style={{ fontWeight: 'bold', color: '#0D9488' }}>{aptStart} ➔ {aptEnd}</Text> ({aptCredit} TC)
              </Text>
            </View>

            {/* Chọn Hình Thức */}
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 }}>Hình thức gặp mặt *</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              {(['ONLINE', 'OFFLINE'] as const).map((fmt) => {
                const active = aptFormat === fmt;
                return (
                  <TouchableOpacity
                    key={fmt}
                    style={{
                      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                      paddingVertical: 10, borderRadius: 10, gap: 6,
                      borderWidth: 1.5, borderColor: active ? '#0D9488' : '#E2E8F0',
                      backgroundColor: active ? '#F0FDFA' : '#F8FAFC',
                    }}
                    onPress={() => {
                      setAptFormat(fmt);
                      setAptLocation('');
                    }}
                  >
                    <Ionicons name={fmt === 'ONLINE' ? 'videocam-outline' : 'location-outline'} size={16} color={active ? '#0D9488' : '#64748B'} />
                    <Text style={{ fontSize: 13, fontWeight: '600', color: active ? '#0D9488' : '#64748B' }}>
                      {fmt === 'ONLINE' ? 'Trực tuyến' : 'Trực tiếp'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Link họp / Địa điểm */}
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 }}>
              {aptFormat === 'ONLINE' ? '🔗 Link họp *' : '📍 Địa điểm gặp mặt'}
            </Text>
            <TextInput
              style={[styles.sheetInput, { marginBottom: aptFormat === 'OFFLINE' ? 8 : 16 }]}
              placeholder={aptFormat === 'ONLINE' ? 'https://meet.google.com/...' : 'Nhà sách, quán café, trường... (không bắt buộc)'}
              placeholderTextColor={Colors.textMuted}
              value={aptLocation}
              onChangeText={setAptLocation}
              autoCapitalize="none"
              keyboardType={aptFormat === 'ONLINE' ? 'url' : 'default'}
            />
            {aptFormat === 'OFFLINE' && (
              <TouchableOpacity 
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0FDFA', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#0D9488', marginBottom: 16 }}
                onPress={() => setMapPickerVisible(true)}
              >
                <Ionicons name="map-outline" size={18} color="#0D9488" style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#0D9488' }}>Chọn trên bản đồ</Text>
              </TouchableOpacity>
            )}


            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={[styles.sheetBtn, styles.sheetBtnGhost]}
                onPress={() => setAptModalVisible(false)}
              >
                <Text style={styles.sheetBtnGhostText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sheetBtn, styles.sheetBtnPrimary, creatingApt && { opacity: 0.6 }]}
                onPress={submitCreateAppointment}
                disabled={creatingApt}
              >
                {creatingApt ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.sheetBtnPrimaryText}>Xác nhận tạo</Text>
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

        {/* Map Picker Modal (Bên trong Modal Lịch hẹn để không bị đè) */}
        <MapPickerModal 
          visible={mapPickerVisible}
          onClose={() => setMapPickerVisible(false)}
          onSelect={(address) => setAptLocation(address)}
        />
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
  headerPerson: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9 },
  headerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  headerName: { fontSize: 15, fontWeight: '700', color: '#0F172A', flexShrink: 1 },
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
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
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

  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 16, alignItems: 'center' },
  sheetBtn: { flex: 1, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
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

  // Attachment Bottom Sheet
  attachOption: { alignItems: 'center', width: 70 },
  attachOptionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  attachOptionText: { fontSize: 12, color: '#334155', fontWeight: '500' }
});
