import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@constants/Colors';

// TODO: implement AppointmentDetailScreen screen
// Chi tiết lịch hẹn
export default function AppointmentDetailScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>AppointmentDetail</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark, justifyContent: 'center', alignItems: 'center' },
  text: { color: Colors.textPrimary, fontSize: 20, fontWeight: 'bold' },
});
