import { Stack, Redirect } from 'expo-router';
import { useAuthStore } from '@store/authStore';

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();

  // Nếu đã login → redirect về tabs
  if (!isLoading && isAuthenticated) {
    return <Redirect href="/(tabs)/home" />;
  }

  return (
    <Stack screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: '#0F172A' },
      animation: 'fade',
    }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
