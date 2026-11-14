import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetwork } from '../offline/NetworkContext';
import { useTheme } from '../theme/ThemeContext';

export const OfflineBanner: React.FC = () => {
  const { isOffline, isSyncing, pendingSyncCount, syncNow } = useNetwork();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Khi đang trực tuyến bình thường và không có tác vụ nào chờ đồng bộ thì ẩn hoàn toàn
  if (!isOffline && !isSyncing && pendingSyncCount === 0) {
    return null;
  }

  // Vị trí nổi thông minh phía trên thanh Tab Bar đáy màn hình (tránh 100% va chạm với tiêu đề/tai thỏ ở trên đỉnh)
  const bottomPosition = Math.max(insets.bottom, 16) + 62;

  // 1. Chế độ đang đồng bộ dữ liệu khi vừa có mạng lại
  if (isSyncing) {
    return (
      <View
        pointerEvents="box-none"
        style={[styles.floatingWrapper, { bottom: bottomPosition }]}
      >
        <View
          style={[
            styles.pill,
            {
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.96)' : 'rgba(239, 246, 255, 0.98)',
              borderColor: colors.primary,
            },
          ]}
        >
          <ActivityIndicator size="small" color={colors.primary} style={styles.icon} />
          <Text style={[styles.text, { color: colors.primary }]}>
            Đang đồng bộ dữ liệu...
          </Text>
        </View>
      </View>
    );
  }

  // 2. Chế độ ngoại tuyến (Offline)
  if (isOffline) {
    return (
      <View
        pointerEvents="box-none"
        style={[styles.floatingWrapper, { bottom: bottomPosition }]}
      >
        <View
          style={[
            styles.pill,
            {
              backgroundColor: isDark ? 'rgba(69, 26, 3, 0.95)' : 'rgba(254, 243, 199, 0.98)',
              borderColor: isDark ? '#B45309' : '#F59E0B',
            },
          ]}
        >
          <Ionicons name="cloud-offline" size={15} color="#D97706" style={styles.icon} />
          <Text style={[styles.text, { color: isDark ? '#FDE68A' : '#92400E' }]}>
            Đang ngoại tuyến • Dữ liệu trong máy
          </Text>
          {pendingSyncCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingSyncCount}</Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  // 3. Có mạng nhưng còn thao tác ngoại tuyến đang chờ gửi
  if (pendingSyncCount > 0) {
    return (
      <View
        pointerEvents="box-none"
        style={[styles.floatingWrapper, { bottom: bottomPosition }]}
      >
        <TouchableOpacity
          onPress={syncNow}
          activeOpacity={0.8}
          style={[
            styles.pill,
            {
              backgroundColor: isDark ? 'rgba(20, 83, 45, 0.95)' : 'rgba(220, 252, 231, 0.98)',
              borderColor: '#16A34A',
            },
          ]}
        >
          <Ionicons name="cloud-upload-outline" size={15} color="#16A34A" style={styles.icon} />
          <Text style={[styles.text, { color: isDark ? '#86EFAC' : '#15803D' }]}>
            Có mạng lại • Bấm để đồng bộ {pendingSyncCount} tác vụ
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 99999,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
    maxWidth: '90%',
  },
  icon: {
    marginRight: 7,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  badge: {
    marginLeft: 8,
    backgroundColor: '#D97706',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10.5,
    fontWeight: '800',
  },
});
