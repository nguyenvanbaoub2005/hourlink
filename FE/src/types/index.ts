// ============================================================
// HourLink — TypeScript Types / Interfaces
// Maps 1-1 với DBML schema và API Response từ Spring Boot BE
// ============================================================

// ─── Enums ──────────────────────────────────────────────────

export type UserType = 'individual' | 'organization' | 'admin';
export type SkillLevel = 'basic' | 'intermediate' | 'advanced';
export type SessionFormat = 'online' | 'offline';
export type RequestStatus = 'open' | 'matched' | 'closed' | 'cancelled';
export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'reschedule_proposed' | 'cancelled';
export type MessageType = 'text' | 'image' | 'document' | 'location' | 'meeting_link';
export type AppointmentStatus = 'pending_confirmation' | 'confirmed' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled' | 'disputed';
export type VerificationMethod = 'qr' | 'otp';
export type ExtraCreditStatus = 'none' | 'pending' | 'accepted' | 'rejected';
export type WalletTxType = 'earn' | 'spend' | 'hold' | 'release' | 'refund' | 'extra_earn' | 'extra_spend' | 'activity_bonus' | 'admin_adjustment';
export type ReportReason = 'no_show' | 'offensive_behavior' | 'harassment' | 'credit_fraud' | 'wrong_guidance' | 'outside_payment_request' | 'password_otp_request' | 'fake_account' | 'other';
export type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed';
export type DisputeStatus = 'open' | 'reviewing' | 'resolved';
export type ActivityParticipantStatus = 'registered' | 'confirmed' | 'completed' | 'cancelled';
export type NotificationType = 'invitation' | 'appointment' | 'wallet' | 'rating' | 'report' | 'community_activity' | 'system';

// ─── API Response wrapper (mirrors ApiResponse<T> từ BE) ────

export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  timestamp: string;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

// ─── Auth ────────────────────────────────────────────────────

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
}

// ─── User ────────────────────────────────────────────────────

export interface UserResponse {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  dob?: string;
  region?: string;
  occupation?: string;
  userType: UserType;
  avatarUrl?: string;
  bio?: string;
  languages?: string;
  isVerified: boolean;
  isLocked: boolean;
  reputationScore: number;
  completedSessions: number;
  cancelRate: number;
  createdAt: string;
}

export interface ProfileUpdateRequest {
  fullName: string;
  bio?: string;
  region?: string;
  phone?: string;
  email?: string;
  occupation?: string;
  languages?: string;
  avatarUrl?: string;
  dob?: string;
}

export interface OrganizationProfile {
  id: string;
  userId: string;
  organizationName: string;
  organizationType?: string;
  address?: string;
  representativeName?: string;
  verifiedDocumentUrl?: string;
}

export interface Badge {
  id: string;
  code: string;
  name: string;
  description?: string;
  iconUrl?: string;
}

export interface UserBadge {
  id: string;
  badge: Badge;
  awardedAt: string;
}

// ─── Skill ───────────────────────────────────────────────────

export interface SkillCategory {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface Skill {
  id: string;
  userId: string;
  user?: UserResponse;
  category: SkillCategory;
  name: string;
  description?: string;
  level: SkillLevel;
  format: SessionFormat;
  region?: string;
  durationMinutes?: number;
  availableTime?: string;
  isActive: boolean;
  createdAt: string;
}

// ─── HelpRequest ─────────────────────────────────────────────

export interface HelpRequest {
  id: string;
  user: UserResponse;
  category: SkillCategory;
  title: string;
  description: string;
  skillNeeded?: string;
  levelRequired?: SkillLevel;
  format: SessionFormat;
  desiredTime?: string;
  durationMinutes?: number;
  region?: string;
  timeCredit: number;
  status: RequestStatus;
  createdAt: string;
}

// ─── AI Matching ─────────────────────────────────────────────

export interface AiMatchSuggestion {
  id: string;
  requestId: string;
  suggestedUser: UserResponse;
  matchPercent: number;
  skillMatchScore?: number;
  scheduleMatchScore?: number;
  distanceScore?: number;
  reputationScore?: number;
  explanation?: string;
  createdAt: string;
}

// ─── Invitation ──────────────────────────────────────────────

export interface Invitation {
  id: string;
  request: HelpRequest;
  sender: UserResponse;
  receiver: UserResponse;
  message?: string;
  proposedTime?: string;
  durationMinutes?: number;
  status: InvitationStatus;
  createdAt: string;
  respondedAt?: string;
}

// ─── Chat ────────────────────────────────────────────────────

export interface Conversation {
  id: string;
  invitationId: string;
  otherUser: UserResponse;
  lastMessage?: ChatMessage;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: UserResponse;
  content?: string;
  messageType: MessageType;
  attachmentUrl?: string;
  createdAt: string;
}

// ─── Appointment ─────────────────────────────────────────────

export interface Appointment {
  id: string;
  helper: UserResponse;
  receiver: UserResponse;
  content?: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  format: SessionFormat;
  location?: string;
  meetingLink?: string;
  timeCredit: number;
  note?: string;
  status: AppointmentStatus;
  createdAt: string;
}

export interface AppointmentVerification {
  id: string;
  appointmentId: string;
  method: VerificationMethod;
  code: string;
  expiresAt?: string;
  verifiedAt?: string;
}

// ─── Wallet ──────────────────────────────────────────────────

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  heldAmount: number;
  totalEarned: number;
  totalUsed: number;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  type: WalletTxType;
  amount: number;
  description?: string;
  createdAt: string;
}

// ─── Rating ──────────────────────────────────────────────────

export interface Rating {
  id: string;
  appointmentId: string;
  rater: UserResponse;
  rated: UserResponse;
  punctualityScore?: number;
  attitudeScore?: number;
  communicationScore?: number;
  qualityScore?: number;
  overallStars: number;
  comment?: string;
  createdAt: string;
}

// ─── Report & Dispute ─────────────────────────────────────────

export interface Report {
  id: string;
  reporter: UserResponse;
  reported: UserResponse;
  reason: ReportReason;
  description?: string;
  evidenceUrl?: string;
  status: ReportStatus;
  createdAt: string;
}

export interface Dispute {
  id: string;
  appointmentId: string;
  raisedBy: UserResponse;
  reason?: string;
  status: DisputeStatus;
  resolution?: string;
  resolvedAt?: string;
  createdAt: string;
}

// ─── Community Activity ───────────────────────────────────────

export interface CommunityActivity {
  id: string;
  organization: UserResponse;
  title: string;
  description?: string;
  location?: string;
  activityTime: string;
  slotsNeeded?: number;
  conditionText?: string;
  timeCredit: number;
  status: string;
  createdAt: string;
}

export interface ActivityParticipant {
  id: string;
  activity: CommunityActivity;
  user: UserResponse;
  status: ActivityParticipantStatus;
  confirmedHours?: number;
  certificateUrl?: string;
  joinedAt: string;
}

// ─── Notification ────────────────────────────────────────────

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  content?: string;
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
}
