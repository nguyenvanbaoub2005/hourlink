import api from './axiosInstance';
import type { ApiResponse, PagedResponse } from '@types';
// TODO: import request/response types as they are implemented

/**
 * AppointmentApi — API calls cho module appointment.
 * Base URL: /appointments
 */
const AppointmentApi = {
  getMyAppointments: () => api.get('/appointments'),
  getById: (id: string) => api.get(`/appointments/{id}`),
  generateQr: () => api.post(`/appointments/{id}/qr`),
  verifyOtp: (data: any) => api.post(`/appointments/{id}/verify-otp`, data),
  confirmStart: (id: string) => api.put(`/appointments/${id}/confirm-start`),
  confirmComplete: (id: string) => api.put(`/appointments/${id}/confirm-complete`),
};

export default AppointmentApi;
