import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@constants/Colors';
import CommunityApi from '@api/community';
import type { ParticipantResponse } from '@types';

const labels = { REGISTERED: 'Đã đăng ký', CONFIRMED: 'Đã xác nhận', ABSENT: 'Vắng mặt', CANCELLED: 'Đã hủy' };

export default function MyRegistrationsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<ParticipantResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const { data } = await CommunityApi.getMyRegistrations(0, 100);
      setItems(data.data?.content || []);
    } catch {
      Alert.alert('Lỗi', 'Không thể tải hoạt động đã đăng ký.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const renderItem = ({ item }: { item: ParticipantResponse }) => {
    const hasEnded = new Date(item.activityEndTime) <= new Date();
    const canSubmitEvidence = ['REGISTERED', 'CONFIRMED'].includes(item.status) && hasEnded;
    const evidenceCount = item.evidence?.length ?? 0;
    const creditText = item.status === 'CONFIRMED'
      ? `+${item.actualHours ?? 0} TC · Đã nhận`
      : item.status === 'ABSENT'
        ? 'Không được xác nhận · Không nhận Credit'
        : item.status === 'CANCELLED'
          ? 'Đăng ký đã hủy'
          : `Dự kiến +${item.activityCreditReward} TC · Chờ xác nhận`;

    return (
      <View style={styles.card}>
        <TouchableOpacity onPress={() => router.push(`/community/${item.activityId}` as any)}>
          <View style={styles.row}>
            <Text style={styles.cardTitle}>{item.activityTitle}</Text>
            <Text style={styles.status}>{labels[item.status]}</Text>
          </View>
          <Text style={styles.meta}>{new Date(item.activityStartTime).toLocaleString('vi-VN')}</Text>
          {!!item.activityLocation && <Text style={styles.meta}>{item.activityLocation}</Text>}
          <Text style={[styles.credit, item.status === 'ABSENT' && styles.creditRejected]}>{creditText}</Text>
        </TouchableOpacity>

        {(canSubmitEvidence || evidenceCount > 0) && (
          <TouchableOpacity
            style={styles.evidenceButton}
            onPress={() => router.push(`/community/evidence/${item.activityId}` as any)}
          >
            <Ionicons name={evidenceCount ? 'checkmark-circle-outline' : 'camera-outline'} size={19} color={Colors.primary} />
            <Text style={styles.evidenceText}>
              {evidenceCount
                ? `Đã gửi ${evidenceCount} ảnh · ${canSubmitEvidence ? 'Xem hoặc cập nhật' : 'Xem minh chứng'}`
                : canSubmitEvidence ? 'Gửi ảnh minh chứng tham gia' : 'Minh chứng · Gửi sau khi kết thúc'}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} /></TouchableOpacity>
        <Text style={styles.title}>Hoạt Động Đã Đăng Ký</Text>
        <View style={{ width: 24 }} />
      </View>
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
          ListEmptyComponent={<Text style={styles.empty}>Bạn chưa đăng ký hoạt động nào.</Text>}
          renderItem={renderItem}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontSize: 18, fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: Spacing.md },
  empty: { textAlign: 'center', color: Colors.textMuted, marginTop: 50 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  cardTitle: { flex: 1, fontWeight: 'bold', fontSize: 16, color: Colors.textPrimary },
  status: { color: Colors.primary, fontWeight: '600', fontSize: 12 },
  meta: { color: Colors.textMuted, marginTop: 6 },
  credit: { color: '#D97706', fontWeight: 'bold', marginTop: 10 },
  creditRejected: { color: '#DC2626' },
  evidenceButton: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border, flexDirection: 'row', alignItems: 'center', gap: 7 },
  evidenceText: { flex: 1, color: Colors.primary, fontWeight: '700', fontSize: 13 },
});
