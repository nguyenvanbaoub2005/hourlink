import { useDeferredValue, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Coins,
  Eye,
  History,
  LockKeyhole,
  MinusCircle,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  UserRound,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  walletApi,
  type AdminWalletAnomaly,
  type AdminWalletSummary,
  type AdminWalletTransaction,
  type WalletTransactionType,
} from '@/api/wallet';

type WalletTab = 'overview' | 'wallets' | 'transactions' | 'anomalies';
type BooleanFilter = boolean | '';

const TRANSACTION_META: Record<WalletTransactionType, { label: string; className: string }> = {
  EARN: { label: 'Nhận Credit', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  SPEND: { label: 'Chi Credit', className: 'border-rose-200 bg-rose-50 text-rose-700' },
  HOLD: { label: 'Tạm giữ', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  RELEASE: { label: 'Hoàn giữ', className: 'border-sky-200 bg-sky-50 text-sky-700' },
  REFUND: { label: 'Hoàn tiền', className: 'border-blue-200 bg-blue-50 text-blue-700' },
  BONUS: { label: 'Thưởng', className: 'border-violet-200 bg-violet-50 text-violet-700' },
  ADJUSTMENT: { label: 'Admin điều chỉnh', className: 'border-slate-200 bg-slate-100 text-slate-700' },
};

const SEVERITY_META: Record<string, { label: string; className: string; dot: string }> = {
  WARNING: { label: 'Cảnh báo', className: 'border-amber-200 bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  CRITICAL: { label: 'Nghiêm trọng', className: 'border-red-200 bg-red-50 text-red-700', dot: 'bg-red-500' },
};

const ANOMALY_LABEL: Record<string, string> = {
  INVARIANT_MISMATCH: 'Số dư không khớp sổ cái',
  NEGATIVE_BALANCE: 'Số dư âm',
  HIGH_24H_INFLOW: 'Nhận Credit bất thường trong 24 giờ',
  FREQUENT_PAIR: 'Tần suất giao dịch cặp cao',
};

const TRANSACTION_TYPES = Object.keys(TRANSACTION_META) as WalletTransactionType[];

const formatCredit = (value: number | null | undefined) => new Intl.NumberFormat('vi-VN', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
}).format(Number(value ?? 0));

const formatInteger = (value: number | null | undefined) => new Intl.NumberFormat('vi-VN').format(Number(value ?? 0));

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return 'Chưa cập nhật';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Không xác định';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(date);
};

const createRequestId = () => {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const values = crypto.getRandomValues(new Uint8Array(16));
  values[6] = (values[6] & 0x0f) | 0x40;
  values[8] = (values[8] & 0x3f) | 0x80;
  const hex = Array.from(values, (value) => value.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (!error || typeof error !== 'object') return fallback;
  const response = 'response' in error ? error.response : undefined;
  if (!response || typeof response !== 'object' || !('data' in response)) return fallback;
  const data = response.data;
  if (typeof data === 'string' && data.trim()) return data;
  if (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string') return data.message;
  return fallback;
};

const isWalletInconsistent = (wallet: AdminWalletSummary) => {
  return wallet.inconsistent || Math.abs(wallet.invariantDifference) > 0.001;
};

const signedAmount = (transaction: AdminWalletTransaction) => {
  if (Number.isFinite(transaction.signedAmount)) return transaction.signedAmount;
  if (transaction.type === 'SPEND' || transaction.type === 'HOLD') return -Math.abs(transaction.amount);
  return transaction.type === 'ADJUSTMENT' ? transaction.amount : Math.abs(transaction.amount);
};

function Avatar({ wallet, size = 'md' }: { wallet: Pick<AdminWalletSummary, 'userFullName' | 'userAvatarUrl'>; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'sm' ? 'h-8 w-8 text-xs' : size === 'lg' ? 'h-14 w-14 text-lg' : 'h-10 w-10 text-sm';
  if (wallet.userAvatarUrl) {
    return <img src={wallet.userAvatarUrl} alt={wallet.userFullName} className={`${sizeClass} shrink-0 rounded-full object-cover`} />;
  }
  const initials = wallet.userFullName.trim().split(/\s+/).slice(-2).map((part) => part.charAt(0)).join('').toUpperCase() || '?';
  return <div className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary`}>{initials}</div>;
}

function TransactionBadge({ type }: { type: WalletTransactionType }) {
  const item = TRANSACTION_META[type] ?? { label: type, className: 'border-slate-200 bg-slate-100 text-slate-700' };
  return <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${item.className}`}>{item.label}</span>;
}

function SeverityBadge({ severity }: { severity: string }) {
  const item = SEVERITY_META[severity] ?? { label: severity || 'Khác', className: 'border-slate-200 bg-slate-100 text-slate-700', dot: 'bg-slate-400' };
  return <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${item.className}`}><span className={`h-1.5 w-1.5 rounded-full ${item.dot}`} />{item.label}</span>;
}

export default function WalletPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<WalletTab>('overview');

  const [walletPage, setWalletPage] = useState(0);
  const [walletSearch, setWalletSearch] = useState('');
  const [hasHeld, setHasHeld] = useState<BooleanFilter>('');
  const [inconsistent, setInconsistent] = useState<BooleanFilter>('');

  const [transactionPage, setTransactionPage] = useState(0);
  const [transactionSearch, setTransactionSearch] = useState('');
  const [transactionType, setTransactionType] = useState<WalletTransactionType | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [transactionUser, setTransactionUser] = useState<{ id: string; name: string } | null>(null);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustStep, setAdjustStep] = useState<'form' | 'confirm-debit'>('form');
  const [adjustSearch, setAdjustSearch] = useState('');
  const deferredAdjustSearch = useDeferredValue(adjustSearch);
  const [adjustWallet, setAdjustWallet] = useState<AdminWalletSummary | null>(null);
  const [adjustDirection, setAdjustDirection] = useState<'credit' | 'debit'>('credit');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustRequestId, setAdjustRequestId] = useState('');
  const size = 10;

  const overviewQuery = useQuery({ queryKey: ['admin-wallet-overview'], queryFn: walletApi.getOverview });
  const anomaliesQuery = useQuery({ queryKey: ['admin-wallet-anomalies'], queryFn: walletApi.getAnomalies });

  const walletsQuery = useQuery({
    queryKey: ['admin-wallets', walletPage, walletSearch, hasHeld, inconsistent],
    queryFn: () => walletApi.getWallets({ page: walletPage, size, search: walletSearch, hasHeld, inconsistent }),
    enabled: activeTab === 'wallets',
  });

  const transactionsQuery = useQuery({
    queryKey: ['admin-wallet-transactions', transactionPage, transactionSearch, transactionUser?.id, transactionType, dateFrom, dateTo],
    queryFn: () => walletApi.getTransactions({
      page: transactionPage,
      size,
      search: transactionSearch,
      userId: transactionUser?.id,
      type: transactionType,
      dateFrom,
      dateTo,
    }),
    enabled: activeTab === 'transactions',
  });

  const walletDetailQuery = useQuery({
    queryKey: ['admin-wallet-detail', selectedUserId],
    queryFn: () => walletApi.getWalletDetail(selectedUserId!),
    enabled: Boolean(selectedUserId),
  });

  const walletTransactionsQuery = useQuery({
    queryKey: ['admin-wallet-detail-transactions', selectedUserId],
    queryFn: () => walletApi.getTransactions({ page: 0, size: 6, userId: selectedUserId! }),
    enabled: Boolean(selectedUserId),
  });

  const adjustmentWalletsQuery = useQuery({
    queryKey: ['admin-wallet-adjustment-search', deferredAdjustSearch],
    queryFn: () => walletApi.getWallets({ page: 0, size: 8, search: deferredAdjustSearch }),
    enabled: adjustOpen && !adjustWallet,
  });

  const resetAdjustment = () => {
    setAdjustOpen(false);
    setAdjustStep('form');
    setAdjustSearch('');
    setAdjustWallet(null);
    setAdjustDirection('credit');
    setAdjustAmount('');
    setAdjustReason('');
    setAdjustRequestId('');
  };

  const adjustmentMutation = useMutation({
    mutationFn: () => walletApi.adjustBalance({
      userId: adjustWallet!.userId,
      amount: adjustDirection === 'credit' ? Number(adjustAmount) : -Number(adjustAmount),
      reason: adjustReason.trim(),
      requestId: adjustRequestId,
    }),
    onSuccess: async (response) => {
      const wasCredit = adjustDirection === 'credit';
      toast.success(response.idempotentReplay
        ? 'Yêu cầu này đã được xử lý trước đó; dữ liệu ví đã được đồng bộ'
        : wasCredit ? 'Đã cộng Time Credit vào ví người dùng' : 'Đã trừ Time Credit khỏi ví người dùng');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-wallet-overview'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-wallets'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-wallet-transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-wallet-anomalies'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-wallet-detail'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-wallet-detail-transactions'] }),
      ]);
      resetAdjustment();
    },
    onError: (error) => {
      setAdjustStep('form');
      toast.error(getErrorMessage(error, 'Không thể điều chỉnh ví. Mã yêu cầu được giữ để bạn thử lại an toàn.'));
    },
  });

  const closeAdjustment = () => {
    if (adjustmentMutation.isPending) return;
    resetAdjustment();
  };

  const openAdjustment = (wallet?: AdminWalletSummary) => {
    setAdjustWallet(wallet ?? null);
    setAdjustSearch('');
    setAdjustAmount('');
    setAdjustDirection('credit');
    setAdjustReason('');
    setAdjustStep('form');
    setAdjustRequestId(createRequestId());
    setAdjustOpen(true);
  };

  const validateAdjustment = () => {
    if (!adjustWallet) {
      toast.error('Vui lòng chọn ví người dùng cần điều chỉnh');
      return false;
    }
    const amount = Number(adjustAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Số Credit điều chỉnh phải lớn hơn 0');
      return false;
    }
    if (Math.abs(amount) > 100) {
      toast.error('Mỗi lần chỉ được điều chỉnh tối đa 100 Time Credit');
      return false;
    }
    if (adjustDirection === 'debit' && amount > adjustWallet.balance) {
      toast.error(`Số Credit trừ không thể vượt quá số dư khả dụng ${formatCredit(adjustWallet.balance)} TC`);
      return false;
    }
    if (adjustReason.trim().length < 5) {
      toast.error('Vui lòng nhập lý do rõ ràng, tối thiểu 5 ký tự');
      return false;
    }
    return true;
  };

  const submitAdjustment = () => {
    if (adjustmentMutation.isPending || !validateAdjustment()) return;
    if (adjustDirection === 'debit' && adjustStep === 'form') {
      setAdjustStep('confirm-debit');
      return;
    }
    adjustmentMutation.mutate();
  };

  const refresh = async () => {
    const tasks: Promise<{ isError: boolean }>[] = [overviewQuery.refetch(), anomaliesQuery.refetch()];
    if (activeTab === 'wallets') tasks.push(walletsQuery.refetch());
    if (activeTab === 'transactions') tasks.push(transactionsQuery.refetch());
    const results = await Promise.all(tasks);
    if (results.some((result) => result.isError)) {
      toast.error('Không thể cập nhật đầy đủ dữ liệu ví');
      return;
    }
    toast.success('Đã cập nhật dữ liệu ví');
  };

  const showTransactionsForUser = (wallet: AdminWalletSummary) => {
    setTransactionUser({ id: wallet.userId, name: wallet.userFullName });
    setTransactionPage(0);
    setActiveTab('transactions');
    setSelectedUserId(null);
  };

  const tabs = useMemo(() => [
    { id: 'overview' as const, label: 'Tổng quan', icon: Activity },
    { id: 'wallets' as const, label: 'Ví người dùng', icon: Users },
    { id: 'transactions' as const, label: 'Giao dịch', icon: History },
    { id: 'anomalies' as const, label: 'Bất thường', icon: ShieldAlert, badge: anomaliesQuery.data?.length ?? 0 },
  ], [anomaliesQuery.data?.length]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-text">Ví Time Credit</h1>
            {(anomaliesQuery.data?.length ?? 0) > 0 && <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700"><AlertTriangle size={13} />{anomaliesQuery.data?.length} cảnh báo</span>}
          </div>
          <p className="mt-1 text-sm text-text-muted">Theo dõi dòng Credit, kiểm tra số dư và điều chỉnh ví có kiểm soát.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={refresh} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-text hover:bg-surface-2"><RefreshCw size={16} className={(overviewQuery.isFetching || walletsQuery.isFetching || transactionsQuery.isFetching) ? 'animate-spin' : ''} /> Làm mới</button>
          <button type="button" onClick={() => openAdjustment()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover"><SlidersHorizontal size={16} /> Điều chỉnh ví</button>
        </div>
      </header>

      <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-border bg-white p-1.5 shadow-sm">
        {tabs.map(({ id, label, icon: Icon, badge }) => (
          <button key={id} type="button" onClick={() => setActiveTab(id)} className={`inline-flex min-w-max flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${activeTab === id ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:bg-surface-2 hover:text-text'}`}>
            <Icon size={16} /> {label}
            {badge != null && badge > 0 && <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${activeTab === id ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'}`}>{badge}</span>}
          </button>
        ))}
      </nav>

      {activeTab === 'overview' && <OverviewSection overview={overviewQuery.data} isLoading={overviewQuery.isLoading} isError={overviewQuery.isError} anomalies={anomaliesQuery.data ?? []} onViewAnomalies={() => setActiveTab('anomalies')} onAdjust={() => openAdjustment()} />}

      {activeTab === 'wallets' && <WalletsSection
        page={walletPage}
        search={walletSearch}
        hasHeld={hasHeld}
        inconsistent={inconsistent}
        data={walletsQuery.data}
        isLoading={walletsQuery.isLoading}
        isError={walletsQuery.isError}
        onPage={setWalletPage}
        onSearch={(value) => { setWalletSearch(value); setWalletPage(0); }}
        onHasHeld={(value) => { setHasHeld(value); setWalletPage(0); }}
        onInconsistent={(value) => { setInconsistent(value); setWalletPage(0); }}
        onClear={() => { setWalletSearch(''); setHasHeld(''); setInconsistent(''); setWalletPage(0); }}
        onView={setSelectedUserId}
        onAdjust={openAdjustment}
      />}

      {activeTab === 'transactions' && <TransactionsSection
        page={transactionPage}
        search={transactionSearch}
        type={transactionType}
        dateFrom={dateFrom}
        dateTo={dateTo}
        userFilter={transactionUser}
        data={transactionsQuery.data}
        isLoading={transactionsQuery.isLoading}
        isError={transactionsQuery.isError}
        onPage={setTransactionPage}
        onSearch={(value) => { setTransactionSearch(value); setTransactionPage(0); }}
        onType={(value) => { setTransactionType(value); setTransactionPage(0); }}
        onDateFrom={(value) => { setDateFrom(value); setTransactionPage(0); }}
        onDateTo={(value) => { setDateTo(value); setTransactionPage(0); }}
        onClear={() => { setTransactionSearch(''); setTransactionType(''); setDateFrom(''); setDateTo(''); setTransactionUser(null); setTransactionPage(0); }}
        onClearUser={() => { setTransactionUser(null); setTransactionPage(0); }}
      />}

      {activeTab === 'anomalies' && <AnomaliesSection anomalies={anomaliesQuery.data ?? []} isLoading={anomaliesQuery.isLoading} isError={anomaliesQuery.isError} onOpenWallet={setSelectedUserId} />}

      {selectedUserId && <WalletDetailDrawer
        userId={selectedUserId}
        detail={walletDetailQuery.data}
        transactions={walletTransactionsQuery.data?.content ?? []}
        isLoading={walletDetailQuery.isLoading || walletTransactionsQuery.isLoading}
        isError={walletDetailQuery.isError || walletTransactionsQuery.isError}
        onClose={() => setSelectedUserId(null)}
        onAdjust={(wallet) => { setSelectedUserId(null); openAdjustment(wallet); }}
        onViewTransactions={showTransactionsForUser}
      />}

      {adjustOpen && <AdjustmentDialog
        step={adjustStep}
        search={adjustSearch}
        wallets={adjustmentWalletsQuery.data?.content ?? []}
        searchLoading={adjustmentWalletsQuery.isLoading || adjustmentWalletsQuery.isFetching}
        selectedWallet={adjustWallet}
        direction={adjustDirection}
        amount={adjustAmount}
        reason={adjustReason}
        requestId={adjustRequestId}
        isPending={adjustmentMutation.isPending}
        onSearch={setAdjustSearch}
        onSelect={setAdjustWallet}
        onChangeWallet={() => setAdjustWallet(null)}
        onDirection={setAdjustDirection}
        onAmount={setAdjustAmount}
        onReason={setAdjustReason}
        onBack={() => setAdjustStep('form')}
        onClose={closeAdjustment}
        onSubmit={submitAdjustment}
      />}
    </div>
  );
}

interface OverviewSectionProps {
  overview: Awaited<ReturnType<typeof walletApi.getOverview>> | undefined;
  isLoading: boolean;
  isError: boolean;
  anomalies: AdminWalletAnomaly[];
  onViewAnomalies: () => void;
  onAdjust: () => void;
}

function OverviewSection({ overview, isLoading, isError, anomalies, onViewAnomalies, onAdjust }: OverviewSectionProps) {
  if (isLoading) return <LoadingPanel message="Đang tổng hợp dữ liệu ví..." />;
  if (isError) return <ErrorPanel message="Không thể tải tổng quan ví. Vui lòng kiểm tra Backend và quyền Admin." />;
  const cards = [
    { label: 'Tổng số ví', value: formatInteger(overview?.totalWallets), suffix: 'ví', icon: Wallet, color: 'bg-primary/10 text-primary' },
    { label: 'Khả dụng toàn hệ thống', value: formatCredit(overview?.totalAvailableBalance), suffix: 'TC', icon: Coins, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Đang tạm giữ', value: formatCredit(overview?.totalHeldAmount), suffix: 'TC', icon: LockKeyhole, color: 'bg-amber-50 text-amber-600' },
    { label: 'Credit lưu hành', value: formatCredit(overview?.totalEconomyBalance), suffix: 'TC', icon: CircleDollarSign, color: 'bg-cyan-50 text-cyan-600' },
    { label: 'Tổng đã kiếm', value: formatCredit(overview?.totalEarned), suffix: 'TC', icon: ArrowDownLeft, color: 'bg-blue-50 text-blue-600' },
    { label: 'Tổng đã sử dụng', value: formatCredit(overview?.totalUsed), suffix: 'TC', icon: ArrowUpRight, color: 'bg-violet-50 text-violet-600' },
  ];
  return <div className="space-y-6">
    <section className="grid grid-cols-2 gap-3 xl:grid-cols-3 2xl:grid-cols-6">
      {cards.map(({ label, value, suffix, icon: Icon, color }) => <div key={label} className="rounded-2xl border border-border bg-white p-4 shadow-sm"><div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${color}`}><Icon size={19} /></div><div className="flex flex-wrap items-baseline gap-1.5"><p className="text-2xl font-bold text-text">{value}</p><span className="text-xs font-semibold text-text-muted">{suffix}</span></div><p className="mt-1 text-xs text-text-muted">{label}</p></div>)}
    </section>

    <section className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-border p-5"><div><h2 className="font-bold text-text">Hoạt động hôm nay</h2><p className="mt-1 text-xs text-text-muted">Số liệu được cập nhật theo giao dịch đã ghi nhận.</p></div><Activity size={20} className="text-primary" /></div>
        <div className="grid gap-px bg-border sm:grid-cols-3">
          {[{ label: 'Giao dịch', value: formatInteger(overview?.transactionCountToday), suffix: 'lượt', icon: History }, { label: 'Khối lượng', value: formatCredit(overview?.transactionVolumeToday), suffix: 'TC', icon: CircleDollarSign }, { label: 'Admin điều chỉnh', value: formatInteger(overview?.adjustmentCountToday), suffix: 'lần', icon: SlidersHorizontal }].map(({ label, value, suffix, icon: Icon }) => <div key={label} className="bg-white p-5"><Icon size={19} className="mb-5 text-text-muted" /><p className="text-2xl font-bold text-text">{value} <span className="text-xs font-semibold text-text-muted">{suffix}</span></p><p className="mt-1 text-xs text-text-muted">{label}</p></div>)}
        </div>
        <div className="flex flex-col gap-3 border-t border-border bg-surface-2 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex flex-wrap gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${(overview?.missingWalletCount ?? 0) > 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>{formatInteger(overview?.missingWalletCount)} tài khoản thiếu ví</span><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${(overview?.inconsistentWallets ?? 0) > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{formatInteger(overview?.inconsistentWallets)} ví lệch sổ</span><span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">{formatInteger(overview?.walletsWithHeldCredit)} ví đang giữ Credit</span></div><button type="button" onClick={onAdjust} className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-primary hover:text-primary-hover"><Plus size={16} /> Tạo điều chỉnh</button></div>
      </div>

      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-3"><div><h2 className="font-bold text-text">Cảnh báo mới</h2><p className="mt-1 text-xs text-text-muted">Dấu hiệu cần quản trị viên kiểm tra.</p></div>{anomalies.length > 0 && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">{anomalies.length}</span>}</div>
        {anomalies.length === 0 ? <div className="flex min-h-40 flex-col items-center justify-center rounded-xl bg-emerald-50 p-5 text-center"><CheckCircle2 size={30} className="mb-3 text-emerald-500" /><p className="font-semibold text-emerald-800">Chưa phát hiện bất thường</p><p className="mt-1 text-xs text-emerald-700">Các chỉ số ví đang trong ngưỡng theo dõi.</p></div> : <div className="space-y-2">{anomalies.slice(0, 3).map((item) => <div key={item.anomalyKey} className="rounded-xl border border-border p-3"><div className="flex items-start justify-between gap-2"><p className="line-clamp-1 text-sm font-semibold text-text">{ANOMALY_LABEL[item.type] ?? item.type}</p><SeverityBadge severity={item.severity} /></div><p className="mt-1 line-clamp-2 text-xs leading-5 text-text-muted">{item.message}</p></div>)}</div>}
        <button type="button" onClick={onViewAnomalies} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-text hover:bg-surface-2">Xem tất cả cảnh báo <ArrowRight size={15} /></button>
      </div>
    </section>
  </div>;
}

interface WalletsSectionProps {
  page: number;
  search: string;
  hasHeld: BooleanFilter;
  inconsistent: BooleanFilter;
  data: Awaited<ReturnType<typeof walletApi.getWallets>> | undefined;
  isLoading: boolean;
  isError: boolean;
  onPage: (page: number) => void;
  onSearch: (value: string) => void;
  onHasHeld: (value: BooleanFilter) => void;
  onInconsistent: (value: BooleanFilter) => void;
  onClear: () => void;
  onView: (userId: string) => void;
  onAdjust: (wallet: AdminWalletSummary) => void;
}

function WalletsSection({ page, search, hasHeld, inconsistent, data, isLoading, isError, onPage, onSearch, onHasHeld, onInconsistent, onClear, onView, onAdjust }: WalletsSectionProps) {
  const items = data?.content ?? [];
  return <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
    <div className="grid gap-3 border-b border-border p-4 md:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_auto]">
      <label className="relative"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" /><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Tên hoặc email người dùng..." className="w-full rounded-xl border border-border bg-surface-2 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary" /></label>
      <select value={hasHeld === '' ? '' : String(hasHeld)} onChange={(event) => onHasHeld(event.target.value === '' ? '' : event.target.value === 'true')} className="rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"><option value="">Tất cả số dư giữ</option><option value="true">Có Credit đang giữ</option><option value="false">Không có Credit giữ</option></select>
      <select value={inconsistent === '' ? '' : String(inconsistent)} onChange={(event) => onInconsistent(event.target.value === '' ? '' : event.target.value === 'true')} className="rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"><option value="">Tất cả đối soát</option><option value="true">Có chênh lệch</option><option value="false">Đã cân bằng</option></select>
      <button type="button" onClick={onClear} className="rounded-xl px-3 py-2 text-sm font-medium text-text-muted hover:bg-surface-2">Xóa lọc</button>
    </div>
    <div className="overflow-x-auto"><table className="w-full min-w-[930px] text-left text-sm"><thead className="bg-surface-2 text-xs uppercase tracking-wide text-text-muted"><tr><th className="px-5 py-3">Người dùng</th><th className="px-5 py-3">Khả dụng</th><th className="px-5 py-3">Đang giữ</th><th className="px-5 py-3">Đã kiếm</th><th className="px-5 py-3">Đã dùng</th><th className="px-5 py-3">Đối soát</th><th className="px-5 py-3 text-right">Thao tác</th></tr></thead><tbody className="divide-y divide-border">
      {isLoading && <EmptyRows colSpan={7} message="Đang tải danh sách ví..." />}
      {isError && <EmptyRows colSpan={7} message="Không thể tải danh sách ví." error />}
      {!isLoading && !isError && items.length === 0 && <EmptyRows colSpan={7} message="Không tìm thấy ví phù hợp." />}
      {items.map((wallet) => <tr key={wallet.walletId} className="hover:bg-surface-hover"><td className="px-5 py-4"><div className="flex items-center gap-3"><Avatar wallet={wallet} /><div><div className="flex items-center gap-2"><p className="font-semibold text-text">{wallet.userFullName}</p>{wallet.userType === 'admin' && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">ADMIN</span>}</div><p className="text-xs text-text-muted">{wallet.userEmail}</p></div></div></td><td className="px-5 py-4"><p className="font-bold text-emerald-600">{formatCredit(wallet.balance)} TC</p><p className="mt-1 text-xs text-text-muted">Cập nhật {formatDateTime(wallet.updatedAt)}</p></td><td className="px-5 py-4 font-semibold text-amber-600">{formatCredit(wallet.heldAmount)} TC</td><td className="px-5 py-4 text-text">{formatCredit(wallet.totalEarned)} TC</td><td className="px-5 py-4 text-text">{formatCredit(wallet.totalUsed)} TC</td><td className="px-5 py-4">{isWalletInconsistent(wallet) ? <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700"><AlertTriangle size={13} /> Chênh {formatCredit(Math.abs(wallet.invariantDifference))} TC</span> : <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"><CheckCircle2 size={13} /> Cân bằng</span>}</td><td className="px-5 py-4"><div className="flex justify-end gap-1">{wallet.userType !== 'admin' && <button type="button" onClick={() => onAdjust(wallet)} title="Điều chỉnh ví" className="rounded-lg p-2 text-primary hover:bg-primary/10"><SlidersHorizontal size={16} /></button>}<button type="button" onClick={() => onView(wallet.userId)} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 font-semibold text-primary hover:bg-primary/10"><Eye size={15} /> Xem</button></div></td></tr>)}
    </tbody></table></div>
    <Pagination page={page} totalPages={data?.totalPages ?? 0} totalElements={data?.totalElements ?? 0} label="ví" onPage={onPage} />
  </section>;
}

interface TransactionsSectionProps {
  page: number;
  search: string;
  type: WalletTransactionType | '';
  dateFrom: string;
  dateTo: string;
  userFilter: { id: string; name: string } | null;
  data: Awaited<ReturnType<typeof walletApi.getTransactions>> | undefined;
  isLoading: boolean;
  isError: boolean;
  onPage: (page: number) => void;
  onSearch: (value: string) => void;
  onType: (value: WalletTransactionType | '') => void;
  onDateFrom: (value: string) => void;
  onDateTo: (value: string) => void;
  onClear: () => void;
  onClearUser: () => void;
}

function TransactionsSection({ page, search, type, dateFrom, dateTo, userFilter, data, isLoading, isError, onPage, onSearch, onType, onDateFrom, onDateTo, onClear, onClearUser }: TransactionsSectionProps) {
  const items = data?.content ?? [];
  return <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
    {userFilter && <div className="flex items-center justify-between border-b border-primary/20 bg-primary/5 px-4 py-3 text-sm"><span className="inline-flex items-center gap-2 font-medium text-primary"><UserRound size={16} /> Đang xem giao dịch của <strong>{userFilter.name}</strong></span><button type="button" onClick={onClearUser} className="rounded-lg p-1.5 text-primary hover:bg-primary/10" title="Bỏ lọc người dùng"><X size={16} /></button></div>}
    <div className="grid gap-3 border-b border-border p-4 md:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr_auto]">
      <label className="relative"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" /><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Người dùng, mô tả, mã tham chiếu..." className="w-full rounded-xl border border-border bg-surface-2 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary" /></label>
      <select value={type} onChange={(event) => onType(event.target.value as WalletTransactionType | '')} className="rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"><option value="">Tất cả loại</option>{TRANSACTION_TYPES.map((value) => <option key={value} value={value}>{TRANSACTION_META[value].label}</option>)}</select>
      <input type="date" value={dateFrom} max={dateTo || undefined} onChange={(event) => onDateFrom(event.target.value)} className="rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-primary" title="Từ ngày" />
      <input type="date" value={dateTo} min={dateFrom || undefined} onChange={(event) => onDateTo(event.target.value)} className="rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-primary" title="Đến ngày" />
      <button type="button" onClick={onClear} className="rounded-xl px-3 py-2 text-sm font-medium text-text-muted hover:bg-surface-2">Xóa lọc</button>
    </div>
    <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-sm"><thead className="bg-surface-2 text-xs uppercase tracking-wide text-text-muted"><tr><th className="px-5 py-3">Thời gian</th><th className="px-5 py-3">Người dùng</th><th className="px-5 py-3">Loại</th><th className="px-5 py-3">Biến động</th><th className="px-5 py-3">Số dư sau</th><th className="px-5 py-3">Nội dung</th><th className="px-5 py-3">Tham chiếu</th></tr></thead><tbody className="divide-y divide-border">
      {isLoading && <EmptyRows colSpan={7} message="Đang tải giao dịch..." />}
      {isError && <EmptyRows colSpan={7} message="Không thể tải lịch sử giao dịch." error />}
      {!isLoading && !isError && items.length === 0 && <EmptyRows colSpan={7} message="Không có giao dịch phù hợp." />}
      {items.map((transaction) => {
        const amount = signedAmount(transaction);
        return <tr key={transaction.id} className="hover:bg-surface-hover"><td className="whitespace-nowrap px-5 py-4 text-xs text-text-muted">{formatDateTime(transaction.createdAt)}</td><td className="px-5 py-4"><p className="font-semibold text-text">{transaction.userFullName}</p><p className="text-xs text-text-muted">{transaction.userEmail}</p></td><td className="px-5 py-4"><TransactionBadge type={transaction.type} /></td><td className={`px-5 py-4 font-bold ${amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{amount >= 0 ? '+' : ''}{formatCredit(amount)} TC</td><td className="px-5 py-4 font-semibold text-text">{formatCredit(transaction.balanceAfter)} TC</td><td className="px-5 py-4"><p className="max-w-[260px] truncate text-text" title={transaction.description ?? ''}>{transaction.description || 'Không có mô tả'}</p></td><td className="px-5 py-4"><p className="max-w-44 truncate font-mono text-xs text-text-muted" title={transaction.appointmentTitle ?? transaction.referenceType ?? transaction.appointmentId ?? transaction.referenceId ?? ''}>{transaction.appointmentTitle ?? transaction.referenceType ?? transaction.appointmentId ?? transaction.referenceId ?? '—'}</p></td></tr>;
      })}
    </tbody></table></div>
    <Pagination page={page} totalPages={data?.totalPages ?? 0} totalElements={data?.totalElements ?? 0} label="giao dịch" onPage={onPage} />
  </section>;
}

function AnomaliesSection({ anomalies, isLoading, isError, onOpenWallet }: { anomalies: AdminWalletAnomaly[]; isLoading: boolean; isError: boolean; onOpenWallet: (userId: string) => void }) {
  if (isLoading) return <LoadingPanel message="Đang phân tích bất thường..." />;
  if (isError) return <ErrorPanel message="Không thể tải dữ liệu bất thường." />;
  return <section className="rounded-2xl border border-border bg-white p-5 shadow-sm"><div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="flex items-center gap-2 font-bold text-text"><ShieldAlert size={19} className="text-amber-500" /> Phát hiện bất thường</h2><p className="mt-1 text-xs text-text-muted">Danh sách được tính lại từ dữ liệu ví và lịch sử giao dịch hiện tại.</p></div><span className="w-fit rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold text-text-muted">{anomalies.length} cảnh báo</span></div>
    {anomalies.length === 0 ? <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 p-8 text-center"><CheckCircle2 size={42} className="mb-3 text-emerald-500" /><h3 className="font-bold text-emerald-800">Không có dấu hiệu bất thường</h3><p className="mt-1 max-w-md text-sm text-emerald-700">Số dư, tổng Credit đã kiếm và sử dụng hiện khớp với các quy tắc đối soát.</p></div> : <div className="grid gap-3 lg:grid-cols-2">{anomalies.map((item) => <article key={item.anomalyKey} className="rounded-2xl border border-border p-4 transition-colors hover:border-amber-200 hover:bg-amber-50/30"><div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><AlertTriangle size={20} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-semibold text-text">{ANOMALY_LABEL[item.type] ?? item.type}</h3><p className="mt-0.5 text-xs text-text-muted">{item.type}</p></div><SeverityBadge severity={item.severity} /></div><p className="mt-3 text-sm leading-6 text-text-muted">{item.message}</p><div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-text-muted">{item.userFullName && <span className="inline-flex items-center gap-1.5"><UserRound size={13} /> {item.userFullName}</span>}{item.relatedUserFullName && <span>Liên quan: {item.relatedUserFullName}</span>}<span className="font-semibold text-amber-700">Chỉ số: {formatCredit(item.metricValue)} · Ngưỡng: {formatCredit(item.threshold)}</span><span className="inline-flex items-center gap-1.5"><Clock3 size={13} /> {formatDateTime(item.detectedAt)}</span></div>{item.userId && <button type="button" onClick={() => onOpenWallet(item.userId!)} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover"><Eye size={15} /> Kiểm tra ví</button>}</div></div></article>)}</div>}
  </section>;
}

interface WalletDetailDrawerProps {
  userId: string;
  detail: Awaited<ReturnType<typeof walletApi.getWalletDetail>> | undefined;
  transactions: AdminWalletTransaction[];
  isLoading: boolean;
  isError: boolean;
  onClose: () => void;
  onAdjust: (wallet: AdminWalletSummary) => void;
  onViewTransactions: (wallet: AdminWalletSummary) => void;
}

function WalletDetailDrawer({ userId, detail, transactions, isLoading, isError, onClose, onAdjust, onViewTransactions }: WalletDetailDrawerProps) {
  return <div className="fixed inset-0 z-[70] flex justify-end bg-slate-900/40 backdrop-blur-sm" onMouseDown={onClose}><aside className="h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}><div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-6 py-5"><div><h2 className="text-xl font-bold text-text">Chi tiết ví</h2><p className="mt-0.5 text-xs text-text-muted">Người dùng: {userId}</p></div><button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-surface-2"><X size={20} /></button></div>
    {isLoading && <LoadingPanel message="Đang tải chi tiết ví..." flat />}
    {isError && <ErrorPanel message="Không thể tải chi tiết ví." flat />}
    {detail && !isLoading && <div className="space-y-6 p-6"><section className="flex flex-col gap-4 rounded-2xl border border-border p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-3"><Avatar wallet={detail} size="lg" /><div className="min-w-0"><h3 className="truncate text-lg font-bold text-text">{detail.userFullName}</h3><p className="truncate text-sm text-text-muted">{detail.userEmail}</p></div></div><div className="sm:text-right"><p className="text-2xl font-bold text-emerald-600">{formatCredit(detail.balance)} TC</p><p className="text-xs text-text-muted">Số dư khả dụng</p></div></section>
      <section className="grid grid-cols-2 gap-3"><MetricBox label="Đang giữ" value={`${formatCredit(detail.heldAmount)} TC`} color="text-amber-600" /><MetricBox label="Sổ giao dịch" value={`${formatCredit(detail.ledgerBalance)} TC`} color="text-cyan-600" /><MetricBox label="Đã kiếm" value={`${formatCredit(detail.totalEarned)} TC`} color="text-blue-600" /><MetricBox label="Đã sử dụng" value={`${formatCredit(detail.totalUsed)} TC`} color="text-violet-600" /><MetricBox label="Đối soát" value={isWalletInconsistent(detail) ? `Chênh ${formatCredit(Math.abs(detail.invariantDifference))} TC` : 'Cân bằng'} color={isWalletInconsistent(detail) ? 'text-red-600' : 'text-emerald-600'} /></section>
      <div className="flex flex-wrap gap-2">{detail.userType !== 'admin' && <button type="button" onClick={() => onAdjust(detail)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"><SlidersHorizontal size={16} /> Điều chỉnh ví</button>}<button type="button" onClick={() => onViewTransactions(detail)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-text hover:bg-surface-2"><History size={16} /> Toàn bộ giao dịch</button></div>
      <section><div className="mb-3 flex items-center justify-between"><h4 className="font-bold text-text">Giao dịch gần đây</h4><span className="text-xs text-text-muted">Cập nhật {formatDateTime(detail.updatedAt)}</span></div>{transactions.length === 0 ? <p className="rounded-xl bg-surface-2 p-5 text-center text-sm text-text-muted">Ví chưa có giao dịch.</p> : <div className="divide-y divide-border rounded-xl border border-border">{transactions.map((transaction) => { const amount = signedAmount(transaction); return <div key={transaction.id} className="flex items-center gap-3 p-3"><div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${amount >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{amount >= 0 ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-text">{transaction.description || TRANSACTION_META[transaction.type]?.label || transaction.type}</p><p className="text-xs text-text-muted">{formatDateTime(transaction.createdAt)}</p></div><p className={`whitespace-nowrap text-sm font-bold ${amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{amount >= 0 ? '+' : ''}{formatCredit(amount)} TC</p></div>; })}</div>}</section>
    </div>}
  </aside></div>;
}

interface AdjustmentDialogProps {
  step: 'form' | 'confirm-debit';
  search: string;
  wallets: AdminWalletSummary[];
  searchLoading: boolean;
  selectedWallet: AdminWalletSummary | null;
  direction: 'credit' | 'debit';
  amount: string;
  reason: string;
  requestId: string;
  isPending: boolean;
  onSearch: (value: string) => void;
  onSelect: (wallet: AdminWalletSummary) => void;
  onChangeWallet: () => void;
  onDirection: (direction: 'credit' | 'debit') => void;
  onAmount: (value: string) => void;
  onReason: (value: string) => void;
  onBack: () => void;
  onClose: () => void;
  onSubmit: () => void;
}

function AdjustmentDialog({ step, search, wallets, searchLoading, selectedWallet, direction, amount, reason, requestId, isPending, onSearch, onSelect, onChangeWallet, onDirection, onAmount, onReason, onBack, onClose, onSubmit }: AdjustmentDialogProps) {
  const numericAmount = Number(amount);
  return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onMouseDown={onClose}><div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
    {step === 'confirm-debit' ? <><div className="p-6 text-center"><div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600"><MinusCircle size={28} /></div><h2 className="text-xl font-bold text-text">Xác nhận trừ Time Credit?</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text-muted">Bạn sắp trừ <strong className="text-red-600">{formatCredit(numericAmount)} TC</strong> khỏi ví của <strong className="text-text">{selectedWallet?.userFullName}</strong>. Thao tác sẽ được ghi vào lịch sử quản trị.</p><div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4 text-left"><p className="text-xs font-semibold uppercase tracking-wide text-red-600">Lý do</p><p className="mt-1 text-sm text-red-800">{reason}</p></div><p className="mt-3 break-all font-mono text-[10px] text-text-dim">Mã yêu cầu: {requestId}</p></div><div className="flex gap-3 border-t border-border bg-surface-2 p-4"><button type="button" disabled={isPending} onClick={onBack} className="flex-1 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-text disabled:opacity-50">Quay lại</button><button type="button" disabled={isPending} onClick={onSubmit} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">{isPending && <RefreshCw size={15} className="animate-spin" />}{isPending ? 'Đang xử lý...' : 'Xác nhận trừ'}</button></div></> : <><div className="flex items-start justify-between border-b border-border p-6"><div><h2 className="text-xl font-bold text-text">Điều chỉnh ví</h2><p className="mt-1 text-sm text-text-muted">Cộng hoặc trừ tối đa 100 Time Credit mỗi lần.</p></div><button type="button" disabled={isPending} onClick={onClose} className="rounded-lg p-2 hover:bg-surface-2 disabled:opacity-50"><X size={20} /></button></div><div className="space-y-5 p-6">
      <section><label className="mb-2 block text-sm font-semibold text-text">Ví người dùng <span className="text-red-500">*</span></label>{selectedWallet ? <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3"><div className="flex min-w-0 items-center gap-3"><Avatar wallet={selectedWallet} /><div className="min-w-0"><p className="truncate font-semibold text-text">{selectedWallet.userFullName}</p><p className="truncate text-xs text-text-muted">{selectedWallet.userEmail} · {formatCredit(selectedWallet.balance)} TC</p></div></div><button type="button" disabled={isPending} onClick={onChangeWallet} className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10">Đổi</button></div> : <div><label className="relative block"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" /><input autoFocus value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Tìm theo tên hoặc email..." className="w-full rounded-xl border border-border bg-surface-2 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary" /></label><div className="mt-2 max-h-52 space-y-1 overflow-y-auto rounded-xl border border-border p-1">{searchLoading && <p className="p-4 text-center text-sm text-text-muted">Đang tìm ví...</p>}{!searchLoading && wallets.filter((wallet) => wallet.userType !== 'admin').length === 0 && <p className="p-4 text-center text-sm text-text-muted">Không tìm thấy ví người dùng có thể điều chỉnh.</p>}{!searchLoading && wallets.filter((wallet) => wallet.userType !== 'admin').map((wallet) => <button type="button" key={wallet.walletId} onClick={() => onSelect(wallet)} className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left hover:bg-surface-2"><Avatar wallet={wallet} size="sm" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-text">{wallet.userFullName}</span><span className="block truncate text-xs text-text-muted">{wallet.userEmail}</span></span><span className="whitespace-nowrap text-xs font-bold text-primary">{formatCredit(wallet.balance)} TC</span></button>)}</div></div>}</section>
      <section><label className="mb-2 block text-sm font-semibold text-text">Loại điều chỉnh <span className="text-red-500">*</span></label><div className="grid grid-cols-2 gap-2"><button type="button" disabled={isPending} onClick={() => onDirection('credit')} className={`rounded-xl border p-3 text-left transition-colors ${direction === 'credit' ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-border text-text-muted hover:bg-surface-2'}`}><span className="flex items-center gap-2 font-bold"><Plus size={17} /> Cộng Credit</span><span className="mt-1 block text-xs">Bổ sung vào số dư khả dụng</span></button><button type="button" disabled={isPending} onClick={() => onDirection('debit')} className={`rounded-xl border p-3 text-left transition-colors ${direction === 'debit' ? 'border-red-400 bg-red-50 text-red-700' : 'border-border text-text-muted hover:bg-surface-2'}`}><span className="flex items-center gap-2 font-bold"><MinusCircle size={17} /> Trừ Credit</span><span className="mt-1 block text-xs">Giảm số dư khả dụng</span></button></div></section>
      <section><label htmlFor="adjust-amount" className="mb-2 block text-sm font-semibold text-text">Số Credit <span className="text-red-500">*</span></label><div className="relative"><input id="adjust-amount" type="number" step="0.5" min="0.01" max="100" value={amount} disabled={isPending} onChange={(event) => onAmount(event.target.value)} placeholder="Ví dụ: 2 hoặc 1.5" className="w-full rounded-xl border border-border px-4 py-3 pr-12 text-lg font-bold text-text outline-none focus:border-primary disabled:bg-surface-2" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-text-muted">TC</span></div><div className="mt-2 flex flex-wrap gap-2">{[1, 2, 5, 10].map((value) => <button type="button" key={value} disabled={isPending} onClick={() => onAmount(String(value))} className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${direction === 'credit' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>{value} TC</button>)}</div><p className="mt-2 text-xs text-text-muted">Nhập giá trị dương từ 0 đến 100. Hệ thống tự áp dụng dấu theo loại đã chọn.</p></section>
      <section><label htmlFor="adjust-reason" className="mb-2 block text-sm font-semibold text-text">Lý do điều chỉnh <span className="text-red-500">*</span></label><textarea id="adjust-reason" rows={3} maxLength={500} value={reason} disabled={isPending} onChange={(event) => onReason(event.target.value)} placeholder="Nêu rõ căn cứ điều chỉnh để phục vụ kiểm tra..." className="w-full resize-none rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-primary disabled:bg-surface-2" /><p className="mt-1 text-right text-xs text-text-dim">{reason.length}/500</p></section>
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3"><p className="flex items-start gap-2 text-xs leading-5 text-amber-800"><AlertTriangle size={15} className="mt-0.5 shrink-0" /> Không dùng điều chỉnh tay để giải quyết tranh chấp hoặc hoàn tiền lịch hẹn vì Credit có thể đang được tạm giữ. Những trường hợp đó phải xử lý qua luồng tranh chấp riêng.</p></div>
      <div className="rounded-xl bg-surface-2 p-3"><p className="flex items-center gap-2 text-xs font-medium text-text-muted"><LockKeyhole size={14} /> Mỗi yêu cầu có một mã chống xử lý trùng.</p><p className="mt-1 break-all font-mono text-[10px] text-text-dim">{requestId}</p></div>
    </div><div className="flex gap-3 border-t border-border bg-surface-2 p-4"><button type="button" disabled={isPending} onClick={onClose} className="flex-1 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-text disabled:opacity-50">Hủy</button><button type="button" disabled={isPending} onClick={onSubmit} className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 ${direction === 'debit' ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary-hover'}`}>{isPending && <RefreshCw size={15} className="animate-spin" />}{isPending ? 'Đang xử lý...' : direction === 'debit' ? 'Tiếp tục trừ' : 'Cộng Credit'}</button></div></>}
  </div></div>;
}

function MetricBox({ label, value, color }: { label: string; value: string; color: string }) {
  return <div className="rounded-xl bg-surface-2 p-4"><p className="text-xs font-medium text-text-muted">{label}</p><p className={`mt-1 font-bold ${color}`}>{value}</p></div>;
}

function Pagination({ page, totalPages, totalElements, label, onPage }: { page: number; totalPages: number; totalElements: number; label: string; onPage: (page: number) => void }) {
  const pages = Math.max(totalPages, 1);
  return <div className="flex flex-col gap-3 border-t border-border px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between"><span className="text-text-muted">{formatInteger(totalElements)} {label}</span><div className="flex items-center gap-2"><button type="button" disabled={page === 0} onClick={() => onPage(page - 1)} className="rounded-lg border border-border p-2 hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={16} /></button><span className="min-w-24 text-center text-text-muted">Trang {page + 1}/{pages}</span><button type="button" disabled={page + 1 >= pages} onClick={() => onPage(page + 1)} className="rounded-lg border border-border p-2 hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight size={16} /></button></div></div>;
}

function EmptyRows({ colSpan, message, error = false }: { colSpan: number; message: string; error?: boolean }) {
  return <tr><td colSpan={colSpan} className={`py-14 text-center text-sm ${error ? 'text-red-600' : 'text-text-muted'}`}>{message}</td></tr>;
}

function LoadingPanel({ message, flat = false }: { message: string; flat?: boolean }) {
  return <div className={`${flat ? '' : 'rounded-2xl border border-border bg-white shadow-sm'} flex min-h-64 flex-col items-center justify-center p-8 text-center text-text-muted`}><RefreshCw size={28} className="mb-3 animate-spin text-primary" /><p className="text-sm font-medium">{message}</p></div>;
}

function ErrorPanel({ message, flat = false }: { message: string; flat?: boolean }) {
  return <div className={`${flat ? '' : 'rounded-2xl border border-red-100 bg-white shadow-sm'} flex min-h-64 flex-col items-center justify-center p-8 text-center`}><AlertTriangle size={30} className="mb-3 text-red-500" /><p className="text-sm font-medium text-red-600">{message}</p></div>;
}
