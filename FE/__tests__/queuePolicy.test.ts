/// <reference types="jest" />
import {
  MAX_SYNC_RETRIES,
  isNetworkError,
  isPermanentFailure,
  resolveSyncOutcome,
} from '../src/offline/queuePolicy';

const httpError = (status: number) => ({ response: { status }, request: {} });
const networkError = { request: {}, message: 'Network Error', code: 'ERR_NETWORK' };

describe('isNetworkError', () => {
  it('nhận diện lỗi mạng (không có response)', () => {
    expect(isNetworkError(networkError)).toBe(true);
    expect(isNetworkError({ code: 'ECONNABORTED' })).toBe(true);
  });
  it('lỗi server trả về response thì không phải lỗi mạng', () => {
    expect(isNetworkError(httpError(500))).toBe(false);
    expect(isNetworkError(null)).toBe(false);
    expect(isNetworkError(new Error('boom'))).toBe(false);
  });
});

describe('isPermanentFailure', () => {
  it.each([400, 403, 404, 409, 422])('HTTP %i là lỗi vĩnh viễn', (status) => {
    expect(isPermanentFailure(httpError(status))).toBe(true);
  });
  it.each([401, 408, 429, 500, 503])('HTTP %i vẫn được thử lại', (status) => {
    expect(isPermanentFailure(httpError(status))).toBe(false);
  });
  it('lỗi mạng không phải lỗi vĩnh viễn', () => {
    expect(isPermanentFailure(networkError)).toBe(false);
  });
});

describe('resolveSyncOutcome', () => {
  it('mất mạng: giữ PENDING, không tăng retry, dừng đồng bộ', () => {
    expect(resolveSyncOutcome(2, networkError)).toEqual({ status: 'PENDING', retryCount: 2, stopSync: true });
  });
  it('lỗi 4xx: FAILED ngay, không dừng các thao tác khác', () => {
    expect(resolveSyncOutcome(0, httpError(400))).toEqual({ status: 'FAILED', retryCount: 1, stopSync: false });
  });
  it('lỗi 5xx: tăng retry, PENDING cho tới khi chạm giới hạn', () => {
    expect(resolveSyncOutcome(0, httpError(500))).toEqual({ status: 'PENDING', retryCount: 1, stopSync: false });
    expect(resolveSyncOutcome(MAX_SYNC_RETRIES - 1, httpError(500)).status).toBe('FAILED');
  });
});
