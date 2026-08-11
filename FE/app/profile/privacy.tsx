import { Stack } from 'expo-router';
import PrivacyScreen from '@screens/profile/PrivacyScreen';

export default function PrivacyRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <PrivacyScreen />
    </>
  );
}
