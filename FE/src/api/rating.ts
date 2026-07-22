import api from './axiosInstance';
import type { ApiResponse, PagedResponse } from '@types';
// TODO: import request/response types as they are implemented

/**
 * RatingApi — API calls cho module rating.
 * Base URL: /ratings
 */
const RatingApi = {
  submitRating: (data: any) => api.post('/ratings', data),
  getUserRatings: (id: string) => api.get(`/ratings/{id}`),
};

export default RatingApi;
