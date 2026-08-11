# 📋 HOURLINK ADMIN PANEL — KẾ HOẠCH THIẾT KẾ & TRIỂN KHAI

> Tài liệu này mô tả công nghệ, cấu trúc thư mục, danh sách module và kế hoạch triển khai Admin Panel cho dự án HourLink.
> Cập nhật lần cuối: 2026-08-07

---

## 1. 🛠️ Công nghệ sử dụng

### Tại sao chọn React + Vite?

HourLink hiện tại đã dùng:
- **FE Mobile**: React Native (Expo) — TypeScript, Axios, TanStack Query, Zustand, Expo Router
- **BE**: Java Spring Boot — REST API, JWT Auth, Spring Security, WebSocket

Admin Panel là **website riêng biệt** (không phải app mobile). Chọn **React + Vite** vì:

| Lý do | Chi tiết |
|---|---|
| ✅ Cùng hệ sinh thái React | Tái dụng kiến thức, pattern từ FE mobile |
| ✅ TypeScript có sẵn | Consistent type-safe với toàn dự án |
| ✅ Axios & TanStack Query | Dùng lại API client pattern từ `FE/src/api/` |
| ✅ Vite siêu nhanh | Hot reload, build nhỏ, dev experience tốt |
| ✅ Không cần Expo | Admin là web thuần, không cần mobile toolchain |
| ✅ Tài liệu đề xuất | `HourLink_Knowledge_Base.md` §15 đề xuất ReactJS |

### Stack kỹ thuật Admin Panel

```
ADMIN/
├── Framework     : React 19 + Vite 6
├── Language      : TypeScript
├── Styling       : Vanilla CSS (design system riêng)
├── State         : Zustand (global) + TanStack Query (server state)
├── HTTP Client   : Axios (tái sử dụng pattern từ FE)
├── Charts        : Recharts (biểu đồ dashboard)
├── Icons         : Lucide React
├── Routing       : React Router v7
└── Auth          : JWT (cùng backend hiện tại)
```

> **Lưu ý CORS**: SecurityConfig.java hiện tại đã cho phép `http://localhost:*` → Admin chạy local sẽ hoạt động ngay.

---

## 2. 📁 Cấu trúc thư mục

### Vị trí trong mono-repo

```
hourlink/
├── BE/                     ← Spring Boot backend (đang có)
├── FE/                     ← React Native mobile app (đang có)
├── ADMIN/                  ← 🆕 Admin Panel (web)
└── AI/                     ← AI service (đang có)
```

### Chi tiết thư mục ADMIN/

```
ADMIN/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
│
├── public/
│   └── favicon.ico
│
└── src/
    ├── main.tsx                    ← Entry point
    ├── App.tsx                     ← Router setup
    │
    ├── api/                        ← API calls (mirror pattern FE/src/api/)
    │   ├── axiosInstance.ts        ← Axios config + JWT interceptor
    │   ├── auth.ts                 ← Admin login/logout
    │   ├── users.ts                ← User management APIs
    │   ├── skills.ts               ← Skill management APIs
    │   ├── appointments.ts         ← Appointment APIs
    │   ├── wallet.ts               ← Time Credit APIs
    │   ├── reports.ts              ← Report & dispute APIs
    │   ├── community.ts            ← Community activity APIs
    │   └── dashboard.ts            ← Dashboard stats APIs
    │
    ├── components/                 ← Shared UI components
    │   ├── layout/
    │   │   ├── AdminLayout.tsx      ← Sidebar + Header + Content wrapper
    │   │   ├── Sidebar.tsx
    │   │   ├── Header.tsx
    │   │   └── Breadcrumb.tsx
    │   ├── ui/
    │   │   ├── Button.tsx
    │   │   ├── Badge.tsx
    │   │   ├── Card.tsx
    │   │   ├── Table.tsx
    │   │   ├── Modal.tsx
    │   │   ├── Input.tsx
    │   │   ├── Select.tsx
    │   │   ├── Pagination.tsx
    │   │   ├── SearchBar.tsx
    │   │   ├── Toast.tsx
    │   │   ├── Spinner.tsx
    │   │   └── EmptyState.tsx
    │   └── charts/
    │       ├── LineChart.tsx
    │       ├── BarChart.tsx
    │       ├── PieChart.tsx
    │       └── StatCard.tsx
    │
    ├── pages/                      ← Các trang admin (1 folder = 1 module)
    │   ├── login/
    │   │   └── LoginPage.tsx
    │   ├── dashboard/
    │   │   └── DashboardPage.tsx
    │   ├── users/
    │   │   ├── UserListPage.tsx
    │   │   └── UserDetailPage.tsx
    │   ├── skills/
    │   │   ├── SkillListPage.tsx
    │   │   └── SkillCategoryPage.tsx
    │   ├── appointments/
    │   │   ├── AppointmentListPage.tsx
    │   │   └── AppointmentDetailPage.tsx
    │   ├── wallet/
    │   │   ├── WalletOverviewPage.tsx
    │   │   └── TransactionListPage.tsx
    │   ├── reports/
    │   │   ├── ReportListPage.tsx
    │   │   └── ReportDetailPage.tsx
    │   ├── disputes/
    │   │   ├── DisputeListPage.tsx
    │   │   └── DisputeDetailPage.tsx
    │   └── community/
    │       ├── CommunityListPage.tsx
    │       └── CommunityDetailPage.tsx
    │
    ├── store/                      ← Zustand global state
    │   ├── authStore.ts            ← Admin auth state
    │   └── uiStore.ts              ← Sidebar collapsed, theme, etc.
    │
    ├── hooks/                      ← Custom hooks
    │   ├── useAdminAuth.ts
    │   ├── useUsers.ts
    │   ├── useSkills.ts
    │   ├── useWallet.ts
    │   ├── useReports.ts
    │   └── useDashboard.ts
    │
    ├── types/                      ← TypeScript types/interfaces
    │   ├── user.ts
    │   ├── skill.ts
    │   ├── appointment.ts
    │   ├── wallet.ts
    │   ├── report.ts
    │   └── dashboard.ts
    │
    ├── constants/
    │   └── config.ts               ← API base URL, pagination size, etc.
    │
    └── styles/
        ├── index.css               ← Global styles + CSS variables
        ├── layout.css
        └── components.css
```

---

## 3. 📦 Các Module Admin cần hoàn thiện

### 3.1 Tổng quan module & độ ưu tiên

| # | Module | Mô tả | Độ ưu tiên | Trạng thái |
|---|---|---|---|---|
| 1 | **Dashboard** | Thống kê tổng quan hệ thống | 🔴 Cao | ⬜ Chưa làm |
| 2 | **Quản lý người dùng** | Xem, tìm kiếm, khoá/mở tài khoản | 🔴 Cao | ⬜ Chưa làm |
| 3 | **Quản lý kỹ năng** | Duyệt, ẩn, xoá kỹ năng vi phạm | 🔴 Cao | ⬜ Chưa làm |
| 4 | **Quản lý báo cáo** | Xem báo cáo, xử lý vi phạm | 🔴 Cao | ⬜ Chưa làm |
| 5 | **Quản lý tranh chấp** | Kiểm tra & quyết định tranh chấp | 🔴 Cao | ⬜ Chưa làm |
| 6 | **Quản lý ví Time Credit** | Xem giao dịch, phát hiện bất thường | 🟡 Trung | ⬜ Chưa làm |
| 7 | **Quản lý lịch hẹn** | Xem lịch hẹn toàn hệ thống | 🟡 Trung | ⬜ Chưa làm |
| 8 | **Quản lý cộng đồng** | Duyệt hoạt động tổ chức đăng | 🟢 Thấp | ⬜ Chưa làm |
| 9 | **Admin Auth** | Đăng nhập/đăng xuất admin | 🔴 Cao | ⬜ Chưa làm |

---

### 3.2 Chi tiết từng module

---

#### MODULE 1 — Dashboard (Tổng quan hệ thống)

**Mục tiêu**: Trang đầu tiên sau login, hiển thị số liệu thực tế của hệ thống.

**Chức năng cần có:**
- [ ] Thẻ thống kê nhanh (stat cards):
  - Tổng người dùng / người dùng hoạt động 7 ngày qua
  - Tổng buổi hỗ trợ hoàn thành / hôm nay
  - Tổng Time Credit đang lưu thông
  - Số báo cáo chờ xử lý
  - Số tranh chấp đang mở
  - Số tài khoản bị khoá
- [ ] Biểu đồ đường: người dùng đăng ký theo ngày/tuần/tháng
- [ ] Biểu đồ cột: buổi hỗ trợ hoàn thành vs hủy theo tuần
- [ ] Biểu đồ tròn: phân bố kỹ năng phổ biến top 5
- [ ] Bảng hoạt động gần đây (5–10 mục mới nhất)
- [ ] Cảnh báo nổi bật: tài khoản gian lận, tranh chấp mở lâu

**API backend cần (ADMIN module):**
```
GET /admin/dashboard/stats
GET /admin/dashboard/user-growth?period=week
GET /admin/dashboard/appointment-stats?period=week
GET /admin/dashboard/top-skills
GET /admin/dashboard/recent-activities
```

---

#### MODULE 2 — Quản lý người dùng (User Management)

**Mục tiêu**: Xem, tìm kiếm, lọc và quản lý toàn bộ tài khoản người dùng.

**Chức năng cần có:**
- [ ] Danh sách người dùng với phân trang (pagination)
- [ ] Tìm kiếm theo: tên, email, số điện thoại
- [ ] Lọc theo: trạng thái (active/banned/pending), loại tài khoản, khu vực
- [ ] Xem chi tiết hồ sơ người dùng:
  - Thông tin cơ bản
  - Điểm uy tín & huy hiệu
  - Lịch sử giao dịch Time Credit
  - Danh sách buổi hẹn
  - Các báo cáo liên quan
- [ ] Hành động: cảnh cáo, khoá tạm thời, mở khoá, khoá vĩnh viễn
- [ ] Ghi chú nội bộ admin cho từng user

**API backend cần:**
```
GET    /admin/users?page=0&size=20&search=&status=
GET    /admin/users/{userId}
GET    /admin/users/{userId}/transactions
GET    /admin/users/{userId}/appointments
GET    /admin/users/{userId}/reports
POST   /admin/users/{userId}/warn
POST   /admin/users/{userId}/ban
POST   /admin/users/{userId}/unban
POST   /admin/users/{userId}/note
```

---

#### MODULE 3 — Quản lý kỹ năng (Skill Management)

**Mục tiêu**: Quản lý danh mục kỹ năng và nội dung kỹ năng người dùng đăng.

**Chức năng cần có:**
- [ ] Danh sách tất cả kỹ năng người dùng đăng (phân trang)
- [ ] Tìm kiếm, lọc theo danh mục, trạng thái, người đăng
- [ ] Xem chi tiết kỹ năng
- [ ] Hành động: phê duyệt, ẩn, xóa, cảnh báo người đăng
- [ ] Quản lý danh mục kỹ năng (categories):
  - Thêm danh mục mới
  - Sửa tên/mô tả danh mục
  - Ẩn/hiện danh mục
  - Xoá danh mục (nếu không có kỹ năng nào thuộc)

**API backend cần:**
```
GET    /admin/skills?page=0&size=20&categoryId=&status=
GET    /admin/skills/{skillId}
POST   /admin/skills/{skillId}/approve
POST   /admin/skills/{skillId}/hide
DELETE /admin/skills/{skillId}
GET    /admin/skill-categories
POST   /admin/skill-categories
PUT    /admin/skill-categories/{id}
DELETE /admin/skill-categories/{id}
```

---

#### MODULE 4 — Quản lý báo cáo (Report Management)

**Mục tiêu**: Tiếp nhận, xem xét và xử lý các báo cáo vi phạm từ người dùng.

**Chức năng cần có:**
- [ ] Danh sách báo cáo: lọc theo trạng thái (chờ xử lý / đã xử lý / bác bỏ)
- [ ] Xem chi tiết báo cáo:
  - Thông tin người báo cáo
  - Người bị báo cáo
  - Lý do + mô tả + hình ảnh bằng chứng
  - Lịch hẹn / tin nhắn liên quan
- [ ] Hành động xử lý:
  - Cảnh cáo người bị báo cáo
  - Khoá tài khoản người bị báo cáo
  - Bác bỏ báo cáo (không vi phạm)
  - Ghi chú nội bộ
- [ ] Thống kê báo cáo: top lý do, user bị báo cáo nhiều nhất

**API backend cần:**
```
GET    /admin/reports?page=0&size=20&status=PENDING
GET    /admin/reports/{reportId}
POST   /admin/reports/{reportId}/resolve
POST   /admin/reports/{reportId}/reject
POST   /admin/reports/{reportId}/note
```

---

#### MODULE 5 — Quản lý tranh chấp (Dispute Management)

**Mục tiêu**: Xem xét và ra quyết định khi có tranh chấp Time Credit giữa hai người dùng.

**Chức năng cần có:**
- [ ] Danh sách tranh chấp: lọc theo trạng thái, ngày tạo
- [ ] Xem chi tiết tranh chấp:
  - Thông tin lịch hẹn liên quan
  - Lịch sử chat giữa 2 người
  - Thông tin QR/OTP xác nhận
  - Xác nhận từng bên
- [ ] Hành động quyết định:
  - Chuyển Time Credit cho người hỗ trợ (người hỗ trợ đúng)
  - Hoàn Time Credit cho người nhận (người nhận đúng)
  - Chia Time Credit (trường hợp lỗi cả hai)
  - Cảnh cáo / giảm điểm uy tín tài khoản vi phạm
  - Ghi chú lý do quyết định

**API backend cần:**
```
GET    /admin/disputes?page=0&size=20&status=OPEN
GET    /admin/disputes/{disputeId}
GET    /admin/disputes/{disputeId}/chat-history
POST   /admin/disputes/{disputeId}/resolve
```

---

#### MODULE 6 — Quản lý ví Time Credit (Wallet Management)

**Mục tiêu**: Xem tổng quan và phát hiện bất thường trong giao dịch Time Credit.

**Chức năng cần có:**
- [ ] Tổng quan hệ thống:
  - Tổng Time Credit đang lưu thông
  - Tổng đã được kiếm / đã được tiêu
  - Giao dịch hôm nay
- [ ] Danh sách tất cả giao dịch (phân trang, lọc)
- [ ] Tìm kiếm giao dịch theo user, loại, khoảng thời gian
- [ ] Xem lịch sử ví của từng user
- [ ] Phát hiện bất thường:
  - Hai tài khoản giao dịch quá nhiều với nhau
  - Tốc độ tích lũy Time Credit bất thường
- [ ] Điều chỉnh Time Credit thủ công (khi giải quyết tranh chấp)

**API backend cần:**
```
GET    /admin/wallet/overview
GET    /admin/wallet/transactions?page=0&size=20&userId=&type=
GET    /admin/wallet/anomalies
POST   /admin/wallet/adjust
```

---

#### MODULE 7 — Quản lý lịch hẹn (Appointment Management)

**Mục tiêu**: Xem toàn bộ lịch hẹn trong hệ thống, phục vụ kiểm tra khi có tranh chấp.

**Chức năng cần có:**
- [ ] Danh sách lịch hẹn: lọc theo trạng thái, ngày, người dùng
- [ ] Xem chi tiết lịch hẹn: người hỗ trợ, người nhận, nội dung, Time Credit, QR/OTP log
- [ ] Xem lịch sử xác nhận (ai xác nhận lúc mấy giờ)
- [ ] Thống kê: tỷ lệ hoàn thành, hủy, tranh chấp

**API backend cần:**
```
GET    /admin/appointments?page=0&size=20&status=&userId=
GET    /admin/appointments/{appointmentId}
GET    /admin/appointments/{appointmentId}/confirmation-log
GET    /admin/appointments/stats
```

---

#### MODULE 8 — Quản lý cộng đồng (Community Management)

**Mục tiêu**: Duyệt và quản lý hoạt động cộng đồng do tổ chức đăng.

**Chức năng cần có:**
- [ ] Danh sách hoạt động cộng đồng: lọc theo trạng thái
- [ ] Xem chi tiết hoạt động
- [ ] Phê duyệt / từ chối hoạt động
- [ ] Quản lý tổ chức (organization accounts)

**API backend cần:**
```
GET    /admin/community?page=0&size=20&status=
GET    /admin/community/{activityId}
POST   /admin/community/{activityId}/approve
POST   /admin/community/{activityId}/reject
```

---

#### MODULE 9 — Admin Auth (Xác thực quản trị viên)

**Mục tiêu**: Đăng nhập an toàn vào Admin Panel với tài khoản có role ADMIN.

**Chức năng cần có:**
- [ ] Trang đăng nhập riêng (email + password)
- [ ] JWT token lưu vào localStorage
- [ ] Auto redirect nếu chưa đăng nhập
- [ ] Đăng xuất (xoá token)
- [ ] Tự động refresh token (nếu cần)

**Lưu ý bảo mật:**
- Route `/admin/**` phải có `@PreAuthorize("hasRole('ADMIN')")` ở backend
- Admin Panel chạy trên port riêng (VD: localhost:5173), khác mobile

---

## 4. 🗺️ Kế hoạch triển khai (Road Map)

### Giai đoạn 1 — Setup & Foundation (Tuần 1)

- [ ] Khởi tạo project `ADMIN/` với Vite + React + TypeScript
- [ ] Cài đặt dependencies: React Router, Axios, TanStack Query, Zustand, Recharts, Lucide React
- [ ] Tạo design system: CSS variables, typography, color palette, spacing
- [ ] Xây dựng layout cơ bản: Sidebar + Header + Content
- [ ] Setup Axios instance với JWT interceptor
- [ ] Module Auth: trang login + lưu token + redirect guard

### Giai đoạn 2 — Module cốt lõi (Tuần 2–3)

- [ ] **Dashboard**: stat cards + 3 biểu đồ cơ bản
- [ ] **User Management**: danh sách + chi tiết + hành động khoá/mở
- [ ] **Skill Management**: danh sách + ẩn/hiện + quản lý danh mục

### Giai đoạn 3 — Module xử lý vi phạm (Tuần 4)

- [ ] **Report Management**: danh sách + xem bằng chứng + xử lý
- [ ] **Dispute Management**: xem chi tiết + quyết định Time Credit

### Giai đoạn 4 — Module phụ & hoàn thiện (Tuần 5)

- [ ] **Wallet Management**: tổng quan + danh sách giao dịch + anomaly detection
- [ ] **Appointment Management**: danh sách + chi tiết + confirmation log
- [ ] **Community Management**: duyệt hoạt động

### Giai đoạn 5 — Polish & Deploy (Tuần 6)

- [ ] Responsive design (admin trên tablet)
- [ ] Toast notifications, loading states, error handling
- [ ] Build production + cấu hình CORS cho URL deploy
- [ ] Kiểm thử tất cả module

---

## 5. 🔧 Backend cần bổ sung

> Backend hiện tại có `AdminController.java` nhưng chưa có endpoint nào. Cần implement song song với frontend.

### Thứ tự ưu tiên implement API backend

1. **Admin Auth** — Dùng lại `/auth/login` hiện tại (đảm bảo role ADMIN check)
2. **Dashboard stats** — Đơn giản, chỉ cần aggregate data
3. **User CRUD** — Xem danh sách + ban/unban
4. **Skill management** — Ẩn, xoá, duyệt
5. **Report + Dispute** — Phức tạp nhất, cần xử lý nghiệp vụ Time Credit

### Lưu ý Security Backend

```java
// Thêm annotation này vào AdminController
@PreAuthorize("hasRole('ADMIN')")
```

---

## 6. 📐 Design System

### Màu sắc chủ đạo (dark mode)

```css
--primary: #6366f1;         /* Indigo — main action */
--primary-dark: #4f46e5;
--danger: #ef4444;          /* Red — ban, delete */
--warning: #f59e0b;         /* Amber — warn, pending */
--success: #10b981;         /* Emerald — approve, active */
--surface: #1e1e2e;         /* Dark surface */
--surface-2: #2a2a3e;       /* Elevated surface */
--text: #e2e8f0;
--text-muted: #94a3b8;
--border: rgba(255,255,255,0.08);
```

### Layout tổng quát

```
┌────────────────────────────────────────┐
│ HEADER (logo + admin name + logout)    │
├──────────┬─────────────────────────────┤
│          │                             │
│ SIDEBAR  │  MAIN CONTENT AREA         │
│ (240px)  │                             │
│          │  [Stat][Stat][Stat][Stat]   │
│ Dashboard│                             │
│ Users    │  [Chart / Table]            │
│ Skills   │                             │
│ Reports  │                             │
│ Disputes │                             │
│ Wallet   │                             │
│ Appts    │                             │
│ Community│                             │
└──────────┴─────────────────────────────┘
```

---

## 7. 📎 Tài liệu tham chiếu trong dự án

- [HourLink_Knowledge_Base.md](v:\JavaSpringBoot\hourlink\BE\docs\HourLink_Knowledge_Base.md) — §11, §15, §16
- [SecurityConfig.java](v:\JavaSpringBoot\hourlink\BE\src\main\java\com\hourlink\config\SecurityConfig.java) — CORS config
- [AdminController.java](v:\JavaSpringBoot\hourlink\BE\src\main\java\com\hourlink\admin\controller\AdminController.java) — TODO endpoints
- [FE/src/api/axiosInstance.ts](v:\JavaSpringBoot\hourlink\FE\src\api\axiosInstance.ts) — Axios pattern tham khảo
