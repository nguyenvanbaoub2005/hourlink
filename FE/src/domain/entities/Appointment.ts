export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'UPCOMING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED'
  | 'RESCHEDULED';

export interface AppointmentEntity {
  id: string;
  title: string;
  status: AppointmentStatus;
  scheduledTime?: string;
  location?: string;
  providerId?: string;
  providerName?: string;
  providerAvatar?: string;
  receiverId?: string;
  receiverName?: string;
  receiverAvatar?: string;
  timeCredit?: number;
  meetingType?: string;
}
