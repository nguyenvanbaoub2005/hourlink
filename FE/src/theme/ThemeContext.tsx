import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { MD3LightTheme, MD3DarkTheme, PaperProvider, type MD3Theme } from 'react-native-paper';
import { lightColorScheme, darkColorScheme, type ColorScheme } from './colors';

export type ThemeMode = 'system' | 'light' | 'dark';

const THEME_STORAGE_KEY = 'hourlink_theme_preference';

interface ThemeContextType {
  colors: ColorScheme;
  isDark: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  paperTheme: MD3Theme;
}

const ThemeContext = createContext<ThemeContextType>({
  colors: lightColorScheme,
  isDark: false,
  themeMode: 'system',
  setThemeMode: async () => {},
  paperTheme: MD3LightTheme,
});

export const AppThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const deviceColorScheme = useDeviceColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme preference from SecureStore
  useEffect(() => {
    SecureStore.getItemAsync(THEME_STORAGE_KEY)
      .then((saved) => {
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setThemeModeState(saved as ThemeMode);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoaded(true));
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await SecureStore.setItemAsync(THEME_STORAGE_KEY, mode);
    } catch {}
  };

  const isDark = useMemo(() => {
    if (themeMode === 'system') {
      return deviceColorScheme === 'dark';
    }
    return themeMode === 'dark';
  }, [themeMode, deviceColorScheme]);

  const colors = useMemo(() => (isDark ? darkColorScheme : lightColorScheme), [isDark]);

  const paperTheme = useMemo<MD3Theme>(() => {
    const base = isDark ? MD3DarkTheme : MD3LightTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        onPrimary: colors.onPrimary,
        primaryContainer: colors.primaryContainer,
        onPrimaryContainer: colors.onPrimaryContainer,
        secondary: colors.secondary,
        onSecondary: colors.onSecondary,
        background: colors.background,
        onBackground: colors.onBackground,
        surface: colors.surface,
        onSurface: colors.onSurface,
        surfaceVariant: colors.surfaceVariant,
        onSurfaceVariant: colors.onSurfaceVariant,
        outline: colors.outline,
        outlineVariant: colors.outlineVariant,
        error: colors.error,
        onError: colors.onError,
      },
    };
  }, [isDark, colors]);

  const contextValue = useMemo(
    () => ({
      colors,
      isDark,
      themeMode,
      setThemeMode,
      paperTheme,
    }),
    [colors, isDark, themeMode, paperTheme]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      <PaperProvider theme={paperTheme}>
        {children}
      </PaperProvider>
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  return useContext(ThemeContext);
}

export function useColors() {
  return useContext(ThemeContext).colors;
}
