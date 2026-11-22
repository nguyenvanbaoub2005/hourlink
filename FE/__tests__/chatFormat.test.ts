/// <reference types="jest" />
import { formatBytes, initialsOf } from '../src/utils/chatFormat';

describe('chatFormat', () => {
  it('formatBytes', () => {
    expect(formatBytes(undefined)).toBe('');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2 KB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
  });

  it('initialsOf lấy 2 chữ cái cuối của tên', () => {
    expect(initialsOf('Minh Nguyễn')).toBe('MN');
    expect(initialsOf('Nguyễn Văn Bảo')).toBe('VB');
    expect(initialsOf('bảo')).toBe('B');
    expect(initialsOf('')).toBe('?');
  });
});
