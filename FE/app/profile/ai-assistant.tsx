import { Stack } from 'expo-router';
import AiAssistantScreen from '@screens/chat/AiAssistantScreen';

export default function AiAssistantRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AiAssistantScreen />
    </>
  );
}
