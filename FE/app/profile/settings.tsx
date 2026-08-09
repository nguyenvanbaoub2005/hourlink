import { Stack } from 'expo-router';
import SettingsScreen from '@screens/profile/SettingsScreen';

export default function SettingsRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SettingsScreen />
    </>
  );
}
