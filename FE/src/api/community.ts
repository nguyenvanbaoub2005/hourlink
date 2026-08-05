import apiClient from './client';

export enum ActivityStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

export enum ParticipantStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

export interface ActivityResponse {
  id: string;
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  creditReward: number;
  maxParticipants: number;
  currentParticipants: number;
  status: ActivityStatus;
  organizerId: string;
  organizerName: string;
  organizerAvatar?: string;
  createdAt: string;
}

export interface ActivityRequest {
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  creditReward: number;
  maxParticipants: number;
}

export interface ParticipantResponse {
  id: string;
  activityId: string;
  activityTitle: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  status: ParticipantStatus;
  contributionHours?: number;
  registeredAt: string;
}

export const communityApi = {
  // Public
  getAllActivities: () => 
    apiClient.get<ActivityResponse[]>('/community/activities').then(res => res.data),
    
  getActivityById: (id: string) => 
    apiClient.get<ActivityResponse>(`/community/activities/${id}`).then(res => res.data),

  // Organizer
  createActivity: (data: ActivityRequest) => 
    apiClient.post<ActivityResponse>('/community/activities', data).then(res => res.data),
    
  getMyCreatedActivities: () => 
    apiClient.get<ActivityResponse[]>('/community/organizer/activities').then(res => res.data),
    
  updateActivityStatus: (id: string, status: ActivityStatus) => 
    apiClient.patch<ActivityResponse>(`/community/activities/${id}/status`, null, { params: { status } }).then(res => res.data),

  updateActivity: (id: string, data: ActivityRequest) => 
    apiClient.put<ActivityResponse>(`/community/activities/${id}`, data).then(res => res.data),

  deleteActivity: (id: string) => 
    apiClient.delete<void>(`/community/activities/${id}`).then(res => res.data),
    
  getActivityParticipants: (id: string) => 
    apiClient.get<ParticipantResponse[]>(`/community/activities/${id}/participants`).then(res => res.data),
    
  confirmParticipant: (activityId: string, participantId: string, contributionHours: number) => 
    apiClient.post<ParticipantResponse>(`/community/activities/${activityId}/participants/${participantId}/confirm`, { contributionHours }).then(res => res.data),

  // Participant
  registerForActivity: (id: string) => 
    apiClient.post<ParticipantResponse>(`/community/activities/${id}/register`).then(res => res.data),
    
  unregisterForActivity: (id: string) => 
    apiClient.post<void>(`/community/activities/${id}/unregister`).then(res => res.data),
    
  getMyRegistrations: () => 
    apiClient.get<ParticipantResponse[]>('/community/me/registrations').then(res => res.data),
};
