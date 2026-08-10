import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarClock, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Eye,
  FileImage, MapPin, RefreshCw, Search, Users, X, XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import {
  communityApi,
  type ActivityStatus,
  type AdminCommunityActivity,
  type ParticipantStatus,
} from '@/api/community';

const ACTIVITY_STATUS: Record<ActivityStatus, { label: string; className: string }> = {
  OPEN: { label: 'Mở đăng ký', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CLOSED: { label: 'Đóng đăng ký', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  COMPLETED: { label: 'Hoàn thành', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  CANCELLED: { label: 'Đã hủy', className: 'bg-red-50 text-red-700 border-red-200' },
};
const PARTICIPANT_STATUS: Record<ParticipantStatus, { label: string; className: string }> = {
  REGISTERED: { label: 'Đã đăng ký', className: 'bg-sky-50 text-sky-700' },
  CONFIRMED: { label: 'Đã xác nhận', className: 'bg-emerald-50 text-emerald-700' },
  ABSENT: { label: 'Vắng mặt', className: 'bg-orange-50 text-orange-700' },
  CANCELLED: { label: 'Đã hủy', className: 'bg-red-50 text-red-700' },
};

const formatDateTime = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short', timeStyle: 'short',
}).format(new Date(value));
const toStartInstant = (value: string) => value ? new Date(`${value}T00:00:00`).toISOString() : '';
const toEndInstant = (value: string) => value ? new Date(`${value}T23:59:59.999`).toISOString() : '';
const formatBytes = (value: number | null) => {
  if (value == null) return '';
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
};

function ActivityBadge({ status }: { status: ActivityStatus }) {
  const item = ACTIVITY_STATUS[status];
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${item.className}`}>{item.label}</span>;
}

export default function CommunityPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ActivityStatus | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [action, setAction] = useState<'close' | 'cancel' | null>(null);
  const size = 10;

  const listQuery = useQuery({
    queryKey: ['admin-community', page, search, status, dateFrom, dateTo],
    queryFn: () => communityApi.getActivities({
      page, size, search, status,
      startFrom: toStartInstant(dateFrom), startTo: toEndInstant(dateTo),
    }),
  });
  const statsQuery = useQuery({ queryKey: ['admin-community-stats'], queryFn: communityApi.getStats });
  const detailQuery = useQuery({
    queryKey: ['admin-community-detail', selectedId],
    queryFn: () => communityApi.getDetail(selectedId!),
    enabled: Boolean(selectedId),
  });
  const participantsQuery = useQuery({
    queryKey: ['admin-community-participants', selectedId],
    queryFn: () => communityApi.getParticipants(selectedId!),
    enabled: Boolean(selectedId),
  });
  const actionMutation = useMutation({
    mutationFn: ({ id, type }: { id: string; type: 'close' | 'cancel' }) =>
      type === 'close' ? communityApi.closeRegistration(id) : communityApi.cancelActivity(id),
    onSuccess: async (_, variables) => {
      toast.success(variables.type === 'close' ? 'Đã đóng đăng ký' : 'Đã hủy hoạt động và thông báo người tham gia');
      setAction(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-community'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-community-stats'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-community-detail', selectedId] }),
        queryClient.invalidateQueries({ queryKey: ['admin-community-participants', selectedId] }),
      ]);
    },
    onError: () => toast.error('Không thể thực hiện thao tác ở trạng thái hiện tại'),
  });

  const refresh = async () => {
    await Promise.all([listQuery.refetch(), statsQuery.refetch()]);
    toast.success('Đã cập nhật dữ liệu cộng đồng');
  };
  const clearFilters = () => {
    setSearch(''); setStatus(''); setDateFrom(''); setDateTo(''); setPage(0);
  };
  const items = listQuery.data?.content ?? [];
  const stats = statsQuery.data;
  const detail = detailQuery.data;
  const participants = participantsQuery.data?.content ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div><h1 className="text-2xl font-bold text-text">Quản lý Cộng đồng</h1><p className="mt-1 text-sm text-text-muted">Theo dõi hoạt động, người tham gia, minh chứng và Time Credit đóng góp.</p></div>
        <button onClick={refresh} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-text hover:bg-surface-2"><RefreshCw size={16} className={listQuery.isFetching ? 'animate-spin' : ''} /> Làm mới</button>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        {[
          { label: 'Tổng hoạt động', value: stats?.totalActivities ?? 0, icon: CalendarClock, color: 'text-primary bg-primary/10' },
          { label: 'Đang mở', value: stats?.openActivities ?? 0, icon: Clock3, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Đã hoàn thành', value: stats?.completedActivities ?? 0, icon: CheckCircle2, color: 'text-blue-600 bg-blue-50' },
          { label: 'Lượt tham gia', value: stats?.totalRegistrations ?? 0, icon: Users, color: 'text-violet-600 bg-violet-50' },
          { label: 'Giờ đã ghi nhận', value: `${stats?.awardedHours ?? 0}h`, icon: CheckCircle2, color: 'text-amber-600 bg-amber-50' },
        ].map(({ label, value, icon: Icon, color }) => <div key={label} className="rounded-2xl border border-border bg-white p-4 shadow-sm"><div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${color}`}><Icon size={18} /></div><p className="text-2xl font-bold text-text">{value}</p><p className="mt-1 text-xs text-text-muted">{label}</p></div>)}
      </div>

      <div className="rounded-2xl border border-border bg-white shadow-sm">
        <div className="grid gap-3 border-b border-border p-4 md:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr_auto]">
          <label className="relative"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" /><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} placeholder="Hoạt động, tổ chức, email, địa điểm..." className="w-full rounded-xl border border-border bg-surface-2 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary" /></label>
          <select value={status} onChange={(e) => { setStatus(e.target.value as ActivityStatus | ''); setPage(0); }} className="rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"><option value="">Tất cả trạng thái</option>{Object.entries(ACTIVITY_STATUS).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}</select>
          <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(0); }} className="rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-primary" title="Từ ngày" />
          <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(0); }} className="rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-primary" title="Đến ngày" />
          <button onClick={clearFilters} className="rounded-xl px-3 py-2 text-sm font-medium text-text-muted hover:bg-surface-2">Xóa lọc</button>
        </div>

        <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead className="bg-surface-2 text-xs uppercase tracking-wide text-text-muted"><tr><th className="px-5 py-3">Hoạt động</th><th className="px-5 py-3">Tổ chức</th><th className="px-5 py-3">Thời gian</th><th className="px-5 py-3">Người tham gia</th><th className="px-5 py-3">Credit</th><th className="px-5 py-3">Trạng thái</th><th className="px-5 py-3 text-right">Chi tiết</th></tr></thead>
          <tbody className="divide-y divide-border">
            {listQuery.isLoading && <EmptyRows message="Đang tải hoạt động..." />}
            {listQuery.isError && <EmptyRows message="Không thể tải dữ liệu. Vui lòng kiểm tra Backend và thử lại." />}
            {!listQuery.isLoading && !listQuery.isError && items.length === 0 && <EmptyRows message="Không có hoạt động phù hợp." />}
            {items.map((item: AdminCommunityActivity) => <tr key={item.id} className="hover:bg-surface-hover">
              <td className="px-5 py-4"><p className="max-w-[250px] truncate font-semibold text-text">{item.title}</p><p className="mt-1 flex max-w-[240px] items-center gap-1 truncate text-xs text-text-muted"><MapPin size={12} /> {item.location || 'Chưa cập nhật'}</p></td>
              <td className="px-5 py-4"><p className="font-medium text-text">{item.organizerName}</p><p className="text-xs text-text-muted">{item.organizerEmail}</p></td>
              <td className="px-5 py-4"><p className="font-medium text-text">{formatDateTime(item.startTime)}</p><p className="text-xs text-text-muted">đến {formatDateTime(item.endTime)}</p></td>
              <td className="px-5 py-4"><p className="font-medium text-text">{item.registeredCount + item.confirmedCount}/{item.maxParticipants ?? '∞'}</p><p className="text-xs text-text-muted">{item.confirmedCount} đã xác nhận · {item.absentCount} vắng</p></td>
              <td className="px-5 py-4 font-semibold text-amber-600">~{item.creditReward} TC</td><td className="px-5 py-4"><ActivityBadge status={item.status} /></td>
              <td className="px-5 py-4 text-right"><button onClick={() => setSelectedId(item.id)} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 font-semibold text-primary hover:bg-primary/10"><Eye size={15} /> Xem</button></td>
            </tr>)}
          </tbody></table></div>
        <div className="flex items-center justify-between border-t border-border px-5 py-4 text-sm"><span className="text-text-muted">{listQuery.data?.totalElements ?? 0} hoạt động</span><div className="flex items-center gap-2"><button disabled={page === 0} onClick={() => setPage((value) => value - 1)} className="rounded-lg border border-border p-2 disabled:opacity-40"><ChevronLeft size={16} /></button><span className="min-w-24 text-center text-text-muted">Trang {page + 1}/{Math.max(listQuery.data?.totalPages ?? 1, 1)}</span><button disabled={page + 1 >= (listQuery.data?.totalPages ?? 1)} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-border p-2 disabled:opacity-40"><ChevronRight size={16} /></button></div></div>
      </div>

      {selectedId && <div className="fixed inset-0 z-[70] flex justify-end bg-slate-900/40 backdrop-blur-sm" onMouseDown={() => setSelectedId(null)}><aside className="h-full w-full max-w-3xl overflow-y-auto bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-6 py-5"><div><h2 className="text-xl font-bold text-text">Chi tiết hoạt động</h2><p className="text-xs text-text-muted">Mã: {selectedId}</p></div><button onClick={() => setSelectedId(null)} className="rounded-lg p-2 hover:bg-surface-2"><X size={20} /></button></div>
        {(detailQuery.isLoading || participantsQuery.isLoading) && <p className="p-8 text-center text-text-muted">Đang tải chi tiết...</p>}
        {(detailQuery.isError || participantsQuery.isError) && <p className="p-8 text-center text-danger">Không thể tải chi tiết hoạt động.</p>}
        {detail && !participantsQuery.isLoading && <div className="space-y-6 p-6">
          <section><div className="mb-3 flex flex-wrap items-center gap-3"><h3 className="text-xl font-bold text-text">{detail.title}</h3><ActivityBadge status={detail.status} /></div><p className="whitespace-pre-wrap text-sm leading-6 text-text-muted">{detail.description || 'Không có mô tả.'}</p></section>
          <section className="grid gap-3 rounded-2xl bg-surface-2 p-4 sm:grid-cols-2"><Info label="Bắt đầu" value={formatDateTime(detail.startTime)} /><Info label="Kết thúc" value={formatDateTime(detail.endTime)} /><Info label="Địa điểm" value={detail.location || 'Chưa cập nhật'} /><Info label="Credit dự kiến" value={`${detail.creditReward} TC`} /><Info label="Sức chứa" value={detail.maxParticipants?.toString() ?? 'Không giới hạn'} /><Info label="Tạo lúc" value={formatDateTime(detail.createdAt)} /></section>
          <section className="rounded-2xl border border-border p-4"><p className="text-xs font-medium uppercase tracking-wide text-text-muted">Tổ chức</p><div className="mt-3 flex items-center gap-3">{detail.organizerAvatarUrl ? <img src={detail.organizerAvatarUrl} alt={detail.organizerName} className="h-11 w-11 rounded-full object-cover" /> : <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">{detail.organizerName.charAt(0)}</div>}<div><p className="font-semibold text-text">{detail.organizerName}</p><p className="text-sm text-text-muted">{detail.organizerEmail}</p></div></div></section>
          {detail.status === 'OPEN' && <div className="flex flex-wrap gap-3"><button onClick={() => setAction('close')} className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700"><Clock3 size={16} /> Đóng đăng ký</button><button onClick={() => setAction('cancel')} className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700"><XCircle size={16} /> Hủy hoạt động</button></div>}
          {detail.status === 'CLOSED' && <button onClick={() => setAction('cancel')} className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700"><XCircle size={16} /> Hủy hoạt động</button>}
          <section><h4 className="mb-3 flex items-center gap-2 font-bold text-text"><Users size={18} /> Người tham gia ({participantsQuery.data?.totalElements ?? 0})</h4><div className="space-y-3">{participants.length === 0 ? <p className="rounded-xl bg-surface-2 p-4 text-sm text-text-muted">Chưa có người đăng ký.</p> : participants.map((participant) => {
            const participantStatus = PARTICIPANT_STATUS[participant.status];
            return <div key={participant.id} className="rounded-xl border border-border p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-center gap-3">{participant.userAvatarUrl ? <img src={participant.userAvatarUrl} alt={participant.userName} className="h-10 w-10 rounded-full object-cover" /> : <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">{participant.userName.charAt(0)}</div>}<div><p className="font-semibold text-text">{participant.userName}</p><p className="text-xs text-text-muted">{participant.userEmail}</p></div></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${participantStatus.className}`}>{participantStatus.label}</span></div>
              <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2"><Info label="Giờ thực tế" value={participant.actualHours == null ? 'Chưa xác nhận' : `${participant.actualHours} giờ`} /><Info label="Đã cộng Credit" value={participant.creditAwarded ? 'Có' : 'Chưa'} /></div>
              {participant.confirmNote && <p className="mt-2 rounded-lg bg-surface-2 p-2.5 text-sm text-text-muted">Ghi chú: {participant.confirmNote}</p>}
              {(participant.evidenceNote || participant.evidence.length > 0) && <div className="mt-3 border-t border-border pt-3"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Minh chứng</p>{participant.evidenceNote && <p className="mb-2 text-sm text-text-muted">{participant.evidenceNote}</p>}<div className="flex flex-wrap gap-2">{participant.evidence.map((evidence) => <a key={evidence.id} href={evidence.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10"><FileImage size={15} /><span className="max-w-40 truncate">{evidence.originalName || 'Xem ảnh'}</span><span className="text-xs text-text-muted">{formatBytes(evidence.fileSize)}</span></a>)}</div></div>}
            </div>;
          })}</div></section>
        </div>}
      </aside></div>}

      <Modal isOpen={action !== null} title={action === 'close' ? 'Đóng đăng ký hoạt động?' : 'Hủy hoạt động?'} message={action === 'close' ? 'Người dùng sẽ không thể đăng ký thêm. Các lượt đăng ký hiện tại vẫn được giữ nguyên.' : 'Hoạt động sẽ chuyển sang Đã hủy. Những người đang đăng ký sẽ được cập nhật trạng thái và nhận thông báo.'} type={action === 'cancel' ? 'danger' : 'warning'} confirmText={actionMutation.isPending ? 'Đang xử lý...' : action === 'close' ? 'Đóng đăng ký' : 'Hủy hoạt động'} onCancel={() => !actionMutation.isPending && setAction(null)} onConfirm={() => selectedId && action && actionMutation.mutate({ id: selectedId, type: action })} />
    </div>
  );
}

function EmptyRows({ message }: { message: string }) {
  return <tr><td colSpan={7} className="py-14 text-center text-sm text-text-muted">{message}</td></tr>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</p><p className="mt-1 break-words text-sm font-medium text-text">{value}</p></div>;
}
