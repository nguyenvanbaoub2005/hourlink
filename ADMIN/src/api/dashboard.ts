import api from './axiosInstance';
import type { ApiResponse, DashboardStats, ChartDataPoint } from '@/types';

const DashboardApi = {
  getStats: () =>
    api.get<ApiResponse<DashboardStats>>('/admin/dashboard/stats'),

  getUserGrowth: (period: 'week' | 'month' = 'week') =>
    api.get<ApiResponse<ChartDataPoint[]>>(`/admin/dashboard/user-growth?period=${period}`),

  getAppointmentStats: (period: 'week' | 'month' = 'week') =>
    api.get<ApiResponse<ChartDataPoint[]>>(`/admin/dashboard/appointment-stats?period=${period}`),

  getTopSkills: () =>
    api.get<ApiResponse<ChartDataPoint[]>>('/admin/dashboard/top-skills'),
};

export default DashboardApi;
