/**
 * Colors — Bảng màu chính của HourLink.
 * Dark-first, hỗ trợ light/dark mode.
 */
export const Colors = {
  primary:    '#10B981',  // Teal/Emerald (Main button color)
  secondary:  '#0D9488',  // Darker Teal (Text links)
  accent:     '#F97316',  // Orange (Accent)
  success:    '#10B981',  // Emerald
  warning:    '#F59E0B',  // Amber
  danger:     '#EF4444',  // Red

  // Backgrounds
  bgLight:    '#FFFFFF',  // White
  bgCard:     '#F1F5F9',  // Slate-100 (Light gray)
  bgInput:    '#FFFFFF',  // White inputs
  bgScreen:   '#F8FAFC',  // Very light screen bg
  bgDark:     '#F8FAFC',  // Alias for old screens to avoid errors
  surface:    '#FFFFFF',  // Alias for legacy card/input screens

  // Text
  text:          '#1E293B',  // Alias for old screens
  textPrimary:   '#1E293B',  // Slate-800
  textSecondary: '#64748B',  // Slate-500
  textMuted:     '#94A3B8',  // Slate-400

  // Border
  border:     '#E2E8F0',  // Slate-200

  // Gradient stops
  gradientStart: '#047857',  // Deep emerald
  gradientEnd:   '#10B981',  // Emerald

  // Time Credit gold
  credit:     '#F59E0B',
};

export const Fonts = {
  regular: 'System',
  medium:  'System',
  bold:    'System',
};

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
};

export const Radius = {
  sm:  8,
  md:  12,
  lg:  16,
  xl:  24,
  full: 9999,
};
