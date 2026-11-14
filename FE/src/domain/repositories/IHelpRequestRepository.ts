import type { HelpRequestEntity } from '../entities/HelpRequest';

export interface IHelpRequestRepository {
  getMyHelpRequests(): Promise<HelpRequestEntity[]>;
  getAll(): Promise<HelpRequestEntity[]>;
  getById(id: string): Promise<HelpRequestEntity | null>;
  create(request: Partial<HelpRequestEntity>): Promise<HelpRequestEntity>;
}
