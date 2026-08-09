import api from './axiosInstance';
import type { ApiResponse, Report } from '../types';

export interface ReportRequest {
  targetId: string;
  targetType: 'USER' | 'MESSAGE' | 'CONTENT';
  reason: string;
  description: string;
  evidenceUrls?: string;
}

const ReportApi = {
  submitReport: (data: ReportRequest): Promise<ApiResponse<Report>> => 
    api.post('/report', data).then((res) => res.data),
  getMyReports: (): Promise<ApiResponse<Report[]>> => 
    api.get('/report/my').then((res) => res.data),
  getMyReport: (id: string): Promise<ApiResponse<Report>> =>
    api.get(`/report/my/${id}`).then((res) => res.data),
};

export default ReportApi;
