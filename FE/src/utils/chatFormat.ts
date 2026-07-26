/**
 * Tiện ích định dạng cho màn hình chat (chức năng 9.10).
 * Dự án không cài thư viện ngày tháng nên các hàm này viết tay.
 */

const WEEKDAYS = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

const two = (n: number) => String(n).padStart(2, '0');

/** Giờ:phút — dùng trong bong bóng tin nhắn. VD: "19:53" */
export function formatTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return `${two(d.getHours())}:${two(d.getMinutes())}`;
}

/**
 * Nhãn thời gian ở danh sách hội thoại:
 * hôm nay → "20:15", hôm qua → "Hôm qua", trong tuần → "Thứ 3", cũ hơn → "12/07"
 */
export function formatConversationTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';

  const now = new Date();
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const dayDiff = Math.round((startOfDay(now) - startOfDay(d)) / 86400000);

  if (dayDiff === 0) return `${two(d.getHours())}:${two(d.getMinutes())}`;
  if (dayDiff === 1) return 'Hôm qua';
  if (dayDiff < 7) return WEEKDAYS[d.getDay()];
  return `${two(d.getDate())}/${two(d.getMonth() + 1)}`;
}

/** Dải phân cách ngày giữa các nhóm tin nhắn */
export function formatDateSeparator(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';

  const now = new Date();
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const dayDiff = Math.round((startOfDay(now) - startOfDay(d)) / 86400000);

  if (dayDiff === 0) return 'Hôm nay';
  if (dayDiff === 1) return 'Hôm qua';
  return `${two(d.getDate())}/${two(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** Dung lượng file dễ đọc */
export function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Hai chữ cái đầu của tên, dùng cho avatar chữ. VD: "Minh Nguyễn" → "MN" */
export function initialsOf(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (
    parts[parts.length - 2].charAt(0) + parts[parts.length - 1].charAt(0)
  ).toUpperCase();
}

/** Bảng màu pastel cho avatar chữ — chọn ổn định theo tên */
const AVATAR_PALETTE = [
  { bg: '#D1FAE5', fg: '#047857' },
  { bg: '#FEF3C7', fg: '#B45309' },
  { bg: '#EDE9FE', fg: '#6D28D9' },
  { bg: '#FCE7F3', fg: '#BE185D' },
  { bg: '#DBEAFE', fg: '#1D4ED8' },
  { bg: '#FFE4E6', fg: '#BE123C' },
];

export function avatarColorOf(name?: string): { bg: string; fg: string } {
  if (!name) return AVATAR_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

/** Icon Ionicons phù hợp với loại tài liệu */
export function fileIconOf(originalName?: string): string {
  const ext = (originalName ?? '').split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf') return 'document-text';
  if (ext === 'doc' || ext === 'docx') return 'document';
  if (ext === 'ppt' || ext === 'pptx') return 'easel';
  return 'attach';
}
