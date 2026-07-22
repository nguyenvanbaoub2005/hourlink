import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors, Fonts, Spacing, Radius } from '@constants/Colors';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@store/authStore';

export default function OrganizationHomeScreen() {
  const { user, logout } = useAuthStore();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Tổ chức,</Text>
          <Text style={styles.name}>{user?.fullName || 'Tên Tổ Chức'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Feather name="log-out" size={18} color={Colors.danger} />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>5</Text>
          <Text style={styles.statLabel}>Hoạt động</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>120</Text>
          <Text style={styles.statLabel}>Người tham gia</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.createButton}>
        <Feather name="plus-circle" size={20} color="#FFF" />
        <Text style={styles.createButtonText}>Tạo hoạt động mới</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Đang chờ xác nhận giờ</Text>
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardTitle}>Nguyễn Văn A</Text>
            <Text style={styles.timeTag}>+4 giờ</Text>
          </View>
          <Text style={styles.cardDesc}>Hoạt động: Phân loại quần áo cũ</Text>
          <TouchableOpacity style={styles.confirmButton}>
            <Text style={styles.confirmText}>Xác nhận cấp giờ</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: Colors.bgLight, padding: Spacing.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  greeting: { fontSize: 14, color: Colors.textSecondary },
  name: { fontSize: 22, fontWeight: 'bold', color: Colors.secondary, fontFamily: Fonts.bold },
  statsContainer: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
  statBox: { flex: 1, backgroundColor: Colors.bgCard, padding: Spacing.lg, borderRadius: Radius.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  statValue: { fontSize: 24, fontWeight: 'bold', color: Colors.primary, marginBottom: Spacing.xs },
  statLabel: { fontSize: 13, color: Colors.textSecondary },
  createButton: { backgroundColor: Colors.secondary, padding: Spacing.md, borderRadius: Radius.md, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xl },
  createButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  section: { marginBottom: Spacing.xl },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: Spacing.md },
  card: { backgroundColor: Colors.bgCard, padding: Spacing.lg, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.textPrimary },
  timeTag: { backgroundColor: '#E0F2FE', color: '#0284C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, fontSize: 12, fontWeight: 'bold' },
  cardDesc: { fontSize: 14, color: Colors.textSecondary, marginBottom: Spacing.md },
  confirmButton: { backgroundColor: Colors.primary, padding: Spacing.sm, borderRadius: Radius.sm, alignItems: 'center' },
  confirmText: { color: '#FFF', fontWeight: 'bold' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEE2E2', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 6 },
  logoutText: { color: Colors.danger, fontSize: 14, fontWeight: 'bold' },
});
