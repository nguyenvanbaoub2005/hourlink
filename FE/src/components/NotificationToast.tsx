import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity,
  PanResponder, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useNotificationStore } from '@store/notificationStore';
import NotificationApi from '@api/notification';
import { useAuthStore } from '@store/authStore';

const SCREEN_WIDTH = Dimensions.get('window').width;
const TOAST_DURATION = 4500; // ms hiển thị tự động

type ToastData = {
  title: string;
  body: string;
  type: string;
};

const TYPE_ICON: Record<string, { icon: string; color: string; bg: string }> = {
  INVITATION_RECEIVED:    { icon: 'mail-unread-outline',      color: '#0284C7', bg: '#E0F2FE' },
  INVITATION_ACCEPTED:    { icon: 'checkmark-circle-outline', color: '#15803D', bg: '#DCFCE7' },
  INVITATION_REJECTED:    { icon: 'close-circle-outline',     color: '#DC2626', bg: '#FEE2E2' },
  INVITATION_RESCHEDULED: { icon: 'calendar-outline',         color: '#2563EB', bg: '#EFF6FF' },
  INVITATION_CANCELLED:   { icon: 'ban-outline',              color: '#64748B', bg: '#F1F5F9' },
  APPOINTMENT_REMINDER:   { icon: 'alarm-outline',            color: '#D97706', bg: '#FEF3C7' },
  NEW_RATING:             { icon: 'star-outline',             color: '#9333EA', bg: '#F3E8FF' },
};

/**
 * NotificationToast — Banner thông báo nổi hiển thị khi có thông báo mới.
 * Đặt ở root layout để hoạt động trên toàn bộ màn hình.
 */
export default function NotificationToast() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { unreadCount, setUnreadCount } = useNotificationStore();

  const [toast, setToast] = useState<ToastData | null>(null);
  const [visible, setVisible] = useState(false);

  const slideY   = useRef(new Animated.Value(-120)).current;
  const opacity  = useRef(new Animated.Value(0)).current;
  const prevCount = useRef(0);
  const lastSeenId = useRef<string | null>(null);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset khi đổi tài khoản hoặc đăng xuất
  useEffect(() => {
    lastSeenId.current = null;
    prevCount.current = 0;
  }, [user?.email, isAuthenticated]);

  // ── Poll thông báo (mỗi 10s) ───────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;

    const poll = async () => {
      try {
        const res = await NotificationApi.getAll();
        const data: any[] = res.data?.data ?? [];
        const count = data.filter((n: any) => !n.isRead).length;

        // Tìm thông báo mới nhất chưa đọc
        const newest = data.find((n: any) => !n.isRead);
        if (newest) {
          // Hiển thị toast nếu:
          // 1) Là thông báo chưa đọc mới (ID khác lần trước, bao gồm cả khi vừa đổi acc/đăng nhập vào thấy có thông báo)
          // 2) Hoặc số lượng thông báo tăng lên
          if (newest.id !== lastSeenId.current || count > prevCount.current) {
            showToast({
              title: newest.title,
              body: newest.body,
              type: newest.type,
            });
            lastSeenId.current = newest.id;
          }
        }

        prevCount.current = count;
        setUnreadCount(count);
      } catch {
        // Bỏ qua lỗi polling
      }
    };

    // Poll ngay lần đầu
    poll();
    const id = setInterval(poll, 10000); // 10s để phản hồi cực nhanh như tin nhắn
    return () => clearInterval(id);
  }, [isAuthenticated, user?.email]);

  // ── Hiện toast ─────────────────────────────────────────────────────────────
  const showToast = (data: ToastData) => {
    setToast(data);
    setVisible(true);

    // Reset animation
    slideY.setValue(-120);
    opacity.setValue(0);

    Animated.parallel([
      Animated.spring(slideY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 9,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();

    // Tự động ẩn sau TOAST_DURATION
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    dismissTimer.current = setTimeout(() => dismiss(), TOAST_DURATION);
  };

  // ── Ẩn toast ───────────────────────────────────────────────────────────────
  const dismiss = () => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    Animated.parallel([
      Animated.timing(slideY, {
        toValue: -120,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      setToast(null);
    });
  };

  // ── Swipe up để dismiss ────────────────────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5 && g.dy < 0,
      onPanResponderMove: (_, g) => {
        if (g.dy < 0) slideY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy < -30) {
          dismiss();
        } else {
          Animated.spring(slideY, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  if (!visible || !toast) return null;

  const cfg = TYPE_ICON[toast.type] ?? { icon: 'notifications-outline', color: '#10B981', bg: '#D1FAE5' };

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateY: slideY }], opacity }]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity
        style={styles.toast}
        activeOpacity={0.92}
        onPress={() => {
          dismiss();
          if (toast.type.startsWith('INVITATION_')) {
            router.push('/notifications' as any);
          }
        }}
      >
        {/* Icon */}
        <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon as any} size={22} color={cfg.color} />
        </View>

        {/* Text */}
        <View style={styles.textWrap}>
          <Text style={styles.toastTitle} numberOfLines={1}>{toast.title}</Text>
          <Text style={styles.toastBody} numberOfLines={2}>{toast.body}</Text>
        </View>

        {/* Close */}
        <TouchableOpacity style={styles.closeBtn} onPress={dismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={18} color="#94A3B8" />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Progress bar */}
      <View style={styles.progressBarBg}>
        <Animated.View style={[styles.progressBar, { backgroundColor: cfg.color }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 52,   // Bên dưới status bar
    left: 12,
    right: 12,
    zIndex: 9999,
    elevation: 20,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 13,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  textWrap: { flex: 1 },
  toastTitle: {
    fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 2,
  },
  toastBody: {
    fontSize: 13, color: '#64748B', lineHeight: 18,
  },
  closeBtn: { marginLeft: 8, padding: 2 },
  progressBarBg: {
    height: 3, backgroundColor: '#E2E8F0',
    borderBottomLeftRadius: 4, borderBottomRightRadius: 4,
    marginHorizontal: 8, marginTop: -1, overflow: 'hidden',
  },
  progressBar: { height: '100%', width: '100%', borderRadius: 4 },
});
