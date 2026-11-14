import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetwork } from '../offline/NetworkContext';
import { useTheme } from '../theme/ThemeContext';

export const OfflineBanner: React.FC = () => {
  const { isOffline, isSyncing, pendingSyncCount, syncNow } = useNetwork();
  const { colors, isDark } = useTheme();

  if (!isOffline && !isSyncing && pendingSyncCount === 0) {
    return null;
  }

  // Chế độ đang đồng bộ khi vừa có mạng
  if (isSyncing) {
    return (
      <View style={[styles.banner, { backgroundColor: isDark ? '#1E293B' : '#EFF6FF', borderColor: colors.primary }]}>
        <ActivityIndicator size="small" color={colors.primary} style={styles.icon} />
        <Text style={[styles.text, { color: colors.primary }]}>
          Đang đồng bộ {pendingSyncCount > 0 ? `${pendingSyncCount} tác vụ` : 'dữ liệu'} lên máy chủ...
        </Text>
      </View>
    );
  }

  // Chế độ ngoại tuyến (Offline)
  if (isOffline) {
    return (
      <View style={[styles.banner, { backgroundColor: isDark ? '#451A03' : '#FEF3C7', borderColor: '#F59E0B' }]}>
        <Ionicons name="cloud-offline" size={18} color="#D97706" style={styles.icon} />
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: isDark ? '#FDE68A' : '#92400E' }]}>
            Đang ngoại tuyến (Offline Mode)
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? '#FCD34D' : '#B45309' }]}>
            Dữ liệu đang được đọc trực tiếp từ SQLite cục bộ.
            {pendingSyncCount > 0 ? ` Có ${pendingSyncCount} thao tác đang đợi gửi khi có mạng.` : ''}
          </Text>
        </View>
      </View>
    );
  }

  // Có mạng nhưng còn tác vụ trong hàng đợi cần sync
  if (pendingSyncCount > 0) {
    return (
      <TouchableOpacity
        onPress={syncNow}
        activeOpacity={0.8}
        style={[styles.banner, { backgroundColor: isDark ? '#14532D' : '#DCFCE7', borderColor: '#16A34A' }]}
      >
        <Ionicons name="cloud-upload-outline" size={18} color="#16A34A" style={styles.icon} />
        <Text style={[styles.text, { color: isDark ? '#86EFAC' : '#15803D' }]}>
          Đã có mạng lại. Bấm vào đây để đồng bộ {pendingSyncCount} thao tác!
        </Text>
      </TouchableOpacity>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    zIndex: 9999,
  },
  icon: {
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
});
