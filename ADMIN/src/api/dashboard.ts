import api from './axiosInstance';
import type { ApiResponse, DashboardStats, ChartDataPoint } from '@/types';

const DashboardApi = {
  getStats: async () => {
    const response = await api.get<ApiResponse<DashboardStats>>('/admin/dashboard/stats');
    return response.data.data;
  },

  getUserGrowth: async (period: 'week' | 'month' = 'week') => {
    const response = await api.get<ApiResponse<ChartDataPoint[]>>('/admin/dashboard/user-growth', {
      params: { period },
    });
    return response.data.data;
  },

  getAppointmentStats: async (period: 'week' | 'month' = 'week') => {
    const response = await api.get<ApiResponse<ChartDataPoint[]>>('/admin/dashboard/appointment-stats', {
      params: { period },
    });
    return response.data.data;
  },

  getTopSkills: async () => {
    const response = await api.get<ApiResponse<ChartDataPoint[]>>('/admin/dashboard/top-skills');
    return response.data.data;
  },
};

export default DashboardApi;
