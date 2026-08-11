import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { AdminCategoryResponse } from '@/api/skills';

interface CategoryEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string) => Promise<void>;
  category: AdminCategoryResponse | null;
}

export default function CategoryEditModal({
  isOpen, onClose, onSave, category,
}: CategoryEditModalProps) {
  const [name, setName] = useState(category?.name ?? '');
  const [description, setDescription] = useState(category?.description ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(category?.name ?? '');
      setDescription(category?.description ?? '');
      setError('');
    }
  }, [isOpen, category]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!name.trim()) { setError('Tên danh mục không được để trống'); return; }
    if (name.length > 100) { setError('Tên tối đa 100 ký tự'); return; }
    setLoading(true);
    setError('');
    try {
      await onSave(name.trim(), description.trim());
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Đã xảy ra lỗi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface border border-border rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-base font-bold text-text">Chỉnh sửa danh mục</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-2 text-text-muted hover:text-text transition">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-text mb-1.5">
              Tên danh mục <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder="Ví dụ: Lập trình"
              className="w-full px-3 py-2 bg-surface-2 border border-border rounded-xl text-sm text-text placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text mb-1.5">Mô tả</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn về danh mục..."
              rows={3}
              className="w-full px-3 py-2 bg-surface-2 border border-border rounded-xl text-sm text-text placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition resize-none"
            />
          </div>
          {error && <p className="text-xs text-danger">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 pt-0">
          <button onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-semibold text-text-muted bg-surface-2 hover:bg-border rounded-xl transition">
            Hủy
          </button>
          <button onClick={handleSave} disabled={loading} className="px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl transition disabled:opacity-60">
            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  );
}
