import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '@constants/Colors';
import UserApi from '@api/user';
import SkillApi from '@api/skill';
import HelpRequestApi from '@api/helprequest';
import NotificationApi from '@api/notification';
import { useAuthStore } from '@store/authStore';
import { useNotificationStore } from '@store/notificationStore';
import type { UserResponse } from '@types';

type SkillItem = { id: string; name: string; status: string };
type RequestItem = { id: string; title: string; categoryName?: string; status: string };

export default function ProfileScreen() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const { unreadCount, setUnreadCount } = useNotificationStore();
  const [profile, setProfile] = useState<UserResponse | null>(null);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const handleMenuPress = (label: string, isLogout?: boolean) => {
    if (isLogout) {
      Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất khỏi HourLink?', [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]);
      return;
    }
    if (label === 'Ví Time Credit') {
      router.push('/(tabs)/wallet' as any);
      return;
    }
    if (label === 'Yêu cầu của tôi') {
      router.push('/profile/help-requests' as any);
      return;
    }
    if (label === 'Lời mời') {
      router.push('/profile/invitations' as any);
      return;
    }
    Alert.alert('Thông báo', `Tính năng "${label}" đang được phát triển.`);
  };

  const fetchAll = async () => {
    try {
      const [profileRes, skillsRes, requestsRes] = await Promise.all([
        UserApi.getMyProfile(),
        SkillApi.getMySkills(),
        HelpRequestApi.getMyRequests(),
      ]);
      setProfile(profileRes.data.data);
      setSkills(skillsRes.data.data ?? []);
      setRequests(requestsRes.data.data ?? []);
    } catch (e) {
      console.log('Lỗi tải hồ sơ:', e);
    } finally {
      setLoading(false);
    }
    // Poll unread notification count
    try {
      const nRes = await NotificationApi.getUnreadCount();
      const count = nRes.data?.data?.count ?? 0;
      setUnreadCount(Number(count));
    } catch {
      // ignore silently
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={{ color: Colors.textMuted }}>Không thể tải hồ sơ</Text>
      </SafeAreaView>
    );
  }

  const joinDate = profile.createdAt ? new Date(profile.createdAt) : new Date();
  const joinMonthYear = `T${joinDate.getMonth() + 1}/${joinDate.getFullYear()}`;
  const visibleSkills = skills.filter(s => s.status === 'VISIBLE');
  const activeRequests = requests.filter(r => r.status === 'SEARCHING' || r.status === 'ASSIGNED');

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cá nhân</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Bell icon với badge thông báo thực */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push('/notifications' as any)}
          >
            <Ionicons name="notifications-outline" size={24} color={Colors.textPrimary} />
            {unreadCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>
                  {unreadCount > 9 ? '9+' : String(unreadCount)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="settings-outline" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Avatar + Info */}
        <View style={styles.infoRow}>
          <View style={styles.avatarWrap}>
            {profile.avatarUrl ? (
              <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarBg]}>
                <Text style={styles.avatarLetter}>
                  {profile.fullName?.charAt(0).toUpperCase() ?? '?'}
                </Text>
              </View>
            )}
            <TouchableOpacity style={styles.editBadge} onPress={() => router.push('/profile/edit' as any)}>
              <Ionicons name="pencil" size={12} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{profile.fullName}</Text>
            <Text style={styles.subtext}>
              {profile.region ? `${profile.region} · ` : ''}Tham gia từ {joinMonthYear}
            </Text>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map(s => (
                <Ionicons
                  key={s}
                  name={s <= Math.round(profile.reputationScore) ? 'star' : 'star-outline'}
                  size={15}
                  color="#F59E0B"
                />
              ))}
              <Text style={styles.ratingText}>{profile.reputationScore?.toFixed(1) ?? '0.0'}</Text>
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {[
            { label: 'Số dư',   value: '-',                         color: Colors.primary },
            { label: 'Đã cho',  value: '-',                         color: '#3B82F6' },
            { label: 'Đã nhận', value: '-',                         color: '#F59E0B' },
            { label: 'Buổi học', value: String(profile.completedSessions ?? 0), color: '#8B5CF6' },
          ].map((stat, i, arr) => (
            <React.Fragment key={stat.label}>
              <View style={styles.statCell}>
                <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
              {i < arr.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        {/* Skills section */}
        <View style={styles.section}>
          {/* Kỹ năng chia sẻ */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Kỹ năng chia sẻ</Text>
            <TouchableOpacity onPress={() => router.push('/profile/skills' as any)}>
              <Text style={styles.actionLink}>Quản lý</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.chipWrap}>
            {visibleSkills.length > 0 ? (
              visibleSkills.map(skill => (
                <View key={skill.id} style={styles.chipBlue}>
                  <Text style={styles.chipBlueText}>{skill.name}</Text>
                </View>
              ))
            ) : (
              <TouchableOpacity
                style={styles.emptyChipHint}
                onPress={() => router.push('/(tabs)/post' as any)}
              >
                <Text style={styles.emptyChipText}>+ Thêm kỹ năng</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Muốn học */}
          <View style={[styles.sectionHeaderRow, { marginTop: Spacing.lg }]}>
            <Text style={styles.sectionTitle}>Muốn học</Text>
            <TouchableOpacity onPress={() => router.push('/profile/help-requests' as any)}>
              <Text style={styles.actionLink}>Quản lý</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.chipWrap}>
            {activeRequests.length > 0 ? (
              activeRequests.map(req => (
                <View key={req.id} style={styles.chipOrange}>
                  <Text style={styles.chipOrangeText}>{req.title || req.categoryName || 'Khác'}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyHint}>Chưa có dữ liệu</Text>
            )}
          </View>

          {/* Huy hiệu */}
          <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>Huy hiệu</Text>
          <View style={styles.badgeRow}>
            {[
              { emoji: '⭐', label: 'Người mới\nxuất sắc' },
              { emoji: '🤝', label: 'Người\nchia sẻ' },
              { emoji: '💎', label: 'Uy tín cao' },
            ].map(b => (
              <View key={b.label} style={styles.badgeCard}>
                <Text style={styles.badgeEmoji}>{b.emoji}</Text>
                <Text style={styles.badgeLabel}>{b.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Nghề nghiệp & Ngôn ngữ */}
        {(profile.occupation || profile.languages) && (
          <View style={styles.section}>
            {profile.occupation && (
              <>
                <Text style={styles.sectionTitle}>Nghề nghiệp</Text>
                <View style={styles.chipWrap}>
                  <View style={styles.chipBlue}>
                    <Text style={styles.chipBlueText}>{profile.occupation}</Text>
                  </View>
                </View>
              </>
            )}
            {profile.languages && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: Spacing.md }]}>Ngôn ngữ</Text>
                <View style={styles.chipWrap}>
                  <View style={styles.chipOrange}>
                    <Text style={styles.chipOrangeText}>{profile.languages}</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        )}

        {/* Menu Items (Theo ảnh 3) */}
        <View style={styles.menuSection}>
          <Text style={[styles.sectionTitle, { marginBottom: Spacing.md, marginTop: Spacing.sm }]}>Cài đặt & Tiện ích</Text>

          {/* Nhóm 1: Hoạt động & Uy tín */}
          {[
            { icon: 'wallet-outline', color: '#059669', bg: '#D1FAE5', label: 'Ví Time Credit' },
            { icon: 'book-outline', color: '#0284C7', bg: '#E0F2FE', label: 'Yêu cầu của tôi' },
            { icon: 'star-outline', color: '#D97706', bg: '#FFEDD5', label: 'Đánh giá & Uy tín' },
            { icon: 'people-outline', color: '#9333EA', bg: '#F3E8FF', label: 'Lời mời' },
          ].map(item => (
            <TouchableOpacity key={item.label} style={styles.menuItem} onPress={() => handleMenuPress(item.label)}>
              <View style={[styles.menuIconWrap, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}

          <View style={styles.menuDivider} />

          {/* Nhóm 2: Cài đặt tài khoản */}
          {[
            { icon: 'notifications-outline', color: '#EA580C', bg: '#FFEDD5', label: 'Thông báo' },
            { icon: 'lock-closed-outline', color: '#2563EB', bg: '#E0F2FE', label: 'Bảo mật' },
            { icon: 'eye-off-outline', color: '#64748B', bg: '#F1F5F9', label: 'Quyền riêng tư' },
          ].map(item => (
            <TouchableOpacity key={item.label} style={styles.menuItem} onPress={() => handleMenuPress(item.label)}>
              <View style={[styles.menuIconWrap, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}

          <View style={styles.menuDivider} />

          {/* Nhóm 3: Hỗ trợ & Khác */}
          {[
            { icon: 'help-circle-outline', color: '#10B981', bg: '#D1FAE5', label: 'Trợ giúp & FAQ' },
            { icon: 'document-text-outline', color: '#64748B', bg: '#F1F5F9', label: 'Điều khoản dịch vụ' },
          ].map(item => (
            <TouchableOpacity key={item.label} style={styles.menuItem} onPress={() => handleMenuPress(item.label)}>
              <View style={[styles.menuIconWrap, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}

          <View style={styles.menuDivider} />

          {/* Đăng xuất */}
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('Đăng xuất', true)}>
            <View style={[styles.menuIconWrap, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="log-out-outline" size={20} color="#DC2626" />
            </View>
            <Text style={[styles.menuLabel, { color: '#DC2626', fontWeight: 'bold' }]}>Đăng xuất</Text>
            <Ionicons name="chevron-forward" size={18} color="#FCA5A5" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center:       { flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  container:    { flex: 1, backgroundColor: '#fff' },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: '#fff' },
  headerTitle:  { fontSize: 24, fontWeight: 'bold', color: Colors.textPrimary },
  iconBtn:      { marginLeft: Spacing.md, position: 'relative' },
  content:      { paddingBottom: 40 },

  // Notification badge
  notifBadge: {
    position: 'absolute', top: -4, right: -6,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 4, borderWidth: 2, borderColor: '#fff',
  },
  notifBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

  // Avatar
  infoRow:      { flexDirection: 'row', paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, alignItems: 'center' },
  avatarWrap:   { position: 'relative', marginRight: Spacing.md },
  avatar:       { width: 78, height: 78, borderRadius: 39 },
  avatarBg:     { backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { color: '#fff', fontSize: 30, fontWeight: 'bold' },
  editBadge:    { position: 'absolute', bottom: 0, right: 0, backgroundColor: Colors.primary, width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },

  name:         { fontSize: 20, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 3 },
  subtext:      { fontSize: 13, color: Colors.textMuted, marginBottom: 6 },
  ratingRow:    { flexDirection: 'row', alignItems: 'center' },
  ratingText:   { marginLeft: 6, fontSize: 14, fontWeight: 'bold', color: Colors.textPrimary },

  // Stats
  statsRow:     { flexDirection: 'row', paddingVertical: Spacing.md, marginHorizontal: Spacing.md, borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md },
  statCell:     { flex: 1, alignItems: 'center' },
  statValue:    { fontSize: 18, fontWeight: 'bold', marginBottom: 3 },
  statLabel:    { fontSize: 12, color: Colors.textMuted },
  divider:      { width: 1, backgroundColor: Colors.border, marginVertical: 4 },

  // Section
  section:          { paddingHorizontal: Spacing.md, marginBottom: Spacing.md },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  sectionTitle:     { fontSize: 16, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: Spacing.sm },
  actionLink:       { color: Colors.secondary, fontWeight: '600', fontSize: 14 },

  chipWrap:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chipBlue:      { backgroundColor: '#E0F2FE', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: '#BAE6FD' },
  chipBlueText:  { color: '#0369A1', fontWeight: '500', fontSize: 13 },
  chipOrange:    { backgroundColor: '#FFF7ED', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: '#FFEDD5' },
  chipOrangeText:{ color: '#C2410C', fontWeight: '500', fontSize: 13 },

  emptyChipHint: { borderStyle: 'dashed', borderWidth: 1, borderColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  emptyChipText: { color: Colors.primary, fontWeight: '500', fontSize: 13 },
  emptyHint:     { color: Colors.textMuted, fontStyle: 'italic', fontSize: 13 },

  // Badges
  badgeRow:     { flexDirection: 'row', gap: 12 },
  badgeCard:    { alignItems: 'center', backgroundColor: '#FAFAFA', borderRadius: Radius.lg, padding: Spacing.md, flex: 1, borderWidth: 1, borderColor: Colors.border },
  badgeEmoji:   { fontSize: 28, marginBottom: 6 },
  badgeLabel:   { fontSize: 12, color: Colors.textMuted, textAlign: 'center', lineHeight: 16 },

  // Menu
  menuSection:  { paddingHorizontal: Spacing.md, marginBottom: Spacing.xl, marginTop: Spacing.md },
  menuItem:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: Spacing.md, borderRadius: Radius.lg, marginBottom: 8, borderWidth: 1, borderColor: '#F1F5F9' },
  menuIconWrap: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  menuLabel:    { flex: 1, fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  menuDivider:  { height: 1, backgroundColor: Colors.border, marginVertical: 8 },
});

