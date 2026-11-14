import type { AiRecommendationEntity } from '../entities/AiRecommendation';

export interface IAiMatchingRepository {
  getRecommendations(helpRequestId: string): Promise<AiRecommendationEntity[]>;
}
