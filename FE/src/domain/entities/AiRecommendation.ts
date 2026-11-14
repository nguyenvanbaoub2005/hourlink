export interface AiRecommendationEntity {
  helper: {
    id?: string;
    fullName?: string;
    avatarUrl?: string;
    reputationScore?: number;
    bio?: string;
  };
  skill: {
    id?: string;
    name?: string;
    level?: string;
  };
  matchPercentage: number;
  reasons: string[];
}
