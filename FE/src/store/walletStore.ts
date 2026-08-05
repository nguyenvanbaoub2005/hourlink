import { create } from 'zustand';
import WalletApi from '@api/wallet';
import type { Wallet, WalletTransaction } from '@types';

interface WalletState {
  wallet: Wallet | null;
  transactions: WalletTransaction[];
  totalPages: number;
  currentPage: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;

  // Actions
  fetchWallet: () => Promise<void>;
  fetchTransactions: (page?: number) => Promise<void>;
  loadMoreTransactions: () => Promise<void>;
  refreshAll: () => Promise<void>;
  clearWallet: () => void;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  wallet: null,
  transactions: [],
  totalPages: 0,
  currentPage: 0,
  isLoading: false,
  isLoadingMore: false,
  error: null,

  /** Lấy thông tin ví (số dư, heldAmount, totalEarned, totalUsed) */
  fetchWallet: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await WalletApi.getMyWallet();
      if (res.data?.data) {
        set({ wallet: res.data.data });
      }
    } catch (err: any) {
      set({ error: err?.response?.data?.message ?? 'Không tải được thông tin ví' });
    } finally {
      set({ isLoading: false });
    }
  },

  /** Lấy lịch sử giao dịch (reset về trang đầu) */
  fetchTransactions: async (page = 0) => {
    set({ isLoading: true, error: null });
    try {
      const res = await WalletApi.getTransactions(page, 20);
      const paged = res.data?.data;
      if (paged) {
        set({
          transactions: paged.content,
          totalPages: paged.totalPages,
          currentPage: page,
        });
      }
    } catch (err: any) {
      set({ error: err?.response?.data?.message ?? 'Không tải được lịch sử giao dịch' });
    } finally {
      set({ isLoading: false });
    }
  },

  /** Load thêm giao dịch (infinite scroll) */
  loadMoreTransactions: async () => {
    const { currentPage, totalPages, isLoadingMore } = get();
    if (isLoadingMore || currentPage + 1 >= totalPages) return;

    set({ isLoadingMore: true });
    try {
      const nextPage = currentPage + 1;
      const res = await WalletApi.getTransactions(nextPage, 20);
      const paged = res.data?.data;
      if (paged) {
        set((state) => ({
          transactions: [...state.transactions, ...paged.content],
          currentPage: nextPage,
          totalPages: paged.totalPages,
        }));
      }
    } catch {
      // Bỏ qua lỗi load more
    } finally {
      set({ isLoadingMore: false });
    }
  },

  /** Refresh cả ví lẫn lịch sử giao dịch cùng lúc */
  refreshAll: async () => {
    await Promise.all([get().fetchWallet(), get().fetchTransactions(0)]);
  },

  clearWallet: () =>
    set({ wallet: null, transactions: [], totalPages: 0, currentPage: 0, error: null }),
}));
