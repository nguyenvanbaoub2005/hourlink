import { useRouter } from 'expo-router';
import { InfoCard, ProfilePage, SettingsGroup, SettingsRow } from '@components/ProfilePage';

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <ProfilePage title="Quyền riêng tư">
      <InfoCard icon="shield-checkmark-outline" title="Bạn kiểm soát thông tin của mình" tone="blue">
        Email, số điện thoại và ngày sinh không hiển thị trên hồ sơ công khai. Bạn có thể chỉnh sửa
        hồ sơ, chặn tương tác và gửi báo cáo ngay trong ứng dụng.
      </InfoCard>

      <SettingsGroup title="Kiểm soát của bạn">
        <SettingsRow
          icon="person-outline"
          title="Chỉnh sửa hồ sơ"
          subtitle="Cập nhật thông tin người khác có thể nhìn thấy"
          onPress={() => router.push('/profile/edit' as any)}
        />
        <SettingsRow
          icon="ban-outline"
          iconColor="#7C3AED"
          iconBackground="#F5F3FF"
          title="Người dùng đã chặn"
          subtitle="Chặn ngăn lời mời và tin nhắn mới giữa hai bên"
          onPress={() => router.push('/profile/blocked-users' as any)}
        />
        <SettingsRow
          icon="alert-circle-outline"
          iconColor="#DC2626"
          iconBackground="#FEF2F2"
          title="Báo cáo của tôi"
          subtitle="Theo dõi trạng thái nội dung đã báo cáo"
          onPress={() => router.push('/report/my-reports' as any)}
        />
      </SettingsGroup>

      <SettingsGroup title="Thông tin dữ liệu">
        <SettingsRow
          icon="shield-checkmark-outline"
          iconColor="#2563EB"
          iconBackground="#EFF6FF"
          title="Chính sách quyền riêng tư"
          subtitle="Dữ liệu được xử lý và các lựa chọn hiện có"
          onPress={() => router.push('/legal/privacy' as any)}
        />
      </SettingsGroup>

      <InfoCard icon="information-circle-outline" title="Về cài đặt quyền riêng tư" tone="amber">
        Hiện bạn có thể chỉnh sửa hồ sơ, chặn tương tác và gửi báo cáo. Tùy chọn ẩn toàn bộ hồ sơ
        hoặc tự động xóa tài khoản chưa có trong phiên bản này.
      </InfoCard>
    </ProfilePage>
  );
}
