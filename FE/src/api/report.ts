import api from './axiosInstance';
import type { ApiResponse, PagedResponse } from '@types';
// TODO: import request/response types as they are implemented

/**
 * ReportApi — API calls cho module report.
 * Base URL: /reports
 */
const ReportApi = {
  submitReport: (data: any) => api.post('/reports', data),
  getMyReports: () => api.get('/reports/me'),
};

export default ReportApi;
