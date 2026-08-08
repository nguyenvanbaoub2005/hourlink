import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ShieldAlert, BadgeCheck, Shield, MapPin, Briefcase, 
  Mail, Phone, AlertTriangle, Lock, Unlock, Save, Edit, X, KeyRound
} from 'lucide-react';
import { usersApi, type AdminUserDetailResponse } from '@/api/users';
import Modal from '@/components/ui/Modal';
import UserFormModal from './components/UserFormModal';
import toast from 'react-hot-toast';

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [user, setUser] = useState<AdminUserDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'wallet' | 'appointments' | 'reports' | 'actions'>('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [actionModal, setActionModal] = useState<{isOpen: boolean, type: 'WARN' | 'LOCK' | 'UNLOCK' | 'SOFT_DELETE' | null}>({isOpen: false, type: null});
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (id) fetchUserDetail(id);
  }, [id]);

  const fetchUserDetail = async (userId: string) => {
    setLoading(true);
    try {
      const userData = await usersApi.getUserDetail(userId);
      setUser(userData);
      setAdminNotes(userData.adminNotes || '');
    } catch (error) {
      console.error("Failed to fetch user details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!user) return;
    try {
      await usersApi.updateAdminNotes(user.id, adminNotes);
      toast.success('Đã lưu ghi chú thành công!');
    } catch (error) {
      console.error(error);
      toast.error('Có lỗi xảy ra khi lưu ghi chú!');
    }
  };

  const handleAction = (actionType: 'WARN' | 'LOCK' | 'UNLOCK' | 'SOFT_DELETE') => {
    setActionModal({ isOpen: true, type: actionType });
  };

  const executeAction = async () => {
    if (!user || !actionModal.type) return;
    try {
      await usersApi.performAction(user.id, actionModal.type, actionReason || "Hành động quản trị hệ thống");
      
      let successMsg = 'Hành động đã được thực hiện!';
      switch (actionModal.type) {
        case 'WARN': successMsg = 'Đã gửi cảnh cáo thành công!'; break;
        case 'LOCK': successMsg = 'Đã khoá tài khoản thành công!'; break;
        case 'UNLOCK': successMsg = 'Đã mở khoá tài khoản thành công!'; break;
        case 'SOFT_DELETE': successMsg = 'Đã xoá tài khoản thành công!'; break;
      }
      
      setActionModal({ isOpen: false, type: null });
      setActionReason('');
      toast.success(successMsg);
      fetchUserDetail(user.id);
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || 'Thao tác thất bại!';
      toast.error(msg);
      setActionModal({ isOpen: false, type: null });
      setActionReason('');
    }
  };

  const getModalConfig = () => {
    switch (actionModal.type) {
      case 'WARN': return { title: 'Cảnh cáo người dùng', message: 'Bạn có chắc muốn gửi cảnh cáo đến người dùng này?', type: 'warning' as const };
      case 'LOCK': return { title: 'Khoá tài khoản', message: 'Bạn có chắc muốn khoá tài khoản này? Người dùng sẽ không thể truy cập hệ thống.', type: 'danger' as const };
      case 'UNLOCK': return { title: 'Mở khoá tài khoản', message: 'Bạn có chắc muốn mở khoá cho tài khoản này?', type: 'primary' as const };
      case 'SOFT_DELETE': return { title: 'Xoá tài khoản', message: 'Hành động này sẽ xoá hoàn toàn tài khoản khỏi hệ thống. Bạn có chắc chắn không?', type: 'danger' as const };
      default: return { title: '', message: '', type: 'primary' as const };
    }
  };
  const modalConfig = getModalConfig();

  if (loading) return <div className="p-8 text-center text-text-muted">Đang tải thông tin...</div>;
  if (!user) return <div className="p-8 text-center text-danger">Không tìm thấy người dùng!</div>;

  return (
    <div className="flex flex-col gap-6 max-w-[1000px]">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/users')}
          className="flex items-center justify-center w-10 h-10 rounded-full text-text-muted transition hover:bg-surface-2 hover:text-text"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text mb-1">Chi tiết Người dùng</h1>
          <p className="text-sm text-text-muted">Xem và quản lý thông tin chi tiết</p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
        {/* Profile Header */}
        <div className="flex items-center gap-6 pb-6 border-b border-border mb-6">
          <div 
            className="w-20 h-20 rounded-full overflow-hidden shrink-0 shadow-sm border border-border cursor-pointer hover:opacity-90 transition"
            onClick={() => user.avatarUrl && setPreviewImage(user.avatarUrl)}
          >
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary/10 text-primary flex items-center justify-center text-3xl font-bold">
                {user.fullName.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-text">{user.fullName}</h2>
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition"
                title="Chỉnh sửa thông tin"
              >
                <Edit size={16} />
              </button>
              <button 
                onClick={() => setShowResetPasswordModal(true)}
                className="p-1.5 text-text-muted hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                title="Cấp lại mật khẩu"
              >
                <KeyRound size={16} />
              </button>
              {user.locked && <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-surface-2 rounded-md text-[13px] font-medium text-danger"><ShieldAlert size={14}/> Đã khoá</span>}
              {!user.locked && user.verified && <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-surface-2 rounded-md text-[13px] font-medium text-success"><BadgeCheck size={14}/> Đã xác thực</span>}
            </div>
            
            <div className="flex flex-wrap gap-4 text-sm text-text-muted">
              <div className="flex items-center gap-1.5"><Mail size={16}/> {user.email}</div>
              <div className="flex items-center gap-1.5"><Phone size={16}/> {user.phone || 'N/A'}</div>
              <div className="flex items-center gap-1.5"><MapPin size={16}/> {user.region || 'N/A'}</div>
              <div className="flex items-center gap-1.5"><Briefcase size={16}/> {user.occupation || 'N/A'}</div>
            </div>
          </div>
          
          <div className="flex gap-8 text-center">
            <div>
              <div className="text-2xl font-bold text-warning">{user.reputationScore.toFixed(1)}</div>
              <div className="text-xs text-text-muted mt-1">Điểm uy tín</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-text">{user.completedSessions}</div>
              <div className="text-xs text-text-muted mt-1">Đã hoàn thành</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-border mb-6">
          {[
            { id: 'overview', label: 'Tổng quan' },
            { id: 'wallet', label: 'Ví & Lịch sử' },
            { id: 'appointments', label: 'Buổi hẹn' },
            { id: 'reports', label: 'Báo cáo' },
            { id: 'actions', label: 'Quản trị' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 text-sm font-semibold relative transition ${activeTab === tab.id ? 'text-primary' : 'text-text-muted hover:text-text'}`}
            >
              {tab.label}
              {activeTab === tab.id && <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-primary rounded-t-sm" />}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="pt-2">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-base font-semibold text-text mb-4">Thông tin cơ bản</h3>
                <div className="bg-surface-2 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex justify-between pb-3 border-b border-border text-sm">
                    <span className="text-text-muted">Ngày tham gia:</span>
                    <span className="font-semibold text-text">{new Date(user.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <div className="flex justify-between pb-3 border-b border-border text-sm">
                    <span className="text-text-muted">Loại tài khoản:</span>
                    <span className="font-semibold text-text capitalize">{user.userType}</span>
                  </div>
                  <div className="flex justify-between pb-3 border-b border-border text-sm">
                    <span className="text-text-muted">Tỉ lệ huỷ hẹn:</span>
                    <span className="font-semibold text-warning">{user.cancelRate}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Số lần bị cảnh cáo:</span>
                    <span className={`font-semibold ${user.warningCount > 0 ? 'text-danger' : 'text-success'}`}>{user.warningCount}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-base font-semibold text-text mb-4">Tiểu sử (Bio)</h3>
                <div className="bg-surface-2 rounded-xl p-4 min-h-[100px] whitespace-pre-wrap text-sm text-text">
                  {user.bio || 'Chưa có thông tin.'}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'wallet' && <div className="text-center py-12 text-text-muted">Tính năng Lịch sử Ví & Giao dịch đang được phát triển...</div>}
          {activeTab === 'appointments' && <div className="text-center py-12 text-text-muted">Tính năng Lịch sử Buổi hẹn đang được phát triển...</div>}
          {activeTab === 'reports' && <div className="text-center py-12 text-text-muted">Tính năng Danh sách Báo cáo đang được phát triển...</div>}

          {activeTab === 'actions' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-base font-semibold text-text mb-1">Ghi chú nội bộ (Chỉ Admin)</h3>
                <p className="text-xs text-text-muted mb-3">Ghi chú này giúp đội ngũ Admin nắm bắt tình hình của user. Người dùng sẽ không thể nhìn thấy nội dung này.</p>
                <textarea
                  className="w-full h-32 p-3 bg-surface-2 border border-border rounded-lg text-sm text-text resize-y mb-4 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="Nhập ghi chú (VD: Đã gọi điện cảnh cáo, có dấu hiệu lừa đảo...)"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
                <button 
                  onClick={handleSaveNotes}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-semibold transition"
                >
                  <Save size={18} /> Lưu ghi chú
                </button>
              </div>

              <div>
                <h3 className="text-base font-semibold text-text mb-4">Hành động quản trị</h3>
                <div className="bg-surface-2 rounded-xl p-4 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-text mb-1">Gửi cảnh cáo</div>
                      <div className="text-xs text-text-muted">Gửi email cảnh cáo vi phạm chính sách</div>
                    </div>
                    <button 
                      onClick={() => handleAction('WARN')}
                      className="px-4 py-2 border border-warning text-warning hover:bg-warning/10 rounded-lg font-semibold text-sm transition"
                    >
                      Cảnh cáo
                    </button>
                  </div>
                  <div className="h-px bg-border my-1" />
                  
                  {user.locked ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-text mb-1">Mở khoá tài khoản</div>
                        <div className="text-xs text-text-muted">Khôi phục quyền truy cập ứng dụng</div>
                      </div>
                      <button 
                        onClick={() => handleAction('UNLOCK')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 border border-success text-success hover:bg-success/10 rounded-lg font-semibold text-sm transition"
                      >
                        <Unlock size={16}/> Mở khoá
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-danger mb-1">Khoá tài khoản</div>
                        <div className="text-xs text-text-muted">Ngăn chặn đăng nhập và sử dụng app</div>
                      </div>
                      <button 
                        onClick={() => handleAction('LOCK')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-danger hover:bg-danger-hover text-white rounded-lg font-semibold text-sm transition"
                      >
                        <Lock size={16}/> Khoá
                      </button>
                    </div>
                  )}

                  <div className="h-px bg-border my-1" />
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-danger mb-1">Xoá tài khoản</div>
                      <div className="text-xs text-text-muted">Xoá hoàn toàn tài khoản khỏi hệ thống</div>
                    </div>
                    <button 
                      onClick={() => handleAction('SOFT_DELETE')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 border border-danger text-danger bg-surface-3 hover:bg-danger/10 rounded-lg font-semibold text-sm transition"
                    >
                      <AlertTriangle size={16}/> Xoá
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal 
        isOpen={actionModal.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onConfirm={executeAction}
        onCancel={() => {
          setActionModal({ isOpen: false, type: null });
          setActionReason('');
        }}
        showInput={actionModal.type === 'WARN'}
        inputValue={actionReason}
        onInputChange={setActionReason}
        inputPlaceholder="Nhập lý do gửi cảnh cáo (VD: Đăng kỹ năng spam, thái độ không lịch sự...)"
      />

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

      <UserFormModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => fetchUserDetail(user.id)}
        mode="edit"
        initialData={user}
      />

      {/* Reset Password Confirm Modal */}
      {showResetPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <KeyRound className="text-amber-600" size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Cấp lại mật khẩu</h3>
                <p className="text-sm text-slate-500">Tài khoản: {user.fullName}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-1">
              Hệ thống sẽ tạo một mật khẩu mới ngẫu nhiên và <strong>gửi về email</strong> của người dùng:
            </p>
            <p className="text-sm font-semibold text-primary mb-5">{user.email}</p>
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg mb-5">
              ⚠️ Mật khẩu cũ sẽ không còn hiệu lực sau thao tác này.
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowResetPasswordModal(false)}
                disabled={isResetting}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition disabled:opacity-50"
              >
                Huỷ
              </button>
              <button 
                onClick={async () => {
                  setIsResetting(true);
                  try {
                    await usersApi.resetPassword(user.id);
                    toast.success('Đã cấp lại mật khẩu và gửi email thành công!');
                    setShowResetPasswordModal(false);
                  } catch (e: any) {
                    toast.error('Lỗi: ' + (e.response?.data?.message || 'Có lỗi xảy ra'));
                  } finally {
                    setIsResetting(false);
                  }
                }}
                disabled={isResetting}
                className="px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition flex items-center gap-2 disabled:opacity-50"
              >
                {isResetting ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <KeyRound size={15} />
                )}
                {isResetting ? 'Đang xử lý...' : 'Xác nhận cấp lại'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
