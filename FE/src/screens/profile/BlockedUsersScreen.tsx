import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ChatApi from '@api/chat';
import { ProfilePage } from '@components/ProfilePage';
import { Colors, Radius, Spacing } from '@constants/Colors';
import type { BlockedUser } from '@types';

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export default function BlockedUsersScreen() {
  const [items, setItems] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  const loadBlockedUsers = useCallback(async () => {
    try {
      setError('');
      const response = await ChatApi.getBlockedUsers();
      setItems(response.data?.data ?? []);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message ?? 'Không thể tải danh sách người dùng đã chặn.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void loadBlockedUsers();
  }, [loadBlockedUsers]));

  const confirmUnblock = (item: BlockedUser) => {
    Alert.alert(
      'Bỏ chặn người dùng',
      `Bạn có muốn cho phép ${item.fullName} gửi lời mời và nhắn tin lại không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Bỏ chặn',
          onPress: async () => {
            try {
              setUnblockingId(item.userId);
              await ChatApi.unblockUser(item.userId);
              setItems(current => current.filter(blocked => blocked.userId !== item.userId));
            } catch (requestError: any) {
              Alert.alert(
                'Không thể bỏ chặn',
                requestError?.response?.data?.message ?? 'Vui lòng thử lại sau.'
              );
            } finally {
              setUnblockingId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <ProfilePage title="Người dùng đã chặn">
      <Text style={styles.description}>
        Người bị chặn không thể gửi lời mời hoặc tin nhắn mới cho bạn. Lịch hẹn đã tạo trước đó
        không tự động bị hủy.
      </Text>

      {loading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.stateText}>Đang tải danh sách...</Text>
        </View>
      ) : error ? (
        <View style={styles.stateBox}>
          <Ionicons name="cloud-offline-outline" size={42} color={Colors.textMuted} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => void loadBlockedUsers()}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.stateBox}>
          <View style={styles.emptyIcon}>
            <Ionicons name="shield-checkmark-outline" size={38} color={Colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Chưa chặn ai</Text>
          <Text style={styles.stateText}>Những người bạn chặn trong cuộc trò chuyện sẽ xuất hiện ở đây.</Text>
        </View>
      ) : (
        items.map(item => (
          <View key={item.id} style={styles.userCard}>
            {item.avatarUrl ? (
              <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarLetter}>{item.fullName?.charAt(0).toUpperCase() || '?'}</Text>
              </View>
            )}
            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>{item.fullName}</Text>
              {item.reason ? <Text style={styles.reason} numberOfLines={2}>Lý do: {item.reason}</Text> : null}
              <Text style={styles.date}>Đã chặn {formatDate(item.blockedAt)}</Text>
            </View>
            <TouchableOpacity
              style={styles.unblockButton}
              onPress={() => confirmUnblock(item)}
              disabled={unblockingId === item.userId}
            >
              {unblockingId === item.userId ? (
                <ActivityIndicator size="small" color={Colors.secondary} />
              ) : (
                <Text style={styles.unblockText}>Bỏ chặn</Text>
              )}
            </TouchableOpacity>
          </View>
        ))
      )}
    </ProfilePage>
  );
}

const styles = StyleSheet.create({
  description: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: Spacing.md,
  },
  stateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    minHeight: 230,
  },
  stateText: { color: Colors.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 20, marginTop: 10 },
  errorText: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 12 },
  retryButton: { marginTop: Spacing.md, paddingHorizontal: 18, paddingVertical: 10, borderRadius: Radius.md, backgroundColor: '#ECFDF5' },
  retryText: { color: Colors.secondary, fontWeight: '700' },
  emptyIcon: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ECFDF5' },
  emptyTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700', marginTop: 14 },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: 12,
    marginBottom: 10,
  },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3E8FF' },
  avatarLetter: { color: '#7C3AED', fontSize: 19, fontWeight: '800' },
  userInfo: { flex: 1, paddingRight: 8 },
  userName: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700' },
  reason: { color: Colors.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 3 },
  date: { color: Colors.textMuted, fontSize: 11, marginTop: 3 },
  unblockButton: { minWidth: 75, minHeight: 38, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.md, backgroundColor: '#ECFDF5', paddingHorizontal: 10 },
  unblockText: { color: Colors.secondary, fontSize: 13, fontWeight: '700' },
});
