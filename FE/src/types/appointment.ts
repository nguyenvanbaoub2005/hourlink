export type AppointmentStatusType = 
  | 'PENDING' | 'CONFIRMED' | 'UPCOMING' | 'IN_PROGRESS' 
  | 'COMPLETED' | 'CANCELLED' | 'DISPUTED' | 'RESCHEDULED'
  | 'pending' | 'confirmed' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled' | 'disputed';

export type VerificationMethodType = 'QR' | 'OTP' | 'qr' | 'otp';

export interface AppointmentItem {
  id: string;
  providerId: string;
  providerName: string;
  providerAvatarUrl?: string;
  receiverId: string;
  receiverName: string;
  receiverAvatarUrl?: string;
  invitationId?: string;
  skillId?: string;
  skillName?: string;
  title: string;
  description?: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  meetingType: string;
  locationOrLink: string;
  timeCreditAmount: number;
  notes?: string;
  status: AppointmentStatusType;
  cancelReason?: string;
  rescheduleProposedTime?: string;
  extraCreditStatus?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateAppointmentPayload {
  invitationId?: string;
  providerId: string;
  receiverId: string;
  skillId?: string;
  title: string;
  description?: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  meetingType: string;
  locationOrLink: string;
  timeCreditAmount: number;
  notes?: string;
}

export interface RespondAppointmentPayload {
  action: 'CONFIRM' | 'CANCEL' | 'RESCHEDULE';
  reason?: string;
  newTime?: string;
  locationOrLink?: string;
}

export interface VerifyCodePayload {
  code: string;
}

export interface ConfirmCompletionPayload {
  actualDurationMinutes: number;
  contentCompleted?: string;
  hasIssue?: boolean;
  issueDescription?: string;
}

export interface AppointmentVerificationItem {
  id: string;
  appointmentId: string;
  method: VerificationMethodType;
  code: string;
  expiresAt: string;
  verifiedAt?: string;
  verifiedById?: string;
  createdAt: string;
}
