import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors, Fonts, Spacing, Radius } from '@constants/Colors';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@store/authStore';

export default function IndividualHomeScreen() {
  const { user, logout } = useAuthStore();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Xin chào,</Text>
          <Text style={styles.name}>{user?.fullName || 'Người dùng'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Feather name="log-out" size={18} color={Colors.danger} />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.creditCard}>
        <Text style={styles.creditLabel}>Số dư Time Credit</Text>
        <Text style={styles.creditValue}>24.5 <Text style={styles.creditUnit}>giờ</Text></Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gợi ý từ AI (Matching)</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dạy kèm Tiếng Anh</Text>
          <Text style={styles.cardDesc}>Có 3 người đang cần học Tiếng Anh cơ bản. Kỹ năng của bạn rất phù hợp!</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hoạt động cộng đồng</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dọn rác bãi biển Cần Giờ</Text>
          <Text style={styles.cardDesc}>Tổ chức: GreenEarth - Tặng 5 Time Credit</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: Colors.bgLight, padding: Spacing.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  greeting: { fontSize: 14, color: Colors.textSecondary },
  name: { fontSize: 22, fontWeight: 'bold', color: Colors.textPrimary, fontFamily: Fonts.bold },
  creditCard: { backgroundColor: Colors.primary, padding: Spacing.xl, borderRadius: Radius.lg, marginBottom: Spacing.xl },
  creditLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: Spacing.sm },
  creditValue: { color: '#FFF', fontSize: 32, fontWeight: 'bold' },
  creditUnit: { fontSize: 18, fontWeight: 'normal' },
  section: { marginBottom: Spacing.xl },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: Spacing.md },
  card: { backgroundColor: Colors.bgCard, padding: Spacing.lg, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: Spacing.xs },
  cardDesc: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEE2E2', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 6 },
  logoutText: { color: Colors.danger, fontSize: 14, fontWeight: 'bold' },
});
