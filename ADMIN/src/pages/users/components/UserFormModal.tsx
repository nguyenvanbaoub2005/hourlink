import React, { useState, useEffect, useRef } from 'react';
import { usersApi } from '@/api/users';
import toast from 'react-hot-toast';
import { X, Upload, Loader2, User } from 'lucide-react';
import RegionPicker from '@/pages/skills/components/RegionPicker';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: 'create' | 'edit';
  initialData?: any;
}

export default function UserFormModal({ isOpen, onClose, onSuccess, mode, initialData }: UserFormModalProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    avatarUrl: '',
    userType: 'individual',
    region: '',
    occupation: '',
    bio: '',
    isVerified: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      if (mode === 'edit' && initialData) {
        setFormData({
          fullName: initialData.fullName || '',
          email: initialData.email || '',
          phone: initialData.phone || '',
          password: '',
          avatarUrl: initialData.avatarUrl || '',
          userType: initialData.userType || 'individual',
          region: initialData.region || '',
          occupation: initialData.occupation || '',
          bio: initialData.bio || '',
          isVerified: initialData.verified ?? true
        });
      } else {
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          password: '',
          avatarUrl: '',
          userType: 'individual',
          region: '',
          occupation: '',
          bio: '',
          isVerified: true
        });
      }
    }
  }, [isOpen, mode, initialData]);

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Họ và tên không được để trống';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email không được để trống';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Email không đúng định dạng (VD: name@example.com)';
    }
    if (formData.phone.trim() && !/^[0-9+()\s-]{9,15}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Số điện thoại không đúng định dạng (từ 9 đến 15 chữ số)';
    }
    if (mode === 'create') {
      if (!formData.password) {
        newErrors.password = 'Mật khẩu không được để trống';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Mật khẩu phải có tối thiểu 8 ký tự';
      }
    }
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      if (mode === 'create') {
        await usersApi.createUser(formData);
        toast.success('Đã thêm người dùng mới thành công!');
      } else {
        await usersApi.updateUser(initialData.id, formData);
        toast.success('Đã cập nhật thông tin người dùng thành công!');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra!');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh hợp lệ (JPG, PNG, ...)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Kích thước ảnh tối đa là 10MB');
      return;
    }

    try {
      setIsUploading(true);
      const url = await usersApi.uploadAvatar(file);
      setFormData(prev => ({ ...prev, avatarUrl: url }));
      toast.success('Đã tải ảnh đại diện lên thành công!');
    } catch (error: any) {
      toast.error('Lỗi tải ảnh: ' + (error.response?.data?.message || 'Có lỗi xảy ra'));
    } finally {
      setIsUploading(false);
      // Reset input value so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">
            {mode === 'create' ? 'Thêm Người dùng mới' : 'Chỉnh sửa Thông tin'}
          </h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="user-form" onSubmit={handleSubmit} noValidate className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Ảnh đại diện</label>
                <div className="flex items-center gap-4">
                  <div 
                    className="w-20 h-20 rounded-full border-2 border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:border-primary transition"
                    onClick={() => formData.avatarUrl && setPreviewImage(formData.avatarUrl)}
                  >
                    {formData.avatarUrl ? (
                      <img src={formData.avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                    ) : (
                      <User className="text-slate-400" size={32} />
                    )}
                  </div>
                  <div className="flex-1">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handleAvatarUpload} 
                    />
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition disabled:opacity-50"
                    >
                      {isUploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                      {isUploading ? 'Đang tải lên...' : 'Chọn ảnh'}
                    </button>
                    <p className="text-[12px] text-slate-500 mt-1">Hỗ trợ JPG, PNG, WEBP. Tối đa 10MB.</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Họ và tên <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm outline-none transition ${errors.fullName ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary'}`} 
                  value={formData.fullName} 
                  onChange={e => { setFormData({...formData, fullName: e.target.value}); if (errors.fullName) setErrors({...errors, fullName: ''}); }} 
                />
                {errors.fullName && <p className="text-xs text-red-500 mt-1 font-medium">{errors.fullName}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email <span className="text-red-500">*</span></label>
                <input 
                  type="email" 
                  className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm outline-none transition ${errors.email ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary'}`} 
                  value={formData.email} 
                  onChange={e => { setFormData({...formData, email: e.target.value}); if (errors.email) setErrors({...errors, email: ''}); }} 
                />
                {errors.email && <p className="text-xs text-red-500 mt-1 font-medium">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Số điện thoại</label>
                <input 
                  type="tel" 
                  className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm outline-none transition ${errors.phone ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary'}`} 
                  value={formData.phone} 
                  onChange={e => { setFormData({...formData, phone: e.target.value}); if (errors.phone) setErrors({...errors, phone: ''}); }} 
                />
                {errors.phone && <p className="text-xs text-red-500 mt-1 font-medium">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Loại tài khoản</label>
                <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                  value={formData.userType} onChange={e => setFormData({...formData, userType: e.target.value})}>
                  <option value="individual">Cá nhân</option>
                  <option value="organization">Tổ chức</option>
                </select>
              </div>

              {mode === 'create' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Mật khẩu <span className="text-red-500">*</span></label>
                  <input 
                    type="password" 
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm outline-none transition ${errors.password ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary'}`} 
                    placeholder="Tối thiểu 8 ký tự"
                    value={formData.password} 
                    onChange={e => { setFormData({...formData, password: e.target.value}); if (errors.password) setErrors({...errors, password: ''}); }} 
                  />
                  {errors.password && <p className="text-xs text-red-500 mt-1 font-medium">{errors.password}</p>}
                </div>
              )}

              <div>
                <RegionPicker
                  label="Khu vực"
                  value={formData.region}
                  onChange={val => setFormData({...formData, region: val})}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nghề nghiệp / Lĩnh vực</label>
                <input type="text" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition" 
                  value={formData.occupation} onChange={e => setFormData({...formData, occupation: e.target.value})} />
              </div>

              {mode === 'edit' && (
                <div className="md:col-span-2 flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <input type="checkbox" id="isVerified" className="w-4 h-4 text-primary rounded focus:ring-primary border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    checked={formData.isVerified} onChange={e => setFormData({...formData, isVerified: e.target.checked})} disabled={initialData?.verified} />
                  <label htmlFor="isVerified" className={`text-sm font-semibold ${initialData?.verified ? 'text-slate-500 cursor-not-allowed' : 'text-slate-700 cursor-pointer'}`}>
                    {initialData?.verified ? 'Tài khoản đã được xác thực (không thể huỷ)' : 'Xác thực danh tính cho tài khoản này'}
                  </label>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Tiểu sử (Bio)</label>
                <textarea className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition resize-y min-h-[80px]" 
                  value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} />
              </div>
            </div>
          </form>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} disabled={loading} className="px-5 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50">
            Hủy
          </button>
          <button type="submit" form="user-form" disabled={loading} className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-primary hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center gap-2">
            {loading ? 'Đang xử lý...' : 'Lưu thông tin'}
          </button>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <button 
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-2 transition"
            onClick={() => setPreviewImage(null)}
          >
            <X size={24} />
          </button>
          <img 
            src={previewImage} 
            alt="Full Preview" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={e => e.stopPropagation()} 
          />
        </div>
      )}
    </div>
  );
}
