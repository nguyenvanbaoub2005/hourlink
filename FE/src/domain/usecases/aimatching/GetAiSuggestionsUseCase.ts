import type { IAiMatchingRepository } from '../../repositories/IAiMatchingRepository';
import type { AiRecommendationEntity } from '../../entities/AiRecommendation';

export class GetAiSuggestionsUseCase {
  constructor(private aiMatchingRepo: IAiMatchingRepository) {}

  async execute(helpRequestId: string): Promise<AiRecommendationEntity[]> {
    if (!helpRequestId) {
      throw new Error('ID yêu cầu trợ giúp không hợp lệ.');
    }
    return this.aiMatchingRepo.getRecommendations(helpRequestId);
  }
}
