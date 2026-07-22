import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@constants/Colors';

// TODO: implement CommunityDetailScreen screen
// Chi tiết hoạt động + đăng ký
export default function CommunityDetailScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>CommunityDetail</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark, justifyContent: 'center', alignItems: 'center' },
  text: { color: Colors.textPrimary, fontSize: 20, fontWeight: 'bold' },
});
