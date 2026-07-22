import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@constants/Colors';

// TODO: implement QrScanScreen screen
// Quét QR xác nhận bắt đầu buổi học
export default function QrScanScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>QrScan</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark, justifyContent: 'center', alignItems: 'center' },
  text: { color: Colors.textPrimary, fontSize: 20, fontWeight: 'bold' },
});
