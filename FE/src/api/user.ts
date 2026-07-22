import api from './axiosInstance';
import type { ApiResponse, PagedResponse } from '@types';
// TODO: import request/response types as they are implemented

/**
 * UserApi — API calls cho module user.
 * Base URL: /users
 */
const UserApi = {
  getMyProfile: () => api.get('/users/profile'),
  updateMyProfile: (data: any) => api.put('/users/profile', data),
  getUserById: (id: string) => api.get(`/users/{id}`),
  changePassword: (data: any) => api.post('/users/change-password', data),
};

export default UserApi;
