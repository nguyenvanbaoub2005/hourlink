/// <reference types="jest" />
import {
  normalizePhone,
  validateConfirmPassword,
  validateEmail,
  validateFullName,
  validatePassword,
  validatePhone,
} from '../src/utils/validation';

describe('validation', () => {
  it('validateEmail', () => {
    expect(validateEmail('')).not.toBeNull();
    expect(validateEmail('abc')).not.toBeNull();
    expect(validateEmail('a@b.c')).not.toBeNull();
    expect(validateEmail(' user@hourlink.vn ')).toBeNull();
  });

  it('validatePhone: tùy chọn, chấp nhận 0xxxxxxxxx và +84', () => {
    expect(validatePhone('')).toBeNull();
    expect(validatePhone('0901 234 567')).toBeNull();
    expect(validatePhone('+84901234567')).toBeNull();
    expect(validatePhone('0201234567')).not.toBeNull();
    expect(normalizePhone('(090) 123-4567')).toBe('0901234567');
  });

  it('validatePassword', () => {
    expect(validatePassword('')).not.toBeNull();
    expect(validatePassword('12345')).not.toBeNull();
    expect(validatePassword('abc def')).not.toBeNull();
    expect(validatePassword('secret1')).toBeNull();
  });

  it('validateConfirmPassword', () => {
    expect(validateConfirmPassword('secret1', '')).not.toBeNull();
    expect(validateConfirmPassword('secret1', 'secret2')).not.toBeNull();
    expect(validateConfirmPassword('secret1', 'secret1')).toBeNull();
  });

  it('validateFullName', () => {
    expect(validateFullName('  ')).not.toBeNull();
    expect(validateFullName('A')).not.toBeNull();
    expect(validateFullName('Nguyễn Văn Bảo')).toBeNull();
  });
});
