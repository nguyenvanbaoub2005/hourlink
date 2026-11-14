export interface UserEntity {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  phoneNumber?: string;
  bio?: string;
  reputationScore?: number;
  totalHoursShared?: number;
  completedAppointmentsCount?: number;
  role?: string;
  status?: string;
}
