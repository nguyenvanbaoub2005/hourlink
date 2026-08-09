import api from './axiosInstance';

// ─── Types ────────────────────────────────────────────────────

export type SkillStatus = 'VISIBLE' | 'HIDDEN' | 'DELETED';
export type SkillLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
export type SkillFormat = 'ONLINE' | 'OFFLINE';

export interface AdminSkillResponse {
  id: string;
  name: string;
  status: SkillStatus;
  level: SkillLevel | null;
  format: SkillFormat | null;
  categoryName: string | null;
  userId: string;
  userFullName: string;
  userEmail: string;
  userAvatarUrl: string | null;
  attachmentCount: number;
  createdAt: string;
}

export interface SkillAttachment {
  id: string;
  fileUrl: string;
  publicId: string;
  originalName: string;
  fileType: 'IMAGE' | 'DOCUMENT';
  fileSize: number;
  createdAt: string;
}

export interface AdminSkillDetailResponse {
  id: string;
  name: string;
  description: string | null;
  level: SkillLevel | null;
  format: SkillFormat | null;
  duration: number | null;
  freeTime: string | null;
  region: string | null;
  status: SkillStatus;
  categoryId: string | null;
  categoryName: string | null;
  createdAt: string;
  updatedAt: string;
  // Người đăng
  userId: string;
  userFullName: string;
  userEmail: string;
  userAvatarUrl: string | null;
  userReputationScore: number;
  userCompletedSessions: number;
  userWarningCount: number;
  userRegion: string | null;
  userOccupation: string | null;
  // Minh chứng
  attachments: SkillAttachment[];
}

export interface AdminCategoryResponse {
  id: string;
  name: string;
  description: string | null;
  visibleSkillCount: number;
  totalSkillCount: number;
  activeHelpRequestCount: number;
  totalHelpRequestCount: number;
  createdAt: string;
}

export interface PaginatedSkillResponse {
  content: AdminSkillResponse[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

// ─── API Client ───────────────────────────────────────────────

export const skillsApi = {
  getSkills: async (
    page = 0,
    size = 10,
    skillName = '',
    userName = '',
    categoryId = '',
    status = '',
    level = '',
    format = ''
  ) => {
    const response = await api.get<PaginatedSkillResponse>('/admin/skills', {
      params: {
        page,
        size,
        skillName: skillName || undefined,
        userName: userName || undefined,
        categoryId: categoryId || undefined,
        status: status || undefined,
        level: level || undefined,
        format: format || undefined,
      },
    });
    return response.data;
  },

  getSkillDetail: async (id: string) => {
    const response = await api.get<AdminSkillDetailResponse>(`/admin/skills/${id}`);
    return response.data;
  },

  performAction: async (
    id: string,
    actionType: 'HIDE' | 'SHOW' | 'DELETE' | 'WARN',
    reason?: string
  ) => {
    const response = await api.post(`/admin/skills/${id}/actions`, { actionType, reason });
    return response.data;
  },

  getCategories: async () => {
    const response = await api.get<AdminCategoryResponse[]>('/admin/skills/categories');
    return response.data;
  },

  updateCategory: async (id: string, data: { name: string; description?: string }) => {
    const response = await api.put<AdminCategoryResponse>(
      `/admin/skills/categories/${id}`,
      data
    );
    return response.data;
  },

  createCategory: async (data: { name: string; description?: string }) => {
    const response = await api.post<AdminCategoryResponse>('/admin/skills/categories', data);
    return response.data;
  },

  deleteCategory: async (id: string) => {
    await api.delete(`/admin/skills/categories/${id}`);
  },

  createSkill: async (data: {
    userId: string;
    name: string;
    description?: string;
    categoryId?: string;
    level?: string;
    format?: string;
    duration?: number;
    freeTime?: string;
    region?: string;
    status?: string;
  }) => {
    const response = await api.post('/admin/skills', data);
    return response.data;
  },

  updateSkill: async (id: string, data: {
    name: string;
    description?: string;
    categoryId?: string | null;
    level?: string | null;
    format?: string | null;
    duration?: number | null;
    freeTime?: string;
    region?: string;
    status?: string;
  }) => {
    const response = await api.put(`/admin/skills/${id}`, data);
    return response.data;
  },

  uploadAttachment: async (skillId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/admin/skills/${skillId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  deleteAttachment: async (attachmentId: string) => {
    await api.delete(`/admin/skills/attachments/${attachmentId}`);
  }
};
