import type { UserEntity } from '../../domain/entities/User';
import type { HelpRequestEntity } from '../../domain/entities/HelpRequest';
import type { AppointmentEntity } from '../../domain/entities/Appointment';
import type { AiRecommendationEntity } from '../../domain/entities/AiRecommendation';

export class EntityMapper {
  static toUserEntity(dto: any): UserEntity {
    return {
      id: String(dto.id || dto.userId || ''),
      email: dto.email || '',
      fullName: dto.fullName || '',
      avatarUrl: dto.avatarUrl,
      phoneNumber: dto.phoneNumber,
      bio: dto.bio,
      reputationScore: dto.reputationScore ?? 0,
      totalHoursShared: dto.totalHoursShared ?? 0,
      completedAppointmentsCount: dto.completedAppointmentsCount ?? 0,
      role: dto.role,
      status: dto.status,
    };
  }

  static toHelpRequestEntity(dto: any): HelpRequestEntity {
    return {
      id: String(dto.id || dto.helpRequestId || ''),
      title: dto.title || '',
      description: dto.description || '',
      status: dto.status || 'OPEN',
      requesterId: String(dto.requesterId || dto.userId || ''),
      requesterName: dto.requesterName || dto.user?.fullName,
      categoryName: dto.categoryName || dto.category?.name,
      location: dto.location,
      duration: Number(dto.duration || 0),
      timeCredit: Number(dto.timeCredit || 0),
      format: dto.format,
      createdAt: dto.createdAt || new Date().toISOString(),
    };
  }

  static toAppointmentEntity(dto: any): AppointmentEntity {
    return {
      id: String(dto.id || dto.appointmentId || ''),
      title: dto.title || dto.invitationTitle || 'Lịch hẹn',
      status: dto.status || 'PENDING',
      scheduledTime: dto.scheduledTime || dto.scheduledAt || '',
      location: dto.location,
      providerId: dto.providerId,
      providerName: dto.providerName || dto.provider?.fullName,
      providerAvatar: dto.providerAvatar || dto.provider?.avatarUrl,
      receiverId: dto.receiverId,
      receiverName: dto.receiverName || dto.receiver?.fullName,
      receiverAvatar: dto.receiverAvatar || dto.receiver?.avatarUrl,
      timeCredit: dto.timeCredit,
      meetingType: dto.meetingType,
    };
  }

  static toAiRecommendationEntity(dto: any): AiRecommendationEntity {
    return {
      helper: dto.helper || {
        id: String(dto.helperId || dto.userId || ''),
        fullName: dto.helperName || dto.fullName || 'Người hỗ trợ',
        avatarUrl: dto.helperAvatarUrl || dto.avatarUrl,
        reputationScore: dto.reputationScore,
      },
      skill: dto.skill || {
        id: dto.skillId,
        name: dto.skillName || dto.matchedSkills?.[0],
      },
      matchPercentage: Number(dto.matchScore || dto.matchPercentage || 0),
      reasons: Array.isArray(dto.reasons) ? dto.reasons : (dto.explanation ? [dto.explanation] : []),
    };
  }
}
