import api from './axiosInstance';
import type { ApiResponse, PagedResponse } from '@types';
// TODO: import request/response types as they are implemented

/**
 * AiMatchingApi — API calls cho module aimatching.
 * Base URL: /ai-matching
 */
const AiMatchingApi = {
  getSuggestions: () => api.get('/ai-matching/suggest'),
};

export default AiMatchingApi;
