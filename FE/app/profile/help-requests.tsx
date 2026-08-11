import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import HelpRequestApi, { type HelpRequestResponse } from '@api/helprequest';

type RequestAction = 'close' | 'delete';

const getRequestErrorMessage = (error: any, fallback: string) => {
  const status = error?.response?.status;
  const serverMessage = error?.response?.data?.message;

  if (!error?.response) return 'Không thể kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại.';
  if (status === 403) return 'Bạn không có quyền thay đổi yêu cầu này.';
  if (status === 404) return 'Yêu cầu này không còn tồn tại.';
  if (status >= 500) return 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.';
  return serverMessage || fallback;
};

export default function HelpRequestsScreen() {
  const router = useRouter();
  const [requests, setRequests] = useState<HelpRequestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'COMPLETED'>('ACTIVE');
  const [processing, setProcessing] = useState<{ id: string; action: RequestAction } | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await HelpRequestApi.getMyRequests();
      setRequests((res.data?.data ?? []).filter(item => item.status !== 'DELETED'));
    } catch (error) {
      console.error('Lỗi khi tải yêu cầu:', error);
      Alert.alert('Không thể tải yêu cầu', getRequestErrorMessage(error, 'Vui lòng thử lại.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void fetchRequests();
    }, [fetchRequests]),
  );

  const handleEdit = (item: HelpRequestResponse) => {
    router.push({
      pathname: '/(tabs)/post' as any,
      params: {
        editId: item.id,
        editType: 'needHelp',
        initialData: JSON.stringify(item),
      },
    });
  };

  const deleteRequest = async (item: HelpRequestResponse) => {
    setProcessing({ id: item.id, action: 'delete' });
    try {
      await HelpRequestApi.deleteRequest(item.id);
      setRequests(previous => previous.filter(request => request.id !== item.id));
      Alert.alert('Đã xóa yêu cầu', 'Yêu cầu đã được gỡ khỏi danh sách của bạn.');
    } catch (error: any) {
      if (error?.response?.status === 404) {
        setRequests(previous => previous.filter(request => request.id !== item.id));
        Alert.alert('Danh sách đã được cập nhật', 'Yêu cầu này không còn tồn tại.');
      } else {
        Alert.alert('Không thể xóa yêu cầu', getRequestErrorMessage(error, 'Vui lòng thử lại.'));
      }
    } finally {
      setProcessing(null);
    }
  };

  const closeRequest = async (item: HelpRequestResponse) => {
    setProcessing({ id: item.id, action: 'close' });
    try {
      const response = await HelpRequestApi.closeRequest(item.id);
      const updatedRequest = response.data?.data ?? { ...item, status: 'COMPLETED' as const };
      setRequests(previous => previous.map(request => request.id === item.id ? updatedRequest : request));
      Alert.alert('Đã đóng yêu cầu', 'Yêu cầu được lưu trong mục đã kết thúc.');
    } catch (error) {
      Alert.alert('Không thể đóng yêu cầu', getRequestErrorMessage(error, 'Vui lòng thử lại.'));
    } finally {
      setProcessing(null);
    }
  };

  const confirmDelete = (item: HelpRequestResponse) => {
    Alert.alert(
      'Xóa yêu cầu',
      'Yêu cầu sẽ không còn hiển thị trong danh sách của bạn. Lịch sử lời mời và lịch hẹn liên quan vẫn được giữ để đối soát.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa yêu cầu',
          style: 'destructive',
          onPress: () => void deleteRequest(item),
        },
      ],
    );
  };

  const handleDeleteOrClose = (item: HelpRequestResponse) => {
    const isCompleted = item.status === 'COMPLETED' || item.status === 'CANCELLED';
    if (isCompleted) {
      confirmDelete(item);
    } else {
      Alert.alert('Quản lý yêu cầu', 'Đóng để lưu yêu cầu trong lịch sử, hoặc xóa để gỡ khỏi danh sách của bạn. Lịch sử liên quan vẫn được giữ.', [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đóng yêu cầu',
          onPress: () => void closeRequest(item),
        },
        {
          text: 'Xóa yêu cầu',
          style: 'destructive',
          onPress: () => void deleteRequest(item),
        },
      ]);
    }
  };

  const activeList = requests.filter(r => r.status !== 'COMPLETED' && r.status !== 'CANCELLED' && r.status !== 'DELETED');
  const completedList = requests.filter(r => r.status === 'COMPLETED' || r.status === 'CANCELLED');
  const displayList = activeTab === 'ACTIVE' ? activeList : completedList;

  const renderItem = ({ item }: { item: HelpRequestResponse }) => {
    const isCompleted = item.status === 'COMPLETED';
    const isCancelled = item.status === 'CANCELLED';
    const durMin = item.duration || (item.timeCreditAmount > 10 ? item.timeCreditAmount : Number(item.timeCreditAmount || 1) * 60);
    const tcVal = item.duration
      ? Number((item.duration / 60).toFixed(1))
      : (item.timeCreditAmount > 10
          ? Number((item.timeCreditAmount / 60).toFixed(1))
          : Number(Number(item.timeCreditAmount || 1).toFixed(1)));
    const isProcessing = processing?.id === item.id;

    return (
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <View style={[
            styles.badge,
            isCompleted ? styles.badgeCompleted : isCancelled ? styles.badgeCancelled : styles.badgeActive
          ]}>
            <Text style={[
              styles.badgeText,
              isCompleted ? styles.textCompleted : isCancelled ? styles.textCancelled : styles.textActive
            ]}>
              {isCompleted ? 'Đã hoàn thành' : isCancelled ? 'Đã hủy' : 'Đang mở'}
            </Text>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>

        {/* Info Row */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={15} color="#64748B" />
            <Text style={styles.infoText}>{durMin} phút · {item.format === 'OFFLINE' ? 'Trực tiếp' : 'Online'}</Text>
          </View>
          <View style={[styles.tcBadge, styles.infoItem]}>
            <Ionicons name="hourglass-outline" size={13} color="#EA580C" />
            <Text style={styles.tcText}>{tcVal} TC</Text>
          </View>
          <Text style={styles.replyText}>{item.responseCount ?? 0} phản hồi</Text>
        </View>

        <View style={styles.divider} />

        {/* Actions Row */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.aiButton}
            onPress={() => router.push({ pathname: '/profile/ai-suggest', params: { helpRequestId: item.id } })}
            disabled={isProcessing}
            accessibilityRole="button"
            accessibilityLabel={`Xem AI gợi ý cho yêu cầu ${item.title}`}
          >
            <Ionicons name="sparkles-outline" size={17} color="#059669" />
            <Text style={styles.aiButtonText}>Xem AI gợi ý</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => handleEdit(item)}
            disabled={isProcessing}
            accessibilityRole="button"
            accessibilityLabel={`Chỉnh sửa yêu cầu ${item.title}`}
          >
            <Ionicons name="pencil-outline" size={18} color="#64748b" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: '#fef2f2' }, isProcessing && styles.actionDisabled]}
            onPress={() => handleDeleteOrClose(item)}
            disabled={isProcessing}
            accessibilityRole="button"
            accessibilityLabel={`Quản lý hoặc xóa yêu cầu ${item.title}`}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navIcon}>
          <Ionicons name="chevron-back" size={26} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yêu cầu cần hỗ trợ</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/post' as any)} style={styles.navIcon}>
          <Ionicons name="add" size={28} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'ACTIVE' && styles.tabItemActive]}
          onPress={() => setActiveTab('ACTIVE')}
        >
          <Text style={[styles.tabText, activeTab === 'ACTIVE' && styles.tabTextActive]}>
            Đang hoạt động ({activeList.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'COMPLETED' && styles.tabItemActive]}
          onPress={() => setActiveTab('COMPLETED')}
        >
          <Text style={[styles.tabText, activeTab === 'COMPLETED' && styles.tabTextActive]}>
            Đã hoàn thành ({completedList.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : displayList.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="document-text-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>Chưa có yêu cầu nào</Text>
        </View>
      ) : (
        <FlatList
          data={displayList}
          keyExtractor={i => i.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 12 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0'
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  navIcon: { padding: 4 },

  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  tabItem: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabItemActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabText: { fontSize: 15, fontWeight: '500', color: '#64748B' },
  tabTextActive: { color: Colors.primary, fontWeight: 'bold' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 16, color: '#64748B', marginTop: 12 },

  card: {
    backgroundColor: '#fff', marginHorizontal: 16, marginVertical: 8,
    borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#0F172A', flex: 1, marginRight: 8 },

  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeActive: { backgroundColor: '#FEF3C7' },
  badgeCompleted: { backgroundColor: '#DCFCE7' },
  badgeCancelled: { backgroundColor: '#F1F5F9' },

  badgeText: { fontSize: 12, fontWeight: '600' },
  textActive: { color: '#D97706' },
  textCompleted: { color: '#15803d' },
  textCancelled: { color: '#64748B' },

  description: { fontSize: 14, color: '#64748B', marginTop: 8, lineHeight: 20 },

  infoRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText: { fontSize: 13, color: '#64748B' },
  tcBadge: { backgroundColor: '#FFEDD5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  tcText: { fontSize: 12, fontWeight: 'bold', color: '#EA580C' },
  replyText: { fontSize: 13, fontWeight: '600', color: '#0284C7', marginLeft: 'auto' },

  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },

  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiButton: {
    flex: 1, flexDirection: 'row', gap: 6, backgroundColor: '#ECFDF5', paddingVertical: 10,
    borderRadius: 10, alignItems: 'center', justifyContent: 'center'
  },
  aiButtonText: { fontSize: 14, fontWeight: 'bold', color: '#059669' },
  iconBtn: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center'
  },
  actionDisabled: { opacity: 0.65 },
});
