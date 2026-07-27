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
    // role là claim "scope" trong JWT, có thể chứa nhiều role cách nhau
    // bởi dấu cách (vd: "ROLE_USER ROLE_ADMIN") → check theo độ ưu tiên
    // cao nhất trước: ADMIN > ORGANIZATION > USER/mặc định
    if (role?.includes('ROLE_ADMIN')) {
      return <AdminHomeScreen />;
    }
    if (role?.includes('ROLE_ORGANIZATION')) {
      return <OrganizationHomeScreen />;
    }
    // ROLE_USER, role null (decode lỗi) hoặc role lạ → màn cá nhân
    return <IndividualHomeScreen />;
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
