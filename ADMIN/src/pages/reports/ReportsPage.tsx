import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  Eye,
  FileText,
  Flag,
  Image as ImageIcon,
  MessageSquareWarning,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  X,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  reportsApi,
  type AdminReport,
  type ReportReason,
  type ReportSource,
  type ReportStatus,
  type ReportTargetType,
  type ReportUserAction,
} from '@/api/reports';

const STATUS: Record<ReportStatus, { label: string; className: string }> = {
  PENDING: {
    label: 'Chờ xử lý',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  REVIEWING: {
    label: 'Đang xem xét',
    className: 'border-blue-200 bg-blue-50 text-blue-700',
  },
  RESOLVED: {
    label: 'Đã xử lý',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  DISMISSED: {
    label: 'Bỏ qua',
    className: 'border-slate-200 bg-slate-100 text-slate-600',
  },
};

const TARGET_TYPE: Record<ReportTargetType, { label: string; icon: typeof UserRound }> = {
  USER: { label: 'Người dùng', icon: UserRound },
  MESSAGE: { label: 'Tin nhắn', icon: MessageSquareWarning },
  CONTENT: { label: 'Nội dung', icon: FileText },
};

const REASON: Record<ReportReason, string> = {
  SPAM: 'Spam / quảng cáo',
  HARASSMENT: 'Quấy rối',
  MISINFORMATION: 'Thông tin sai lệch',
  ILLEGAL_CONTENT: 'Nội dung trái pháp luật',
  FRAUD: 'Lừa đảo',
  OFFENSIVE: 'Nội dung xúc phạm',
  SCAM: 'Lừa đảo qua tin nhắn',
  OUTSIDE_PAYMENT: 'Yêu cầu thanh toán bên ngoài',
  ASK_CREDENTIALS: 'Yêu cầu thông tin đăng nhập',
  OTHER: 'Khác',
};

const USER_ACTION: Record<ReportUserAction, { label: string; description: string }> = {
  NONE: {
    label: 'Chỉ ghi nhận',
    description: 'Cập nhật báo cáo, không tác động tài khoản.',
  },
  WARN: {
    label: 'Cảnh cáo',
    description: 'Ghi nhận một lần cảnh cáo cho người vi phạm.',
  },
  LOCK: {
    label: 'Khóa tài khoản',
    description: 'Người dùng không thể tiếp tục sử dụng hệ thống.',
  },
};

const SOURCE: Record<ReportSource, string> = {
  GENERAL: 'Báo cáo chung',
  CHAT: 'Tin nhắn',
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Không xác định';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
};

const formatNumber = (value: number) => new Intl.NumberFormat('vi-VN').format(value);

const isImageEvidence = (url: string) => {
  const pathname = url.split('?')[0].toLowerCase();
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(pathname);
};

const evidenceName = (url: string, index: number) => {
  try {
    const pathname = new URL(url, window.location.origin).pathname;
    return decodeURIComponent(pathname.split('/').filter(Boolean).pop() || `Minh chứng ${index + 1}`);
  } catch {
    return `Minh chứng ${index + 1}`;
  }
};

function StatusBadge({ status }: { status: ReportStatus }) {
  const item = STATUS[status];
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${item.className}`}>
      {item.label}
    </span>
  );
}

function TargetBadge({ type }: { type: ReportTargetType }) {
  const item = TARGET_TYPE[type];
  const Icon = item.icon;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface-2 px-2.5 py-1.5 text-xs font-semibold text-text-muted">
      <Icon size={14} /> {item.label}
    </span>
  );
}

export default function ReportsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ReportStatus | ''>('');
  const [targetType, setTargetType] = useState<ReportTargetType | ''>('');
  const [reason, setReason] = useState<ReportReason | ''>('');
  const [source, setSource] = useState<ReportSource | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<ReportSource>('GENERAL');
  const [draftStatus, setDraftStatus] = useState<ReportStatus>('PENDING');
  const [adminNote, setAdminNote] = useState('');
  const [userAction, setUserAction] = useState<ReportUserAction>('NONE');
  const size = 10;

  const listQuery = useQuery({
    queryKey: ['admin-reports', page, search, status, targetType, reason, source, dateFrom, dateTo],
    queryFn: () => reportsApi.getReports({
      page,
      size,
      search,
      status,
      targetType,
      reason,
      source,
      dateFrom,
      dateTo,
    }),
  });

  const statsQuery = useQuery({
    queryKey: ['admin-report-stats'],
    queryFn: reportsApi.getStats,
  });

  const detailQuery = useQuery({
    queryKey: ['admin-report', selectedId, selectedSource],
    queryFn: () => reportsApi.getDetail(selectedId!, selectedSource),
    enabled: Boolean(selectedId),
  });

  const detail = detailQuery.data;

  useEffect(() => {
    if (!detail) return;
    setDraftStatus(detail.status);
    setAdminNote(detail.adminNote ?? '');
    setUserAction('NONE');
  }, [detail]);

  const statusMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => reportsApi.updateStatus(id, selectedSource, {
      status: draftStatus,
      adminNote: adminNote.trim(),
      userAction: draftStatus === 'RESOLVED' ? userAction : 'NONE',
    }),
    onSuccess: async (updated) => {
      queryClient.setQueryData(['admin-report', selectedId, selectedSource], updated);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-reports'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-report-stats'] }),
      ]);
      toast.success(
        userAction === 'WARN'
          ? 'Đã xử lý báo cáo và cảnh cáo người dùng'
          : userAction === 'LOCK'
            ? 'Đã xử lý báo cáo và khóa tài khoản'
            : 'Đã cập nhật trạng thái báo cáo',
      );
    },
    onError: () => toast.error('Không thể cập nhật báo cáo. Vui lòng kiểm tra quyền và thử lại.'),
  });

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setTargetType('');
    setReason('');
    setSource('');
    setDateFrom('');
    setDateTo('');
    setPage(0);
  };

  const refresh = async () => {
    await Promise.all([
      listQuery.refetch(),
      statsQuery.refetch(),
      selectedId ? detailQuery.refetch() : Promise.resolve(),
    ]);
    toast.success('Đã cập nhật dữ liệu báo cáo');
  };

  const submitStatus = () => {
    if (!selectedId) return;
    if ((draftStatus === 'RESOLVED' || draftStatus === 'DISMISSED') && !adminNote.trim()) {
      toast.error('Vui lòng nhập ghi chú trước khi kết thúc xử lý báo cáo');
      return;
    }
    statusMutation.mutate({ id: selectedId });
  };

  const closeDetail = () => {
    if (statusMutation.isPending) return;
    setSelectedId(null);
  };

  const openReport = (report: AdminReport) => {
    setSelectedSource(report.source ?? 'GENERAL');
    setSelectedId(report.id);
  };

  const reports = listQuery.data?.content ?? [];
  const stats = statsQuery.data;
  const totalPages = Math.max(listQuery.data?.totalPages ?? 1, 1);
  const hasTargetUser = Boolean(detail && (detail.targetUserId || detail.targetType === 'USER'));
  const isTerminal = draftStatus === 'RESOLVED' || draftStatus === 'DISMISSED';
  const isUnchanged = Boolean(
    detail
    && draftStatus === detail.status
    && adminNote.trim() === (detail.adminNote ?? '').trim()
    && userAction === 'NONE',
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-text">Quản lý Báo cáo</h1>
            {(stats?.pending ?? 0) > 0 && (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
                {formatNumber(stats?.pending ?? 0)} cần xử lý
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-text-muted">
            Tiếp nhận, kiểm tra minh chứng và xử lý nội dung vi phạm trên hệ thống.
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-text hover:bg-surface-2"
        >
          <RefreshCw size={16} className={listQuery.isFetching ? 'animate-spin' : ''} /> Làm mới
        </button>
      </header>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        {[
          { label: 'Tổng báo cáo', value: stats?.total ?? 0, icon: Flag, color: 'bg-primary/10 text-primary' },
          { label: 'Chờ xử lý', value: stats?.pending ?? 0, icon: AlertTriangle, color: 'bg-amber-50 text-amber-600' },
          { label: 'Đang xem xét', value: stats?.reviewing ?? 0, icon: Clock3, color: 'bg-blue-50 text-blue-600' },
          { label: 'Đã xử lý', value: stats?.resolved ?? 0, icon: ShieldCheck, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Đã bỏ qua', value: stats?.dismissed ?? 0, icon: XCircle, color: 'bg-slate-100 text-slate-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-border bg-white p-4 shadow-sm">
            <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${color}`}>
              <Icon size={18} />
            </div>
            <p className="text-2xl font-bold text-text">{formatNumber(value)}</p>
            <p className="mt-1 text-xs text-text-muted">{label}</p>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="grid gap-3 border-b border-border p-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-[2fr_repeat(7,minmax(0,1fr))]">
          <label className="relative">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(0); }}
              placeholder="Người báo cáo, đối tượng, nội dung..."
              className="w-full rounded-xl border border-border bg-surface-2 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary"
            />
          </label>
          <select
            value={status}
            onChange={(event) => { setStatus(event.target.value as ReportStatus | ''); setPage(0); }}
            className="rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(STATUS).map(([value, item]) => (
              <option key={value} value={value}>{item.label}</option>
            ))}
          </select>
          <select
            value={targetType}
            onChange={(event) => { setTargetType(event.target.value as ReportTargetType | ''); setPage(0); }}
            className="rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
          >
            <option value="">Mọi đối tượng</option>
            {Object.entries(TARGET_TYPE).map(([value, item]) => (
              <option key={value} value={value}>{item.label}</option>
            ))}
          </select>
          <select
            value={reason}
            onChange={(event) => { setReason(event.target.value as ReportReason | ''); setPage(0); }}
            className="rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
          >
            <option value="">Mọi lý do</option>
            {Object.entries(REASON).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select
            value={source}
            onChange={(event) => { setSource(event.target.value as ReportSource | ''); setPage(0); }}
            className="rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
          >
            <option value="">Mọi nguồn</option>
            {Object.entries(SOURCE).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => { setDateFrom(event.target.value); setPage(0); }}
            title="Từ ngày"
            className="rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(event) => { setDateTo(event.target.value); setPage(0); }}
            title="Đến ngày"
            className="rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={clearFilters}
            className="whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium text-text-muted hover:bg-surface-2"
          >
            Xóa lọc
          </button>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-surface-2 text-xs uppercase tracking-wide text-text-muted">
              <tr>
                <th className="px-5 py-3">Đối tượng</th>
                <th className="px-5 py-3">Lý do</th>
                <th className="px-5 py-3">Người báo cáo</th>
                <th className="px-5 py-3">Thời gian</th>
                <th className="px-5 py-3">Minh chứng</th>
                <th className="px-5 py-3">Trạng thái</th>
                <th className="px-5 py-3 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {listQuery.isLoading && <EmptyRow message="Đang tải báo cáo..." />}
              {listQuery.isError && <EmptyRow message="Không thể tải báo cáo. Vui lòng kiểm tra Backend và thử lại." />}
              {!listQuery.isLoading && !listQuery.isError && reports.length === 0 && (
                <EmptyRow message="Không có báo cáo phù hợp với bộ lọc." />
              )}
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-surface-hover">
                  <td className="px-5 py-4">
                    <TargetBadge type={report.source === 'CHAT' ? 'MESSAGE' : report.targetType} />
                    <p className="mt-2 max-w-[240px] truncate font-semibold text-text" title={report.targetLabel}>
                      {report.targetLabel || `Mã ${report.targetId}`}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-text">{REASON[report.reason]}</p>
                    <p className="mt-1 max-w-[220px] truncate text-xs text-text-muted">
                      {report.description || 'Không có mô tả'}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-text">{report.reporterName}</p>
                    <p className="text-xs text-text-muted">{report.reporterEmail}</p>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-text-muted">{formatDateTime(report.createdAt)}</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1.5 text-text-muted">
                      <ImageIcon size={15} /> {report.evidenceCount ?? 0}
                    </span>
                  </td>
                  <td className="px-5 py-4"><StatusBadge status={report.status} /></td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => openReport(report)}
                      className="inline-flex items-center gap-1 rounded-lg px-3 py-2 font-semibold text-primary hover:bg-primary/10"
                    >
                      <Eye size={15} /> Xem
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-border md:hidden">
          {listQuery.isLoading && <MobileEmpty message="Đang tải báo cáo..." />}
          {listQuery.isError && <MobileEmpty message="Không thể tải báo cáo." />}
          {!listQuery.isLoading && !listQuery.isError && reports.length === 0 && (
            <MobileEmpty message="Không có báo cáo phù hợp." />
          )}
          {reports.map((report) => (
            <button
              type="button"
              key={report.id}
              onClick={() => openReport(report)}
              className="block w-full p-4 text-left hover:bg-surface-hover"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <TargetBadge type={report.source === 'CHAT' ? 'MESSAGE' : report.targetType} />
                  <p className="mt-2 truncate font-semibold text-text">{report.targetLabel || `Mã ${report.targetId}`}</p>
                </div>
                <StatusBadge status={report.status} />
              </div>
              <p className="mt-3 text-sm font-medium text-text">{REASON[report.reason]}</p>
              <div className="mt-2 flex items-center justify-between gap-3 text-xs text-text-muted">
                <span className="truncate">Bởi {report.reporterName}</span>
                <span className="whitespace-nowrap">{formatDateTime(report.createdAt)}</span>
              </div>
            </button>
          ))}
        </div>

        <footer className="flex flex-col gap-3 border-t border-border px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span className="text-text-muted">{formatNumber(listQuery.data?.totalElements ?? 0)} báo cáo</span>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((value) => Math.max(value - 1, 0))}
              className="rounded-lg border border-border p-2 disabled:opacity-40"
              aria-label="Trang trước"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="min-w-24 text-center text-text-muted">Trang {page + 1}/{totalPages}</span>
            <button
              type="button"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((value) => value + 1)}
              className="rounded-lg border border-border p-2 disabled:opacity-40"
              aria-label="Trang sau"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </footer>
      </section>

      {selectedId && (
        <div
          className="fixed inset-0 z-[80] flex justify-end bg-slate-900/40 backdrop-blur-sm"
          onMouseDown={closeDetail}
        >
          <aside
            className="h-full w-full max-w-3xl overflow-y-auto bg-white shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-5 py-4 sm:px-6 sm:py-5">
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-text">Chi tiết báo cáo</h2>
                <p className="truncate text-xs text-text-muted">Mã: {selectedId}</p>
              </div>
              <button type="button" onClick={closeDetail} className="rounded-lg p-2 hover:bg-surface-2" aria-label="Đóng">
                <X size={20} />
              </button>
            </div>

            {detailQuery.isLoading && <p className="p-10 text-center text-text-muted">Đang tải chi tiết...</p>}
            {detailQuery.isError && (
              <div className="m-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-center text-sm text-red-700">
                Không thể tải chi tiết báo cáo.
              </div>
            )}

            {detail && (
              <div className="space-y-6 p-5 sm:p-6">
                <section>
                  <div className="flex flex-wrap items-center gap-3">
                    <TargetBadge type={detail.source === 'CHAT' ? 'MESSAGE' : detail.targetType} />
                    <StatusBadge status={detail.status} />
                    <span className="text-xs text-text-muted">Gửi lúc {formatDateTime(detail.createdAt)}</span>
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-text">
                    {detail.targetLabel || `Đối tượng ${detail.targetId}`}
                  </h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text-muted">
                    {detail.targetDescription || 'Không có nội dung đối tượng để hiển thị.'}
                  </p>
                </section>

                <section className="grid gap-3 rounded-2xl bg-surface-2 p-4 sm:grid-cols-2">
                  <Info label="Lý do báo cáo" value={REASON[detail.reason]} />
                  <Info label="Loại đối tượng" value={detail.source === 'CHAT' ? 'Tin nhắn' : TARGET_TYPE[detail.targetType].label} />
                  <Info label="Nguồn báo cáo" value={SOURCE[detail.source ?? selectedSource]} />
                  <Info label="Mã đối tượng" value={detail.targetId} />
                  <Info label="Cập nhật gần nhất" value={formatDateTime(detail.updatedAt)} />
                </section>

                <section className="rounded-2xl border border-border p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Người gửi báo cáo</p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                      {detail.reporterName?.charAt(0).toUpperCase() || 'N'}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-text">{detail.reporterName}</p>
                      <p className="truncate text-sm text-text-muted">{detail.reporterEmail}</p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-xl bg-surface-2 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Mô tả vi phạm</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text">
                      {detail.description || 'Người báo cáo không nhập mô tả.'}
                    </p>
                  </div>
                </section>

                <section>
                  <h4 className="mb-3 flex items-center gap-2 font-bold text-text">
                    <ImageIcon size={18} /> Minh chứng ({detail.evidenceUrls?.length ?? 0})
                  </h4>
                  {!detail.evidenceUrls?.length ? (
                    <p className="rounded-xl bg-surface-2 p-4 text-sm text-text-muted">Báo cáo này không đính kèm minh chứng.</p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {detail.evidenceUrls.map((url, index) => (
                        <a
                          key={`${url}-${index}`}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="group overflow-hidden rounded-xl border border-border bg-white hover:border-primary/40"
                        >
                          {isImageEvidence(url) ? (
                            <img
                              src={url}
                              alt={`Minh chứng ${index + 1}`}
                              className="h-40 w-full bg-surface-2 object-cover transition-transform group-hover:scale-[1.02]"
                            />
                          ) : (
                            <div className="flex h-32 items-center justify-center bg-violet-50 text-violet-600">
                              <FileText size={34} />
                            </div>
                          )}
                          <div className="flex items-center justify-between gap-2 p-3">
                            <span className="truncate text-sm font-medium text-text">{evidenceName(url, index)}</span>
                            <ExternalLink size={15} className="shrink-0 text-primary" />
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </section>

                {hasTargetUser && (
                  <section className="rounded-2xl border border-border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Tài khoản liên quan</p>
                        <p className="mt-2 font-semibold text-text">{detail.targetUserName || detail.targetLabel}</p>
                        <p className="text-sm text-text-muted">{detail.targetUserEmail || 'Không có email'}</p>
                      </div>
                      {detail.targetUserLocked ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
                          <Ban size={14} /> Đang bị khóa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 size={14} /> Đang hoạt động
                        </span>
                      )}
                    </div>
                  </section>
                )}

                <section className="rounded-2xl border border-primary/20 bg-primary/[0.035] p-4 sm:p-5">
                  <div className="mb-4">
                    <h4 className="font-bold text-text">Xử lý báo cáo</h4>
                    <p className="mt-1 text-xs text-text-muted">Mọi thay đổi được ghi nhận theo tài khoản quản trị viên hiện tại.</p>
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-text">Trạng thái</span>
                    <select
                      value={draftStatus}
                      onChange={(event) => {
                        const value = event.target.value as ReportStatus;
                        setDraftStatus(value);
                        if (value !== 'RESOLVED') setUserAction('NONE');
                      }}
                      className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
                    >
                      {Object.entries(STATUS).map(([value, item]) => (
                        <option key={value} value={value}>{item.label}</option>
                      ))}
                    </select>
                  </label>

                  {draftStatus === 'RESOLVED' && hasTargetUser && (
                    <fieldset className="mt-4">
                      <legend className="mb-2 text-sm font-semibold text-text">Xử lý tài khoản vi phạm</legend>
                      <div className="grid gap-2 sm:grid-cols-3">
                        {(Object.entries(USER_ACTION) as [ReportUserAction, typeof USER_ACTION[ReportUserAction]][]).map(([value, item]) => {
                          const disabled = value === 'LOCK' && Boolean(detail.targetUserLocked);
                          return (
                            <label
                              key={value}
                              className={`rounded-xl border p-3 transition-colors ${
                                userAction === value ? 'border-primary bg-primary/10' : 'border-border bg-white'
                              } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-primary/50'}`}
                            >
                              <input
                                type="radio"
                                name="report-user-action"
                                value={value}
                                checked={userAction === value}
                                disabled={disabled}
                                onChange={() => setUserAction(value)}
                                className="sr-only"
                              />
                              <p className="text-sm font-semibold text-text">{item.label}</p>
                              <p className="mt-1 text-xs leading-5 text-text-muted">{item.description}</p>
                            </label>
                          );
                        })}
                      </div>
                    </fieldset>
                  )}

                  <label className="mt-4 block">
                    <span className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold text-text">
                      Ghi chú quản trị
                      {isTerminal && <span className="text-xs font-medium text-red-600">Bắt buộc</span>}
                    </span>
                    <textarea
                      value={adminNote}
                      onChange={(event) => setAdminNote(event.target.value)}
                      rows={4}
                      maxLength={2000}
                      placeholder="Kết quả kiểm tra, căn cứ xử lý hoặc lý do bỏ qua..."
                      className="w-full resize-y rounded-xl border border-border bg-white px-3 py-2.5 text-sm leading-6 outline-none focus:border-primary"
                    />
                    <span className="mt-1 block text-right text-xs text-text-muted">{adminNote.length}/2000</span>
                  </label>

                  <button
                    type="button"
                    onClick={submitStatus}
                    disabled={statusMutation.isPending || isUnchanged || (isTerminal && !adminNote.trim())}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {statusMutation.isPending ? (
                      <><RefreshCw size={16} className="animate-spin" /> Đang lưu...</>
                    ) : (
                      <><ShieldCheck size={16} /> Lưu kết quả xử lý</>
                    )}
                  </button>
                </section>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

function EmptyRow({ message }: { message: string }) {
  return <tr><td colSpan={7} className="py-14 text-center text-sm text-text-muted">{message}</td></tr>;
}

function MobileEmpty({ message }: { message: string }) {
  return <p className="p-10 text-center text-sm text-text-muted">{message}</p>;
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-text">{value}</p>
    </div>
  );
}
