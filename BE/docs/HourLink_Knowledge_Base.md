# TÀI LIỆU YÊU CẦU ỨNG DỤNG HOURLINK

> Nguồn: hourlink_requirements.docx

## 1. Tên đề tài

HourLink – Ứng dụng đa nền tảng trao đổi kỹ năng và hỗ trợ cộng đồng bằng tín dụng thời gian

## 2. Mô tả ngắn về ứng dụng

HourLink là ứng dụng giúp mọi người trong xã hội hỗ trợ lẫn nhau bằng thời gian thay vì tiền.

Khi một người dành thời gian giúp người khác, họ sẽ nhận được Time Credit.

Quy ước:

Hỗ trợ người khác 1 giờ

→ Nhận 1 Time Credit

Dùng 1 Time Credit

→ Nhận lại 1 giờ hỗ trợ từ người khác

Ví dụ:

Việt hướng dẫn An học Java trong 1 giờ

→ Việt nhận 1 Time Credit

→ An sử dụng 1 Time Credit

Sau đó Việt dùng 1 Time Credit

→ Nhờ Minh luyện tiếng Nhật trong 1 giờ

Người hỗ trợ Việt không nhất thiết phải là người hỗ trợ lại cho An. Time Credit có thể được sử dụng với bất kỳ người phù hợp nào trong cộng đồng.

## 3. Vấn đề ứng dụng muốn giải quyết

Trong xã hội có nhiều người:

- Có kỹ năng nhưng chưa có cơ hội chia sẻ.

- Muốn học một kỹ năng nhưng không đủ chi phí.

- Cần được giúp đỡ trong một công việc nhỏ.

- Có thời gian rảnh và muốn đóng góp cho cộng đồng.

- Gặp khó khăn trong việc tìm đúng người có thể hỗ trợ.

- Muốn tham gia hoạt động xã hội nhưng chưa biết bắt đầu từ đâu.

Trong khi đó, mỗi người đều có những khả năng riêng.

Ví dụ:

- Sinh viên biết lập trình.

- Người đi làm có kinh nghiệm viết CV.

- Người cao tuổi biết nấu món truyền thống.

- Người nội trợ biết may vá.

- Người lao động biết sửa điện.

- Người nước ngoài có thể dạy ngoại ngữ.

HourLink tạo ra một cộng đồng để những kỹ năng đó được trao đổi công bằng bằng thời gian.

## 4. Mục tiêu của ứng dụng

Ứng dụng hướng đến các mục tiêu:

- Kết nối người cần hỗ trợ với người có kỹ năng phù hợp.

- Giúp mọi người học hỏi mà không cần thanh toán bằng tiền.

- Khuyến khích hoạt động hỗ trợ cộng đồng.

- Ghi nhận thời gian đóng góp của mỗi người.

- Xây dựng môi trường trao đổi đáng tin cậy.

- Ứng dụng AI để đề xuất người hỗ trợ phù hợp.

- Hạn chế gian lận thông qua QR, OTP và xác nhận hai chiều.

## 5. Đối tượng người dùng

### 5.1. Người dùng cá nhân

Người dùng cá nhân có thể vừa là người hỗ trợ, vừa là người cần hỗ trợ.

Các nhóm người dùng gồm:

- Sinh viên.

- Người đi làm.

- Người thất nghiệp hoặc đang chuyển nghề.

- Người cao tuổi.

- Người nội trợ.

- Người lao động phổ thông.

- Người khuyết tật.

- Người nước ngoài đang sinh sống tại địa phương.

- Nghệ nhân.

- Chuyên gia đã nghỉ hưu.

- Tình nguyện viên.

Ví dụ:

Sinh viên:

- Dạy lập trình.

- Học ngoại ngữ.

Người cao tuổi:

- Cần hỗ trợ sử dụng điện thoại.

- Có thể dạy nấu ăn hoặc chia sẻ nghề truyền thống.

Người đi làm:

- Hướng dẫn viết CV.

- Nhờ người khác sửa máy tính.

### 5.2. Tổ chức cộng đồng

Tổ chức cộng đồng có thể là:

- Trường học.

- Câu lạc bộ sinh viên.

- Hội tình nguyện.

- Trung tâm cộng đồng.

- Tổ chức hỗ trợ người cao tuổi.

- Tổ chức hỗ trợ người khuyết tật.

Tổ chức có thể:

- Đăng hoạt động cộng đồng.

- Tuyển tình nguyện viên.

- Xác nhận giờ tham gia.

- Cấp chứng nhận đóng góp.

- Quản lý danh sách thành viên tham gia.

### 5.3. Quản trị viên

Quản trị viên có nhiệm vụ:

- Quản lý tài khoản.

- Quản lý kỹ năng.

- Quản lý giao dịch Time Credit.

- Xử lý báo cáo.

- Giải quyết tranh chấp.

- Kiểm tra gian lận.

- Khóa hoặc mở khóa tài khoản.

- Theo dõi thống kê hệ thống.

## 6. Vai trò của người dùng trong hệ thống

Một người dùng không bị cố định chỉ là người cho hoặc người nhận.

Mỗi người đều có thể:

Có kỹ năng

→ Đăng kỹ năng để hỗ trợ người khác

Có nhu cầu

→ Đăng yêu cầu cần được hỗ trợ

Ví dụ:

Việt có thể dạy Java

nhưng lại cần học tiếng Nhật.

Lan có thể dạy tiếng Nhật

nhưng cần người sửa máy tính.

Minh có thể sửa máy tính

nhưng muốn học thiết kế.

Nhờ Time Credit, các thành viên không cần trao đổi trực tiếp theo cặp.

## 7. Khái niệm Time Credit

Time Credit là đơn vị ghi nhận thời gian đóng góp.

Quy tắc chính:

1 giờ hỗ trợ = 1 Time Credit

Time Credit:

- Không được đổi trực tiếp thành tiền.

- Chỉ được dùng trong hệ thống.

- Được chuyển sau khi buổi hỗ trợ hoàn thành.

- Có thể bị tạm giữ khi lịch hẹn đang diễn ra.

- Có thể được hoàn lại nếu lịch bị hủy hợp lệ.

Ví dụ:

Số dư ban đầu của Việt: 2 Time Credit

Việt hỗ trợ An 1 giờ:

→ Việt có 3 Time Credit

Việt học tiếng Nhật với Lan 1 giờ:

→ Việt còn 2 Time Credit

## 8. Luồng hoạt động tổng quát

Đăng ký tài khoản

↓

Xác minh email hoặc số điện thoại

↓

Cập nhật hồ sơ và kỹ năng

↓

Đăng yêu cầu cần hỗ trợ

↓

AI đề xuất người phù hợp

↓

Gửi lời mời hỗ trợ

↓

Hai bên chat

↓

Tạo lịch hẹn

↓

Hai bên xác nhận lịch

↓

QR hoặc OTP xác nhận bắt đầu

↓

Thực hiện buổi hỗ trợ

↓

Hai bên xác nhận hoàn thành

↓

Chuyển Time Credit

↓

Đánh giá và cập nhật uy tín

## 9. Các chức năng chính

### 9.1. Đăng ký tài khoản

Người dùng nhập:

- Họ và tên.

- Email.

- Số điện thoại.

- Mật khẩu.

- Ngày sinh.

- Khu vực sinh sống.

- Nghề nghiệp hoặc nhóm người dùng.

Sau khi đăng ký, hệ thống gửi mã OTP hoặc liên kết xác minh.

Tài khoản chưa xác minh sẽ bị giới hạn một số chức năng.

### 9.2. Đăng nhập

Người dùng đăng nhập bằng:

- Email và mật khẩu.

- Số điện thoại và mật khẩu.

Hệ thống hỗ trợ:

- Đăng nhập.

- Đăng xuất.

- Quên mật khẩu.

- Đổi mật khẩu.

- Làm mới phiên đăng nhập.

### 9.3. Quản lý hồ sơ cá nhân

Người dùng có thể cập nhật:

- Ảnh đại diện.

- Họ tên.

- Giới thiệu bản thân.

- Nghề nghiệp.

- Khu vực.

- Kỹ năng có thể hỗ trợ.

- Kỹ năng muốn học.

- Thời gian rảnh.

- Hình thức hỗ trợ.

- Ngôn ngữ sử dụng.

Hồ sơ hiển thị:

- Điểm uy tín.

- Số Time Credit.

- Tổng số buổi đã hoàn thành.

- Tỷ lệ hủy lịch.

- Các đánh giá.

- Các huy hiệu.

### 9.4. Đăng kỹ năng có thể hỗ trợ

Người dùng có thể đăng một kỹ năng mình có thể chia sẻ.

Thông tin gồm:

- Tên kỹ năng.

- Danh mục.

- Mô tả.

- Trình độ.

- Hình thức online hoặc trực tiếp.

- Thời gian rảnh.

- Thời lượng mỗi buổi.

- Khu vực có thể hỗ trợ.

- Hình ảnh hoặc tài liệu minh chứng.

Ví dụ:

Tên kỹ năng: Java cơ bản

Nội dung:

- Biến và kiểu dữ liệu.

- Câu điều kiện.

- Vòng lặp.

- Lập trình hướng đối tượng.

Hình thức: Online

Thời lượng: 1 giờ

Thời gian: Tối thứ Bảy

### 9.5. Đăng yêu cầu cần hỗ trợ

Người dùng đăng vấn đề mình cần giúp đỡ.

Thông tin gồm:

- Tiêu đề.

- Mô tả nhu cầu.

- Kỹ năng cần hỗ trợ.

- Mức độ hiện tại.

- Hình thức online hoặc trực tiếp.

- Thời gian mong muốn.

- Thời lượng.

- Khu vực.

- Số Time Credit sử dụng.

Ví dụ:

Tiêu đề:

Cần người hướng dẫn Spring Boot JWT

Mô tả:

Tôi đã biết Java cơ bản nhưng chưa biết cách làm đăng nhập JWT.

Hình thức: Online

Thời lượng: 1 giờ

Time Credit: 1

### 9.6. Tìm kiếm người hỗ trợ

Người dùng có thể tìm kiếm theo:

- Tên kỹ năng.

- Danh mục.

- Khu vực.

- Khoảng cách.

- Hình thức hỗ trợ.

- Thời gian rảnh.

- Điểm uy tín.

- Số buổi đã hoàn thành.

Kết quả hiển thị:

- Tên người hỗ trợ.

- Ảnh đại diện.

- Kỹ năng.

- Điểm uy tín.

- Khoảng cách.

- Mức độ phù hợp.

- Thời gian rảnh.

### 9.7. AI đề xuất người phù hợp

AI phân tích nội dung yêu cầu và hồ sơ người hỗ trợ.

Ví dụ người dùng nhập:

Tôi cần người hướng dẫn cách đăng nhập bằng JWT trong Spring Boot.

AI phân tích thành:

Kỹ năng cần:

- Java.

- Spring Boot.

- Spring Security.

- JWT.

Trình độ:

- Cơ bản.

Hình thức:

- Online.

AI sau đó xếp hạng những người phù hợp nhất.

Ví dụ:

1. Minh – phù hợp 92%

2. Lan – phù hợp 85%

3. Hoàng – phù hợp 76%

AI dựa trên:

- Độ phù hợp kỹ năng.

- Trùng thời gian rảnh.

- Khoảng cách.

- Điểm uy tín.

- Số lần hủy lịch.

- Lịch sử hỗ trợ.

- Hình thức online hoặc trực tiếp.

### 9.8. Giải thích kết quả AI

Hệ thống cần giải thích tại sao đề xuất một người.

Ví dụ:

Minh phù hợp 92% vì:

- Có kỹ năng Spring Boot và JWT.

- Rảnh tối thứ Bảy.

- Thường hỗ trợ người mới.

- Có điểm uy tín 4,8/5.

- Đã hoàn thành 25 buổi.

Điều này giúp người dùng tin tưởng kết quả AI hơn.

### 9.9. Gửi lời mời hỗ trợ

Người cần hỗ trợ có thể gửi lời mời đến người phù hợp.

Lời mời gồm:

- Nội dung yêu cầu.

- Thời gian đề xuất.

- Thời lượng.

- Hình thức.

- Tin nhắn giới thiệu.

Người nhận có thể:

- Chấp nhận.

- Từ chối.

- Đề xuất thời gian khác.

- Hỏi thêm thông tin.

### 9.10. Chat

Sau khi lời mời được chấp nhận, hai người có thể chat.

Chức năng chat:

- Gửi tin nhắn.

- Gửi hình ảnh.

- Gửi tài liệu.

- Gửi vị trí.

- Gửi link họp online.

- Đề xuất đổi lịch.

- Báo cáo tin nhắn.

- Chặn người dùng.

Ví dụ:

Việt:

Bạn có thể hướng dẫn tôi lúc 19 giờ thứ Bảy không?

Minh:

Được. Bạn đang gặp khó khăn ở phần nào?

Việt:

Phần tạo token và phân quyền.

Minh:

Được, mình sẽ chuẩn bị ví dụ trước.

### 9.11. Tạo lịch hẹn

Sau khi trao đổi, hai bên tạo lịch hẹn.

Thông tin lịch gồm:

- Người hỗ trợ.

- Người nhận hỗ trợ.

- Nội dung.

- Ngày.

- Giờ bắt đầu.

- Giờ kết thúc.

- Hình thức online hoặc trực tiếp.

- Địa điểm hoặc link họp.

- Số Time Credit.

- Ghi chú.

Trạng thái lịch:

Chờ xác nhận

Đã xác nhận

Sắp diễn ra

Đang diễn ra

Hoàn thành

Đã hủy

Có tranh chấp

### 9.12. Quản lý lịch cá nhân

Người dùng có thể xem:

- Lịch hôm nay.

- Lịch sắp tới.

- Lịch đã hoàn thành.

- Lịch đã hủy.

- Lịch có tranh chấp.

Hệ thống gửi thông báo trước thời gian hẹn.

### 9.13. Bản đồ

Bản đồ được sử dụng khi hai người gặp trực tiếp.

Chức năng bản đồ:

- Hiển thị người hỗ trợ ở gần.

- Hiển thị khoảng cách.

- Đề xuất địa điểm công cộng.

- Chỉ đường đến địa điểm hẹn.

- Chia sẻ vị trí tạm thời.

Ứng dụng không nên hiển thị địa chỉ nhà chính xác của người dùng cho người lạ.

Trước khi xác nhận lịch, chỉ hiển thị:

- Khu vực.

- Khoảng cách gần đúng.

### 9.14. Xác nhận bằng QR hoặc OTP

Khi buổi hỗ trợ bắt đầu, hệ thống tạo QR hoặc OTP.

Đối với gặp trực tiếp:

Người hỗ trợ mở QR

↓

Người nhận quét QR

↓

Hệ thống ghi nhận thời gian bắt đầu

Đối với online:

Hệ thống tạo OTP

↓

Người nhận nhập OTP

↓

Hai bên xác nhận đã tham gia

QR và OTP giúp hạn chế tạo giao dịch giả.

### 9.15. Xác nhận hoàn thành

Sau khi buổi hỗ trợ kết thúc, hai bên xác nhận:

- Buổi hỗ trợ có diễn ra hay không.

- Thời gian thực tế.

- Nội dung đã hoàn thành.

- Có vấn đề phát sinh hay không.

Chỉ khi hai bên xác nhận, Time Credit mới được chuyển.

### 9.16. Ví Time Credit

Ví Time Credit hiển thị:

- Số dư.

- Tổng số giờ đã kiếm.

- Tổng số giờ đã sử dụng.

- Điểm đang tạm giữ.

- Lịch sử giao dịch.

- Giao dịch đang tranh chấp.

Ví dụ:

Số dư: 5 Time Credit

+1: Hướng dẫn Java cho An

-1: Học tiếng Nhật với Lan

+2: Tham gia hoạt động tình nguyện

### 9.17. Cơ chế tạm giữ Time Credit

Khi lịch hẹn được xác nhận, Time Credit của người nhận sẽ được tạm giữ.

Ví dụ:

Việt có 3 Time Credit

Đặt lịch 1 giờ với Minh

Số dư khả dụng: 2

Đang tạm giữ: 1

Sau khi hoàn thành:

- Minh nhận 1 Time Credit.

- Việt bị trừ 1 Time Credit.

Nếu lịch được hủy hợp lệ:

- 1 Time Credit được hoàn lại cho Việt.

### 9.18. Đánh giá người dùng

Sau mỗi buổi, hai bên đánh giá nhau.

Tiêu chí:

- Đúng giờ.

- Thái độ.

- Khả năng giao tiếp.

- Chất lượng hỗ trợ.

- Mức độ hoàn thành.

- Độ tin cậy.

Người dùng có thể:

- Chấm từ 1 đến 5 sao.

- Viết nhận xét.

- Báo cáo vấn đề.

### 9.19. Điểm uy tín

Điểm uy tín được tính dựa trên:

- Điểm đánh giá trung bình.

- Tỷ lệ hoàn thành.

- Số lần hủy lịch.

- Số lần bị báo cáo.

- Số buổi đã hỗ trợ.

- Mức độ đúng giờ.

- Tần suất hoạt động.

Điểm uy tín ảnh hưởng đến:

- Thứ tự đề xuất.

- Kết quả tìm kiếm.

- Khả năng được người khác tin tưởng.

- Một số quyền trong hệ thống.

### 9.20. Huy hiệu

Người dùng có thể nhận:

- Người hỗ trợ tích cực.

- Luôn đúng giờ.

- Chuyên gia Java.

- Tình nguyện viên nổi bật.

- Hoàn thành 10 buổi.

- Được đánh giá cao.

- Đã xác minh danh tính.

### 9.21. Hoạt động cộng đồng

Tổ chức có thể đăng hoạt động:

- Hỗ trợ người cao tuổi.

- Dạy học miễn phí.

- Dọn vệ sinh môi trường.

- Hỗ trợ sự kiện.

- Quyên góp sách.

- Hướng dẫn kỹ năng số.

- Hoạt động hỗ trợ người khuyết tật.

Thông tin hoạt động:

- Tên hoạt động.

- Mô tả.

- Địa điểm.

- Thời gian.

- Số người cần.

- Điều kiện tham gia.

- Số Time Credit nhận được.

### 9.22. Báo cáo người dùng

Người dùng có thể báo cáo khi:

- Người còn lại không xuất hiện.

- Có hành vi xúc phạm.

- Quấy rối.

- Gian lận Time Credit.

- Cố tình hướng dẫn sai.

- Yêu cầu thanh toán ngoài hệ thống.

- Yêu cầu chia sẻ mật khẩu hoặc OTP.

- Tạo nhiều tài khoản giả.

Báo cáo gồm:

- Lý do.

- Mô tả.

- Hình ảnh.

- Lịch hẹn liên quan.

- Tin nhắn liên quan.

### 9.23. Tranh chấp

Tranh chấp xảy ra khi:

- Một bên xác nhận hoàn thành nhưng bên kia không đồng ý.

- Hai bên không thống nhất thời gian thực tế.

- Người hỗ trợ không thực hiện đúng nội dung.

- Người nhận không chịu xác nhận.

- Có tranh cãi về Time Credit.

Khi có tranh chấp:

Time Credit bị tạm khóa

↓

Admin kiểm tra

↓

Xem chat, lịch, QR và bằng chứng

↓

Đưa ra quyết định

Admin có thể:

- Chuyển Time Credit cho người hỗ trợ.

- Hoàn Time Credit cho người nhận.

- Cảnh cáo tài khoản.

- Giảm điểm uy tín.

- Khóa tài khoản.

## 10. Chức năng AI

### 10.1. AI phân tích yêu cầu

AI đọc mô tả tự nhiên và xác định:

- Kỹ năng cần hỗ trợ.

- Mức độ.

- Hình thức.

- Danh mục.

- Thời lượng phù hợp.

### 10.2. AI Semantic Matching

AI so sánh nội dung yêu cầu với hồ sơ người hỗ trợ.

Ví dụ:

Yêu cầu:

Cần người hướng dẫn đăng nhập JWT.

Hồ sơ:

Có kinh nghiệm Spring Security và xác thực REST API.

AI hiểu rằng hai nội dung liên quan dù không dùng từ giống nhau hoàn toàn.

### 10.3. AI hỗ trợ tạo yêu cầu

Nếu người dùng nhập quá ngắn:

Tôi muốn học Java.

AI sẽ hỏi thêm:

Bạn muốn học phần nào?

- Java cơ bản.

- OOP.

- Collections.

- Spring Boot.

- Sửa lỗi code.

Sau đó AI tạo nội dung yêu cầu đầy đủ.

### 10.4. AI phát hiện nội dung không an toàn

AI kiểm tra:

- Nội dung xúc phạm.

- Quấy rối.

- Lừa đảo.

- Yêu cầu thông tin nhạy cảm.

- Yêu cầu chia sẻ mật khẩu.

- Giao dịch tiền ngoài hệ thống.

- Nội dung bị cấm.

### 10.5. AI phát hiện gian lận

AI hoặc thuật toán kiểm tra các dấu hiệu:

- Hai tài khoản giao dịch quá nhiều.

- Không có chat nhưng liên tục tạo lịch.

- Luôn đánh giá 5 sao cho nhau.

- Nhiều lịch xảy ra cùng thời điểm.

- Quét QR ở vị trí bất thường.

- Một thiết bị tạo nhiều tài khoản.

## 11. Chức năng quản trị viên

Admin có các chức năng:

Quản lý người dùng

- Xem danh sách.

- Tìm kiếm.

- Xem hồ sơ.

- Xem lịch sử giao dịch.

- Cảnh cáo.

- Khóa.

- Mở khóa.

Quản lý kỹ năng

- Thêm danh mục.

- Sửa danh mục.

- Ẩn kỹ năng không phù hợp.

- Xóa kỹ năng vi phạm.

Quản lý giao dịch

- Xem giao dịch.

- Kiểm tra Time Credit.

- Phát hiện bất thường.

- Điều chỉnh khi có tranh chấp.

Quản lý báo cáo

- Tiếp nhận báo cáo.

- Xem bằng chứng.

- Yêu cầu giải trình.

- Đưa ra quyết định.

- Cập nhật trạng thái xử lý.

Dashboard

Hiển thị:

- Tổng người dùng.

- Người dùng hoạt động.

- Tổng số buổi hỗ trợ.

- Tổng số giờ trao đổi.

- Kỹ năng phổ biến.

- Tỷ lệ hoàn thành.

- Tỷ lệ hủy.

- Số tranh chấp.

- Số tài khoản bị cảnh báo.

## 12. Luồng nghiệp vụ mẫu

Tình huống

Việt cần học Figma nhưng không có đủ Time Credit.

Bước 1: Việt đăng kỹ năng

Hướng dẫn Git và GitHub cơ bản

Thời lượng: 1 giờ

Hình thức: Online

Bước 2: An gửi lời mời

An muốn học Git và gửi yêu cầu cho Việt.

Bước 3: Hai người chat

Hai người thống nhất lịch lúc 19 giờ thứ Bảy.

Bước 4: Tạo lịch

Hệ thống tạm giữ 1 Time Credit của An.

Bước 5: Xác nhận bắt đầu

An nhập OTP do Việt cung cấp.

Bước 6: Hoàn thành

Hai người xác nhận buổi học đã hoàn thành.

Bước 7: Chuyển điểm

Việt: +1 Time Credit

An: -1 Time Credit

Bước 8: Việt sử dụng điểm

Việt tìm người dạy Figma.

AI đề xuất Lan phù hợp 91%.

Việt gửi lời mời, tạo lịch và học Figma.

Sau khi hoàn thành:

Việt: -1 Time Credit

Lan: +1 Time Credit

## 13. Phạm vi phiên bản đầu tiên

Để tránh dự án quá lớn, phiên bản đầu tiên nên làm các chức năng chính:

- Đăng ký và đăng nhập.

- Hồ sơ người dùng.

- Đăng kỹ năng.

- Đăng yêu cầu.

- Tìm kiếm.

- AI matching.

- Gửi lời mời.

- Chat.

- Lịch hẹn.

- QR hoặc OTP.

- Ví Time Credit.

- Đánh giá.

- Báo cáo.

- Trang quản trị.

Các chức năng có thể phát triển sau:

- Bản đồ nâng cao.

- Video call.

- Chứng nhận điện tử.

- AI phát hiện gian lận nâng cao.

- Phân tích đánh giá bằng AI.

- Hỗ trợ nhiều ngôn ngữ.

- Kết nối với trường học và tổ chức xã hội.

## 14. Yêu cầu phi chức năng

Bảo mật

- Mật khẩu phải được mã hóa.

- Sử dụng JWT để xác thực.

- Không công khai địa chỉ chính xác.

- Không cho phép người khác xem OTP.

- Phân quyền rõ ràng.

- Ghi log các giao dịch quan trọng.

Hiệu năng

- Trang danh sách tải nhanh.

- Chat gần thời gian thực.

- AI trả kết quả trong thời gian hợp lý.

- Hệ thống hỗ trợ nhiều người dùng đồng thời.

Dễ sử dụng

- Giao diện đơn giản.

- Nút chức năng rõ ràng.

- Hỗ trợ người cao tuổi.

- Có cỡ chữ lớn.

- Có thông báo lỗi dễ hiểu.

Đa nền tảng

Hệ thống có thể gồm:

- Ứng dụng mobile cho người dùng.

- Website quản trị cho admin.

- Backend API dùng chung.

## 15. Công nghệ đề xuất

Mobile:

Flutter hoặc React Native

Website quản trị:

ReactJS

Backend:

Java Spring Boot

Database:

MySQL

Chat:

WebSocket

Thông báo:

Firebase Cloud Messaging

Bản đồ:

Google Maps hoặc Mapbox

QR:

ZXing hoặc thư viện QR

AI:

Python, FastAPI, Scikit-learn,

Sentence Transformers

## 16. Các module chính

Team có thể chia hệ thống thành các module:

1. Authentication

2. User Profile

3. Skill Management

4. Help Request

5. AI Matching

6. Invitation

7. Chat

8. Appointment

9. QR/OTP Verification

10. Time Credit Wallet

11. Rating and Reputation

12. Report and Dispute

13. Community Activity

14. Notification

15. Admin Management

## 17. Giá trị nổi bật của đề tài

HourLink không chỉ là ứng dụng tìm người dạy kỹ năng.

Điểm nổi bật gồm:

- Không sử dụng tiền để trao đổi.

- Mỗi người đều có thể cho và nhận.

- Time Credit lưu chuyển trong cộng đồng.

- AI hiểu nhu cầu và đề xuất người phù hợp.

- QR và OTP giúp xác minh hoạt động.

- Có hệ thống uy tín.

- Có xử lý tranh chấp.

- Có ý nghĩa xã hội.

- Có thể mở rộng cho nhiều nhóm người dùng.

Thông điệp chính của ứng dụng:

Bạn dành thời gian giúp người khác

→ cộng đồng ghi nhận thời gian đó

→ bạn nhận lại sự giúp đỡ khi cần
