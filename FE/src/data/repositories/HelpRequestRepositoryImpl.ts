import type { IHelpRequestRepository } from '../../domain/repositories/IHelpRequestRepository';
import type { HelpRequestEntity } from '../../domain/entities/HelpRequest';
import HelpRequestApi from '@api/helprequest';
import { EntityMapper } from '../mappers';
import { saveHelpRequestsToLocal, getLocalHelpRequests } from '../../offline';

export class HelpRequestRepositoryImpl implements IHelpRequestRepository {
  async getMyHelpRequests(): Promise<HelpRequestEntity[]> {
    try {
      const res = await HelpRequestApi.getMyRequests();
      const list = res.data?.data ?? [];
      const entities = list.map(EntityMapper.toHelpRequestEntity);
      if (entities.length > 0) {
        saveHelpRequestsToLocal(list).catch(() => {});
      }
      return entities;
    } catch {
      // Offline fallback
      const cached = await getLocalHelpRequests();
      return cached.map(EntityMapper.toHelpRequestEntity);
    }
  }

  async getAll(): Promise<HelpRequestEntity[]> {
    try {
      const res = await HelpRequestApi.getRequests();
      const rawList = res.data?.data || [];
      return rawList.map(EntityMapper.toHelpRequestEntity);
    } catch {
      const cached = await getLocalHelpRequests();
      return cached.map(EntityMapper.toHelpRequestEntity);
    }
  }

  async getById(id: string): Promise<HelpRequestEntity | null> {
    try {
      const res = await HelpRequestApi.getRequests();
      const item = res.data?.data?.find((r) => r.id === id);
      return item ? EntityMapper.toHelpRequestEntity(item) : null;
    } catch {
      const cached = await getLocalHelpRequests();
      const item = cached.find((r: any) => r.id === id);
      return item ? EntityMapper.toHelpRequestEntity(item) : null;
    }
  }

  async create(request: Partial<HelpRequestEntity>): Promise<HelpRequestEntity> {
    const res = await HelpRequestApi.createRequest(request as any);
    return EntityMapper.toHelpRequestEntity(res.data?.data);
  }
}
