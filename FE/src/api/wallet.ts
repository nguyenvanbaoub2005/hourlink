import api from './axiosInstance';
import type { ApiResponse, PagedResponse } from '@types';
// TODO: import request/response types as they are implemented

/**
 * WalletApi — API calls cho module wallet.
 * Base URL: /wallet
 */
const WalletApi = {
  getMyWallet: () => api.get('/wallet'),
  getTransactions: () => api.get('/wallet/transactions'),
};

export default WalletApi;
