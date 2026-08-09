import { Stack } from 'expo-router';
import TermsScreen from '@screens/profile/TermsScreen';

export default function TermsRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <TermsScreen />
    </>
  );
}
