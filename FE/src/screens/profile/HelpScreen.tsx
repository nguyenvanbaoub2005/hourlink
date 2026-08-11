import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { InfoCard, ProfilePage, SettingsGroup, SettingsRow } from '@components/ProfilePage';
import { Colors, Radius, Spacing } from '@constants/Colors';

const FAQS = [
  {
    question: 'Time Credit là gì?',
    answer: 'Time Credit ghi nhận thời gian bạn đã hỗ trợ cộng đồng. Credit dùng để tham gia các buổi trao đổi trong HourLink và không phải tiền mặt.',
  },
  {
    question: 'Làm sao tạo một lịch hẹn?',
    answer: 'Bạn có thể gửi lời mời từ hồ sơ hoặc yêu cầu hỗ trợ. Khi lời mời được chấp nhận, hai bên có thể tạo và thống nhất ngày giờ trong phần Lời mời hoặc cuộc trò chuyện.',
  },
  {
    question: 'Khi nào Time Credit được chuyển?',
    answer: 'Credit được xử lý sau khi buổi học được xác nhận hoàn thành. Hãy kiểm tra thời lượng thực tế và nội dung trao đổi trước khi xác nhận.',
  },
  {
    question: 'Tôi có thể hủy lịch hẹn không?',
    answer: 'Có. Hãy hủy từ chi tiết lịch hẹn, nhập lý do rõ ràng và thực hiện càng sớm càng tốt để người còn lại chủ động sắp xếp.',
  },
  {
    question: 'Làm sao báo cáo hoặc chặn người dùng?',
    answer: 'Mở cuộc trò chuyện, chọn menu ở góc trên để chặn hoặc báo cáo tin nhắn vi phạm. Báo cáo có thể kèm mô tả và bằng chứng để quản trị viên xử lý.',
  },
  {
    question: 'Minh chứng hoạt động cộng đồng dùng để làm gì?',
    answer: 'Người tham gia có thể gửi ảnh minh chứng sau khi đăng ký. Tổ chức xem minh chứng, xác nhận tham gia và số giờ đóng góp trước khi hệ thống cộng Credit.',
  },
  {
    question: 'Ứng dụng không tải được dữ liệu thì làm gì?',
    answer: 'Hãy kiểm tra kết nối mạng, kéo để làm mới màn hình và đăng nhập lại nếu phiên đã hết hạn. Nếu lỗi vẫn còn, ghi lại thao tác và ảnh lỗi để gửi cho nhóm HourLink.',
  },
];

export default function HelpScreen() {
  const router = useRouter();
  const [expanded, setExpanded] = useState<number | null>(0);

  return (
    <ProfilePage title="Trợ giúp & FAQ">
      <InfoCard icon="help-buoy-outline" title="Bạn cần hỗ trợ?">
        Xem các câu hỏi thường gặp bên dưới. Với nội dung vi phạm, hãy dùng chức năng Báo cáo để
        trạng thái xử lý được lưu và theo dõi trong ứng dụng.
      </InfoCard>

      <Text style={styles.heading}>Câu hỏi thường gặp</Text>
      <View style={styles.faqList}>
        {FAQS.map((item, index) => {
          const isOpen = expanded === index;
          return (
            <TouchableOpacity
              key={item.question}
              style={styles.faqItem}
              onPress={() => setExpanded(isOpen ? null : index)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityState={{ expanded: isOpen }}
            >
              <View style={styles.questionRow}>
                <Text style={styles.question}>{item.question}</Text>
                <Ionicons
                  name={isOpen ? 'chevron-up' : 'chevron-down'}
                  size={19}
                  color={Colors.textMuted}
                />
              </View>
              {isOpen ? <Text style={styles.answer}>{item.answer}</Text> : null}
            </TouchableOpacity>
          );
        })}
      </View>

      <SettingsGroup title="Liên kết hữu ích">
        <SettingsRow
          icon="alert-circle-outline"
          iconColor="#DC2626"
          iconBackground="#FEF2F2"
          title="Báo cáo của tôi"
          subtitle="Xem trạng thái các báo cáo đã gửi"
          onPress={() => router.push('/report/my-reports' as any)}
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

      <Text style={styles.contact}>Liên hệ: contact@hourlink.vn</Text>
    </ProfilePage>
  );
}

const styles = StyleSheet.create({
  heading: { color: Colors.textPrimary, fontSize: 17, fontWeight: '700', marginBottom: 10 },
  faqList: { marginBottom: Spacing.lg },
  faqItem: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: 9,
  },
  questionRow: { flexDirection: 'row', alignItems: 'center' },
  question: { flex: 1, color: Colors.textPrimary, fontSize: 15, fontWeight: '600', paddingRight: 8 },
  answer: { color: Colors.textSecondary, fontSize: 14, lineHeight: 21, marginTop: 10 },
  contact: { color: Colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: -Spacing.sm },
});
