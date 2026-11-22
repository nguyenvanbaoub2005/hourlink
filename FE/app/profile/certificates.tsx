import { Stack } from 'expo-router';
import CertificatesScreen from '@screens/profile/CertificatesScreen';

export default function CertificatesRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <CertificatesScreen />
    </>
  );
}
