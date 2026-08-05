import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '@constants/Colors';
import RatingApi, { RatingItem, RatingSummary } from '@api/rating';

// ── Helpers ──────────────────────────────────────────────────────────────────

function StarRow({ score, size = 16 }: { score: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Ionicons
          key={s}
          name={s <= score ? 'star' : 'star-outline'}
          size={size}
          color="#F59E0B"
        />
      ))}
    </View>
  );
}

function Avatar({ uri, name, size = 44 }: { uri?: string; name: string; size?: number }) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text style={{ color: '#fff', fontSize: size * 0.4, fontWeight: '700' }}>
        {name?.charAt(0).toUpperCase() ?? '?'}
      </Text>
    </View>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

// ── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({ summary }: { summary: RatingSummary }) {
  const stars = Math.round(summary.averageScore);
  return (
    <View style={styles.summaryCard}>
      {/* Tiêu đề */}
      <Text style={styles.summaryTitle}>Thống kê uy tín của tôi</Text>

      {/* Điểm nổi bật */}
      <View style={styles.summaryMain}>
        <Text style={styles.summaryBigScore}>
          {summary.averageScore.toFixed(1)}
        </Text>
        <View style={{ gap: 4 }}>
          <StarRow score={stars} size={20} />
          <Text style={styles.summaryTotalText}>
            {summary.totalRatings} đánh giá
          </Text>
        </View>
      </View>

      {/* Chỉ số */}
      <View style={styles.summaryStats}>
        <View style={styles.summaryStatItem}>
          <Text style={[styles.summaryStatValue, { color: '#3B82F6' }]}>
            {summary.reputationScore.toFixed(0)}
          </Text>
          <Text style={styles.summaryStatLabel}>Điểm uy tín</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryStatItem}>
          <Text style={[styles.summaryStatValue, { color: '#10B981' }]}>
            {summary.completedSessions}
          </Text>
          <Text style={styles.summaryStatLabel}>Buổi hoàn thành</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryStatItem}>
          <Text style={[styles.summaryStatValue, { color: '#EF4444' }]}>
            {Math.round(summary.cancelRate * 100)}%
          </Text>
          <Text style={styles.summaryStatLabel}>Tỷ lệ hủy</Text>
        </View>
      </View>
    </View>
  );
}

// ── Rating Item Card ──────────────────────────────────────────────────────────

function RatingCard({ item }: { item: RatingItem }) {
  return (
    <View style={styles.card}>
      <Avatar uri={item.fromUserAvatar} name={item.fromUserName} size={44} />
      <View style={{ flex: 1 }}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardName} numberOfLines={1}>
            {item.fromUserName}
          </Text>
          <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
        </View>
        <StarRow score={item.score} size={14} />
        {!!item.comment && (
          <Text style={styles.cardComment} numberOfLines={3}>
            {item.comment}
          </Text>
        )}
      </View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function RatingScreen() {
  const router = useRouter();
  const [summary, setSummary] = useState<RatingSummary | null>(null);
  const [ratings, setRatings] = useState<RatingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [summaryRes, ratingsRes] = await Promise.all([
        RatingApi.getMySummary(),
        RatingApi.getMyRatings(),
      ]);
      setSummary(summaryRes.data.data);
      setRatings(ratingsRes.data.data ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const renderHeader = () => (
    <>
      {summary && <SummaryCard summary={summary} />}
      <Text style={styles.listTitle}>
        Đánh giá nhận được {ratings.length > 0 ? `(${ratings.length})` : ''}
      </Text>
    </>
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

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={52} color={Colors.textMuted} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={ratings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <RatingCard item={item} />}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="star-outline" size={52} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>Chưa có đánh giá nào</Text>
              <Text style={styles.emptySubtitle}>
                Hoàn thành các buổi hỗ trợ để nhận đánh giá từ người khác.
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn:     { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },

  // Summary card
  summaryCard: {
    margin: Spacing.md,
    padding: Spacing.lg,
    backgroundColor: '#fff',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  summaryMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  summaryBigScore: {
    fontSize: 52,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 56,
  },
  summaryTotalText: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
  },
  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.lg,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryStatItem:  { flex: 1, alignItems: 'center', gap: 3 },
  summaryDivider:   { width: 1, height: 30, backgroundColor: '#E2E8F0' },
  summaryStatValue: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  summaryStatLabel: { fontSize: 11, color: Colors.textMuted },

  // List
  listTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginHorizontal: Spacing.md,
    marginBottom: 8,
    marginTop: 4,
  },
  listContent: { paddingBottom: 40 },

  // Rating card
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#fff',
    marginHorizontal: Spacing.md,
    marginBottom: 10,
    padding: 14,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  cardName:    { fontSize: 14, fontWeight: '700', color: '#0F172A', flex: 1 },
  cardDate:    { fontSize: 12, color: Colors.textMuted },
  cardComment: { fontSize: 13, color: Colors.textSecondary, marginTop: 6, lineHeight: 19 },

  // Empty state
  emptyBox: {
    paddingTop: 60,
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyTitle:    { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  emptySubtitle: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 21 },

  // Error
  errorText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: 40 },
  retryBtn:  { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: Radius.lg },
  retryText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
