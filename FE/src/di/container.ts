import { AuthRepositoryImpl } from '../data/repositories/AuthRepositoryImpl';
import { HelpRequestRepositoryImpl } from '../data/repositories/HelpRequestRepositoryImpl';
import { AppointmentRepositoryImpl } from '../data/repositories/AppointmentRepositoryImpl';
import { AiMatchingRepositoryImpl } from '../data/repositories/AiMatchingRepositoryImpl';

import { LoginUseCase } from '../domain/usecases/auth/LoginUseCase';
import { GetProfileUseCase } from '../domain/usecases/auth/GetProfileUseCase';
import { GetMyHelpRequestsUseCase } from '../domain/usecases/helprequest/GetMyHelpRequestsUseCase';
import { GetAppointmentsUseCase } from '../domain/usecases/appointment/GetAppointmentsUseCase';
import { GetAiSuggestionsUseCase } from '../domain/usecases/aimatching/GetAiSuggestionsUseCase';

// ─── Khởi tạo Repositories ──────────────────────────────────────────
const authRepository = new AuthRepositoryImpl();
const helpRequestRepository = new HelpRequestRepositoryImpl();
const appointmentRepository = new AppointmentRepositoryImpl();
const aiMatchingRepository = new AiMatchingRepositoryImpl();

// ─── Khởi tạo Use Cases (Clean Architecture 3 lớp) ───────────────────
export const container = {
  // Repositories
  authRepository,
  helpRequestRepository,
  appointmentRepository,
  aiMatchingRepository,

  // Use Cases
  loginUseCase: new LoginUseCase(authRepository),
  getProfileUseCase: new GetProfileUseCase(authRepository),
  getMyHelpRequestsUseCase: new GetMyHelpRequestsUseCase(helpRequestRepository),
  getAppointmentsUseCase: new GetAppointmentsUseCase(appointmentRepository),
  getAiSuggestionsUseCase: new GetAiSuggestionsUseCase(aiMatchingRepository),
};

export type DIContainer = typeof container;
