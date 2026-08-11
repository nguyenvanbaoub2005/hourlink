import LegalDocumentScreen, { LegalSection } from '@components/LegalDocumentScreen';

const SECTIONS: LegalSection[] = [
  {
    title: 'Phạm vi và chấp nhận',
    paragraphs: [
      'Điều khoản này áp dụng khi bạn tạo tài khoản hoặc sử dụng các tính năng của HourLink. Việc tiếp tục sử dụng ứng dụng đồng nghĩa bạn đồng ý tuân thủ các quy tắc được nêu tại đây.',
    ],
  },
  {
    title: 'Tài khoản và bảo mật',
    bullets: [
      'Cung cấp thông tin chính xác, cập nhật và không mạo danh người khác.',
      'Tự bảo vệ mật khẩu, mã OTP và thiết bị đăng nhập; không chia sẻ các thông tin này qua chat.',
      'Thông báo cho HourLink khi nghi ngờ tài khoản bị truy cập trái phép.',
    ],
  },
  {
    title: 'Cách HourLink hoạt động',
    paragraphs: [
      'HourLink hỗ trợ người dùng đăng kỹ năng, gửi lời mời, tạo lịch hẹn, trao đổi qua chat và tham gia hoạt động cộng đồng. Người dùng tự đánh giá sự phù hợp của đối tác trước khi xác nhận một hoạt động.',
    ],
  },
  {
    title: 'Time Credit',
    paragraphs: [
      'Time Credit là đơn vị ghi nhận thời gian đóng góp trong HourLink. Số Credit được tính theo quy tắc hiển thị ở từng lịch hẹn hoặc hoạt động, chỉ dùng trong hệ thống và không phải tiền pháp định hay cam kết quy đổi trực tiếp thành tiền.',
    ],
  },
  {
    title: 'Lịch hẹn và hoạt động cộng đồng',
    bullets: [
      'Kiểm tra kỹ ngày, giờ, hình thức, địa điểm hoặc đường dẫn phòng họp trước khi xác nhận.',
      'Nếu phải hủy, hãy nhập lý do trung thực và thông báo sớm cho bên còn lại.',
      'Chỉ xác nhận hoàn thành, số giờ đóng góp và minh chứng đúng với thực tế.',
    ],
  },
  {
    title: 'Nội dung và giao tiếp',
    bullets: [
      'Bạn chịu trách nhiệm với nội dung, hình ảnh, tài liệu, vị trí và đường dẫn do mình gửi.',
      'Không đăng nội dung lừa đảo, quấy rối, xúc phạm, vi phạm pháp luật hoặc quyền của người khác.',
      'Không yêu cầu mật khẩu, OTP, thông tin ngân hàng hoặc ép buộc giao dịch bên ngoài HourLink.',
      'Chỉ tải lên tài liệu mà bạn có quyền sử dụng và chia sẻ.',
    ],
  },
  {
    title: 'Báo cáo, chặn và xử lý vi phạm',
    paragraphs: [
      'Bạn có thể chặn người dùng hoặc gửi báo cáo kèm bằng chứng. HourLink có thể xem xét nội dung liên quan, hạn chế tính năng hoặc khóa tài khoản khi phát hiện hành vi vi phạm. Việc chặn ngăn tương tác mới nhưng không tự động hủy lịch hẹn đã có.',
    ],
  },
  {
    title: 'Gợi ý tự động và AI',
    paragraphs: [
      'Kết quả ghép cặp hoặc gợi ý tự động chỉ mang tính hỗ trợ. Bạn cần tự xem hồ sơ, lịch rảnh, uy tín và trao đổi với người còn lại trước khi quyết định.',
    ],
  },
  {
    title: 'Tính sẵn sàng của dịch vụ',
    paragraphs: [
      'HourLink có thể thay đổi, tạm ngừng hoặc bảo trì một số tính năng để bảo đảm an toàn và vận hành. Ứng dụng không bảo đảm mọi lời mời đều được chấp nhận hoặc mọi buổi hỗ trợ đều đạt kết quả mong muốn.',
    ],
  },
  {
    title: 'Cập nhật điều khoản',
    paragraphs: [
      'Khi nội dung được cập nhật, ngày sửa đổi sẽ hiển thị ở đầu trang. Các thay đổi quan trọng nên được xem lại trước khi bạn tiếp tục sử dụng HourLink.',
    ],
  },
];

export default function TermsScreen() {
  return (
    <LegalDocumentScreen
      title="Điều khoản dịch vụ"
      summary="Các quy tắc cơ bản giúp việc trao đổi kỹ năng và thời gian trên HourLink minh bạch, an toàn và tôn trọng lẫn nhau."
      sections={SECTIONS}
    />
  );
}
