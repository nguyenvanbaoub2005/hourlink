import { useState, useEffect, useRef } from 'react';
import { X, Loader2, HelpCircle, Search } from 'lucide-react';
import { helpRequestsApi } from '@/api/helpRequests';
import { skillsApi, type AdminCategoryResponse } from '@/api/skills';
import { usersApi, type AdminUserResponse } from '@/api/users';
import type { AdminHelpRequestDetailResponse } from '@/api/helpRequests';
import FreeTimePicker from './FreeTimePicker';
import RegionPicker from './RegionPicker';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: 'create' | 'edit';
  initialData?: AdminHelpRequestDetailResponse | null;
  categories: AdminCategoryResponse[];
}

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
const TIME_CREDITS = [
  { value: '0.5', label: '0.5 TC (30 phút)', duration: '30' },
  { value: '1', label: '1 TC (60 phút)', duration: '60' },
  { value: '1.5', label: '1.5 TC (90 phút)', duration: '90' },
  { value: '2', label: '2 TC (120 phút)', duration: '120' },
];
const STATUSES = [
  { value: 'SEARCHING', label: 'Đang tìm' },
  { value: 'ASSIGNED', label: 'Đã ghép' },
  { value: 'COMPLETED', label: 'Hoàn tất' },
  { value: 'CANCELLED', label: 'Đã huỷ' },
];

export default function HelpRequestFormModal({ isOpen, onClose, onSuccess, mode, initialData, categories }: Props) {
  const [loading, setLoading] = useState(false);

  // User search
  const [nameSearch, setNameSearch] = useState('');
  const [emailSearch, setEmailSearch] = useState('');
  const [userResults, setUserResults] = useState<AdminUserResponse[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUserResponse | null>(null);
  const [userSearching, setUserSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Form fields
  const [form, setForm] = useState({
    title: '',
    description: '',
    categoryId: '',
    currentLevel: '',
    format: '',
    desiredTime: '',
    duration: '',
    region: '',
    timeCreditAmount: '1',
    status: 'SEARCHING',
  });

  useEffect(() => {
    if (isOpen) {
      setNameSearch(''); setEmailSearch(''); setUserResults([]); setSelectedUser(null);
      if (mode === 'edit' && initialData) {
        setForm({
          title: initialData.title || '',
          description: initialData.description || '',
          categoryId: '',
          currentLevel: initialData.currentLevel || '',
          format: initialData.format || '',
          desiredTime: initialData.desiredTime || '',
          duration: initialData.duration?.toString() || '',
          region: initialData.region || '',
          timeCreditAmount: initialData.timeCreditAmount?.toString() || '1',
          status: initialData.status || 'SEARCHING',
        });
      } else {
        setForm({ title: '', description: '', categoryId: '', currentLevel: '', format: '', desiredTime: '', duration: '', region: '', timeCreditAmount: '1', status: 'SEARCHING' });
      }
    }
  }, [isOpen, mode, initialData]);

  const doSearch = async (name: string, email: string) => {
    if (!name.trim() && !email.trim()) { setUserResults([]); return; }
    setUserSearching(true);
    try {
      const res = await usersApi.getUsers(0, 10, name || '', email || '');
      setUserResults(res.content);
    } catch { /* ignore */ } finally {
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
    if (mode === 'create' && !selectedUser) { toast.error('Vui lòng chọn người yêu cầu hỗ trợ'); return; }
    if (!form.title.trim()) { toast.error('Tiêu đề không được để trống'); return; }

    setLoading(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        categoryId: form.categoryId || undefined,
        currentLevel: form.currentLevel.trim() || undefined,
        format: form.format || undefined,
        desiredTime: form.desiredTime.trim() || undefined,
        duration: form.duration ? parseInt(form.duration) : undefined,
        region: form.region.trim() || undefined,
        timeCreditAmount: form.timeCreditAmount ? parseFloat(form.timeCreditAmount) : 1,
        status: form.status || undefined,
      };

      if (mode === 'create') {
        await helpRequestsApi.createHelpRequest({ ...payload, requesterId: selectedUser!.id });
        toast.success('Đã tạo yêu cầu hỗ trợ mới thành công!');
      } else {
        await helpRequestsApi.updateHelpRequest(initialData!.id, { ...payload, categoryId: form.categoryId || null });
        toast.success('Đã cập nhật yêu cầu hỗ trợ thành công!');
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
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
              <HelpCircle className="text-amber-600" size={18} />
            </div>
            <h2 className="font-bold text-slate-800 text-lg">
              {mode === 'create' ? 'Tạo yêu cầu hỗ trợ mới' : 'Chỉnh sửa yêu cầu hỗ trợ'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          <form id="help-request-form" onSubmit={handleSubmit} className="p-6 space-y-5">

            {/* User picker (only for create) */}
            {mode === 'create' && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Người yêu cầu hỗ trợ <span className="text-red-500">*</span>
                </label>

                {selectedUser ? (
                  <div className="flex items-center gap-3 bg-white border border-amber-300 rounded-xl p-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 overflow-hidden shrink-0">
                      {selectedUser.avatarUrl
                        ? <img src={selectedUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-amber-600 font-bold">{selectedUser.fullName.charAt(0)}</div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{selectedUser.fullName}</p>
                      <p className="text-xs text-slate-500 truncate">{selectedUser.email}</p>
                    </div>
                    <button type="button" onClick={() => setSelectedUser(null)} className="text-xs text-red-500 hover:text-red-700 font-medium shrink-0">Đổi</button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                          type="text" value={nameSearch}
                          onChange={e => handleSearchChange('name', e.target.value)}
                          placeholder="Tìm theo tên..."
                          className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:border-amber-400 outline-none transition"
                        />
                      </div>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                          type="text" value={emailSearch}
                          onChange={e => handleSearchChange('email', e.target.value)}
                          placeholder="Tìm theo email..."
                          className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:border-amber-400 outline-none transition"
                        />
                      </div>
                    </div>
                    {userSearching && <p className="text-xs text-center text-slate-400 py-2">Đang tìm kiếm...</p>}
                    {!userSearching && userResults.length > 0 && (
                      <div className="bg-white border border-slate-200 rounded-xl max-h-44 overflow-y-auto divide-y divide-slate-100">
                        {userResults.map(u => (
                          <button key={u.id} type="button" onClick={() => setSelectedUser(u)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-amber-50 transition text-left">
                            <div className="w-8 h-8 rounded-full bg-amber-100 overflow-hidden shrink-0">
                              {u.avatarUrl
                                ? <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center text-amber-600 font-bold text-xs">{u.fullName.charAt(0)}</div>
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
              </div>
            )}

            {/* Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Tiêu đề <span className="text-red-500">*</span>
                </label>
                <input
                  type="text" required maxLength={255}
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Vd: Cần người dạy Python cơ bản..."
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mô tả</label>
                <textarea rows={3} value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Mô tả chi tiết yêu cầu..."
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Danh mục</label>
                <select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition">
                  <option value="">-- Không chọn --</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Trạng thái</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition">
                  {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Trình độ hiện tại</label>
                <input type="text" maxLength={100} value={form.currentLevel}
                  onChange={e => setForm({ ...form, currentLevel: e.target.value })}
                  placeholder="Vd: Mới bắt đầu..."
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Hình thức</label>
                <select value={form.format} onChange={e => setForm({ ...form, format: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition">
                  <option value="">-- Không chọn --</option>
                  {FORMATS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Thời lượng</label>
                <select
                  value={form.duration}
                  onChange={e => {
                    const dur = e.target.value;
                    const tcMatch = TIME_CREDITS.find(t => t.duration === dur);
                    setForm({
                      ...form,
                      duration: dur,
                      timeCreditAmount: tcMatch ? tcMatch.value : form.timeCreditAmount,
                    });
                  }}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                >
                  <option value="">-- Không chọn --</option>
                  {DURATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tín dụng thời gian (TC)</label>
                <select
                  value={form.timeCreditAmount}
                  onChange={e => {
                    const tc = e.target.value;
                    const tcMatch = TIME_CREDITS.find(t => t.value === tc);
                    setForm({
                      ...form,
                      timeCreditAmount: tc,
                      duration: tcMatch ? tcMatch.duration : form.duration,
                    });
                  }}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                >
                  {TIME_CREDITS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
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
                  label="Thời gian mong muốn"
                  value={form.desiredTime}
                  onChange={val => setForm({ ...form, desiredTime: val })}
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
          <button type="submit" form="help-request-form" disabled={loading} className="flex-1 py-2.5 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50">
            {loading && <Loader2 size={16} className="animate-spin" />}
            {mode === 'create' ? 'Tạo yêu cầu' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  );
}
