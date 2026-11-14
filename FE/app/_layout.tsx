import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@store/authStore';
import NotificationToast from '@components/NotificationToast';
import { AppThemeProvider, useTheme } from '@theme';
import { setUnauthorizedHandler } from '@api/axiosInstance';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 phút
    },
  },
});

function RootNavigationContent() {
  const { colors, isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.surface} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="chat/index" />
        <Stack.Screen name="chat/[id]" />
      </Stack>
      {/* Toast thông báo nổi — hoạt động trên tất cả màn hình */}
      <NotificationToast />
    </>
  );
}

export default function RootLayout() {
  const { loadStoredAuth, logout } = useAuthStore();

  useEffect(() => {
    loadStoredAuth();
    setUnauthorizedHandler(() => {
      logout();
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppThemeProvider>
        <RootNavigationContent />
      </AppThemeProvider>
    </QueryClientProvider>
  );
}
