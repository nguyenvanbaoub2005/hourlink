import api from './axiosInstance';
import type { PaginatedResponse } from './users';

export type AppointmentStatus =
  | 'PENDING' | 'CONFIRMED' | 'UPCOMING' | 'IN_PROGRESS'
  | 'COMPLETED' | 'CANCELLED' | 'DISPUTED' | 'RESCHEDULED';

export interface AdminAppointment {
  id: string;
  title: string;
  status: AppointmentStatus;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  meetingType: 'ONLINE' | 'OFFLINE' | 'BOTH';
  timeCreditAmount: number;
  providerId: string;
  providerName: string;
  providerEmail: string;
  receiverId: string;
  receiverName: string;
  receiverEmail: string;
  skillId: string | null;
  skillName: string | null;
  createdAt: string;
}

export interface AppointmentConfirmation {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  actualDurationMinutes: number;
  contentCompleted: string | null;
  hasIssue: boolean;
  issueDescription: string | null;
  confirmedAt: string;
}

export interface AdminAppointmentDetail extends AdminAppointment {
  description: string | null;
  locationOrLink: string;
  notes: string | null;
  cancelReason: string | null;
  rescheduleProposedTime: string | null;
  extraCreditStatus: string;
  proposedById: string | null;
  invitationId: string | null;
  updatedAt: string;
  confirmations: AppointmentConfirmation[];
}

export interface AppointmentStats {
  total: number;
  pending: number;
  active: number;
  completed: number;
  cancelled: number;
  disputed: number;
  rescheduled: number;
  completionRate: number;
  cancellationRate: number;
  disputeRate: number;
}

export interface AppointmentFilters {
  page: number;
  size: number;
  search?: string;
  status?: AppointmentStatus | '';
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const appointmentsApi = {
  getAppointments: async (filters: AppointmentFilters) => {
    const response = await api.get<PaginatedResponse<AdminAppointment>>('/admin/appointments', {
      params: {
        ...filters,
        search: filters.search || undefined,
        status: filters.status || undefined,
        userId: filters.userId || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
      },
    });
    return response.data;
  },
  getDetail: async (id: string) => {
    const response = await api.get<AdminAppointmentDetail>(`/admin/appointments/${id}`);
    return response.data;
  },
  getStats: async () => {
    const response = await api.get<AppointmentStats>('/admin/appointments/stats');
    return response.data;
  },
};
