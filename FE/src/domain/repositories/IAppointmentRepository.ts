import type { AppointmentEntity, AppointmentStatus } from '../entities/Appointment';

export interface IAppointmentRepository {
  getMyAppointments(status?: string, page?: number, size?: number): Promise<AppointmentEntity[]>;
  getById(id: string): Promise<AppointmentEntity | null>;
  respond(id: string, action: 'CONFIRM' | 'CANCEL', reason?: string): Promise<void>;
}
