import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@constants/Colors';
import ReportApi from '@api/report';
import ChatApi from '@api/chat';
import type { MessageReport, Report, TrackedReport } from '@types';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Đang chờ xử lý',
  REVIEWING: 'Đang xử lý',
  REVIEWED: 'Đã xem xét',
  RESOLVED: 'Đã giải quyết',
  ACTIONED: 'Đã xử lý vi phạm',
  DISMISSED: 'Không phát hiện vi phạm',
};

export default function ReportDetailScreen() {
  const router = useRouter();
  const { id, source } = useLocalSearchParams<{ id: string; source?: 'REPORT' | 'MESSAGE' }>();
  const [report, setReport] = useState<TrackedReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        if (source === 'MESSAGE') {
          const response = await ChatApi.getMyMessageReport(id);
          const item = response.data.data as MessageReport;
          setReport({
            id: item.id,
            source: 'MESSAGE',
            targetId: item.messageId,
            targetType: 'MESSAGE',
            targetLabel: item.reportedUserName,
            reason: item.reason,
            description: item.description,
            evidence: item.evidence,
            status: item.status,
            createdAt: item.createdAt,
          });
        } else {
          const response = await ReportApi.getMyReport(id);
          const item = response.data as Report;
          setReport({ ...item, source: 'REPORT', evidence: item.evidenceUrls });
        }
      } catch (error: any) {
        Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể tải chi tiết báo cáo.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, source]);

  if (loading) {
    return <SafeAreaView style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></SafeAreaView>;
  }

  if (!report) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.muted}>Không tìm thấy báo cáo.</Text>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.link}>Quay lại</Text></TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={Colors.textPrimary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Chi Tiết Báo Cáo</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statusCard}>
          <Text style={styles.statusCaption}>Trạng thái xử lý</Text>
          <Text style={styles.statusValue}>{STATUS_LABELS[report.status] || report.status}</Text>
        </View>
        <View style={styles.card}>
          <Row label="Loại đối tượng" value={report.targetType === 'USER' ? 'Người dùng' : report.targetType === 'MESSAGE' ? 'Tin nhắn' : 'Nội dung'} />
          {report.targetLabel && <Row label="Người bị báo cáo" value={report.targetLabel} />}
          <Row label="Lý do" value={report.reason} />
          <Row label="Ngày gửi" value={new Date(report.createdAt).toLocaleString('vi-VN')} />
          <Row label="Mô tả" value={report.description || 'Không có mô tả'} />
          {report.evidence && <Row label="Bằng chứng" value={report.evidence} />}
        </View>
        {report.adminNote && (
          <View style={styles.noteCard}>
            <Text style={styles.noteTitle}>Phản hồi từ quản trị viên</Text>
            <Text style={styles.noteText}>{report.adminNote}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <View style={styles.row}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary },
  content: { padding: Spacing.md, gap: Spacing.md },
  statusCard: { padding: Spacing.md, borderRadius: Radius.lg, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' },
  statusCaption: { fontSize: 13, color: Colors.textSecondary },
  statusValue: { marginTop: 4, fontSize: 19, fontWeight: 'bold', color: Colors.primary },
  card: { backgroundColor: '#fff', borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  row: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  label: { fontSize: 12, color: Colors.textMuted, marginBottom: 4 },
  value: { fontSize: 15, color: Colors.textPrimary, lineHeight: 22 },
  noteCard: { padding: Spacing.md, borderRadius: Radius.lg, backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0' },
  noteTitle: { fontWeight: 'bold', color: '#166534', marginBottom: 6 },
  noteText: { color: '#166534', lineHeight: 21 },
  muted: { color: Colors.textMuted },
  link: { color: Colors.primary, fontWeight: '600' },
});
