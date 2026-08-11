import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import HelpRequestApi, { type HelpRequestResponse } from '@api/helprequest';
import { Colors, Radius, Spacing } from '@constants/Colors';
import { formatDateTimeVi } from '@utils/dateTime';

const getStatusMeta = (status: string) => {
  if (status === 'ASSIGNED') {
    return {
      label: 'Đã kết nối người hỗ trợ',
      icon: 'people-outline',
      background: '#D1FAE5',
      color: '#047857',
    } as const;
  }

  if (status === 'COMPLETED') {
    return {
      label: 'Đã hoàn thành',
      icon: 'checkmark-circle-outline',
      background: '#DCFCE7',
      color: '#15803D',
    } as const;
  }

  if (status === 'CANCELLED') {
    return {
      label: 'Đã hủy',
      icon: 'close-circle-outline',
      background: '#F1F5F9',
      color: '#64748B',
    } as const;
  }

  return {
    label: 'Đang tìm người hỗ trợ',
    icon: 'search-outline',
    background: '#FEF3C7',
    color: '#B45309',
  } as const;
};

const getFormatMeta = (format?: string) => {
  if (format === 'OFFLINE') return { label: 'Trực tiếp', icon: 'people-outline' } as const;
  if (format === 'BOTH') return { label: 'Trực tuyến hoặc trực tiếp', icon: 'git-compare-outline' } as const;
  return { label: 'Trực tuyến', icon: 'videocam-outline' } as const;
};

export default function HelpRequestDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const requestId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [request, setRequest] = useState<HelpRequestResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRequest = useCallback(async (isRefresh = false) => {
    if (!requestId) {
      setError('Không tìm thấy mã yêu cầu để hiển thị.');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const response = await HelpRequestApi.getMyRequests();
      const requests = response.data?.data ?? [];
      const selectedRequest = requests.find(item => String(item.id) === String(requestId));

      if (!selectedRequest) {
        setRequest(null);
        setError('Yêu cầu này không còn tồn tại hoặc bạn không có quyền xem.');
        return;
      }

      setRequest(selectedRequest);
    } catch (fetchError: any) {
      setRequest(null);
      setError(fetchError?.response?.data?.message ?? 'Không thể tải chi tiết yêu cầu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [requestId]);

  useFocusEffect(
    useCallback(() => {
      fetchRequest();
    }, [fetchRequest]),
  );

  const openAiSuggestions = () => {
    if (!request?.id) return;
    router.push({
      pathname: '/profile/ai-suggest',
      params: { helpRequestId: request.id },
    });
  };

  const editRequest = () => {
    if (!request) return;
    router.push({
      pathname: '/(tabs)/post' as any,
      params: {
        editId: request.id,
        editType: 'needHelp',
        initialData: JSON.stringify(request),
      },
    });
  };

  const deleteRequest = async () => {
    if (!request || deleting) return;

    setDeleting(true);
    try {
      await HelpRequestApi.deleteRequest(request.id);
      router.replace('/profile/help-requests' as any);
      Alert.alert('Đã xóa yêu cầu', 'Yêu cầu đã được gỡ khỏi danh sách của bạn.');
    } catch (deleteError: any) {
      const status = deleteError?.response?.status;
      const serverMessage = deleteError?.response?.data?.message;

      if (status === 404) {
        router.replace('/profile/help-requests' as any);
        Alert.alert('Danh sách đã được cập nhật', 'Yêu cầu này không còn tồn tại.');
      } else if (!deleteError?.response) {
        Alert.alert('Không thể xóa yêu cầu', 'Không thể kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại.');
      } else if (status === 403) {
        Alert.alert('Không thể xóa yêu cầu', 'Bạn không có quyền thay đổi yêu cầu này.');
      } else if (status >= 500) {
        Alert.alert('Không thể xóa yêu cầu', 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.');
      } else {
        Alert.alert('Không thể xóa yêu cầu', serverMessage || 'Vui lòng thử lại.');
      }
    } finally {
      setDeleting(false);
    }
  };

  const confirmDelete = () => {
    if (!request || deleting) return;

    Alert.alert(
      'Xóa yêu cầu',
      'Yêu cầu sẽ không còn hiển thị trong danh sách của bạn. Lịch sử lời mời và lịch hẹn liên quan vẫn được giữ để đối soát.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa yêu cầu',
          style: 'destructive',
          onPress: () => void deleteRequest(),
        },
      ],
    );
  };

  const statusMeta = getStatusMeta(request?.status ?? 'SEARCHING');
  const formatMeta = getFormatMeta(request?.format);
  const canUseAi = request?.status === 'SEARCHING' || request?.status === 'ASSIGNED';
  const duration = request?.duration || 60;
  const timeCredit = request?.timeCreditAmount ?? Number((duration / 60).toFixed(1));

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
        <Text style={styles.headerTitle}>Chi tiết yêu cầu</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.push('/profile/help-requests' as any)}
          accessibilityRole="button"
          accessibilityLabel="Xem tất cả yêu cầu"
        >
          <Ionicons name="list-outline" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.stateDescription}>Đang tải yêu cầu...</Text>
        </View>
      ) : error || !request ? (
        <View style={styles.centerState}>
          <View style={styles.stateIconError}>
            <Ionicons name="alert-circle-outline" size={34} color="#DC2626" />
          </View>
          <Text style={styles.stateTitle}>Không thể mở yêu cầu</Text>
          <Text style={styles.stateDescription}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchRequest()}>
            <Ionicons name="refresh" size={17} color="#FFFFFF" />
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={(
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchRequest(true)}
              tintColor={Colors.primary}
            />
          )}
        >
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={[styles.statusBadge, { backgroundColor: statusMeta.background }]}>
                <Ionicons name={statusMeta.icon} size={15} color={statusMeta.color} />
                <Text style={[styles.statusText, { color: statusMeta.color }]}>{statusMeta.label}</Text>
              </View>
              {request.categoryName ? (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText} numberOfLines={1}>{request.categoryName}</Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.title}>{request.title}</Text>
            <Text style={styles.description}>
              {request.description || 'Yêu cầu này chưa có phần mô tả chi tiết.'}
            </Text>

            {request.createdAt ? (
              <View style={styles.createdRow}>
                <Ionicons name="calendar-clear-outline" size={14} color="#64748B" />
                <Text style={styles.createdText}>Đăng lúc {formatDateTimeVi(request.createdAt)}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.metricRow}>
            <View style={styles.metricCard}>
              <View style={[styles.metricIcon, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="time-outline" size={20} color="#2563EB" />
              </View>
              <Text style={styles.metricValue}>{duration}</Text>
              <Text style={styles.metricLabel}>phút</Text>
            </View>
            <View style={styles.metricCard}>
              <View style={[styles.metricIcon, { backgroundColor: '#FFF7ED' }]}>
                <Ionicons name="hourglass-outline" size={20} color="#EA580C" />
              </View>
              <Text style={styles.metricValue}>{Number(Number(timeCredit).toFixed(1))}</Text>
              <Text style={styles.metricLabel}>Time Credit</Text>
            </View>
            <View style={styles.metricCard}>
              <View style={[styles.metricIcon, { backgroundColor: '#F0FDFA' }]}>
                <Ionicons name="chatbubble-ellipses-outline" size={20} color="#0D9488" />
              </View>
              <Text style={styles.metricValue}>{request.responseCount ?? 0}</Text>
              <Text style={styles.metricLabel}>phản hồi</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.sectionHeading}>Thông tin hỗ trợ</Text>
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Ionicons name={formatMeta.icon} size={19} color="#0F766E" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Hình thức</Text>
                <Text style={styles.infoValue}>{formatMeta.label}</Text>
              </View>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Ionicons name="calendar-outline" size={19} color="#0F766E" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Thời gian mong muốn</Text>
                <Text style={styles.infoValue}>{request.desiredTime || 'Có thể trao đổi sau'}</Text>
              </View>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Ionicons name="location-outline" size={19} color="#0F766E" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Khu vực</Text>
                <Text style={styles.infoValue}>{request.region || 'Không giới hạn khu vực'}</Text>
              </View>
            </View>
            {request.currentLevel ? (
              <>
                <View style={styles.infoDivider} />
                <View style={styles.infoItem}>
                  <View style={styles.infoIcon}>
                    <Ionicons name="school-outline" size={19} color="#0F766E" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Trình độ hiện tại</Text>
                    <Text style={styles.infoValue}>{request.currentLevel}</Text>
                  </View>
                </View>
              </>
            ) : null}
          </View>

          {canUseAi && (
            <TouchableOpacity
              style={styles.aiCard}
              activeOpacity={0.82}
              onPress={openAiSuggestions}
              accessibilityRole="button"
              accessibilityLabel="Xem người hỗ trợ do AI gợi ý"
            >
              <View style={styles.aiIcon}>
                <Ionicons name="sparkles" size={24} color="#047857" />
              </View>
              <View style={styles.aiContent}>
                <Text style={styles.aiTitle}>Tìm người phù hợp bằng AI</Text>
                <Text style={styles.aiDescription}>So khớp kỹ năng, lịch rảnh và uy tín của cộng đồng.</Text>
              </View>
              <View style={styles.aiArrow}>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.editButton, deleting && styles.actionDisabled]}
            activeOpacity={0.75}
            onPress={editRequest}
            disabled={deleting}
            accessibilityRole="button"
            accessibilityLabel="Chỉnh sửa yêu cầu"
          >
            <Ionicons name="pencil-outline" size={18} color="#334155" />
            <Text style={styles.editButtonText}>Chỉnh sửa yêu cầu</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.deleteButton, deleting && styles.actionDisabled]}
            activeOpacity={0.75}
            onPress={confirmDelete}
            disabled={deleting}
            accessibilityRole="button"
            accessibilityLabel="Xóa yêu cầu"
          >
            {deleting ? (
              <ActivityIndicator size="small" color="#DC2626" />
            ) : (
              <Ionicons name="trash-outline" size={18} color="#DC2626" />
            )}
            <Text style={styles.deleteButtonText}>{deleting ? 'Đang xóa...' : 'Xóa yêu cầu'}</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 11, backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  headerButton: {
    width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0',
  },
  headerTitle: { color: '#0F172A', fontSize: 18, fontWeight: '800' },
  content: { padding: Spacing.md, paddingBottom: 36 },
  centerState: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28,
  },
  stateIconError: {
    width: 64, height: 64, borderRadius: 22, backgroundColor: '#FEF2F2',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  stateTitle: { color: '#0F172A', fontSize: 18, fontWeight: '800', textAlign: 'center' },
  stateDescription: {
    color: '#64748B', fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 8,
  },
  retryButton: {
    flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#0F766E',
    paddingHorizontal: 18, paddingVertical: 11, borderRadius: 12, marginTop: 18,
  },
  retryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  heroCard: {
    backgroundColor: '#FFFFFF', borderRadius: Radius.xl, padding: 18,
    borderWidth: 1, borderColor: '#DCE7E5', shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2,
  },
  heroTopRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8,
  },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10,
    paddingVertical: 6, borderRadius: Radius.full,
  },
  statusText: { fontSize: 12, fontWeight: '800' },
  categoryBadge: {
    flexShrink: 1, backgroundColor: '#F1F5F9', paddingHorizontal: 10,
    paddingVertical: 6, borderRadius: Radius.full,
  },
  categoryText: { color: '#475569', fontSize: 12, fontWeight: '700' },
  title: { color: '#0F172A', fontSize: 23, lineHeight: 31, fontWeight: '900', marginTop: 16 },
  description: { color: '#475569', fontSize: 15, lineHeight: 23, marginTop: 9 },
  createdRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16 },
  createdText: { color: '#64748B', fontSize: 12 },
  metricRow: { flexDirection: 'row', gap: 9, marginTop: 12 },
  metricCard: {
    flex: 1, minHeight: 120, backgroundColor: '#FFFFFF', borderWidth: 1,
    borderColor: '#E2E8F0', borderRadius: Radius.lg, alignItems: 'center',
    justifyContent: 'center', paddingHorizontal: 5, paddingVertical: 12,
  },
  metricIcon: {
    width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center',
    marginBottom: 7,
  },
  metricValue: { color: '#0F172A', fontSize: 18, fontWeight: '900' },
  metricLabel: { color: '#64748B', fontSize: 10, fontWeight: '600', marginTop: 2, textAlign: 'center' },
  infoCard: {
    backgroundColor: '#FFFFFF', borderRadius: Radius.xl, padding: 17,
    borderWidth: 1, borderColor: '#E2E8F0', marginTop: 12,
  },
  sectionHeading: { color: '#0F172A', fontSize: 16, fontWeight: '800', marginBottom: 14 },
  infoItem: { flexDirection: 'row', alignItems: 'center' },
  infoIcon: {
    width: 40, height: 40, borderRadius: 13, backgroundColor: '#F0FDFA',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  infoContent: { flex: 1 },
  infoLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '600', marginBottom: 3 },
  infoValue: { color: '#334155', fontSize: 14, lineHeight: 19, fontWeight: '700' },
  infoDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 11, marginLeft: 52 },
  aiCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5',
    borderWidth: 1, borderColor: '#6EE7B7', borderRadius: Radius.xl,
    padding: 15, marginTop: 12,
  },
  aiIcon: {
    width: 48, height: 48, borderRadius: 16, backgroundColor: '#D1FAE5',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  aiContent: { flex: 1 },
  aiTitle: { color: '#065F46', fontSize: 15, fontWeight: '900' },
  aiDescription: { color: '#047857', fontSize: 12, lineHeight: 17, marginTop: 3 },
  aiArrow: {
    width: 34, height: 34, borderRadius: 12, backgroundColor: '#0F766E',
    alignItems: 'center', justifyContent: 'center', marginLeft: 8,
  },
  editButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1',
    borderRadius: 14, paddingVertical: 13, marginTop: 12,
  },
  editButtonText: { color: '#334155', fontSize: 14, fontWeight: '800' },
  deleteButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
    borderRadius: 14, paddingVertical: 13, marginTop: 9,
  },
  deleteButtonText: { color: '#DC2626', fontSize: 14, fontWeight: '800' },
  actionDisabled: { opacity: 0.65 },
});
