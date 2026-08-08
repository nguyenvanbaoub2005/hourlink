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
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import CommunityApi from '@api/community';
import Avatar from '@components/Avatar';
import UserProfileSheet from '@components/UserProfileSheet';
import { Colors, Radius, Spacing } from '@constants/Colors';
import type { FollowedOrganizationResponse } from '@types';

export default function FollowedOrganizationsScreen() {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<FollowedOrganizationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [removingId, setRemovingId] = useState<string>();
  const [profileUserId, setProfileUserId] = useState<string>();

  const load = async () => {
    try {
      const response = await CommunityApi.getFollowedOrganizations();
      setOrganizations(response.data.data ?? []);
    } catch (error: any) {
      Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể tải danh sách theo dõi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const confirmUnfollow = (item: FollowedOrganizationResponse) => {
    Alert.alert(
      'Bỏ theo dõi?',
      `Bạn sẽ không còn nhận thông báo hoạt động mới từ ${item.organizationName}.`,
      [
        { text: 'Quay lại', style: 'cancel' },
        {
          text: 'Bỏ theo dõi',
          style: 'destructive',
          onPress: async () => {
            try {
              setRemovingId(item.organizationId);
              await CommunityApi.unfollowOrganization(item.organizationId);
              setOrganizations(current => current.filter(
                organization => organization.organizationId !== item.organizationId
              ));
            } catch (error: any) {
              Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể bỏ theo dõi.');
            } finally {
              setRemovingId(undefined);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tổ Chức Đang Theo Dõi</Text>
        <View style={styles.headerButton} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={organizations}
          keyExtractor={item => item.organizationId}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-circle-outline" size={52} color={Colors.border} />
              <Text style={styles.emptyTitle}>Bạn chưa theo dõi tổ chức nào</Text>
              <Text style={styles.emptyText}>Theo dõi tổ chức để nhận thông báo khi họ tạo hoạt động mới.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.organization}
                onPress={() => setProfileUserId(item.organizationId)}
                accessibilityRole="button"
                accessibilityLabel={`Xem hồ sơ ${item.organizationName}`}
              >
                <View style={styles.avatar}>
                  <Avatar
                    uri={item.organizationAvatarUrl}
                    name={item.organizationName}
                    size={44}
                  />
                </View>
                <View style={styles.organizationText}>
                  <Text style={styles.organizationName}>{item.organizationName}</Text>
                  <Text style={styles.followedAt}>
                    Theo dõi từ {new Date(item.followedAt).toLocaleDateString('vi-VN')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.unfollowButton}
                onPress={() => confirmUnfollow(item)}
                disabled={removingId === item.organizationId}
              >
                {removingId === item.organizationId
                  ? <ActivityIndicator size="small" color={Colors.primary} />
                  : <>
                      <Ionicons name="checkmark" size={16} color={Colors.primary} />
                      <Text style={styles.unfollowText}>Đang theo dõi</Text>
                    </>}
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <UserProfileSheet
        visible={!!profileUserId}
        userId={profileUserId}
        onClose={() => setProfileUserId(undefined)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerButton: { width: 32, minHeight: 32, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: Spacing.md, flexGrow: 1 },
  card: { padding: Spacing.md, marginBottom: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg },
  organization: { flexDirection: 'row', alignItems: 'center' },
  avatar: { marginRight: 11 },
  organizationText: { flex: 1 },
  organizationName: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  followedAt: { color: Colors.textMuted, fontSize: 12, marginTop: 4 },
  unfollowButton: { marginTop: 12, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderWidth: 1, borderColor: '#A7F3D0', borderRadius: Radius.md, backgroundColor: '#ECFDF5' },
  unfollowText: { color: Colors.primary, fontSize: 13, fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  emptyTitle: { color: Colors.textPrimary, fontSize: 17, fontWeight: '700', marginTop: 12 },
  emptyText: { color: Colors.textMuted, textAlign: 'center', lineHeight: 20, marginTop: 7 },
});
