import api from './axiosInstance';
import type { ApiResponse, PagedResponse, Wallet, WalletTransaction } from '@types';

/**
 * WalletApi — API calls cho module Wallet (chức năng 9.16).
 * Base URL: /wallet
 */
const WalletApi = {
  /**
   * GET /wallet
   * Lấy thông tin ví Time Credit của người dùng đang đăng nhập.
   */
  getMyWallet: () =>
    api.get<ApiResponse<Wallet>>('/wallet'),

  /**
   * GET /wallet/transactions?page=0&size=20
   * Lịch sử giao dịch Time Credit, phân trang, mới nhất trước.
   */
  getTransactions: (page = 0, size = 20) =>
    api.get<ApiResponse<PagedResponse<WalletTransaction>>>('/wallet/transactions', {
      params: { page, size },
    }),
};

export default WalletApi;
