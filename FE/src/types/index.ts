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
/** Khớp com.hourlink.chat.enums.MessageType — BE trả về CHỮ HOA */
export type MessageType =
  | 'TEXT'
  | 'IMAGE'
  | 'DOCUMENT'
  | 'LOCATION'
  | 'MEETING_LINK'
  | 'RESCHEDULE_PROPOSAL'
  | 'APPOINTMENT_CARD'
  | 'SYSTEM';

/** Khớp com.hourlink.chat.enums.ChatReportReason */
export type ChatReportReason =
  | 'OFFENSIVE'
  | 'HARASSMENT'
  | 'SPAM'
  | 'SCAM'
  | 'OUTSIDE_PAYMENT'
  | 'ASK_CREDENTIALS'
  | 'OTHER';
export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED' | 'RESCHEDULED' | 'pending_confirmation' | 'confirmed' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled' | 'disputed';
export type VerificationMethod = 'QR' | 'OTP' | 'qr' | 'otp';
export type ExtraCreditStatus = 'NONE' | 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'none' | 'pending' | 'accepted' | 'rejected';
export type WalletTxType =
  | 'EARN' | 'SPEND' | 'HOLD' | 'RELEASE' | 'REFUND' | 'BONUS' | 'ADJUSTMENT';
export type ReportReason = 'SPAM' | 'HARASSMENT' | 'MISINFORMATION' | 'ILLEGAL_CONTENT' | 'FRAUD' | 'OTHER';
export type ReportStatus = 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED';
export type ReportTargetType = 'USER' | 'MESSAGE' | 'CONTENT';
export type DisputeStatus = 'open' | 'reviewing' | 'resolved';
export type ActivityParticipantStatus = 'REGISTERED' | 'CONFIRMED' | 'CANCELLED';
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

/** Mirror com.hourlink.auth.dto.response.AuthResponse */
export interface AuthResponse {
  token: string;
  refreshToken: string;
  authenticated: boolean;
}

/** Mirror com.hourlink.auth.dto.request.LoginRequest */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Mirror com.hourlink.auth.dto.request.RegisterRequest */
export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  /** Optional — không gửi field này nếu người dùng bỏ trống */
  phone?: string;
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

/** Mirror com.hourlink.chat.dto.response.ConversationResponse */
export interface Conversation {
  id: string;
  invitationId: string;
  invitationStatus: string;
  invitationSenderId: string;
  invitationReceiverId: string;
  skillName?: string;

  otherUserId: string;
  otherUserName: string;
  otherUserAvatarUrl?: string;
  otherUserReputationScore?: number;

  lastMessagePreview?: string;
  lastMessageType?: MessageType;
  lastMessageAt?: string;
  unreadCount: number;

  isBlockedByMe: boolean;
  hasBlockedMe: boolean;
  isActive: boolean;
  createdAt: string;
}

/** Mirror com.hourlink.chat.dto.response.ChatMessageResponse */
export interface ChatMessage {
  id: string;
  conversationId: string;

  /** null với tin nhắn hệ thống */
  senderId?: string;
  senderName?: string;
  senderAvatarUrl?: string;

  type: MessageType;
  content?: string;

  /** IMAGE / DOCUMENT */
  attachmentUrl?: string;
  originalName?: string;
  fileSize?: number;

  /** LOCATION */
  latitude?: number;
  longitude?: number;
  locationLabel?: string;

  /** MEETING_LINK */
  meetingLink?: string;

  /** RESCHEDULE_PROPOSAL */
  proposedTime?: string;

  /** APPOINTMENT_CARD */
  appointmentId?: string;
  appointmentData?: string;

  isRead: boolean;
  isRecalled?: boolean;
  recalled?: boolean;
  createdAt: string;
}

/** Mirror com.hourlink.chat.dto.response.BlockedUserResponse */
export interface BlockedUser {
  id: string;
  userId: string;
  fullName: string;
  avatarUrl?: string;
  reason?: string;
  blockedAt: string;
}

// ─── Appointment ─────────────────────────────────────────────

export interface Appointment {
  id: string;
  providerId?: string;
  providerName?: string;
  providerAvatarUrl?: string;
  receiverId?: string;
  receiverName?: string;
  receiverAvatarUrl?: string;
  invitationId?: string;
  skillId?: string;
  skillName?: string;
  title?: string;
  description?: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  meetingType?: string;
  locationOrLink?: string;
  timeCreditAmount?: number;
  notes?: string;
  status: AppointmentStatus;
  cancelReason?: string;
  rescheduleProposedTime?: string;
  extraCreditStatus?: string;
  createdAt: string;
  updatedAt?: string;

  // Legacy mappings for compatibility
  helper?: UserResponse;
  receiver?: UserResponse;
  content?: string;
  format?: SessionFormat;
  location?: string;
  meetingLink?: string;
  timeCredit?: number;
  note?: string;
}

export interface AppointmentVerification {
  id: string;
  appointmentId: string;
  method: VerificationMethod;
  code: string;
  expiresAt?: string;
  verifiedAt?: string;
  verifiedById?: string;
  createdAt?: string;
}

export * from './appointment';


// ─── Wallet ──────────────────────────────────────────────────

/** Mirror com.hourlink.wallet.entity.Wallet */
export interface Wallet {
  id: string;
  userId: string;
  userFullName: string;
  /** Số dư có thể dùng ngay */
  balance: number;
  /** Số đang bị tạm giữ (appointment CONFIRMED) */
  heldAmount: number;
  /** Tổng đã kiếm từ trước đến nay */
  totalEarned: number;
  /** Tổng đã sử dụng từ trước đến nay */
  totalUsed: number;
  updatedAt: string;
}

/** Mirror com.hourlink.wallet.dto.response.WalletTransactionResponse */
export interface WalletTransaction {
  id: string;
  type: WalletTxType;
  /** Số lượng Time Credit (luôn dương) */
  amount: number;
  /** Số dư ví ngay sau giao dịch */
  balanceAfter: number;
  description?: string;
  /** UUID lịch hẹn liên quan (nếu có) */
  relatedAppointmentId?: string;
  /** Tiêu đề lịch hẹn liên quan (nếu có) */
  relatedAppointmentTitle?: string;
  referenceType?: string;
  referenceId?: string;
  createdAt: string;
}

// ─── Rating ──────────────────────────────────────────────────

/** Mirror com.hourlink.rating.dto.response.RatingResponse */
export interface RatingResponse {
  id: string;
  appointmentId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatarUrl?: string;
  revieweeId: string;
  revieweeName: string;
  punctualityScore?: number;
  attitudeScore?: number;
  communicationScore?: number;
  qualityScore?: number;
  overallStars: number;
  comment?: string;
  createdAt: string;
}

/** Alias tương thích ngược */
export type Rating = RatingResponse;

/** Mirror com.hourlink.rating.dto.response.BadgeResponse */
export interface BadgeResponse {
  id: string;
  code: string;
  name: string;
  description?: string;
  iconUrl?: string;
  awardedAt?: string;
}

// ─── Report & Dispute ─────────────────────────────────────────

export interface Report {
  id: string;
  targetId: string;
  targetType: ReportTargetType;
  reason: ReportReason;
  description?: string;
  evidenceUrls?: string;
  status: ReportStatus;
  adminNote?: string;
  createdAt: string;
}

export interface MessageReport {
  id: string;
  messageId: string;
  reportedUserId: string;
  reportedUserName: string;
  reason: ChatReportReason;
  description?: string;
  evidence?: string;
  status: 'PENDING' | 'REVIEWED' | 'DISMISSED' | 'ACTIONED';
  createdAt: string;
}

export interface TrackedReport {
  id: string;
  source: 'REPORT' | 'MESSAGE';
  targetId: string;
  targetType: ReportTargetType;
  targetLabel?: string;
  reason: string;
  description?: string;
  evidence?: string;
  status: string;
  adminNote?: string;
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

export type ActivityStatus = 'OPEN' | 'CLOSED' | 'COMPLETED' | 'CANCELLED';

export interface ActivityResponse {
  id: string;
  organizerId: string;
  organizerName: string;
  organizerAvatarUrl?: string;
  title: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
  maxParticipants?: number;
  creditReward: number;
  status: ActivityStatus;
  registeredCount: number;
  registered: boolean;
  createdAt: string;
}

export interface ParticipantResponse {
  id: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  status: ActivityParticipantStatus;
  actualHours?: number;
  confirmNote?: string;
  creditAwarded?: boolean;
  confirmedAt?: string;
  activityId: string;
  activityTitle: string;
  activityLocation?: string;
  activityStartTime: string;
  activityEndTime: string;
  activityCreditReward: number;
  createdAt: string;
}

export interface CreateActivityRequest {
  title: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
  maxParticipants?: number;
  creditReward: number;
}

export interface UpdateActivityRequest extends Partial<CreateActivityRequest> {}

export interface ConfirmParticipantsRequest {
  participantIds?: string[];
  actualHours?: number;
  confirmNote?: string;
  confirmations?: Array<{
    participantId: string;
    actualHours: number;
    confirmNote?: string;
  }>;
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
