import { Stack } from 'expo-router';
import BlockedUsersScreen from '@screens/profile/BlockedUsersScreen';

export default function BlockedUsersRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <BlockedUsersScreen />
    </>
  );
}
