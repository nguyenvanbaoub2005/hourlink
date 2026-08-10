import api from './axiosInstance';
import type { PaginatedResponse } from './users';

export type ActivityStatus = 'OPEN' | 'CLOSED' | 'COMPLETED' | 'CANCELLED';
export type ParticipantStatus = 'REGISTERED' | 'CONFIRMED' | 'ABSENT' | 'CANCELLED';

export interface AdminCommunityActivity {
  id: string;
  title: string;
  location: string | null;
  startTime: string;
  endTime: string;
  maxParticipants: number | null;
  creditReward: number;
  status: ActivityStatus;
  organizerId: string;
  organizerName: string;
  organizerEmail: string;
  registeredCount: number;
  confirmedCount: number;
  absentCount: number;
  cancelledCount: number;
  createdAt: string;
}

export interface AdminCommunityActivityDetail extends AdminCommunityActivity {
  description: string | null;
  organizerAvatarUrl: string | null;
  updatedAt: string;
}

export interface CommunityEvidence {
  id: string;
  fileUrl: string;
  originalName: string | null;
  fileSize: number | null;
  createdAt: string;
}

export interface CommunityParticipant {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatarUrl: string | null;
  status: ParticipantStatus;
  actualHours: number | null;
  confirmNote: string | null;
  confirmedAt: string | null;
  creditAwarded: boolean;
  evidenceNote: string | null;
  evidenceSubmittedAt: string | null;
  evidence: CommunityEvidence[];
  registeredAt: string;
}

export interface CommunityStats {
  totalActivities: number;
  openActivities: number;
  closedActivities: number;
  completedActivities: number;
  cancelledActivities: number;
  totalRegistrations: number;
  confirmedParticipations: number;
  awardedHours: number;
}

export interface CommunityFilters {
  page: number;
  size: number;
  search?: string;
  status?: ActivityStatus | '';
  organizerId?: string;
  startFrom?: string;
  startTo?: string;
}

export const communityApi = {
  getActivities: async (filters: CommunityFilters) => {
    const response = await api.get<PaginatedResponse<AdminCommunityActivity>>('/admin/community', {
      params: {
        ...filters,
        search: filters.search || undefined,
        status: filters.status || undefined,
        organizerId: filters.organizerId || undefined,
        startFrom: filters.startFrom || undefined,
        startTo: filters.startTo || undefined,
      },
    });
    return response.data;
  },
  getDetail: async (id: string) => {
    const response = await api.get<AdminCommunityActivityDetail>(`/admin/community/${id}`);
    return response.data;
  },
  getParticipants: async (id: string, page = 0, size = 100) => {
    const response = await api.get<PaginatedResponse<CommunityParticipant>>(
      `/admin/community/${id}/participants`, { params: { page, size } },
    );
    return response.data;
  },
  getStats: async () => {
    const response = await api.get<CommunityStats>('/admin/community/stats');
    return response.data;
  },
  closeRegistration: async (id: string) => {
    const response = await api.post<AdminCommunityActivityDetail>(`/admin/community/${id}/close`);
    return response.data;
  },
  cancelActivity: async (id: string) => {
    const response = await api.post<AdminCommunityActivityDetail>(`/admin/community/${id}/cancel`);
    return response.data;
  },
};
