import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, ShieldAlert, BadgeCheck, MapPin, Briefcase, 
  Mail, Phone, AlertTriangle, Lock, Unlock, Save, Edit, X, KeyRound,
  Wallet as WalletIcon, Coins, LockKeyhole, History, CalendarDays, Flag,
  ChevronLeft, ChevronRight, ExternalLink
} from 'lucide-react';
import { usersApi, type AdminUserDetailResponse } from '@/api/users';
import { walletApi } from '@/api/wallet';
import { appointmentsApi, type AdminAppointment, type AppointmentStatus } from '@/api/appointments';
import { reportsApi, type AdminReport, type ReportStatus } from '@/api/reports';
import Modal from '@/components/ui/Modal';
import UserFormModal from './components/UserFormModal';
import toast from 'react-hot-toast';

const APPOINTMENT_STATUS: Record<AppointmentStatus, { label: string; className: string }> = {
  PENDING: { label: 'Chờ xác nhận', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  CONFIRMED: { label: 'Đã xác nhận', className: 'border-blue-200 bg-blue-50 text-blue-700' },
  UPCOMING: { label: 'Sắp tới', className: 'border-sky-200 bg-sky-50 text-sky-700' },
  IN_PROGRESS: { label: 'Đang diễn ra', className: 'border-violet-200 bg-violet-50 text-violet-700' },
  COMPLETED: { label: 'Hoàn thành', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  CANCELLED: { label: 'Đã hủy', className: 'border-red-200 bg-red-50 text-red-700' },
  DISPUTED: { label: 'Có vấn đề', className: 'border-orange-200 bg-orange-50 text-orange-700' },
  RESCHEDULED: { label: 'Đổi lịch', className: 'border-slate-200 bg-slate-100 text-slate-700' },
};

const REPORT_STATUS: Record<ReportStatus, { label: string; className: string }> = {
  PENDING: { label: 'Chờ xử lý', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  REVIEWING: { label: 'Đang xem xét', className: 'border-blue-200 bg-blue-50 text-blue-700' },
  RESOLVED: { label: 'Đã xử lý', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  DISMISSED: { label: 'Bỏ qua', className: 'border-slate-200 bg-slate-100 text-slate-600' },
};

const formatDateTime = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short',
}).format(new Date(value));

const formatAppointmentDate = (value: string) => new Intl.DateTimeFormat('vi-VN').format(new Date(`${value}T00:00:00`));

const getApiErrorStatus = (error: unknown) => (error as {
  response?: { data?: { status?: number } };
} | null)?.response?.data?.status;

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
  const [showInitializeWalletModal, setShowInitializeWalletModal] = useState(false);
  const [isInitializingWallet, setIsInitializingWallet] = useState(false);
  const [appointmentPage, setAppointmentPage] = useState(0);
  const [reportPage, setReportPage] = useState(0);

  const walletQuery = useQuery({
    queryKey: ['admin-user-wallet', id],
    queryFn: () => walletApi.getWalletDetail(id!),
    enabled: activeTab === 'wallet' && Boolean(id),
    retry: false,
  });
  const walletTransactionsQuery = useQuery({
    queryKey: ['admin-user-wallet-transactions', id],
    queryFn: () => walletApi.getTransactions({ page: 0, size: 6, userId: id! }),
    enabled: activeTab === 'wallet' && Boolean(id) && walletQuery.isSuccess,
  });
  const appointmentsQuery = useQuery({
    queryKey: ['admin-user-appointments', id, appointmentPage],
    queryFn: () => appointmentsApi.getAppointments({ page: appointmentPage, size: 6, userId: id! }),
    enabled: activeTab === 'appointments' && Boolean(id),
  });
  const reportsQuery = useQuery({
    queryKey: ['admin-user-reports', id, reportPage],
    queryFn: () => reportsApi.getReportsForUser(id!, reportPage, 6),
    enabled: activeTab === 'reports' && Boolean(id && user),
  });

  useEffect(() => {
    if (id) fetchUserDetail(id);
    setAppointmentPage(0);
    setReportPage(0);
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

  const handleInitializeWallet = async () => {
    if (!user || isInitializingWallet) return;
    setIsInitializingWallet(true);
    try {
      await walletApi.initializeWallet(user.id);
      await walletQuery.refetch();
      await walletTransactionsQuery.refetch();
      setShowInitializeWalletModal(false);
      toast.success('Đã khởi tạo ví với 5 Time Credit ban đầu');
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(message || 'Không thể khởi tạo ví người dùng');
    } finally {
      setIsInitializingWallet(false);
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
        case 'SOFT_DELETE': successMsg = 'Đã vô hiệu hóa tài khoản thành công!'; break;
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
      case 'SOFT_DELETE': return { title: 'Vô hiệu hóa tài khoản', message: 'Tài khoản sẽ được đánh dấu ngừng hoạt động (soft delete) và được giữ lại trong dữ liệu hệ thống. Bạn có chắc chắn không?', type: 'danger' as const };
      default: return { title: '', message: '', type: 'primary' as const };
    }
  };
  const modalConfig = getModalConfig();

  if (loading) return <div className="p-8 text-center text-text-muted">Đang tải thông tin...</div>;
  if (!user) return <div className="p-8 text-center text-danger">Không tìm thấy người dùng!</div>;

  return (
    <div className="flex w-full max-w-[1000px] flex-col gap-6">
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

      <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-6">
        {/* Profile Header */}
        <div className="mb-6 flex flex-col items-start gap-5 border-b border-border pb-6 lg:flex-row lg:items-center lg:gap-6">
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
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-3">
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
          
          <div className="grid w-full grid-cols-2 gap-4 text-center sm:w-auto lg:flex lg:gap-8">
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
        <div className="mb-6 flex gap-6 overflow-x-auto border-b border-border">
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
              className={`relative shrink-0 pb-3 text-sm font-semibold transition ${activeTab === tab.id ? 'text-primary' : 'text-text-muted hover:text-text'}`}
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

          {activeTab === 'wallet' && <UserWalletTab
            isLoading={walletQuery.isLoading || walletTransactionsQuery.isLoading}
            isError={walletQuery.isError || walletTransactionsQuery.isError}
            isMissing={walletQuery.isError && getApiErrorStatus(walletQuery.error) === 6001}
            canInitialize={!user.deleted}
            onInitialize={() => setShowInitializeWalletModal(true)}
            wallet={walletQuery.data}
            transactions={walletTransactionsQuery.data?.content ?? []}
          />}
          {activeTab === 'appointments' && <UserAppointmentsTab
            items={appointmentsQuery.data?.content ?? []}
            isLoading={appointmentsQuery.isLoading}
            isError={appointmentsQuery.isError}
            page={appointmentPage}
            totalPages={appointmentsQuery.data?.totalPages ?? 0}
            totalElements={appointmentsQuery.data?.totalElements ?? 0}
            onPageChange={setAppointmentPage}
            onOpenAll={() => navigate('/appointments')}
          />}
          {activeTab === 'reports' && <UserReportsTab
            userId={user.id}
            items={reportsQuery.data?.content ?? []}
            isLoading={reportsQuery.isLoading}
            isError={reportsQuery.isError}
            page={reportPage}
            totalPages={reportsQuery.data?.totalPages ?? 0}
            totalElements={reportsQuery.data?.totalElements ?? 0}
            onPageChange={setReportPage}
            onOpenAll={() => navigate('/reports')}
          />}

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
                      <div className="font-semibold text-danger mb-1">Vô hiệu hóa tài khoản</div>
                      <div className="text-xs text-text-muted">Soft delete: ngừng sử dụng nhưng vẫn giữ dữ liệu</div>
                    </div>
                    <button 
                      onClick={() => handleAction('SOFT_DELETE')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 border border-danger text-danger bg-surface-3 hover:bg-danger/10 rounded-lg font-semibold text-sm transition"
                    >
                      <AlertTriangle size={16}/> Vô hiệu hóa
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

      <Modal
        isOpen={showInitializeWalletModal}
        title="Khởi tạo ví Time Credit"
        message={`Tạo ví cho "${user.fullName}" với 5 TC ban đầu và ghi một giao dịch BONUS. Thao tác này thay đổi dữ liệu tài chính và sẽ được lưu lịch sử quản trị.`}
        confirmText={isInitializingWallet ? 'Đang khởi tạo...' : 'Khởi tạo ví'}
        cancelText="Hủy"
        type="warning"
        onConfirm={handleInitializeWallet}
        onCancel={() => !isInitializingWallet && setShowInitializeWalletModal(false)}
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

function UserWalletTab({
  isLoading,
  isError,
  isMissing,
  canInitialize,
  onInitialize,
  wallet,
  transactions,
}: {
  isLoading: boolean;
  isError: boolean;
  isMissing: boolean;
  canInitialize: boolean;
  onInitialize: () => void;
  wallet: Awaited<ReturnType<typeof walletApi.getWalletDetail>> | undefined;
  transactions: Awaited<ReturnType<typeof walletApi.getTransactions>>['content'];
}) {
  const formatCredit = (value: number) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value);
  const formatDateTime = (value: string) => new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));

  if (isLoading) return <div className="flex min-h-52 flex-col items-center justify-center text-text-muted"><span className="mb-3 inline-block h-7 w-7 animate-spin rounded-full border-2 border-primary/30 border-t-primary" /><p className="text-sm">Đang tải dữ liệu ví...</p></div>;
  if (isMissing) return <div className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed border-amber-200 bg-amber-50/60 px-5 text-center text-text-muted"><WalletIcon size={34} className="mb-3 text-amber-600" /><p className="font-semibold text-text">Tài khoản chưa có ví Time Credit</p><p className="mt-1 max-w-md text-xs">Hệ thống không tự cộng TC khi đọc dữ liệu. Admin phải xác nhận rõ ràng trước khi tạo ví và cấp 5 TC ban đầu.</p>{canInitialize ? <button type="button" onClick={onInitialize} className="mt-4 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600">Khởi tạo ví</button> : <p className="mt-3 text-xs font-medium text-amber-700">Không thể khởi tạo ví cho tài khoản đã bị vô hiệu hóa.</p>}</div>;
  if (isError || !wallet) return <div className="flex min-h-52 flex-col items-center justify-center rounded-xl bg-surface-2 text-center text-text-muted"><WalletIcon size={32} className="mb-3" /><p className="font-semibold text-text">Chưa thể tải ví người dùng</p><p className="mt-1 text-xs">Tài khoản có thể chưa được khởi tạo ví hoặc Backend chưa sẵn sàng.</p></div>;

  return <div className="space-y-6">
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <div className="rounded-xl border border-border bg-emerald-50/60 p-4"><Coins size={18} className="mb-3 text-emerald-600" /><p className="text-xl font-bold text-emerald-700">{formatCredit(wallet.balance)} TC</p><p className="mt-1 text-xs text-text-muted">Khả dụng</p></div>
      <div className="rounded-xl border border-border bg-amber-50/60 p-4"><LockKeyhole size={18} className="mb-3 text-amber-600" /><p className="text-xl font-bold text-amber-700">{formatCredit(wallet.heldAmount)} TC</p><p className="mt-1 text-xs text-text-muted">Đang giữ</p></div>
      <div className="rounded-xl border border-border bg-blue-50/60 p-4"><WalletIcon size={18} className="mb-3 text-blue-600" /><p className="text-xl font-bold text-blue-700">{formatCredit(wallet.totalEarned)} TC</p><p className="mt-1 text-xs text-text-muted">Đã kiếm</p></div>
      <div className="rounded-xl border border-border bg-violet-50/60 p-4"><History size={18} className="mb-3 text-violet-600" /><p className="text-xl font-bold text-violet-700">{formatCredit(wallet.totalUsed)} TC</p><p className="mt-1 text-xs text-text-muted">Đã sử dụng</p></div>
      <div className={`rounded-xl border p-4 ${wallet.inconsistent ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'}`}><AlertTriangle size={18} className={`mb-3 ${wallet.inconsistent ? 'text-red-600' : 'text-emerald-600'}`} /><p className={`text-sm font-bold ${wallet.inconsistent ? 'text-red-700' : 'text-emerald-700'}`}>{wallet.inconsistent ? `Chênh ${formatCredit(Math.abs(wallet.invariantDifference))} TC` : 'Cân bằng'}</p><p className="mt-1 text-xs text-text-muted">Đối soát sổ cái</p></div>
    </div>

    <section>
      <div className="mb-3 flex items-center justify-between"><h3 className="flex items-center gap-2 text-base font-semibold text-text"><History size={17} /> 6 giao dịch gần nhất</h3><span className="text-xs text-text-muted">Cập nhật {formatDateTime(wallet.updatedAt)}</span></div>
      {transactions.length === 0 ? <p className="rounded-xl bg-surface-2 py-10 text-center text-sm text-text-muted">Ví chưa có giao dịch.</p> : <div className="overflow-x-auto rounded-xl border border-border"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-surface-2 text-xs uppercase tracking-wide text-text-muted"><tr><th className="px-4 py-3">Thời gian</th><th className="px-4 py-3">Loại</th><th className="px-4 py-3">Biến động</th><th className="px-4 py-3">Số dư sau</th><th className="px-4 py-3">Nội dung</th></tr></thead><tbody className="divide-y divide-border">{transactions.map((transaction) => <tr key={transaction.id}><td className="whitespace-nowrap px-4 py-3 text-xs text-text-muted">{formatDateTime(transaction.createdAt)}</td><td className="px-4 py-3 font-semibold text-text">{transaction.type}</td><td className={`px-4 py-3 font-bold ${transaction.signedAmount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{transaction.signedAmount >= 0 ? '+' : ''}{formatCredit(transaction.signedAmount)} TC</td><td className="px-4 py-3 font-semibold text-text">{formatCredit(transaction.balanceAfter)} TC</td><td className="max-w-64 truncate px-4 py-3 text-text-muted" title={transaction.description ?? ''}>{transaction.description || 'Không có mô tả'}</td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}

function UserAppointmentsTab({
  items,
  isLoading,
  isError,
  page,
  totalPages,
  totalElements,
  onPageChange,
  onOpenAll,
}: {
  items: AdminAppointment[];
  isLoading: boolean;
  isError: boolean;
  page: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (page: number) => void;
  onOpenAll: () => void;
}) {
  if (isLoading) return <TabLoading label="Đang tải lịch hẹn..." />;
  if (isError) return <TabError label="Không thể tải lịch hẹn của người dùng." />;

  return <section className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h3 className="flex items-center gap-2 font-semibold text-text"><CalendarDays size={18} /> Lịch hẹn liên quan</h3>
        <p className="mt-1 text-xs text-text-muted">Người dùng là bên hỗ trợ hoặc bên nhận hỗ trợ · {totalElements} lịch</p>
      </div>
      <button type="button" onClick={onOpenAll} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/10"><ExternalLink size={15} /> Mở quản lý lịch hẹn</button>
    </div>

    {items.length === 0 ? <TabEmpty icon={CalendarDays} label="Người dùng chưa có lịch hẹn nào." /> : <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-surface-2 text-xs uppercase tracking-wide text-text-muted"><tr><th className="px-4 py-3">Lịch hẹn</th><th className="px-4 py-3">Thời gian</th><th className="px-4 py-3">Hai bên</th><th className="px-4 py-3">Credit</th><th className="px-4 py-3">Trạng thái</th></tr></thead>
        <tbody className="divide-y divide-border">{items.map((item) => {
          const status = APPOINTMENT_STATUS[item.status];
          return <tr key={item.id} className="hover:bg-surface-hover">
            <td className="px-4 py-3"><p className="max-w-[220px] truncate font-semibold text-text">{item.title}</p><p className="mt-1 text-xs text-text-muted">{item.skillName || 'Không gắn kỹ năng'}</p></td>
            <td className="whitespace-nowrap px-4 py-3"><p className="font-medium text-text">{formatAppointmentDate(item.appointmentDate)}</p><p className="mt-1 text-xs text-text-muted">{item.startTime?.slice(0, 5)}–{item.endTime?.slice(0, 5)}</p></td>
            <td className="px-4 py-3"><p className="font-medium text-text">{item.providerName}</p><p className="mt-1 text-xs text-text-muted">với {item.receiverName}</p></td>
            <td className="whitespace-nowrap px-4 py-3 font-semibold text-amber-600">{item.timeCreditAmount} TC</td>
            <td className="px-4 py-3"><span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${status.className}`}>{status.label}</span></td>
          </tr>;
        })}</tbody>
      </table>
    </div>}
    <TabPagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
  </section>;
}

function UserReportsTab({
  userId,
  items,
  isLoading,
  isError,
  page,
  totalPages,
  totalElements,
  onPageChange,
  onOpenAll,
}: {
  userId: string;
  items: AdminReport[];
  isLoading: boolean;
  isError: boolean;
  page: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (page: number) => void;
  onOpenAll: () => void;
}) {
  if (isLoading) return <TabLoading label="Đang tải báo cáo..." />;
  if (isError) return <TabError label="Không thể tải báo cáo liên quan tới người dùng." />;

  return <section className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h3 className="flex items-center gap-2 font-semibold text-text"><Flag size={18} /> Báo cáo liên quan</h3>
        <p className="mt-1 text-xs text-text-muted">Bao gồm báo cáo do người dùng gửi và báo cáo nhắm tới họ · {totalElements} báo cáo</p>
      </div>
      <button type="button" onClick={onOpenAll} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/10"><ExternalLink size={15} /> Mở quản lý báo cáo</button>
    </div>

    {items.length === 0 ? <TabEmpty icon={Flag} label="Không có báo cáo liên quan tới người dùng." /> : <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-surface-2 text-xs uppercase tracking-wide text-text-muted"><tr><th className="px-4 py-3">Vai trò</th><th className="px-4 py-3">Đối tượng</th><th className="px-4 py-3">Lý do</th><th className="px-4 py-3">Thời gian</th><th className="px-4 py-3">Trạng thái</th></tr></thead>
        <tbody className="divide-y divide-border">{items.map((item) => {
          const status = REPORT_STATUS[item.status];
          const isReporter = item.reporterId === userId;
          return <tr key={`${item.source ?? 'GENERAL'}-${item.id}`} className="hover:bg-surface-hover">
            <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${isReporter ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>{isReporter ? 'Người gửi' : 'Đối tượng liên quan'}</span></td>
            <td className="px-4 py-3"><p className="max-w-[240px] truncate font-semibold text-text">{item.targetLabel}</p><p className="mt-1 text-xs text-text-muted">{item.source === 'CHAT' ? 'Tin nhắn' : 'Báo cáo chung'} · {item.evidenceCount} minh chứng</p></td>
            <td className="px-4 py-3"><p className="font-medium text-text">{item.reason}</p><p className="mt-1 max-w-[220px] truncate text-xs text-text-muted">{item.description || 'Không có mô tả'}</p></td>
            <td className="whitespace-nowrap px-4 py-3 text-xs text-text-muted">{formatDateTime(item.createdAt)}</td>
            <td className="px-4 py-3"><span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${status.className}`}>{status.label}</span></td>
          </tr>;
        })}</tbody>
      </table>
    </div>}
    <TabPagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
  </section>;
}

function TabPagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (page: number) => void }) {
  if (totalPages <= 1) return null;
  return <div className="flex items-center justify-end gap-2 text-sm">
    <button type="button" aria-label="Trang trước" disabled={page === 0} onClick={() => onPageChange(page - 1)} className="rounded-lg border border-border p-2 text-text-muted hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={16} /></button>
    <span className="min-w-24 text-center text-text-muted">Trang {page + 1}/{totalPages}</span>
    <button type="button" aria-label="Trang sau" disabled={page + 1 >= totalPages} onClick={() => onPageChange(page + 1)} className="rounded-lg border border-border p-2 text-text-muted hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight size={16} /></button>
  </div>;
}

function TabLoading({ label }: { label: string }) {
  return <div className="flex min-h-52 flex-col items-center justify-center text-text-muted"><span className="mb-3 inline-block h-7 w-7 animate-spin rounded-full border-2 border-primary/30 border-t-primary" /><p className="text-sm">{label}</p></div>;
}

function TabError({ label }: { label: string }) {
  return <div className="flex min-h-52 flex-col items-center justify-center rounded-xl bg-red-50 px-4 text-center"><AlertTriangle size={32} className="mb-3 text-red-500" /><p className="font-semibold text-red-700">{label}</p><p className="mt-1 text-xs text-red-600">Kiểm tra kết nối Backend rồi mở lại tab để thử lại.</p></div>;
}

function TabEmpty({ icon: Icon, label }: { icon: typeof CalendarDays; label: string }) {
  return <div className="flex min-h-44 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-2/60 px-4 text-center text-text-muted"><Icon size={34} className="mb-3 text-text-dim" /><p className="text-sm font-medium">{label}</p></div>;
}
