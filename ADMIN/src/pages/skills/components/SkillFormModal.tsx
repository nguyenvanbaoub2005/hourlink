import { useState, useEffect, useRef } from 'react';
import { X, Loader2, BookOpen, Search } from 'lucide-react';
import { skillsApi, type AdminSkillDetailResponse, type AdminCategoryResponse } from '@/api/skills';
import { usersApi, type AdminUserResponse } from '@/api/users';
import FreeTimePicker from './FreeTimePicker';
import RegionPicker from './RegionPicker';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: 'create' | 'edit';
  initialData?: AdminSkillDetailResponse | null;
  categories: AdminCategoryResponse[];
}

const LEVELS = [
  { value: 'BEGINNER', label: 'Sơ cấp' },
  { value: 'INTERMEDIATE', label: 'Trung cấp' },
  { value: 'ADVANCED', label: 'Nâng cao' },
  { value: 'EXPERT', label: 'Chuyên gia' },
];
const FORMATS = [
  { value: 'ONLINE', label: 'Trực tuyến' },
  { value: 'OFFLINE', label: 'Trực tiếp' },
  { value: 'BOTH', label: 'Cả hai' },
];
const DURATIONS = [
  { value: '30', label: '30 phút' },
  { value: '60', label: '60 phút' },
  { value: '90', label: '90 phút' },
  { value: '120', label: '120 phút' },
];
const STATUSES = [
  { value: 'VISIBLE', label: 'Hiển thị' },
  { value: 'HIDDEN', label: 'Ẩn' },
];

export default function SkillFormModal({ isOpen, onClose, onSuccess, mode, initialData, categories }: Props) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // User search
  const [nameSearch, setNameSearch] = useState('');
  const [emailSearch, setEmailSearch] = useState('');
  const [userResults, setUserResults] = useState<AdminUserResponse[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUserResponse | null>(null);
  const [userSearching, setUserSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Form fields
  const [form, setForm] = useState({
    name: '',
    description: '',
    categoryId: '',
    level: '',
    format: '',
    duration: '',
    freeTime: '',
    region: '',
    status: 'VISIBLE',
  });

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      setNameSearch(''); setEmailSearch(''); setUserResults([]); setSelectedUser(null);
      if (mode === 'edit' && initialData) {
        setForm({
          name: initialData.name || '',
          description: initialData.description || '',
          categoryId: initialData.categoryId || '',
          level: initialData.level || '',
          format: initialData.format || '',
          duration: initialData.duration?.toString() || '',
          freeTime: initialData.freeTime || '',
          region: initialData.region || '',
          status: initialData.status || 'VISIBLE',
        });
      } else {
        setForm({ name: '', description: '', categoryId: '', level: '', format: '', duration: '', freeTime: '', region: '', status: 'VISIBLE' });
      }
    }
  }, [isOpen, mode, initialData]);

  const doSearch = async (name: string, email: string) => {
    if (!name.trim() && !email.trim()) { setUserResults([]); return; }
    setUserSearching(true);
    try {
      const res = await usersApi.getUsers(0, 10, name || '', email || '');
      setUserResults(res.content);
    } catch {
      // ignore
    } finally {
      setUserSearching(false);
    }
  };

  const handleSearchChange = (field: 'name' | 'email', value: string) => {
    if (field === 'name') setNameSearch(value);
    else setEmailSearch(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      doSearch(field === 'name' ? value : nameSearch, field === 'email' ? value : emailSearch);
    }, 400);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (mode === 'create' && !selectedUser) {
      newErrors.user = 'Vui lòng tìm và chọn người sở hữu kỹ năng';
    }
    if (!form.name.trim()) {
      newErrors.name = 'Vui lòng nhập tên kỹ năng';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        categoryId: form.categoryId || undefined,
        level: form.level || undefined,
        format: form.format || undefined,
        duration: form.duration ? parseInt(form.duration) : undefined,
        freeTime: form.freeTime.trim() || undefined,
        region: form.region.trim() || undefined,
        status: form.status || undefined,
      };

      if (mode === 'create') {
        await skillsApi.createSkill({ ...payload, userId: selectedUser!.id });
        toast.success('Đã thêm kỹ năng mới thành công!');
      } else {
        await skillsApi.updateSkill(initialData!.id, { ...payload, categoryId: form.categoryId || null });
        toast.success('Đã cập nhật kỹ năng thành công!');
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="text-primary" size={18} />
            </div>
            <h2 className="font-bold text-slate-800 text-lg">
              {mode === 'create' ? 'Thêm kỹ năng mới' : 'Chỉnh sửa kỹ năng'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          <form id="skill-form" onSubmit={handleSubmit} noValidate className="p-6 space-y-5">

            {/* User picker (only for create) */}
            {mode === 'create' && (
              <div className={`bg-slate-50 rounded-xl p-4 border ${errors.user ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200'}`}>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Người sở hữu kỹ năng <span className="text-red-500">*</span>
                </label>

                {selectedUser ? (
                  <div className="flex items-center gap-3 bg-white border border-primary/30 rounded-xl p-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 overflow-hidden shrink-0">
                      {selectedUser.avatarUrl
                        ? <img src={selectedUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-primary font-bold">{selectedUser.fullName.charAt(0)}</div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{selectedUser.fullName}</p>
                      <p className="text-xs text-slate-500 truncate">{selectedUser.email}</p>
                    </div>
                    <button type="button" onClick={() => { setSelectedUser(null); if (errors.user) setErrors({...errors, user: ''}); }} className="text-xs text-red-500 hover:text-red-700 font-medium shrink-0">Đổi</button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                          type="text"
                          value={nameSearch}
                          onChange={e => handleSearchChange('name', e.target.value)}
                          placeholder="Tìm theo tên..."
                          className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:border-primary outline-none transition"
                        />
                      </div>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                          type="text"
                          value={emailSearch}
                          onChange={e => handleSearchChange('email', e.target.value)}
                          placeholder="Tìm theo email..."
                          className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:border-primary outline-none transition"
                        />
                      </div>
                    </div>
                    {userSearching && <p className="text-xs text-center text-slate-400 py-2">Đang tìm kiếm...</p>}
                    {!userSearching && userResults.length > 0 && (
                      <div className="bg-white border border-slate-200 rounded-xl max-h-44 overflow-y-auto divide-y divide-slate-100">
                        {userResults.map(u => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => { setSelectedUser(u); if (errors.user) setErrors({...errors, user: ''}); }}
                            className="w-full flex items-center gap-3 p-3 hover:bg-primary/5 transition text-left"
                          >
                            <div className="w-8 h-8 rounded-full bg-primary/10 overflow-hidden shrink-0">
                              {u.avatarUrl
                                ? <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center text-primary font-bold text-xs">{u.fullName.charAt(0)}</div>
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800 truncate">{u.fullName}</p>
                              <p className="text-xs text-slate-400 truncate">{u.email}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {!userSearching && (nameSearch || emailSearch) && userResults.length === 0 && (
                      <p className="text-xs text-center text-slate-400 py-2">Không tìm thấy người dùng</p>
                    )}
                  </>
                )}
                {errors.user && <p className="text-xs text-red-500 mt-2 font-medium">{errors.user}</p>}
              </div>
            )}

            {/* Skill info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Tên kỹ năng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text" maxLength={150}
                  value={form.name}
                  onChange={e => { setForm({ ...form, name: e.target.value }); if (errors.name) setErrors({...errors, name: ''}); }}
                  placeholder="Vd: Lập trình Python cơ bản"
                  className={`w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-sm outline-none transition ${errors.name ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20'}`}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1 font-medium">{errors.name}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mô tả</label>
                <textarea
                  rows={3} value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Mô tả chi tiết kỹ năng..."
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Danh mục</label>
                <select
                  value={form.categoryId}
                  onChange={e => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                >
                  <option value="">-- Không chọn --</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Trạng thái</label>
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                >
                  {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Trình độ</label>
                <select
                  value={form.level}
                  onChange={e => setForm({ ...form, level: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                >
                  <option value="">-- Không chọn --</option>
                  {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Hình thức</label>
                <select
                  value={form.format}
                  onChange={e => setForm({ ...form, format: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                >
                  <option value="">-- Không chọn --</option>
                  {FORMATS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Thời lượng</label>
                <select
                  value={form.duration}
                  onChange={e => setForm({ ...form, duration: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                >
                  <option value="">-- Không chọn --</option>
                  {DURATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>

              <div>
                <RegionPicker
                  label="Khu vực"
                  value={form.region}
                  onChange={val => setForm({ ...form, region: val })}
                />
              </div>

              <div className="md:col-span-2">
                <FreeTimePicker
                  label="Thời gian rảnh"
                  value={form.freeTime}
                  onChange={val => setForm({ ...form, freeTime: val })}
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex gap-3 shrink-0">
          <button type="button" onClick={onClose} disabled={loading} className="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition disabled:opacity-50">
            Huỷ
          </button>
          <button type="submit" form="skill-form" disabled={loading} className="flex-1 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50">
            {loading && <Loader2 size={16} className="animate-spin" />}
            {mode === 'create' ? 'Tạo kỹ năng' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  );
}
