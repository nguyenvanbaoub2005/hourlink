import { Stack } from 'expo-router';
import PrivacyPolicyScreen from '@screens/profile/PrivacyPolicyScreen';

export default function PrivacyPolicyRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <PrivacyPolicyScreen />
    </>
  );
}
