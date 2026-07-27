const ENV = {
  dev: {
    API_URL: 'http://192.168.1.62:8080/api',  // ← Đã tự động thay IP theo máy của bạn
  },
  prod: {
    API_URL: 'https://api.hourlink.vn/api',
  },
};

const getEnvVars = () => {
	if (__DEV__) return ENV.dev;
	return ENV.prod;
};

/**
 * Cấu hình Firebase — dùng cho chat realtime (chức năng 9.10).
 *
 * Lấy các giá trị này ở Firebase Console → Project settings → Your apps → Web app.
 * Đây là khoá công khai phía client, KHÔNG phải bí mật: quyền truy cập được
 * kiểm soát bằng Firestore Security Rules (xem BE/docs/FIREBASE_SETUP.md).
 *
 * Để trống nếu chưa tạo Firebase project — chat vẫn chạy qua REST, chỉ mất realtime.
 */
export const FIREBASE_CONFIG = {
	apiKey: 'AIzaSyDCHYS04eJWY9VZYyHhQ7LWnBlSpq7CbXA',
	authDomain: 'hourlink-41890.firebaseapp.com',
	projectId: 'hourlink-41890',
	storageBucket: 'hourlink-41890.firebasestorage.app',
	messagingSenderId: '596217560258',
	appId: '1:596217560258:web:8dd15b6e672742024f8f5b',
	measurementId: 'G-HL7CZ7L5J1',
};

/** Firebase đã được điền cấu hình hay chưa */
export const IS_FIREBASE_CONFIGURED = Boolean(
	FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId,
);

export default getEnvVars();
