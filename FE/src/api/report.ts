import api from './axiosInstance';

export enum ReportTargetType {
  USER = 'USER',
  MESSAGE = 'MESSAGE',
  CONTENT = 'CONTENT',
}

export enum ReportReason {
  SPAM = 'SPAM',
  HARASSMENT = 'HARASSMENT',
  MISINFORMATION = 'MISINFORMATION',
  ILLEGAL_CONTENT = 'ILLEGAL_CONTENT',
  FRAUD = 'FRAUD',
  OTHER = 'OTHER',
}

export enum ReportStatus {
  PENDING = 'PENDING',
  REVIEWING = 'REVIEWING',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
}

export interface ReportRequest {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description: string;
  evidenceUrls?: string[];
}

export interface ReportResponse {
  id: string;
  reporterId: string;
  reporterName: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description: string;
  evidenceUrls: string[];
  status: ReportStatus;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

const ReportApi = {
  createReport: (data: ReportRequest) => 
    api.post<ReportResponse>('/reports', data).then(res => res.data),

  getMyReports: (status?: ReportStatus) => 
    api.get<ReportResponse[]>('/reports/me', { params: { status } }).then(res => res.data),

  getReportById: (id: string) => 
    api.get<ReportResponse>(`/reports/${id}`).then(res => res.data),
};

export default ReportApi;
