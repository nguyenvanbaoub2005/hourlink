import { useState, useEffect } from 'react';
import { X, Loader2, Tag } from 'lucide-react';
import { skillsApi, type AdminCategoryResponse } from '@/api/skills';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: 'create' | 'edit';
  initialData?: AdminCategoryResponse | null;
}

export default function CategoryFormModal({ isOpen, onClose, onSuccess, mode, initialData }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      if (mode === 'edit' && initialData) {
        setName(initialData.name);
        setDescription(initialData.description || '');
      } else {
        setName('');
        setDescription('');
      }
    }
  }, [isOpen, mode, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Vui lòng nhập tên danh mục'); return; }
    setError('');
    setLoading(true);
    try {
      if (mode === 'edit' && initialData) {
        await skillsApi.updateCategory(initialData.id, { name: name.trim(), description: description.trim() || undefined });
        toast.success('Đã cập nhật danh mục thành công!');
      } else {
        await skillsApi.createCategory({ name: name.trim(), description: description.trim() || undefined });
        toast.success('Đã thêm danh mục mới thành công!');
      }
      onSuccess();
      onClose();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Tag className="text-primary" size={18} />
            </div>
            <h2 className="font-bold text-slate-800 text-lg">
              {mode === 'create' ? 'Thêm danh mục mới' : 'Chỉnh sửa danh mục'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Tên danh mục <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); if (error) setError(''); }}
              maxLength={100}
              placeholder="Vd: Lập trình web, Ngoại ngữ..."
              className={`w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-sm outline-none transition ${error ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20'}`}
            />
            {error && <p className="text-xs text-red-500 mt-1 font-medium">{error}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mô tả</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Mô tả ngắn về danh mục này..."
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition resize-none"
            />
            <p className="text-right text-xs text-slate-400 mt-1">{description.length}/500</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={loading} className="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition disabled:opacity-50">
              Huỷ
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {mode === 'create' ? 'Tạo danh mục' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
