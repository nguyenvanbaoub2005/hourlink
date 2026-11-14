/**
 * Material 3 Dynamic Color Scheme cho HourLink
 * Tuân thủ Google Material Design 3 Spec & Ergonomic Guidelines
 */

export interface ColorScheme {
  // Primary (HourLink Emerald)
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;

  // Secondary (Teal)
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;

  // Tertiary (Accent Amber / Orange)
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;

  // Surface & Background
  background: string;
  onBackground: string;
  surface: string;
  surfaceCard: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;

  // Outlines & Borders
  outline: string;
  outlineVariant: string;

  // Status Colors
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  success: string;
  warning: string;
  info: string;

  // HourLink Brand Specifics
  credit: string;
  gradientStart: string;
  gradientEnd: string;

  // Backward-compatibility aliases for existing components
  bgLight: string;
  bgCard: string;
  bgInput: string;
  bgScreen: string;
  bgDark: string;
  text: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  accent: string;
  danger: string;
}

export const lightColorScheme: ColorScheme = {
  primary: '#10B981',
  onPrimary: '#FFFFFF',
  primaryContainer: '#D1FAE5',
  onPrimaryContainer: '#065F46',

  secondary: '#0D9488',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#CCFBF1',
  onSecondaryContainer: '#115E59',

  tertiary: '#F59E0B',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#FEF3C7',
  onTertiaryContainer: '#92400E',

  background: '#F8FAFC',
  onBackground: '#0F172A',
  surface: '#FFFFFF',
  surfaceCard: '#FFFFFF',
  onSurface: '#0F172A',
  surfaceVariant: '#F1F5F9',
  onSurfaceVariant: '#64748B',
  surfaceContainer: '#F8FAFC',
  surfaceContainerHigh: '#F1F5F9',
  surfaceContainerHighest: '#E2E8F0',

  outline: '#E2E8F0',
  outlineVariant: '#CBD5E1',

  error: '#EF4444',
  onError: '#FFFFFF',
  errorContainer: '#FEE2E2',
  onErrorContainer: '#991B1B',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#3B82F6',

  credit: '#F59E0B',
  gradientStart: '#047857',
  gradientEnd: '#10B981',

  // Legacy mappings
  bgLight: '#FFFFFF',
  bgCard: '#FFFFFF',
  bgInput: '#F8FAFC',
  bgScreen: '#F8FAFC',
  bgDark: '#0F172A',
  text: '#0F172A',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  accent: '#F97316',
  danger: '#EF4444',
};

export const darkColorScheme: ColorScheme = {
  primary: '#34D399',
  onPrimary: '#064E3B',
  primaryContainer: '#065F46',
  onPrimaryContainer: '#A7F3D0',

  secondary: '#2DD4BF',
  onSecondary: '#134E4A',
  secondaryContainer: '#115E59',
  onSecondaryContainer: '#99F6E4',

  tertiary: '#FBBF24',
  onTertiary: '#78350F',
  tertiaryContainer: '#92400E',
  onTertiaryContainer: '#FDE68A',

  background: '#0B0F19',
  onBackground: '#F1F5F9',
  surface: '#111827',
  surfaceCard: '#1E293B',
  onSurface: '#F3F4F6',
  surfaceVariant: '#1F2937',
  onSurfaceVariant: '#9CA3AF',
  surfaceContainer: '#161F30',
  surfaceContainerHigh: '#1E293B',
  surfaceContainerHighest: '#334155',

  outline: '#374151',
  outlineVariant: '#4B5563',

  error: '#F87171',
  onError: '#7F1D1D',
  errorContainer: '#991B1B',
  onErrorContainer: '#FECACA',
  success: '#34D399',
  warning: '#FBBF24',
  info: '#60A5FA',

  credit: '#FBBF24',
  gradientStart: '#064E3B',
  gradientEnd: '#059669',

  // Legacy mappings for Dark Mode
  bgLight: '#111827',
  bgCard: '#1F2937',
  bgInput: '#1F2937',
  bgScreen: '#0B0F19',
  bgDark: '#0B0F19',
  text: '#F3F4F6',
  textPrimary: '#F3F4F6',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  border: '#374151',
  accent: '#FB923C',
  danger: '#F87171',
};
