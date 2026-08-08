import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { Colors, Radius, Spacing } from '@constants/Colors';
import { useAuthStore } from '@store/authStore';
import CommunityApi from '@api/community';
import type { ActivityResponse } from '@types';

export default function OrganizationHomeScreen() {
  const router = useRouter(); const { user } = useAuthStore();
  const [activities, setActivities] = useState<ActivityResponse[]>([]); const [loading, setLoading] = useState(true); const [refreshing, setRefreshing] = useState(false);
  const load = async () => { try { const { data } = await CommunityApi.getMyActivities(0, 100); setActivities(data.data?.content || []); } finally { setLoading(false); } };
  useFocusEffect(useCallback(() => { load(); }, []));
  const totalRegistrations = activities.reduce((sum, item) => sum + item.registeredCount, 0);
  return <FlatList style={styles.screen} data={activities.slice(0, 5)} keyExtractor={i => i.id} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />} contentContainerStyle={styles.container} ListHeaderComponent={<>
    <Text style={styles.greeting}>Xin chào,</Text><Text style={styles.name}>{user?.fullName || 'Tổ chức'}</Text>
    <View style={styles.stats}><Stat value={activities.length} label="Hoạt động" /><Stat value={totalRegistrations} label="Đang đăng ký" /></View>
    <View style={styles.quickRow}><Quick icon="plus-circle" label="Tạo hoạt động" onPress={() => router.push('/community/create' as any)} /><Quick icon="list" label="Quản lý tất cả" onPress={() => router.push('/community/mine' as any)} /></View>
    <View style={styles.sectionRow}><Text style={styles.sectionTitle}>Hoạt động gần đây</Text><TouchableOpacity onPress={() => router.push('/community/mine' as any)}><Text style={styles.link}>Xem tất cả</Text></TouchableOpacity></View>
    {loading && <ActivityIndicator color={Colors.primary} />}
  </>} ListEmptyComponent={!loading ? <Text style={styles.empty}>Chưa có hoạt động nào. Hãy tạo hoạt động đầu tiên.</Text> : null} renderItem={({ item }) => <TouchableOpacity style={styles.card} onPress={() => item.registeredCount > 0 ? router.push(`/community/manage/${item.id}` as any) : router.push(`/community/${item.id}` as any)}><View style={styles.cardTop}><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.badge}>{item.status}</Text></View><Text style={styles.meta}>{new Date(item.startTime).toLocaleString('vi-VN')}</Text><Text style={styles.pending}>{item.registeredCount} người {new Date(item.endTime) <= new Date() ? 'chờ xác nhận' : 'đã đăng ký'}</Text></TouchableOpacity>} />;
}
function Stat({ value, label }: { value: number; label: string }) { return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }
function Quick({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) { return <TouchableOpacity style={styles.quick} onPress={onPress}><Feather name={icon} size={20} color="#fff" /><Text style={styles.quickText}>{label}</Text></TouchableOpacity>; }
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#F8FAFC' }, container: { padding: Spacing.lg, paddingBottom: 40 }, greeting: { color: Colors.textSecondary }, name: { fontSize: 23, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 18 }, stats: { flexDirection: 'row', gap: 12 }, stat: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: 16, alignItems: 'center' }, statValue: { fontSize: 25, fontWeight: 'bold', color: Colors.primary }, statLabel: { color: Colors.textMuted, marginTop: 4 }, quickRow: { flexDirection: 'row', gap: 10, marginVertical: 18 }, quick: { flex: 1, backgroundColor: Colors.primary, borderRadius: Radius.md, padding: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }, quickText: { color: '#fff', fontWeight: 'bold' }, sectionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }, sectionTitle: { fontSize: 17, fontWeight: 'bold' }, link: { color: Colors.primary, fontWeight: '600' }, card: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: 14, marginBottom: 10 }, cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, cardTitle: { flex: 1, fontWeight: 'bold', fontSize: 15 }, badge: { color: Colors.primary, fontSize: 11, fontWeight: '600' }, meta: { color: Colors.textMuted, marginTop: 6 }, pending: { color: '#D97706', marginTop: 7, fontWeight: '600' }, empty: { textAlign: 'center', color: Colors.textMuted, marginTop: 30 } });
