import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@constants/Colors';

// TODO: implement SkillDetailScreen screen
// Chi tiết 1 kỹ năng, nút gửi lời mời
export default function SkillDetailScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>SkillDetail</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark, justifyContent: 'center', alignItems: 'center' },
  text: { color: Colors.textPrimary, fontSize: 20, fontWeight: 'bold' },
});
