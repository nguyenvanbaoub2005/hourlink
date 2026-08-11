import api from './axiosInstance';

export interface AdminUserResponse {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl?: string | null;
  userType: 'individual' | 'organization';
  verified: boolean;
  locked: boolean;
  deleted: boolean;
  reputationScore: number;
  createdAt: string;
}

export interface AdminUserDetailResponse {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  userType: 'individual' | 'organization';
  region: string | null;
  occupation: string | null;
  avatarUrl: string | null;
  bio: string | null;
  verified: boolean;
  locked: boolean;
  deleted: boolean;
  reputationScore: number;
  completedSessions: number;
  cancelRate: number;
  adminNotes: string | null;
  warningCount: number;
  createdAt: string;
  adminActions: {
    actionType: string;
    reason: string | null;
    adminName: string;
    createdAt: string;
  }[];
}

export interface PaginatedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

export const usersApi = {
  getUsers: async (
    page = 0, size = 10, 
    name = '', email = '', phone = '', 
    userType = '', locked: boolean | '' = '', verified: boolean | '' = ''
  ) => {
    const response = await api.get<PaginatedResponse<AdminUserResponse>>('/admin/users', {
      params: { 
        page, size, 
        name: name || undefined, 
        email: email || undefined, 
        phone: phone || undefined, 
        userType: userType || undefined, 
        locked: locked === '' ? undefined : locked, 
        verified: verified === '' ? undefined : verified 
      }
    });
    return response.data;
  },

  getUserDetail: async (id: string) => {
    const response = await api.get<AdminUserDetailResponse>(`/admin/users/${id}`);
    return response.data;
  },

  updateAdminNotes: async (id: string, adminNotes: string) => {
    const response = await api.put(`/admin/users/${id}/notes`, { adminNotes });
    return response.data;
  },

  performAction: async (id: string, actionType: 'WARN' | 'LOCK' | 'UNLOCK' | 'SOFT_DELETE', reason?: string) => {
    const response = await api.post(`/admin/users/${id}/actions`, { actionType, reason });
    return response.data;
  },

  createUser: async (data: any) => {
    const response = await api.post(`/admin/users`, data);
    return response.data;
  },

  updateUser: async (id: string, data: any) => {
    const response = await api.put(`/admin/users/${id}`, data);
    return response.data;
  },

  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/admin/users/upload-avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data; // Should return string URL
  },

  resetPassword: async (id: string) => {
    const response = await api.post(`/admin/users/${id}/reset-password`);
    return response.data;
  }
};
