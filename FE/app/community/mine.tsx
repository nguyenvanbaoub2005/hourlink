import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@constants/Colors';
import CommunityApi from '@api/community';
import type { ActivityResponse } from '@types';

const statusLabel: Record<string, string> = { OPEN: 'Đang mở', CLOSED: 'Đã đóng đăng ký', COMPLETED: 'Hoàn thành', CANCELLED: 'Đã hủy' };

export default function MyCommunityActivitiesScreen() {
  const router = useRouter();
  const [items, setItems] = useState<ActivityResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try { const { data } = await CommunityApi.getMyActivities(0, 100); setItems(data.data?.content || []); }
    catch (e: any) { Alert.alert('Lỗi', e?.response?.data?.message || 'Không thể tải hoạt động của bạn.'); }
    finally { setLoading(false); }
  };
  useFocusEffect(useCallback(() => { load(); }, []));

  const close = (item: ActivityResponse) => Alert.alert('Đóng đăng ký', `Đóng đăng ký “${item.title}”?`, [
    { text: 'Không', style: 'cancel' },
    { text: 'Đóng', onPress: async () => { try { await CommunityApi.closeRegistration(item.id); load(); } catch (e: any) { Alert.alert('Lỗi', e?.response?.data?.message || 'Không thể đóng đăng ký.'); } } },
  ]);
  const remove = (item: ActivityResponse) => Alert.alert('Xóa hoạt động', 'Chỉ xóa được khi không còn người đang đăng ký. Bạn chắc chắn muốn xóa?', [
    { text: 'Không', style: 'cancel' },
    { text: 'Xóa', style: 'destructive', onPress: async () => { try { await CommunityApi.deleteActivity(item.id); load(); } catch (e: any) { Alert.alert('Lỗi', e?.response?.data?.message || 'Không thể xóa hoạt động.'); } } },
  ]);

  return <SafeAreaView style={styles.container}>
    <View style={styles.header}><TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} /></TouchableOpacity><Text style={styles.headerTitle}>Hoạt Động Của Tôi</Text><TouchableOpacity onPress={() => router.push('/community/create' as any)}><Ionicons name="add-circle" size={26} color={Colors.primary} /></TouchableOpacity></View>
    {loading ? <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View> : <FlatList data={items} keyExtractor={i => i.id} contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />} ListEmptyComponent={<Text style={styles.empty}>Bạn chưa tạo hoạt động nào.</Text>} renderItem={({ item }) => <View style={styles.card}>
      <TouchableOpacity onPress={() => router.push(`/community/${item.id}` as any)}><View style={styles.top}><Text style={styles.title}>{item.title}</Text><Text style={styles.status}>{statusLabel[item.status]}</Text></View><Text style={styles.meta}>{new Date(item.startTime).toLocaleString('vi-VN')} · {item.registeredCount} chờ xác nhận</Text></TouchableOpacity>
      <View style={styles.actions}>
        <Action label="Người tham gia" icon="people-outline" onPress={() => router.push(`/community/manage/${item.id}` as any)} />
        {item.status === 'OPEN' && <Action label="Sửa" icon="create-outline" onPress={() => router.push({ pathname: '/community/create', params: { editId: item.id } } as any)} />}
        {item.status === 'OPEN' && <Action label="Đóng" icon="lock-closed-outline" onPress={() => close(item)} />}
        {(item.status === 'OPEN' || item.status === 'CLOSED') && <Action label="Xóa" icon="trash-outline" danger onPress={() => remove(item)} />}
      </View>
    </View>} />}
  </SafeAreaView>;
}
function Action({ label, icon, onPress, danger }: { label: string; icon: any; onPress: () => void; danger?: boolean }) { return <TouchableOpacity style={styles.action} onPress={onPress}><Ionicons name={icon} size={16} color={danger ? Colors.danger : Colors.primary} /><Text style={[styles.actionText, danger && { color: Colors.danger }]}>{label}</Text></TouchableOpacity>; }
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#F8FAFC' }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.border }, headerTitle: { fontSize: 18, fontWeight: 'bold' }, center: { flex: 1, justifyContent: 'center', alignItems: 'center' }, list: { padding: Spacing.md }, empty: { textAlign: 'center', color: Colors.textMuted, marginTop: 50 }, card: { backgroundColor: '#fff', padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, marginBottom: 12 }, top: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, title: { flex: 1, fontSize: 16, fontWeight: 'bold', color: Colors.textPrimary }, status: { color: Colors.primary, fontSize: 12, fontWeight: '600' }, meta: { color: Colors.textMuted, marginTop: 8 }, actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, borderTopWidth: 1, borderTopColor: Colors.border, marginTop: 12, paddingTop: 12 }, action: { flexDirection: 'row', alignItems: 'center', gap: 4 }, actionText: { color: Colors.primary, fontSize: 13, fontWeight: '600' } });
