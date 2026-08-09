import LegalDocumentScreen, { LegalSection } from '@components/LegalDocumentScreen';

const SECTIONS: LegalSection[] = [
  {
    title: 'Dữ liệu HourLink xử lý',
    bullets: [
      'Thông tin tài khoản và hồ sơ như họ tên, email, số điện thoại, ảnh đại diện, ngày sinh, khu vực, nghề nghiệp, giới thiệu và ngôn ngữ.',
      'Kỹ năng, yêu cầu hỗ trợ, lời mời, lịch hẹn, xác nhận hoàn thành, đánh giá, báo cáo và lịch sử Time Credit.',
      'Tin nhắn cùng ảnh, tài liệu, vị trí, đường dẫn phòng họp hoặc thông tin lịch hẹn mà bạn chủ động gửi.',
      'Dữ liệu cần thiết để đăng nhập, bảo vệ phiên làm việc và gửi thông báo trong ứng dụng.',
    ],
  },
  {
    title: 'Quyền trên thiết bị',
    paragraphs: [
      'HourLink chỉ yêu cầu camera, thư viện ảnh hoặc vị trí khi bạn dùng tính năng tương ứng như quét mã, chọn ảnh, gửi minh chứng hay chia sẻ địa điểm. Bạn có thể từ chối hoặc thay đổi quyền trong cài đặt thiết bị, nhưng tính năng liên quan có thể không hoạt động.',
    ],
  },
  {
    title: 'Mục đích sử dụng',
    bullets: [
      'Tạo và vận hành tài khoản, hồ sơ, lịch hẹn, chat, hoạt động cộng đồng và ví Time Credit.',
      'Ghép cặp, hiển thị gợi ý phù hợp và giúp hai bên phối hợp buổi hỗ trợ.',
      'Gửi thông báo, xử lý báo cáo, ngăn lạm dụng và cải thiện độ ổn định của ứng dụng.',
    ],
  },
  {
    title: 'Thông tin công khai và riêng tư',
    paragraphs: [
      'Hồ sơ người khác có thể thấy gồm tên, ảnh, giới thiệu, khu vực chung, nghề nghiệp, ngôn ngữ, kỹ năng đang hiển thị, huy hiệu và chỉ số uy tín. Email, số điện thoại và ngày sinh không được đưa vào hồ sơ công khai. Nội dung bạn gửi trong chat hoặc lịch hẹn được chia sẻ với những người tham gia liên quan.',
    ],
  },
  {
    title: 'Dịch vụ hỗ trợ vận hành',
    paragraphs: [
      'HourLink sử dụng các dịch vụ kỹ thuật để lưu tệp, đồng bộ chat thời gian thực, bản đồ, mã QR và gợi ý tự động. Dữ liệu cần thiết có thể được chuyển tới các nhà cung cấp như Cloudinary, Firebase, dịch vụ OpenStreetMap/Nominatim hoặc dịch vụ AI khi bạn sử dụng tính năng tương ứng.',
    ],
  },
  {
    title: 'Lưu trữ và bảo mật',
    paragraphs: [
      'Mật khẩu được lưu dưới dạng mã băm và token đăng nhập được lưu bằng cơ chế bảo mật của thiết bị. HourLink áp dụng các biện pháp kỹ thuật phù hợp, nhưng không hệ thống nào có thể bảo đảm an toàn tuyệt đối. Dữ liệu được giữ trong thời gian cần thiết để vận hành, giải quyết tranh chấp và đáp ứng nghĩa vụ liên quan.',
    ],
  },
  {
    title: 'Lựa chọn của bạn',
    bullets: [
      'Xem và chỉnh sửa thông tin hồ sơ đang được hỗ trợ trong mục Cá nhân.',
      'Chặn hoặc bỏ chặn người dùng để kiểm soát tương tác mới.',
      'Báo cáo nội dung vi phạm kèm bằng chứng để được xem xét.',
      'Liên hệ HourLink nếu cần hỏi về dữ liệu; bản hiện tại chưa có tính năng tự động xuất hoặc xóa toàn bộ tài khoản.',
    ],
  },
  {
    title: 'Nội dung của người chưa thành niên',
    paragraphs: [
      'Người dùng chưa đủ tuổi tự quyết định theo quy định tại nơi cư trú cần có sự đồng ý và hướng dẫn của cha mẹ hoặc người giám hộ khi sử dụng dịch vụ.',
    ],
  },
  {
    title: 'Cập nhật chính sách',
    paragraphs: [
      'Chính sách có thể được điều chỉnh khi HourLink thay đổi tính năng hoặc cách xử lý dữ liệu. Ngày cập nhật mới nhất luôn được hiển thị ở đầu trang.',
    ],
  },
];

export default function PrivacyPolicyScreen() {
  return (
    <LegalDocumentScreen
      title="Chính sách quyền riêng tư"
      summary="Tài liệu này mô tả dữ liệu HourLink đang xử lý, lý do sử dụng và các lựa chọn hiện có của bạn trong ứng dụng."
      sections={SECTIONS}
    />
  );
}
