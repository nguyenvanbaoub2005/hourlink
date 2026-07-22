import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@constants/Colors';

// TODO: implement CreateHelpRequestScreen screen
// Form tạo yêu cầu + AI điền tự động
export default function CreateHelpRequestScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>CreateHelpRequest</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark, justifyContent: 'center', alignItems: 'center' },
  text: { color: Colors.textPrimary, fontSize: 20, fontWeight: 'bold' },
});
