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
  toggleVisibility: (id: string) => api.patch(`/skill/${id}/toggle-visibility`),
  getCategories: () => api.get('/skill/categories'),
};

export default SkillApi;
