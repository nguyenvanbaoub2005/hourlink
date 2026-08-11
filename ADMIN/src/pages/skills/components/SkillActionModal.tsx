import { useState } from 'react';
import { AlertTriangle, EyeOff, Eye, Trash2, X } from 'lucide-react';

type ActionType = 'HIDE' | 'SHOW' | 'DELETE' | 'WARN';

interface SkillActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  actionType: ActionType;
  skillName: string;
}

const ACTION_CONFIG: Record<ActionType, {
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  requireReason: boolean;
  description: string;
}> = {
  HIDE: {
    label: 'Ẩn kỹ năng',
    icon: <EyeOff size={20} />,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    requireReason: false,
    description: 'Kỹ năng sẽ bị ẩn khỏi kết quả tìm kiếm và không còn hiển thị với người dùng khác.',
  },
  SHOW: {
    label: 'Hiện lại kỹ năng',
    icon: <Eye size={20} />,
    color: 'text-success',
    bgColor: 'bg-success/10',
    requireReason: false,
    description: 'Kỹ năng sẽ được hiển thị lại trên hệ thống.',
  },
  DELETE: {
    label: 'Xóa',
    icon: <Trash2 size={20} />,
    color: 'text-danger',
    bgColor: 'bg-danger/10',
    requireReason: false,
    description: 'Mục này sẽ bị xóa khỏi hệ thống. Không thể thực hiện nếu đang có lịch hẹn chưa hoàn tất.',
  },
  WARN: {
    label: 'Cảnh báo người đăng',
    icon: <AlertTriangle size={20} />,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    requireReason: true,
    description: 'Người đăng sẽ nhận email cảnh báo vi phạm và tăng thêm 1 lần cảnh báo trên hệ thống.',
  },
};

export default function SkillActionModal({
  isOpen, onClose, onConfirm, actionType, skillName,
}: SkillActionModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const config = ACTION_CONFIG[actionType];

  const handleConfirm = async () => {
    if (config.requireReason && !reason.trim()) {
      setError('Vui lòng nhập lý do');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onConfirm(reason);
      setReason('');
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Đã xảy ra lỗi, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReason('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-surface border border-border rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${config.bgColor} ${config.color} flex items-center justify-center`}>
              {config.icon}
            </div>
            <h3 className="text-base font-bold text-text">{config.label}</h3>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-surface-2 text-text-muted hover:text-text transition">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="p-3 bg-surface-2 rounded-xl">
            <p className="text-xs text-text-muted mb-1">Tên mục xử lý</p>
            <p className="text-sm font-semibold text-text">{skillName}</p>
          </div>

          <p className="text-sm text-text-muted leading-relaxed">{config.description}</p>

          {config.requireReason && (
            <div>
              <label className="block text-sm font-semibold text-text mb-2">
                Lý do <span className="text-danger">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => { setReason(e.target.value); setError(''); }}
                placeholder={actionType === 'WARN'
                  ? 'Ví dụ: Kỹ năng có nội dung không phù hợp, thông tin sai lệch...'
                  : 'Nhập lý do xóa kỹ năng...'}
                rows={3}
                className="w-full px-3 py-2 bg-surface-2 border border-border rounded-xl text-sm text-text placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition resize-none"
              />
              {error && <p className="text-xs text-danger mt-1">{error}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 pt-0">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-text-muted bg-surface-2 hover:bg-border rounded-xl transition"
          >
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-semibold text-white rounded-xl transition disabled:opacity-60 ${
              actionType === 'DELETE' ? 'bg-danger hover:bg-danger/80'
              : actionType === 'WARN' ? 'bg-orange-500 hover:bg-orange-600'
              : actionType === 'HIDE' ? 'bg-warning hover:bg-warning/80'
              : 'bg-success hover:bg-success/80'
            }`}
          >
            {loading ? 'Đang xử lý...' : 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
}
