import api from './axiosInstance';
import type { ApiResponse, PagedResponse } from '@types';
// TODO: import request/response types as they are implemented

/**
 * SkillApi — API calls cho module skill.
 * Base URL: /skills
 */
const SkillApi = {
  getSkills: () => api.get('/skills'),
  getMySkills: () => api.get('/skills/me'),
  createSkill: (data: any) => api.post('/skills', data),
  updateSkill: (data: any) => api.put(`/skills/{id}`, data),
  deleteSkill: (id: string) => api.delete(`/skills/${id}`),
  getCategories: () => api.get('/skills/categories'),
};

export default SkillApi;
