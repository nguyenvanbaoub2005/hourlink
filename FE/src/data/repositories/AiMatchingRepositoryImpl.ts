import type { IAiMatchingRepository } from '../../domain/repositories/IAiMatchingRepository';
import type { AiRecommendationEntity } from '../../domain/entities/AiRecommendation';
import AiMatchingApi from '@api/aimatching';
import { EntityMapper } from '../mappers';

export class AiMatchingRepositoryImpl implements IAiMatchingRepository {
  async getRecommendations(helpRequestId: string): Promise<AiRecommendationEntity[]> {
    const res = await AiMatchingApi.getRecommendations(helpRequestId);
    const rawList = res.data?.data || [];
    return rawList.map(EntityMapper.toAiRecommendationEntity);
  }
}
