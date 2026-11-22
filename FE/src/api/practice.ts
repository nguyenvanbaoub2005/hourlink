import api from './axiosInstance';
import type { ApiResponse } from '@types';

export type PracticeStatus = 'ASSIGNED' | 'SUBMITTED' | 'PASSED' | 'NEEDS_REVISION';

export interface PracticeAssessmentResponse {
  id: string;
  appointmentId: string;
  mentorId: string;
  mentorName: string;
  mentorAvatarUrl?: string;
  learnerId: string;
  learnerName: string;
  learnerAvatarUrl?: string;
  skillTitle: string;
  assignmentTitle: string;
  scenarioPrompt: string;
  practiceCriteria?: string;
  submissionText?: string;
  submissionLink?: string;
  submittedAt?: string;
  communicationScore?: number;
  applicationScore?: number;
  confidenceScore?: number;
  overallScore?: number;
  mentorFeedback?: string;
  status: PracticeStatus;
  certificateCode?: string;
  certificateLevel?: string;
  creditHours?: number;
  issuedAt?: string;
  createdAt?: string;
}

export interface AiPracticeTemplateResponse {
  skillCategory: string;
  assignmentTitle: string;
  scenarioPrompt: string;
  practiceCriteria: string;
}

export interface AssignPracticeRequest {
  assignmentTitle: string;
  scenarioPrompt: string;
  practiceCriteria?: string;
}

export interface SubmitPracticeRequest {
  submissionText: string;
  submissionLink?: string;
}

export interface GradePracticeRequest {
  communicationScore: number;
  applicationScore: number;
  confidenceScore: number;
  mentorFeedback?: string;
}

const PracticeApi = {
  getByAppointment: (appointmentId: string) =>
    api.get<ApiResponse<PracticeAssessmentResponse | null>>(`/practice/appointment/${appointmentId}`),

  assignPractice: (appointmentId: string, data: AssignPracticeRequest) =>
    api.post<ApiResponse<PracticeAssessmentResponse>>(`/practice/appointment/${appointmentId}/assign`, data),

  submitPractice: (appointmentId: string, data: SubmitPracticeRequest) =>
    api.post<ApiResponse<PracticeAssessmentResponse>>(`/practice/appointment/${appointmentId}/submit`, data),

  gradePractice: (appointmentId: string, data: GradePracticeRequest) =>
    api.post<ApiResponse<PracticeAssessmentResponse>>(`/practice/appointment/${appointmentId}/grade`, data),

  getAiTemplate: (skillTitle: string) =>
    api.get<ApiResponse<AiPracticeTemplateResponse>>('/practice/ai-template', {
      params: { skillTitle },
    }),

  getMyEarnedCertificates: () =>
    api.get<ApiResponse<PracticeAssessmentResponse[]>>('/practice/certificates/my'),

  getMyIssuedCertificates: () =>
    api.get<ApiResponse<PracticeAssessmentResponse[]>>('/practice/certificates/issued'),

  verifyCertificate: (code: string) =>
    api.get<ApiResponse<PracticeAssessmentResponse>>(`/practice/certificates/verify/${encodeURIComponent(code.trim())}`),
};

export default PracticeApi;
