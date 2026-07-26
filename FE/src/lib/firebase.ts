import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signOut } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  collection,
  doc,
  query,
  orderBy,
  limit,
  onSnapshot,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore';
import { FIREBASE_CONFIG, IS_FIREBASE_CONFIGURED } from '@constants/Config';
import ChatApi from '@api/chat';

/**
 * Lớp Firebase cho chat realtime (chức năng 9.10).
 *
 * Kiến trúc: backend là nơi ghi duy nhất (REST → MySQL → mirror sang Firestore).
 * App chỉ ĐỌC realtime từ Firestore. Nếu Firebase chưa cấu hình, mọi hàm ở đây
 * đều trả về no-op và màn hình chat tự động lùi về chế độ REST + polling.
 */

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let signedIn = false;

/** Khởi tạo Firebase App + Firestore (chỉ chạy một lần) */
function ensureApp(): FirebaseApp | null {
  if (!IS_FIREBASE_CONFIGURED) return null;
  if (app) return app;

  app = getApps().length ? getApp() : initializeApp(FIREBASE_CONFIG);

  try {
    // React Native cần long-polling: WebChannel của Firestore không ổn định
    // trên Hermes/Expo Go, dễ treo ở trạng thái "connecting".
    db = initializeFirestore(app, { experimentalForceLongPolling: true });
  } catch {
    // initializeFirestore ném lỗi nếu đã được gọi trước đó → lấy instance sẵn có
    db = getFirestore(app);
  }

  return app;
}

/**
 * Đăng nhập Firebase bằng custom token do backend cấp.
 * uid trên Firebase chính là ID người dùng trong MySQL, nhờ vậy Firestore Rules
 * đối chiếu được request.auth.uid với mảng participants của hội thoại.
 *
 * @returns true nếu realtime sẵn sàng
 */
export async function initFirebaseAuth(): Promise<boolean> {
  if (!ensureApp()) return false;
  if (signedIn) return true;

  try {
    const res = await ChatApi.getFirebaseToken();
    const data = res.data?.data;

    if (!data?.enabled || !data?.token) {
      console.log('[firebase] Backend chưa bật Firebase — chat chạy ở chế độ REST');
      return false;
    }

    await signInWithCustomToken(getAuth(app!), data.token);
    signedIn = true;
    console.log('[firebase] Đã đăng nhập, realtime sẵn sàng');
    return true;
  } catch (e: any) {
    console.log('[firebase] Đăng nhập thất bại:', e?.message ?? e);
    return false;
  }
}

/** Đăng xuất Firebase — gọi khi người dùng logout khỏi HourLink */
export async function signOutFirebase(): Promise<void> {
  if (!app || !signedIn) return;
  try {
    await signOut(getAuth(app));
  } catch {
    // bỏ qua — không được để lỗi Firebase làm hỏng luồng logout
  }
  signedIn = false;
}

/** Realtime có đang khả dụng không */
export function isRealtimeReady(): boolean {
  return Boolean(db) && signedIn;
}

/**
 * Lắng nghe tin nhắn của một cuộc trò chuyện theo thời gian thực.
 * @returns hàm huỷ đăng ký, hoặc null nếu realtime không khả dụng
 */
export function listenToMessages(
  conversationId: string,
  onChange: (messages: any[]) => void,
  max = 100
): Unsubscribe | null {
  if (!db || !signedIn) return null;

  const q = query(
    collection(doc(db, 'conversations', conversationId), 'messages'),
    orderBy('createdAt', 'desc'),
    limit(max)
  );

  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => d.data())),
    (err) => console.log('[firebase] Lỗi nghe tin nhắn:', err.message)
  );
}

/**
 * Lắng nghe thay đổi tóm tắt của một cuộc trò chuyện (tin cuối, số chưa đọc).
 * Dùng ở màn danh sách để badge cập nhật ngay không cần refresh.
 */
export function listenToConversation(
  conversationId: string,
  onChange: (data: any) => void
): Unsubscribe | null {
  if (!db || !signedIn) return null;

  return onSnapshot(
    doc(db, 'conversations', conversationId),
    (snap) => {
      if (snap.exists()) onChange(snap.data());
    },
    (err) => console.log('[firebase] Lỗi nghe hội thoại:', err.message)
  );
}
