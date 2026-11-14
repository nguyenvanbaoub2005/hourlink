import type { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import type { AppointmentEntity } from '../../domain/entities/Appointment';
import AppointmentApi from '@api/appointment';
import { EntityMapper } from '../mappers';
import { saveAppointmentsToLocal, getLocalAppointments } from '../../offline';

export class AppointmentRepositoryImpl implements IAppointmentRepository {
  async getMyAppointments(status?: string, page = 0, size = 50): Promise<AppointmentEntity[]> {
    try {
      const res = await AppointmentApi.getMyAppointments(status, page, size);
      const rawList = res.data?.data?.content || res.data?.data || [];
      const list = Array.isArray(rawList) ? rawList : [];
      if (list.length > 0) {
        saveAppointmentsToLocal(list).catch(() => {});
      }
      return list.map(EntityMapper.toAppointmentEntity);
    } catch {
      const cached = await getLocalAppointments();
      return cached.map(EntityMapper.toAppointmentEntity);
    }
  }

  async getById(id: string): Promise<AppointmentEntity | null> {
    const res = await AppointmentApi.getById(id);
    return res.data?.data ? EntityMapper.toAppointmentEntity(res.data.data) : null;
  }

  async respond(id: string, action: 'CONFIRM' | 'CANCEL', reason?: string): Promise<void> {
    await AppointmentApi.respond(id, { action, reason });
  }
}
