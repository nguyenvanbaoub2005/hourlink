import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@constants/Colors';

// TODO: implement AiSuggestScreen screen
// Xem danh sách AI gợi ý người hỗ trợ
export default function AiSuggestScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>AiSuggest</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark, justifyContent: 'center', alignItems: 'center' },
  text: { color: Colors.textPrimary, fontSize: 20, fontWeight: 'bold' },
});
