import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Fonts, Spacing, Radius } from '@constants/Colors';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@store/authStore';

export default function AdminHomeScreen() {
  const { logout } = useAuthStore();

  return (
    <View style={styles.container}>
      <Feather name="shield" size={64} color={Colors.danger} style={{ marginBottom: Spacing.lg }} />
      <Text style={styles.title}>Admin Dashboard</Text>
      <Text style={styles.subtitle}>
        Vui lòng truy cập trang Web Admin (ReactJS) để thực hiện các nghiệp vụ quản trị hệ thống đầy đủ nhất.
      </Text>
      
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgLight, padding: Spacing.xl, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: Spacing.sm },
  subtitle: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.xl },
  logoutButton: { backgroundColor: Colors.textPrimary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: Radius.md },
  logoutText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
