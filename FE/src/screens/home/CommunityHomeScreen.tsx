import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Colors, Spacing, Radius } from '@constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import CommunityApi from '@api/community';
import type { ActivityResponse } from '@types';
import { useAuthStore } from '@store/authStore';

export default function CommunityHomeScreen() {
  const router = useRouter();
  const { role, user } = useAuthStore();
  const [activities, setActivities] = useState<ActivityResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Chỉ Organization hoặc Admin mới được phép tạo hoạt động cộng đồng (theo thiết kế)
  const canCreate = role?.includes('ROLE_ORGANIZATION') || role?.includes('ROLE_ADMIN') || user?.userType === 'organization' || user?.userType === 'admin';

  const fetchActivities = async () => {
    try {
      const res = await CommunityApi.getOpenActivities(0, 20);
      setActivities(res.data?.data?.content || []);
    } catch (e) {
      console.error('Lỗi tải hoạt động cộng đồng:', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchActivities();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchActivities();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: ActivityResponse }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push(`/community/${item.id}` as any)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.orgInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>{item.organizerName.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.orgName}>{item.organizerName}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>+{item.creditReward} TC</Text>
        </View>
      </View>
      
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>

      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Ionicons name="calendar-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.footerText}>
            {new Date(item.startTime).toLocaleDateString('vi-VN')}
          </Text>
        </View>
        <View style={styles.footerItem}>
          <Ionicons name="people-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.footerText}>
            {item.registeredCount} / {item.maxParticipants || '∞'}
          </Text>
        </View>
        {item.registered && (
          <View style={styles.registeredBadge}>
            <Text style={styles.registeredText}>Đã đăng ký</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.shortcutRow}>
        <TouchableOpacity style={styles.shortcut} onPress={() => router.push('/community/registrations' as any)}>
          <Ionicons name="bookmark-outline" size={18} color={Colors.primary} /><Text style={styles.shortcutText}>Đã đăng ký</Text>
        </TouchableOpacity>
        {canCreate && <TouchableOpacity style={styles.shortcut} onPress={() => router.push('/community/mine' as any)}>
          <Ionicons name="settings-outline" size={18} color={Colors.primary} /><Text style={styles.shortcutText}>Quản lý</Text>
        </TouchableOpacity>}
      </View>
      {canCreate && (
        <TouchableOpacity 
          style={styles.createBtn}
          onPress={() => router.push('/community/create' as any)}
        >
          <Ionicons name="add-circle-outline" size={20} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.createBtnText}>Tạo hoạt động mới</Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={activities}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="leaf-outline" size={40} color={Colors.border} />
              <Text style={styles.emptyText}>Hiện chưa có hoạt động cộng đồng nào đang mở.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  createBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: Colors.primary, 
    margin: Spacing.md, 
    padding: 12, 
    borderRadius: Radius.md 
  },
  createBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  listContent: { padding: Spacing.md, paddingBottom: 40 },
  
  card: {
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  orgInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  avatarLetter: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  orgName: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  badge: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#D97706', fontSize: 12, fontWeight: 'bold' },
  
  title: { fontSize: 16, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 6 },
  desc: { fontSize: 14, color: Colors.textMuted, lineHeight: 20, marginBottom: 12 },
  
  footer: { flexDirection: 'row', alignItems: 'center', gap: 16, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12 },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 13, color: Colors.textMuted },
  
  registeredBadge: { marginLeft: 'auto', backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  registeredText: { color: '#059669', fontSize: 12, fontWeight: 'bold' },

  emptyBox: { alignItems: 'center', marginTop: 60, padding: 20 },
  emptyText: { color: Colors.textMuted, marginTop: 12, textAlign: 'center' },
  shortcutRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, paddingHorizontal: Spacing.md, paddingTop: 10 },
  shortcut: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: Colors.border, backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 7, borderRadius: Radius.md },
  shortcutText: { color: Colors.primary, fontWeight: '600', fontSize: 13 }
});
