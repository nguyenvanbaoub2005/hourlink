import api from './axiosInstance';
import type { ApiResponse, UserResponse, ProfileUpdateRequest } from '../types';

/**
 * UserApi — API calls cho module user.
 * Base URL: /users
 */
const UserApi = {
  getMyProfile: () => api.get<ApiResponse<UserResponse>>('/users/profile'),
  updateMyProfile: (data: ProfileUpdateRequest) => api.put<ApiResponse<UserResponse>>('/users/profile', data),
  getUserById: (id: string) => api.get<ApiResponse<UserResponse>>(`/users/${id}`),
  changePassword: (data: any) => api.post('/users/change-password', data),
};

export default UserApi;
