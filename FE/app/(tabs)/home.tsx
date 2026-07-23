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
    // Nếu role có giá trị: check đúng role
    // Nếu role null hoặc ROLE_USER → hiển thị màn hình người dùng cá nhân
    if (!role || role === 'ROLE_USER' || role.includes('ROLE_USER')) {
      return <IndividualHomeScreen />;
    }
    if (role === 'ROLE_ORGANIZATION' || role.includes('ROLE_ORGANIZATION')) {
      return <OrganizationHomeScreen />;
    }
    if (role === 'ROLE_ADMIN' || role.includes('ROLE_ADMIN')) {
      return <AdminHomeScreen />;
    }
    // Fallback: hiển thị luôn màn hình cá nhân
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
