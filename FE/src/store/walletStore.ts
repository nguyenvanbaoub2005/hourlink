import { create } from 'zustand';
import type { Wallet, WalletTransaction } from '@types';

interface WalletState {
  wallet: Wallet | null;
  transactions: WalletTransaction[];
  setWallet: (wallet: Wallet) => void;
  setTransactions: (txs: WalletTransaction[]) => void;
  clearWallet: () => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  wallet: null,
  transactions: [],
  setWallet: (wallet) => set({ wallet }),
  setTransactions: (transactions) => set({ transactions }),
  clearWallet: () => set({ wallet: null, transactions: [] }),
}));
