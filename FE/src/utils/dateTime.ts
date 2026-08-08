/** Hiển thị Instant từ BE theo giờ địa phương của thiết bị. */
export function formatDateTimeVi(value?: string | null): string {
  if (!value) return 'Không rõ thời gian';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Không rõ thời gian';

  const pad = (part: number) => String(part).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())} · ${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

/** Trả về một khung giờ địa phương trong tương lai, làm tròn lên mỗi 30 phút. */
export function getNextAppointmentSlot(from = new Date()): { date: string; time: string } {
  const slot = new Date(from.getTime() + 60 * 60 * 1000);
  slot.setSeconds(0, 0);

  const roundedMinutes = Math.ceil(slot.getMinutes() / 30) * 30;
  if (roundedMinutes >= 60) {
    slot.setHours(slot.getHours() + 1, 0, 0, 0);
  } else {
    slot.setMinutes(roundedMinutes, 0, 0);
  }

  const pad = (part: number) => String(part).padStart(2, '0');
  return {
    date: formatLocalDateInput(slot),
    time: `${pad(slot.getHours())}:${pad(slot.getMinutes())}`,
  };
}

/** Định dạng ngày theo múi giờ thiết bị, tránh lệch ngày do toISOString dùng UTC. */
export function formatLocalDateInput(date: Date): string {
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
