/**
 * validation — Các hàm validate dùng chung cho form (đăng ký, đăng nhập, hồ sơ).
 * Mỗi hàm trả về message lỗi tiếng Việt, hoặc null nếu hợp lệ.
 */

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Số điện thoại VN: 0xxxxxxxxx hoặc +84xxxxxxxxx (đầu số 3,5,7,8,9) */
export const PHONE_REGEX = /^(0|\+84)(3|5|7|8|9)\d{8}$/;

/** BE yêu cầu @Size(min = 6) cho password */
export const PASSWORD_MIN_LENGTH = 6;

/** Bỏ khoảng trắng, dấu chấm, gạch ngang người dùng gõ trong số điện thoại */
export const normalizePhone = (raw: string): string => raw.replace(/[\s.\-()]/g, '');

export const validateFullName = (value: string): string | null => {
  const name = value.trim();
  if (!name) return 'Vui lòng nhập họ và tên';
  if (name.length < 2) return 'Họ và tên quá ngắn';
  if (name.length > 100) return 'Họ và tên tối đa 100 ký tự';
  return null;
};

export const validateEmail = (value: string): string | null => {
  const email = value.trim();
  if (!email) return 'Vui lòng nhập email';
  if (!EMAIL_REGEX.test(email)) return 'Email không đúng định dạng';
  return null;
};

/** Số điện thoại không bắt buộc — chỉ validate khi người dùng có nhập */
export const validatePhone = (value: string): string | null => {
  const phone = normalizePhone(value);
  if (!phone) return null;
  if (!PHONE_REGEX.test(phone)) return 'Số điện thoại không hợp lệ (VD: 0901234567)';
  return null;
};

export const validatePassword = (value: string): string | null => {
  if (!value) return 'Vui lòng nhập mật khẩu';
  if (value.length < PASSWORD_MIN_LENGTH) return `Mật khẩu phải có ít nhất ${PASSWORD_MIN_LENGTH} ký tự`;
  if (/\s/.test(value)) return 'Mật khẩu không được chứa khoảng trắng';
  return null;
};

export const validateConfirmPassword = (password: string, confirm: string): string | null => {
  if (!confirm) return 'Vui lòng nhập lại mật khẩu';
  if (password !== confirm) return 'Mật khẩu nhập lại không khớp';
  return null;
};
