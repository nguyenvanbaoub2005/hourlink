import { Stack } from 'expo-router';
import HelpScreen from '@screens/profile/HelpScreen';

export default function HelpRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <HelpScreen />
    </>
  );
}
