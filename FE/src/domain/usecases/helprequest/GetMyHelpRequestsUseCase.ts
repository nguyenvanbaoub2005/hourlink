import type { IHelpRequestRepository } from '../../repositories/IHelpRequestRepository';
import type { HelpRequestEntity } from '../../entities/HelpRequest';

export class GetMyHelpRequestsUseCase {
  constructor(private helpRequestRepo: IHelpRequestRepository) {}

  async execute(): Promise<HelpRequestEntity[]> {
    return this.helpRequestRepo.getMyHelpRequests();
  }
}
