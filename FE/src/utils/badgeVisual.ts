import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type BadgeVisual = {
  icon: IoniconName;
  color: string;
  background: string;
};

const BADGE_VISUALS: Record<string, BadgeVisual> = {
  SESSION_1: { icon: 'ribbon-outline', color: '#0284C7', background: '#E0F2FE' },
  SESSION_5: { icon: 'medal-outline', color: '#B45309', background: '#FEF3C7' },
  SESSION_10: { icon: 'medal-outline', color: '#64748B', background: '#F1F5F9' },
  SESSION_25: { icon: 'trophy-outline', color: '#D97706', background: '#FEF3C7' },
  SESSION_50: { icon: 'diamond-outline', color: '#7C3AED', background: '#EDE9FE' },
  TOP_RATED: { icon: 'star-outline', color: '#EA580C', background: '#FFEDD5' },
};

const DEFAULT_VISUAL: BadgeVisual = {
  icon: 'ribbon-outline',
  color: '#0D9488',
  background: '#CCFBF1',
};

export const getBadgeVisual = (code?: string): BadgeVisual =>
  (code ? BADGE_VISUALS[code] : undefined) ?? DEFAULT_VISUAL;
