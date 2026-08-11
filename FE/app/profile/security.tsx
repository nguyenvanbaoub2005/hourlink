import { Stack } from 'expo-router';
import SecurityScreen from '@screens/profile/SecurityScreen';

export default function SecurityRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SecurityScreen />
    </>
  );
}
