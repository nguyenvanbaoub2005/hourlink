import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '@constants/Colors';
import UserApi from '@api/user';
import type { UserResponse } from '@types';

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await UserApi.getMyProfile();
      setProfile(res.data.data);
    } catch (error) {
      console.log('Lỗi lấy profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={{ color: Colors.textSecondary }}>Không thể tải hồ sơ</Text>
      </SafeAreaView>
    );
  }

  const joinDate = profile.createdAt ? new Date(profile.createdAt) : new Date();
  const joinMonthYear = `T${joinDate.getMonth() + 1}/${joinDate.getFullYear()}`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cá nhân</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="settings-outline" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Basic Info */}
        <View style={styles.infoSection}>
          <View style={styles.avatarContainer}>
            {profile.avatarUrl ? (
              <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitial}>
                  {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
            )}
            <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/profile/edit' as any)}>
              <Ionicons name="pencil" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.infoTextContainer}>
            <Text style={styles.name}>{profile.fullName}</Text>
            <Text style={styles.subtext}>
              {profile.region ? `${profile.region} · ` : ''}Tham gia từ {joinMonthYear}
            </Text>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map(star => (
                <Ionicons 
                  key={star} 
                  name={star <= Math.round(profile.reputationScore) ? "star" : "star-outline"} 
                  size={16} 
                  color="#F59E0B" 
                />
              ))}
              <Text style={styles.ratingValue}>{profile.reputationScore.toFixed(1)}</Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: Colors.primary }]}>-</Text>
            <Text style={styles.statLabel}>Số dư</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: '#3B82F6' }]}>-</Text>
            <Text style={styles.statLabel}>Đã cho</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>-</Text>
            <Text style={styles.statLabel}>Đã nhận</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: '#8B5CF6' }]}>{profile.completedSessions}</Text>
            <Text style={styles.statLabel}>Buổi học</Text>
          </View>
        </View>

        {/* Links / Menus */}
        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.menuIcon, { backgroundColor: '#E0F2FE' }]}>
              <Ionicons name="wallet-outline" size={20} color="#0284C7" />
            </View>
            <Text style={styles.menuText}>Ví Time Credit</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.menuIcon, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="book-outline" size={20} color="#9333EA" />
            </View>
            <Text style={styles.menuText}>Yêu cầu của tôi</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Nghề nghiệp và Ngôn ngữ */}
        {(profile.occupation || profile.languages) && (
          <View style={styles.chipsSection}>
            {profile.occupation && (
              <View style={styles.chipSectionContainer}>
                <Text style={styles.sectionTitle}>Nghề nghiệp</Text>
                <View style={styles.chipRow}>
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>{profile.occupation}</Text>
                  </View>
                </View>
              </View>
            )}
            
            {profile.languages && (
              <View style={styles.chipSectionContainer}>
                <Text style={styles.sectionTitle}>Ngôn ngữ</Text>
                <View style={styles.chipRow}>
                  <View style={[styles.chip, styles.chipAlt]}>
                    <Text style={[styles.chipText, styles.chipAltText]}>{profile.languages}</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: '#fff',
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.textPrimary },
  headerIcons: { flexDirection: 'row' },
  iconBtn: { marginLeft: Spacing.md },
  content: { paddingBottom: Spacing.xl },
  
  infoSection: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    alignItems: 'center'
  },
  avatarContainer: { position: 'relative', marginRight: Spacing.md },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarPlaceholder: { backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  editBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff'
  },
  infoTextContainer: { flex: 1, justifyContent: 'center' },
  name: { fontSize: 20, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 4 },
  subtext: { fontSize: 13, color: Colors.textSecondary, marginBottom: 6 },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingValue: { marginLeft: 6, fontSize: 14, fontWeight: 'bold', color: Colors.textPrimary },
  
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg
  },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  statLabel: { fontSize: 12, color: Colors.textSecondary },
  statDivider: { width: 1, backgroundColor: Colors.border, marginVertical: 4 },
  
  menuContainer: { marginHorizontal: Spacing.md, marginBottom: Spacing.lg },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md
  },
  menuText: { flex: 1, fontSize: 16, fontWeight: '500', color: Colors.textPrimary },
  
  chipsSection: { paddingHorizontal: Spacing.md },
  chipSectionContainer: { marginBottom: Spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: Spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#BAE6FD'
  },
  chipText: { color: '#0369A1', fontWeight: '500' },
  chipAlt: { backgroundColor: '#FFF7ED', borderColor: '#FFEDD5' },
  chipAltText: { color: '#C2410C' }
});
