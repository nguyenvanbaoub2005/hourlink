/**
 * Colors — Bảng màu chính của HourLink.
 * Hỗ trợ Light & Dark Mode theo chuẩn Google Material 3.
 * Khuyến khích sử dụng hook: `const { colors, isDark } = useTheme()` từ `@theme`
 */
import { lightColorScheme, darkColorScheme, type ColorScheme } from '../theme/colors';

export const Colors = lightColorScheme;
export { lightColorScheme, darkColorScheme, type ColorScheme };

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
