import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Radius, Spacing } from '@constants/Colors';
import RatingApi from '@api/rating';
import UserApi from '@api/user';
import { useAuthStore } from '@store/authStore';
import type { RatingResponse, BadgeResponse, UserResponse } from '@types';
import Avatar from '@components/Avatar';

export default function ReputationScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [profile, setProfile] = useState<UserResponse | null>(null);
  const [ratings, setRatings] = useState<RatingResponse[]>([]);
  const [badges, setBadges] = useState<BadgeResponse[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'RATINGS' | 'BADGES'>('RATINGS');

  const fetchData = async () => {
    if (!user) return;
    try {
      const [profRes, ratRes, badgRes] = await Promise.all([
        UserApi.getMyProfile(),
        RatingApi.getRatingsReceived(user.id, 0, 50),
        RatingApi.getUserBadges(user.id),
      ]);
      setProfile(profRes.data?.data || null);
      setRatings(ratRes.data?.data?.content || []);
      setBadges(badgRes.data?.data || []);
    } catch (e) {
      console.error('Error fetching reputation data', e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  const renderRating = ({ item }: { item: RatingResponse }) => (
    <View style={styles.ratingCard}>
      <View style={styles.ratingHeader}>
        <Avatar uri={item.reviewerAvatarUrl} name={item.reviewerName} size={40} />
        <View style={styles.ratingInfo}>
          <Text style={styles.reviewerName}>{item.reviewerName}</Text>
          <Text style={styles.ratingDate}>
            {new Date(item.createdAt).toLocaleDateString('vi-VN')}
          </Text>
        </View>
        <View style={styles.starsWrap}>
          {[1, 2, 3, 4, 5].map(s => (
            <Ionicons
              key={s}
              name={s <= item.overallStars ? 'star' : 'star-outline'}
              size={14}
              color="#F59E0B"
            />
          ))}
        </View>
      </View>
      {item.comment ? (
        <Text style={styles.ratingComment}>"{item.comment}"</Text>
      ) : (
        <Text style={[styles.ratingComment, { color: Colors.textMuted, fontStyle: 'italic' }]}>
          Không có nhận xét
        </Text>
      )}
    </View>
  );

  const renderBadge = ({ item }: { item: BadgeResponse }) => (
    <View style={styles.badgeCard}>
      <View style={styles.badgeIconWrap}>
        <Text style={styles.badgeEmoji}>{item.iconUrl || '🏆'}</Text>
      </View>
      <View style={styles.badgeInfo}>
        <Text style={styles.badgeName}>{item.name}</Text>
        <Text style={styles.badgeDesc}>{item.description}</Text>
        {item.awardedAt && (
          <Text style={styles.badgeDate}>
            Đạt được: {new Date(item.awardedAt).toLocaleDateString('vi-VN')}
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đánh giá & Uy tín</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={activeTab === 'RATINGS' ? ratings : badges}
        keyExtractor={item => item.id}
        renderItem={activeTab === 'RATINGS' ? (renderRating as any) : (renderBadge as any)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Overview Card */}
            <View style={styles.overviewCard}>
              <Text style={styles.overviewLabel}>ĐIỂM UY TÍN HIỆN TẠI</Text>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreText}>
                  {profile?.reputationScore?.toFixed(1) || '0.0'}
                </Text>
                <Text style={styles.scoreMax}>/ 5.0</Text>
              </View>
              <View style={styles.starsRowOverview}>
                {[1, 2, 3, 4, 5].map(s => (
                  <Ionicons
                    key={s}
                    name={s <= Math.round(profile?.reputationScore || 0) ? 'star' : 'star-outline'}
                    size={24}
                    color="#F59E0B"
                  />
                ))}
              </View>
              <Text style={styles.overviewSub}>
                Dựa trên {ratings.length} đánh giá
              </Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'RATINGS' && styles.tabActive]}
                onPress={() => setActiveTab('RATINGS')}
              >
                <Text style={[styles.tabText, activeTab === 'RATINGS' && styles.tabTextActive]}>
                  Đánh giá ({ratings.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'BADGES' && styles.tabActive]}
                onPress={() => setActiveTab('BADGES')}
              >
                <Text style={[styles.tabText, activeTab === 'BADGES' && styles.tabTextActive]}>
                  Huy hiệu ({badges.length})
                </Text>
              </TouchableOpacity>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name={activeTab === 'RATINGS' ? 'chatbubble-ellipses-outline' : 'medal-outline'}
              size={64}
              color={Colors.border}
            />
            <Text style={styles.emptyText}>
              Chưa có {activeTab === 'RATINGS' ? 'đánh giá' : 'huy hiệu'} nào
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bgScreen },
  container: { flex: 1, backgroundColor: Colors.bgScreen },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  listContent: { padding: Spacing.md, gap: Spacing.md },

  // Overview
  overviewCard: {
    backgroundColor: '#fff',
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: Spacing.md,
  },
  overviewLabel: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, letterSpacing: 1, marginBottom: 8 },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
  scoreText: { fontSize: 48, fontWeight: '800', color: Colors.textPrimary },
  scoreMax: { fontSize: 20, fontWeight: '600', color: Colors.textMuted, marginLeft: 4 },
  starsRowOverview: { flexDirection: 'row', gap: 4, marginBottom: 12 },
  overviewSub: { fontSize: 14, color: Colors.textSecondary },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: Radius.lg,
    padding: 4,
    marginBottom: Spacing.sm,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: Radius.md,
  },
  tabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary },

  // Empty
  emptyContainer: { alignItems: 'center', paddingVertical: Spacing.xl * 2 },
  emptyText: { fontSize: 15, color: Colors.textMuted, marginTop: 12 },

  // Rating item
  ratingCard: {
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  ratingHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  ratingInfo: { flex: 1, marginLeft: 10 },
  reviewerName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  ratingDate: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  starsWrap: { flexDirection: 'row' },
  ratingComment: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },

  // Badge item
  badgeCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
    alignItems: 'center',
  },
  badgeIconWrap: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: '#FEF3C7',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  badgeEmoji: { fontSize: 24 },
  badgeInfo: { flex: 1 },
  badgeName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  badgeDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  badgeDate: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
});
