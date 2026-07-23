import { Stack } from 'expo-router';
import EditProfileScreen from '@screens/profile/EditProfileScreen';

export default function EditProfile() {
  return (
    <>
      <Stack.Screen options={{ title: 'Chỉnh sửa hồ sơ', headerShown: false }} />
      <EditProfileScreen />
    </>
  );
}
