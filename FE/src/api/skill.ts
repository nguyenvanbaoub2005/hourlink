import api from './axiosInstance';
import type { ApiResponse, PagedResponse } from '@types';
// TODO: import request/response types as they are implemented

/**
 * SkillApi — API calls cho module skill.
 * Base URL: /skills
 */
const SkillApi = {
  getSkills: () => api.get('/skill'),
  getMySkills: () => api.get('/skill/my-skills'),
  createSkill: (data: any) => api.post('/skill', data),
  updateSkill: (id: string, data: any) => api.put(`/skill/${id}`, data),
  deleteSkill: (id: string) => api.delete(`/skill/${id}`),
  toggleVisibility: (id: string) => api.patch(`/skill/${id}/toggle-visibility`),
  getCategories: () => api.get('/skill/categories'),
  searchSkills: (params?: { keyword?: string; categoryId?: string; format?: string; region?: string }) =>
    api.get('/skill/search', { params }),
  // Attachment APIs
  uploadAttachment: (skillId: string, formData: FormData) =>
    api.post(`/skill/${skillId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getAttachments: (skillId: string) => api.get(`/skill/${skillId}/attachments`),
  deleteAttachment: (attachmentId: string) => api.delete(`/skill/attachments/${attachmentId}`),
};

export default SkillApi;
