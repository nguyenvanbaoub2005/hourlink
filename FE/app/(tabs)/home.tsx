import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@constants/Colors';
import { useAuthStore } from '@store/authStore';

import IndividualHomeScreen from '../../src/screens/home/IndividualHomeScreen';
import OrganizationHomeScreen from '../../src/screens/home/OrganizationHomeScreen';
import AdminHomeScreen from '../../src/screens/home/AdminHomeScreen';

export default function HomeScreen() {
  const { role } = useAuthStore();

  const renderHomeContent = () => {
    switch (role) {
      case 'ROLE_USER':
        return <IndividualHomeScreen />;
      case 'ROLE_ORGANIZATION':
        return <OrganizationHomeScreen />;
      case 'ROLE_ADMIN':
        return <AdminHomeScreen />;
      default:
        return (
          <View style={styles.center}>
            <Text style={styles.text}>Lỗi phân quyền: Không xác định được Role ({role || 'null'}).</Text>
            <Text style={styles.text}>Token cũ không tương thích.</Text>
            <TouchableOpacity style={{ marginTop: 20, padding: 10, backgroundColor: Colors.danger, borderRadius: 8 }} onPress={() => useAuthStore.getState().logout()}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Đăng xuất (Xóa token lỗi)</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {renderHomeContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgLight },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { color: Colors.textSecondary, fontSize: 16 },
});
