import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@store/authStore';
import NotificationToast from '@components/NotificationToast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 phút
    },
  },
});

import { setUnauthorizedHandler } from '@api/axiosInstance';

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
      <StatusBar style="light" backgroundColor="#0F172A" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="chat" />
      </Stack>
      {/* Toast thông báo nổi — hoạt động trên tất cả màn hình */}
      <NotificationToast />
    </QueryClientProvider>
  );
}
