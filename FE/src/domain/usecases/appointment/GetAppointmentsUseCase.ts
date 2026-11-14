import type { IAppointmentRepository } from '../../repositories/IAppointmentRepository';
import type { AppointmentEntity } from '../../entities/Appointment';

export class GetAppointmentsUseCase {
  constructor(private appointmentRepo: IAppointmentRepository) {}

  async execute(status?: string, page = 0, size = 50): Promise<AppointmentEntity[]> {
    return this.appointmentRepo.getMyAppointments(status, page, size);
  }
}
