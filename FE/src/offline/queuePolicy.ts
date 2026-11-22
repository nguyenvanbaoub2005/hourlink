/**
 * Chính sách hàng đợi ghi offline — thuần TypeScript (không import native module)
 * để có thể unit test bằng Jest.
 */

/** Số lần thử lại tối đa trước khi đánh dấu thao tác là FAILED. */
export const MAX_SYNC_RETRIES = 5;

export type QueueStatus = 'PENDING' | 'FAILED';

/** Lỗi do không có mạng / server không phản hồi (khác với server trả lỗi 4xx/5xx). */
export function isNetworkError(error: any): boolean {
  if (!error || error.response) return false;
  return (
    Boolean(error.request) ||
    error.code === 'ERR_NETWORK' ||
    error.code === 'ECONNABORTED' ||
    error.message === 'Network Error'
  );
}

/**
 * Lỗi vĩnh viễn: server đã nhận và từ chối (400, 403, 404, 409, 422...).
 * Thử lại cũng vô ích nên chuyển FAILED ngay. 401/408/429 vẫn được thử lại.
 */
export function isPermanentFailure(error: any): boolean {
  const status = error?.response?.status;
  return (
    typeof status === 'number' &&
    status >= 400 &&
    status < 500 &&
    status !== 401 &&
    status !== 408 &&
    status !== 429
  );
}

export interface SyncOutcome {
  status: QueueStatus;
  retryCount: number;
  /** true → đang mất mạng thật, nên dừng vòng đồng bộ thay vì thử tiếp các thao tác còn lại */
  stopSync: boolean;
}

/** Quyết định trạng thái kế tiếp của một thao tác vừa đồng bộ thất bại. */
export function resolveSyncOutcome(retryCount: number, error: any): SyncOutcome {
  if (isNetworkError(error)) {
    // Mất mạng không phải lỗi của thao tác → không tính vào số lần thử
    return { status: 'PENDING', retryCount, stopSync: true };
  }
  if (isPermanentFailure(error)) {
    return { status: 'FAILED', retryCount: retryCount + 1, stopSync: false };
  }
  const next = retryCount + 1;
  return { status: next >= MAX_SYNC_RETRIES ? 'FAILED' : 'PENDING', retryCount: next, stopSync: false };
}
