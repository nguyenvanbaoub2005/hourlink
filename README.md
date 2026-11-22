# 🕐 HourLink — Nền tảng Trao đổi Kỹ năng Thời gian

> **Đồ án Tốt nghiệp Đại học (Capstone Project)**  
> Nền tảng kết nối người có nhu cầu học kỹ năng và người sẵn sàng chia sẻ kiến thức theo hình thức trao đổi thời gian (Time Credit Exchange).

---

## 📋 Mục lục

- [Giới thiệu](#-giới-thiệu)
- [Kiến trúc hệ thống](#-kiến-trúc-hệ-thống)
- [Tính năng chính](#-tính-năng-chính)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
- [Hướng dẫn cài đặt & Chạy](#-hướng-dẫn-cài-đặt--chạy)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [Mô hình AI](#-mô-hình-ai)
- [CI/CD Pipeline](#-cicd-pipeline)
- [Thành viên nhóm](#-thành-viên-nhóm)

---

## 🎯 Giới thiệu

**HourLink** là ứng dụng di động (iOS & Android) cho phép người dùng:
- Đăng yêu cầu hỗ trợ kỹ năng (Dạy Toán, lập trình, thiết kế, ngoại ngữ...)
- AI tự động phân loại yêu cầu và gợi ý người hỗ trợ phù hợp nhất
- Thanh toán bằng **giờ tín dụng (time credit)** thay vì tiền mặt — giúp ai cũng có thể tham gia
- Chat realtime, xác nhận buổi học bằng mã QR, đánh giá sau mỗi buổi

---

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (iPhone / Android)                  │
│  React Native Expo 58  ·  Clean Architecture 3 lớp           │
│  Offline-First (SQLite)  ·  Material 3  ·  Dark Mode          │
└──────────────────────┬──────────────────────────────────────-┘
                       │ HTTPS / REST API
          ┌────────────┴────────────┐
          ▼                         ▼
┌──────────────────┐    ┌────────────────────┐
│  Spring Boot BE  │───▶│  FastAPI AI Server │
│  Port 8085       │    │  Port 8000          │
│  JWT Auth        │    │  SentenceTransformer│
│  Swagger UI      │    │  TF-IDF + LR        │
└────────┬─────────┘    └────────────────────┘
         │
    ┌────┴─────┐   ┌──────────────┐
    │ MySQL DB  │   │   Firebase   │
    │ Port 3308 │   │ (Chat RT)    │
    │ (Docker)  │   │ Firestore    │
    └───────────┘   └──────────────┘
                    ┌──────────────┐
                    │  Cloudinary  │
                    │ (Media CDN)  │
                    └──────────────┘
```

---

## ✨ Tính năng chính

### 👤 Xác thực & Hồ sơ (BaaS + JWT)
- Đăng ký / Đăng nhập bằng Email hoặc **Google & Apple ID qua Firebase Auth (BaaS)** (`POST /api/auth/social-login`)
- Tự động khởi tạo hồ sơ & ví **5.0 Time Credit** cho tài khoản mới đăng nhập lần đầu
- Hồ sơ cá nhân: ảnh đại diện, kỹ năng, lịch rảnh, điểm uy tín
- Phân quyền: **Cá nhân** (Individual), **Tổ chức** (Organization) & **Quản trị viên** (Admin)

### 🤖 Hệ sinh thái AI (Server-side ML + Gemini Streaming + On-Device AI)
- **Phân loại thông minh (Hybrid Classifier):** Nhập mô tả tự nhiên → AI tự phân loại danh mục kỹ năng (Lập trình / Ngôn ngữ / Thiết kế / Giáo dục...) với độ chính xác **~82%**
- **Gợi ý tự động:** AI tự điền tiêu đề, hình thức (Online/Offline), khung giờ từ câu mô tả
- **Ghép đôi thông minh (MCDM):** Xếp hạng danh sách người hỗ trợ theo 3 tiêu chí:
  - **60%** Độ khớp ngữ nghĩa (Cosine Similarity)
  - **20%** Lịch rảnh trùng khớp
  - **20%** Điểm uy tín (Rating)
- **Explainable AI (XAI):** Giải thích lý do gợi ý bằng ngôn ngữ tự nhiên
- **Chatbot Trợ lý AI HourLink (Gemini Streaming SSE):** Trả lời theo luồng thời gian thực (`POST /api/ai-chat/stream`) giải đáp quy trình Time Credit, lịch hẹn QR/OTP, kèm cơ chế tự động fallback sang bộ FAQ thông minh khi offline
- **On-Device AI (ML Kit OCR + EdgeVision):** Chạy trực tiếp trên thiết bị (<10ms, 100% offline) khi tải ảnh chứng chỉ kỹ năng hoặc minh chứng hoạt động cộng đồng — tự động gắn nhãn (*Chứng chỉ/Văn bằng*, *Ảnh chụp màn hình*, *Ảnh hoạt động*, *Cảnh báo ảnh mờ*), chấm điểm độ nét (0–100) và gợi ý tên/ghi chú minh chứng

### 📅 Quản lý Lịch hẹn
- Tạo / Duyệt / Hủy lịch hẹn hỗ trợ
- **Xác nhận bằng mã QR** khi bắt đầu buổi học
- Lịch sử buổi học, đánh giá sao sau mỗi buổi

### 💬 Chat Realtime
- Nhắn tin 1-1 thời gian thực qua Firebase Firestore
- Gửi file, hình ảnh, tài liệu

### 💰 Ví Tín dụng Thời gian
- Nạp / Rút / Chuyển giờ tín dụng
- Lịch sử giao dịch chi tiết
- Thanh toán tự động sau mỗi buổi hỗ trợ hoàn thành

### 📱 Offline-First (Đọc Cache + Hàng đợi Ghi Offline)
- Dữ liệu lưu cục bộ bằng **SQLite** (`expo-sqlite`) ở chế độ WAL
- **Hàng đợi ghi ngoại tuyến (`offline_sync_queue`):** Cho phép đăng yêu cầu hỗ trợ & gửi đánh giá buổi học ngay cả khi mất mạng
- **Chính sách Retry thông minh (`queuePolicy.ts`):** Phân biệt lỗi mạng tạm thời với lỗi 4xx/5xx, tự động khôi phục tác vụ bị kẹt `SYNCING` và đồng bộ ngầm khi có mạng trở lại (`SyncManager`)
- **Banner cảnh báo nổi (`OfflineBanner`):** Hiển thị trạng thái mạng và số lượng thao tác đang chờ đồng bộ

### 🎨 UI/UX
- Hỗ trợ **Dark Mode** / Light Mode (tự động theo hệ thống)
- **Material 3** với `react-native-paper`
- Animation mượt với **Reanimated 4** (`react-native-reanimated`)
- Theme hệ thống động với ThemeContext

### 🔔 Thông báo
- Push notification qua `expo-notifications`
- Thông báo khi có yêu cầu mới, lịch hẹn được duyệt, nhắn tin

### 🏢 Bảng điều khiển Tổ chức
- Dashboard riêng cho tổ chức (trường học, trung tâm...)
- Quản lý thành viên, theo dõi hoạt động

---

## 🛠️ Công nghệ sử dụng

### Frontend (Mobile App)
| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| React Native + Expo | SDK 58 | Framework đa nền tảng iOS/Android |
| Expo Router | ~58.0.31 | File-based Navigation |
| TypeScript | ~6.0 | Type safety |
| Zustand | ^4.5 | State management |
| TanStack Query | ^5.0 | Server state & caching |
| Axios | ^1.7 | HTTP client |
| Firebase SDK | ^12 | Realtime chat |
| expo-sqlite | ~58.0 | Offline local database |
| react-native-paper | ^5.15 | Material 3 UI components |
| react-native-reanimated | 4.7.1 | 60fps animations |
| react-native-maps | 1.29.11 | Bản đồ chọn địa điểm |
| expo-camera | ~58.0 | Quét mã QR |

### Backend (REST API)
| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| Java Spring Boot | 3.x | REST API framework |
| Spring Security + JWT | - | Xác thực & phân quyền |
| Spring Data JPA + Hibernate | - | ORM / Database layer |
| MySQL | 8.0.40 | Cơ sở dữ liệu chính |
| Firebase Admin SDK | - | Gửi push notification |
| Cloudinary | - | Lưu trữ & CDN hình ảnh |
| Springdoc OpenAPI | - | Swagger UI documentation |
| Docker | - | Containerized MySQL |

### AI Server
| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| Python FastAPI | 0.110.0 | AI REST API framework |
| Sentence-Transformers | 2.5.1 | Semantic embedding (MiniLM-L12-v2) |
| scikit-learn | 1.4.1 | TF-IDF + Logistic Regression |
| Pandas + NumPy | - | Xử lý dataset |
| Pydantic | 2.6.4 | Data validation |

---

## 💻 Yêu cầu hệ thống

| Thành phần | Yêu cầu |
|------------|---------|
| Node.js | >= 22.13.0 (LTS) |
| Java JDK | >= 17 |
| Python | >= 3.10 |
| Docker Desktop | Mới nhất |
| Expo Go (iPhone/Android) | SDK 58 |
| Tài khoản Expo | Miễn phí tại [expo.dev](https://expo.dev) |

---

## 🚀 Hướng dẫn cài đặt & Chạy

### Bước 0 — Clone & chuẩn bị

```bash
git clone https://github.com/nguyenvanbaoub2005/hourlink.git
cd hourlink
git checkout develop
```

### Bước 1 — Khởi động MySQL (Docker)

```bash
cd BE
docker compose up -d mysql_db phpmyadmin
```

> phpMyAdmin: http://localhost:8081 (root / root)

### Bước 2 — Cấu hình môi trường

**Backend** — Tạo file `BE/.env`:
```env
DB_USERNAME=root
DB_PASSWORD=root
JWT_SIGNER_KEY=hourlink-super-secret-key-change-in-production
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Frontend** — Chỉnh sửa `FE/.env` với IP máy tính của bạn:
```env
EXPO_PUBLIC_API_URL=http://<YOUR_LOCAL_IP>:8085/api
```

> Lấy IP máy: `ifconfig | grep "inet "` (Mac/Linux) hoặc `ipconfig` (Windows)

### Bước 3 — Chạy 3 server (mở 3 Terminal riêng biệt)

**Terminal 1 — Backend (Spring Boot):**
```bash
cd BE && ./mvnw spring-boot:run
```

**Terminal 2 — AI Server (FastAPI):**
```bash
cd AI && ./venv/bin/python3 -m uvicorn main:app --reload --port 8000
```

**Terminal 3 — Frontend (Expo):**
```bash
cd FE && EXPO_TOKEN="<your_expo_token>" npx expo start -c
```

### Bước 4 — Mở app trên điện thoại

1. Cài **Expo Go** từ App Store / Google Play
2. Đăng nhập Expo Go cùng tài khoản với Expo CLI (cần thiết từ SDK 58)
3. Quét mã QR từ Terminal 3 bằng camera iPhone, hoặc dùng tab **Home** trong Expo Go

---

## 📁 Cấu trúc dự án

```
DACN2/
├── FE/                          # React Native Expo App
│   ├── app/                     # Expo Router (file-based routes)
│   │   ├── (auth)/              # Màn hình xác thực
│   │   ├── (tabs)/              # Tab navigation chính
│   │   └── _layout.tsx          # Root layout
│   └── src/
│       ├── domain/              # Clean Architecture — Lớp Domain
│       │   ├── entities/        # TypeScript models thuần túy
│       │   ├── repositories/    # Repository interfaces (contracts)
│       │   └── usecases/        # Business logic use cases
│       ├── data/                # Clean Architecture — Lớp Data
│       │   ├── repositories/    # Implementations của domain interfaces
│       │   └── mappers/         # API response → Domain entity
│       ├── offline/             # Offline-First layer
│       │   ├── database.ts      # SQLite schema & migrations
│       │   ├── syncManager.ts   # Background sync logic
│       │   ├── useOfflineData.ts# Offline data hooks
│       │   └── NetworkContext.tsx# Network state provider
│       ├── screens/             # UI Screens (Presentation layer)
│       │   ├── auth/            # Đăng nhập, đăng ký
│       │   ├── home/            # Trang chủ (Individual / Organization)
│       │   ├── helprequest/     # Yêu cầu hỗ trợ + AI Suggest
│       │   ├── appointment/     # Lịch hẹn + QR Scanner
│       │   ├── chat/            # Chat realtime
│       │   ├── wallet/          # Ví tín dụng
│       │   ├── skill/           # Quản lý kỹ năng
│       │   └── profile/         # Hồ sơ cá nhân
│       ├── components/          # Shared UI components
│       ├── theme/               # Theme system (Dark/Light)
│       │   ├── ThemeContext.tsx  # Theme provider
│       │   ├── colors.ts        # Design tokens (M3 color roles)
│       │   └── motion.tsx       # Animation presets
│       ├── store/               # Zustand global stores
│       ├── api/                 # API layer (axios instances)
│       ├── hooks/               # Custom React hooks
│       └── constants/           # Config, types, utils
│
├── BE/                          # Spring Boot Backend
│   └── src/main/java/com/hourlink/
│       ├── auth/                # JWT, OAuth, security
│       ├── user/                # User management
│       ├── helprequest/         # Yêu cầu hỗ trợ
│       ├── appointment/         # Lịch hẹn
│       ├── aimatching/          # Gọi AI service
│       ├── chat/                # Firebase chat integration
│       ├── wallet/              # Ví tín dụng
│       ├── skill/               # Kỹ năng
│       ├── notification/        # Push notification
│       ├── rating/              # Đánh giá
│       ├── community/           # Cộng đồng
│       └── config/              # Security, CORS, Cloudinary
│
├── AI/                          # FastAPI AI Service
│   ├── main.py                  # API endpoints (/predict-category, /recommend)
│   ├── hybrid_classifier.py     # Hybrid Ensemble Classifier
│   ├── model_category.pkl       # Pre-trained model bundle (v3)
│   ├── docs/
│   │   └── hourlink_skill_dataset_v3.csv  # Training dataset (6471 mẫu)
│   └── requirements.txt
│
├── ADMIN/                       # Admin Dashboard (Vite + React)
├── docs/                        # Tài liệu dự án
│   ├── capstone-audit-plan.md   # Kế hoạch 5 tiêu chuẩn Capstone
│   └── CICD_FASTLANE_GUIDE.md   # Hướng dẫn CI/CD Fastlane
└── .github/workflows/           # GitHub Actions CI/CD
    ├── ci.yml                   # Build & Test pipeline
    └── fastlane-android-release.yml  # Android release pipeline
```

---

## 🤖 Mô hình AI

HourLink tích hợp một **AI Service độc lập** (FastAPI, port 8000) phục vụ 2 chức năng:

### Chức năng 1: Phân loại & Gợi ý thông minh (`POST /api/ai/predict-category`)
**Kiến trúc: Hybrid Ensemble Classifier (Mô hình kết hợp lai)**

| Nhánh | Thuật toán | Trọng số | Điểm mạnh |
|-------|-----------|----------|-----------|
| Nhánh 1 | TF-IDF (Word + Char n-gram) + Logistic Regression | 40% | Bắt tên kỹ năng chính xác, chịu lỗi chính tả/thiếu dấu |
| Nhánh 2 | Sentence-Transformer (MiniLM-L12-v2) + Logistic Regression | 60% | Hiểu ngữ cảnh, từ đồng nghĩa, câu tự nhiên |

**Kết quả thực nghiệm trên 6.471 mẫu kiểm tra (5-Fold):**
- TF-IDF thuần: **69.77%**
- Semantic thuần: **78.11%**
- **Hybrid (đang dùng): 81.76%** ✅

**Danh mục phân loại:** Lập trình · Ngôn ngữ · Thiết kế · Kinh doanh · Giáo dục · Sức khỏe · Nghệ thuật · Khác

### Chức năng 2: Gợi ý người hỗ trợ (`POST /api/ai/recommend`)
**Kiến trúc: Content-Based Recommendation + Multi-Criteria Decision Making (MCDM)**

$$\text{Match\%} = 60\% \times \text{Cosine Similarity} + 20\% \times \text{Lịch trùng} + 20\% \times \frac{\text{Rating}}{5}$$

Kèm theo **Explainable AI (XAI)** — tự động sinh câu giải thích lý do gợi ý.

### Chức năng 3: Chatbot Trợ lý AI Streaming (`POST /api/ai-chat/stream`)
- Kết nối **Google Gemini (`gemini-2.0-flash`)** qua giao thức **Server-Sent Events (SSE)** (`alt=sse`), stream từng cụm token về ứng dụng qua `expo/fetch` ReadableStream.
- Hỗ trợ cơ chế **Offline FAQ Fallback** có khả năng chuẩn hóa tiếng Việt không dấu để luôn trả lời mượt ngay cả khi chưa cấu hình `GEMINI_API_KEY`.

### Chức năng 4: On-Device AI (`FE/src/ai/onDeviceAi.ts`)
- **EdgeVision & ML Kit OCR Analyzer:** Phân tích đặc trưng hình học, mật độ điểm ảnh và nhận diện văn bản trên chứng chỉ/minh chứng ngay trên thiết bị.
- **Offline N-Gram Classifier:** Phân loại 8 danh mục kỹ năng và hình thức học (Online/Offline) trực tiếp trên Hermes JS Engine với độ trễ `~1ms`.

---

## 🧪 Kiểm thử Tự động (Unit & Integration Tests)

```bash
# Chạy 33 Jest Unit Tests cho Frontend (SSE parser, Offline Queue Policy, On-Device AI, Validation, Formatters)
cd FE && npm test

# Chạy JUnit 5 Tests cho Backend (Auth, AI Chat SSE, FAQ Fallback, Rating, Skill, Appointment...)
cd BE && ./mvnw test
```

---

## ⚙️ CI/CD Pipeline

### GitHub Actions (`/.github/workflows/`)

| Workflow | Trigger | Mô tả |
|----------|---------|--------|
| `ci.yml` | Push / PR vào `develop` | Lint, type-check, unit test |
| `fastlane-android-release.yml` | Push tag `v*` hoặc manual | Build APK/AAB và upload |

### EAS Build (Expo Application Services)

```bash
# Build APK cho test (Android)
npx eas-cli build -p android --profile preview

# Build AAB cho production (Google Play)
npx eas-cli build -p android --profile production
```

### Fastlane (`/FE/fastlane/`)
Tự động ký số, đóng gói và phân phối Android APK/AAB.

---

## 👥 Thành viên nhóm

| Họ tên | MSSV | Vai trò |
|--------|------|---------|
| Nguyễn Văn Bảo | - | Full-stack Developer, AI Engineer |

---

## 📄 API Documentation

Sau khi khởi động Backend, truy cập Swagger UI:
> **http://localhost:8085/api/swagger-ui.html**

---

## 📝 License

Dự án này thuộc sở hữu của nhóm phát triển và được thực hiện cho mục đích học thuật tại trường Đại học.
