import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Spacing, Radius } from '@constants/Colors';
import ReportApi from '@api/report';
import type { Report } from '@types';

export default function MyReportsScreen() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = async () => {
    try {
      const res = await ReportApi.getMyReports();
      setReports(res.data || []);
    } catch (e) {
      console.log('Error fetching reports', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchReports();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReports();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return { bg: '#FEF3C7', text: '#D97706', label: 'Đang chờ' };
      case 'REVIEWING': return { bg: '#DBEAFE', text: '#2563EB', label: 'Đang xử lý' };
      case 'RESOLVED': return { bg: '#D1FAE5', text: '#059669', label: 'Đã giải quyết' };
      case 'DISMISSED': return { bg: '#F1F5F9', text: '#64748B', label: 'Bị từ chối' };
      default: return { bg: '#F1F5F9', text: '#64748B', label: status };
    }
  };

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case 'SPAM': return 'Spam';
      case 'HARASSMENT': return 'Quấy rối';
      case 'MISINFORMATION': return 'Thông tin sai lệch';
      case 'FRAUD': return 'Lừa đảo';
      case 'ILLEGAL_CONTENT': return 'Nội dung bất hợp pháp';
      default: return 'Khác';
    }
  };

  const renderItem = ({ item }: { item: Report }) => {
    const statusObj = getStatusColor(item.status);
    const date = new Date(item.createdAt).toLocaleDateString('vi-VN');

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.reasonText}>{getReasonLabel(item.reason)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusObj.bg }]}>
            <Text style={[styles.statusText, { color: statusObj.text }]}>{statusObj.label}</Text>
          </View>
        </View>
        
        <Text style={styles.descText} numberOfLines={2}>
          {item.description || 'Không có mô tả'}
        </Text>
        
        {item.adminNote && (
          <View style={styles.adminNoteWrap}>
            <Text style={styles.adminNoteLabel}>Phản hồi từ Admin:</Text>
            <Text style={styles.adminNoteText}>{item.adminNote}</Text>
          </View>
        )}

        <Text style={styles.dateText}>Ngày gửi: {date}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Báo Cáo Của Tôi</Text>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>Bạn chưa gửi báo cáo nào.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, 
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.border 
  },
  backBtn: { width: 60 },
  backText: { color: Colors.primary, fontSize: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary },
  
  listContent: { padding: Spacing.md },
  
  card: {
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  reasonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textPrimary
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600'
  },
  descText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20
  },
  adminNoteWrap: {
    backgroundColor: '#F3F4F6',
    padding: 10,
    borderRadius: Radius.md,
    marginTop: 4,
    marginBottom: 8
  },
  adminNoteLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 2
  },
  adminNoteText: {
    fontSize: 13,
    color: Colors.textSecondary
  },
  dateText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'right'
  },
  
  emptyWrap: {
    padding: 40,
    alignItems: 'center'
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 15
  }
});
