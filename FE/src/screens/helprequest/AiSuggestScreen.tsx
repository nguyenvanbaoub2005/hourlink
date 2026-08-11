import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AiMatchingApi, { type AiRecommendationResponse } from '@api/aimatching';
import Avatar from '@components/Avatar';
import { Colors, Radius, Spacing } from '@constants/Colors';

export default function AiSuggestScreen() {
  const params = useLocalSearchParams<{ helpRequestId?: string | string[] }>();
  const helpRequestId = Array.isArray(params.helpRequestId)
    ? params.helpRequestId[0]
    : params.helpRequestId;
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<AiRecommendationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async () => {
    if (!helpRequestId) {
      setRecommendations([]);
      setError('Không tìm thấy yêu cầu cần phân tích. Vui lòng mở AI gợi ý từ một yêu cầu đang hoạt động.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await AiMatchingApi.getRecommendations(helpRequestId);
      setRecommendations(response.data?.data ?? []);
    } catch (fetchError: any) {
      const status = fetchError?.response?.status;
      const serverMessage = fetchError?.response?.data?.message;
      const unavailable = !status || status >= 500;

      setRecommendations([]);
      setError(
        serverMessage
        ?? (unavailable
          ? 'Dịch vụ AI chưa sẵn sàng. Hãy kiểm tra máy chủ AI rồi thử lại sau ít phút.'
          : 'AI chưa thể phân tích yêu cầu này. Vui lòng kiểm tra thông tin yêu cầu và thử lại.'),
      );
    } finally {
      setLoading(false);
    }
  }, [helpRequestId]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const renderItem = ({ item, index }: { item: AiRecommendationResponse; index: number }) => {
    const helperId = item.helper?.id;
    const helperName = item.helper?.fullName || 'Người hỗ trợ chưa cập nhật tên';
    const skillId = item.skill?.id;
    const skillName = item.skill?.name;
    const canInvite = Boolean(helperId && skillId);
    const matchPercentage = Math.max(0, Math.min(100, Math.round(Number(item.matchPercentage) || 0)));
    const reasons = Array.isArray(item.reasons) ? item.reasons.filter(Boolean) : [];

    return (
      <View style={styles.card}>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>#{index + 1}</Text>
        </View>

        <View style={styles.cardHeader}>
          <Avatar uri={item.helper?.avatarUrl} name={helperName} size={52} />
          <View style={styles.helperInfo}>
            <Text style={styles.helperName} numberOfLines={1}>{helperName}</Text>
            <View style={styles.skillRow}>
              <Ionicons name="school-outline" size={14} color="#64748B" />
              <Text style={styles.skillName} numberOfLines={1}>
                {skillName || 'Chưa xác định kỹ năng'}
              </Text>
            </View>
          </View>
          <View style={styles.matchBadge}>
            <Ionicons name="sparkles" size={13} color="#047857" />
            <Text style={styles.matchText}>{matchPercentage}%</Text>
          </View>
        </View>

        <View style={styles.matchTrack}>
          <View style={[styles.matchProgress, { width: `${matchPercentage}%` }]} />
        </View>

        <View style={styles.reasonsContainer}>
          <View style={styles.reasonsHeader}>
            <Ionicons name="bulb-outline" size={17} color="#0F766E" />
            <Text style={styles.reasonsTitle}>Vì sao phù hợp?</Text>
          </View>
          {reasons.length > 0 ? reasons.map((reason, reasonIndex) => (
            <View key={`${reason}-${reasonIndex}`} style={styles.reasonRow}>
              <View style={styles.reasonCheck}>
                <Ionicons name="checkmark" size={11} color="#047857" />
              </View>
              <Text style={styles.reasonItem}>{reason}</Text>
            </View>
          )) : (
            <Text style={styles.reasonFallback}>AI đánh giá dựa trên kỹ năng và thông tin của yêu cầu.</Text>
          )}
        </View>

        {!canInvite && (
          <View style={styles.missingInfoRow}>
            <Ionicons name="information-circle-outline" size={16} color="#B45309" />
            <Text style={styles.missingInfoText}>Hồ sơ này chưa đủ thông tin để gửi lời mời.</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.inviteButton, !canInvite && styles.inviteButtonDisabled]}
          disabled={!canInvite}
          activeOpacity={0.8}
          onPress={() => router.push({
            pathname: '/profile/send-invitation',
            params: {
              receiverId: helperId,
              receiverName: helperName,
              skillId,
              skillName,
              helpRequestId,
            },
          })}
          accessibilityRole="button"
          accessibilityLabel={`Gửi lời mời hỗ trợ đến ${helperName}`}
        >
          <Ionicons name={canInvite ? 'send-outline' : 'lock-closed-outline'} size={17} color={canInvite ? '#FFFFFF' : '#94A3B8'} />
          <Text style={[styles.inviteButtonText, !canInvite && styles.inviteButtonTextDisabled]}>
            {canInvite ? 'Gửi lời mời hỗ trợ' : 'Chưa thể gửi lời mời'}
          </Text>
          {canInvite && <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
        >
          <Ionicons name="chevron-back" size={25} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>AI gợi ý người hỗ trợ</Text>
          <Text style={styles.headerSubtitle}>Ghép nối thông minh cho yêu cầu của bạn</Text>
        </View>
        <View style={styles.headerButtonPlaceholder} />
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <View style={styles.loadingIcon}>
            <Ionicons name="sparkles" size={30} color="#0F766E" />
          </View>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.stateTitle}>AI đang tìm người phù hợp</Text>
          <Text style={styles.stateDescription}>Đang so khớp kỹ năng, lịch rảnh và mức độ uy tín...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <View style={styles.errorIcon}>
            <Ionicons name="cloud-offline-outline" size={34} color="#B45309" />
          </View>
          <Text style={styles.stateTitle}>Chưa thể dùng AI lúc này</Text>
          <Text style={styles.stateDescription}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchSuggestions}>
            <Ionicons name="refresh" size={17} color="#FFFFFF" />
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
            <Text style={styles.secondaryButtonText}>Quay lại yêu cầu</Text>
          </TouchableOpacity>
        </View>
      ) : recommendations.length === 0 ? (
        <View style={styles.centerState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="people-outline" size={34} color="#0D9488" />
          </View>
          <Text style={styles.stateTitle}>Chưa có người phù hợp</Text>
          <Text style={styles.stateDescription}>
            AI đã kiểm tra nhưng chưa tìm thấy kỹ năng phù hợp. Bạn có thể thử lại khi cộng đồng có thêm người hỗ trợ.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchSuggestions}>
            <Ionicons name="sparkles-outline" size={17} color="#FFFFFF" />
            <Text style={styles.retryText}>Tìm lại</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
            <Text style={styles.secondaryButtonText}>Quay lại yêu cầu</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={recommendations}
          keyExtractor={(item, index) => `${item.helper?.id ?? 'helper'}-${item.skill?.id ?? 'skill'}-${index}`}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ListHeaderComponent={(
            <View style={styles.resultSummary}>
              <View style={styles.resultSummaryIcon}>
                <Ionicons name="checkmark-circle" size={22} color="#047857" />
              </View>
              <View style={styles.resultSummaryContent}>
                <Text style={styles.resultSummaryTitle}>Đã tìm thấy {recommendations.length} gợi ý</Text>
                <Text style={styles.resultSummaryText}>Danh sách được xếp theo mức độ phù hợp cao nhất.</Text>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  headerButton: {
    width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0',
  },
  headerButtonPlaceholder: { width: 40, height: 40 },
  headerText: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  headerTitle: { color: '#0F172A', fontSize: 17, fontWeight: '900' },
  headerSubtitle: { color: '#64748B', fontSize: 10, marginTop: 2 },
  centerState: {
    flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32,
  },
  loadingIcon: {
    width: 68, height: 68, borderRadius: 23, backgroundColor: '#D1FAE5',
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  errorIcon: {
    width: 68, height: 68, borderRadius: 23, backgroundColor: '#FFF7ED',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyIcon: {
    width: 68, height: 68, borderRadius: 23, backgroundColor: '#CCFBF1',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  stateTitle: { color: '#0F172A', fontSize: 19, fontWeight: '900', marginTop: 14, textAlign: 'center' },
  stateDescription: {
    color: '#64748B', fontSize: 14, lineHeight: 21, marginTop: 8, textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#0F766E',
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 13, marginTop: 20,
  },
  retryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  secondaryButton: { paddingHorizontal: 18, paddingVertical: 10, marginTop: 5 },
  secondaryButtonText: { color: '#0F766E', fontSize: 13, fontWeight: '700' },
  list: { padding: Spacing.md, paddingBottom: 32 },
  resultSummary: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5',
    borderWidth: 1, borderColor: '#A7F3D0', borderRadius: Radius.lg,
    padding: 13, marginBottom: 13,
  },
  resultSummaryIcon: {
    width: 40, height: 40, borderRadius: 13, backgroundColor: '#D1FAE5',
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  resultSummaryContent: { flex: 1 },
  resultSummaryTitle: { color: '#065F46', fontSize: 14, fontWeight: '900' },
  resultSummaryText: { color: '#047857', fontSize: 11, marginTop: 3 },
  card: {
    position: 'relative', backgroundColor: '#FFFFFF', borderRadius: Radius.xl,
    padding: 16, marginBottom: 13, borderWidth: 1, borderColor: '#DCE7E5',
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  rankBadge: {
    position: 'absolute', top: -1, left: -1, backgroundColor: '#0F766E',
    minWidth: 34, height: 25, borderTopLeftRadius: Radius.xl, borderBottomRightRadius: 12,
    alignItems: 'center', justifyContent: 'center', zIndex: 1,
  },
  rankText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 9 },
  helperInfo: { flex: 1, marginLeft: 11, marginRight: 8 },
  helperName: { color: '#0F172A', fontSize: 16, fontWeight: '900' },
  skillRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  skillName: { flex: 1, color: '#64748B', fontSize: 12, fontWeight: '600' },
  matchBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#D1FAE5',
    paddingHorizontal: 9, paddingVertical: 6, borderRadius: Radius.full,
  },
  matchText: { color: '#047857', fontWeight: '900', fontSize: 13 },
  matchTrack: {
    height: 5, backgroundColor: '#E2E8F0', borderRadius: Radius.full,
    overflow: 'hidden', marginTop: 14,
  },
  matchProgress: { height: '100%', backgroundColor: '#10B981', borderRadius: Radius.full },
  reasonsContainer: {
    backgroundColor: '#F8FAFC', padding: 12, borderRadius: 13, marginTop: 13,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  reasonsHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 9 },
  reasonsTitle: { color: '#0F172A', fontSize: 13, fontWeight: '800' },
  reasonRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  reasonCheck: {
    width: 18, height: 18, borderRadius: 9, backgroundColor: '#D1FAE5',
    alignItems: 'center', justifyContent: 'center', marginRight: 7, marginTop: 1,
  },
  reasonItem: { flex: 1, color: '#475569', fontSize: 13, lineHeight: 19 },
  reasonFallback: { color: '#64748B', fontSize: 13, lineHeight: 19 },
  missingInfoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFFBEB',
    padding: 9, borderRadius: 10, marginTop: 10,
  },
  missingInfoText: { flex: 1, color: '#92400E', fontSize: 11, lineHeight: 16 },
  inviteButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: '#0F766E', paddingVertical: 12, borderRadius: 12, marginTop: 12,
  },
  inviteButtonDisabled: { backgroundColor: '#E2E8F0' },
  inviteButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  inviteButtonTextDisabled: { color: '#94A3B8' },
});
