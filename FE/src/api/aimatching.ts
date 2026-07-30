import api from './axiosInstance';
import type { ApiResponse } from '@types';

export interface PredictCategoryRequest {
  description: string;
}

export interface PredictCategoryResponse {
  category_id: number;
  category_name: string;
  confidence: number;
  suggested_title?: string;
  suggested_level?: string;
  suggested_format?: string;
  suggested_time?: string;
}

export interface AiRecommendationResponse {
  helper: any; // UserProfileResponse
  skill: any; // SkillResponse
  matchPercentage: number;
  reasons: string[];
}

/**
 * AiMatchingApi — API calls cho module aimatching.
 * Base URL: /ai-matching
 */
const AiMatchingApi = {
  predictCategory: (data: PredictCategoryRequest) => 
    api.post<ApiResponse<PredictCategoryResponse>>('/ai-matching/predict-category', data),

  getRecommendations: (helpRequestId: string) => 
    api.get<ApiResponse<AiRecommendationResponse[]>>(`/ai-matching/recommend/${helpRequestId}`),
};

export default AiMatchingApi;
