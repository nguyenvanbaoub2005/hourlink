import { Alert, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing } from '@constants/Colors';
import { ProfilePage, SettingsGroup, SettingsRow } from '@components/ProfilePage';
import { useAuthStore } from '@store/authStore';

export default function SettingsScreen() {
  const router = useRouter();
  const logout = useAuthStore(state => state.logout);

  const confirmLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất khỏi HourLink?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: () => void logout() },
    ]);
  };

  return (
    <ProfilePage title="Cài đặt">
      <SettingsGroup title="Tài khoản">
        <SettingsRow
          icon="person-outline"
          title="Chỉnh sửa hồ sơ"
          subtitle="Tên, ảnh đại diện và thông tin giới thiệu"
          onPress={() => router.push('/profile/edit' as any)}
        />
        <SettingsRow
          icon="lock-closed-outline"
          iconColor="#2563EB"
          iconBackground="#EFF6FF"
          title="Bảo mật"
          subtitle="Đổi mật khẩu đăng nhập"
          onPress={() => router.push('/profile/security' as any)}
        />
        <SettingsRow
          icon="ban-outline"
          iconColor="#7C3AED"
          iconBackground="#F5F3FF"
          title="Người dùng đã chặn"
          subtitle="Xem và quản lý danh sách chặn"
          onPress={() => router.push('/profile/blocked-users' as any)}
        />
      </SettingsGroup>

      <SettingsGroup title="Ứng dụng">
        <SettingsRow
          icon="notifications-outline"
          iconColor="#EA580C"
          iconBackground="#FFF7ED"
          title="Thông báo"
          subtitle="Xem thông báo và đánh dấu đã đọc"
          onPress={() => router.push('/notifications' as any)}
        />
        <SettingsRow
          icon="eye-off-outline"
          iconColor="#475569"
          iconBackground="#F1F5F9"
          title="Quyền riêng tư"
          subtitle="Dữ liệu công khai và kiểm soát tương tác"
          onPress={() => router.push('/profile/privacy' as any)}
        />
      </SettingsGroup>

      <SettingsGroup title="Hỗ trợ & pháp lý">
        <SettingsRow
          icon="help-circle-outline"
          title="Trợ giúp & FAQ"
          onPress={() => router.push('/profile/help' as any)}
        />
        <SettingsRow
          icon="shield-checkmark-outline"
          iconColor="#2563EB"
          iconBackground="#EFF6FF"
          title="Chính sách quyền riêng tư"
          onPress={() => router.push('/legal/privacy' as any)}
        />
        <SettingsRow
          icon="document-text-outline"
          iconColor="#475569"
          iconBackground="#F1F5F9"
          title="Điều khoản dịch vụ"
          onPress={() => router.push('/legal/terms' as any)}
        />
      </SettingsGroup>

      <SettingsGroup>
        <SettingsRow
          icon="log-out-outline"
          iconBackground="#FEF2F2"
          title="Đăng xuất"
          danger
          onPress={confirmLogout}
          showChevron={false}
        />
      </SettingsGroup>

      <Text style={styles.version}>HourLink · Phiên bản 1.0.0</Text>
    </ProfilePage>
  );
}

const styles = StyleSheet.create({
  version: {
    color: Colors.textMuted,
    textAlign: 'center',
    fontSize: 12,
    marginTop: -Spacing.sm,
  },
});
