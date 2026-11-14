export type HelpRequestStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface HelpRequestEntity {
  id: string;
  title: string;
  description: string;
  status: HelpRequestStatus;
  requesterId: string;
  requesterName?: string;
  categoryName?: string;
  location?: string;
  duration?: number;
  timeCredit?: number;
  format?: 'ONLINE' | 'OFFLINE';
  createdAt: string;
}
