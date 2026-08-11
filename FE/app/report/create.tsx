import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '@constants/Colors';
import ReportApi, { ReportRequest } from '@api/report';

const REASONS = [
  { value: 'SPAM', label: 'Spam hoặc quảng cáo rác' },
  { value: 'HARASSMENT', label: 'Quấy rối / Công kích cá nhân' },
  { value: 'MISINFORMATION', label: 'Thông tin sai lệch' },
  { value: 'FRAUD', label: 'Lừa đảo / Gian lận' },
  { value: 'ILLEGAL_CONTENT', label: 'Nội dung bất hợp pháp' },
  { value: 'OTHER', label: 'Lý do khác' },
];

export default function CreateReportScreen() {
  const router = useRouter();
  const { targetId, targetType } = useLocalSearchParams<{ targetId: string; targetType: string }>();

  const [reason, setReason] = useState<string>('');
  const [description, setDescription] = useState('');
  const [evidenceUrls, setEvidenceUrls] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!targetId || !targetType) {
      Alert.alert('Lỗi', 'Không xác định được đối tượng cần báo cáo.');
      return;
    }
    if (!reason) {
      Alert.alert('Lỗi', 'Vui lòng chọn lý do báo cáo');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mô tả chi tiết');
      return;
    }

    setSubmitting(true);
    try {
      const requestPayload: ReportRequest = {
        targetId,
        targetType: targetType as ReportRequest['targetType'],
        reason,
        description,
        evidenceUrls: evidenceUrls.trim() || undefined
      };

      await ReportApi.submitReport(requestPayload);
      Alert.alert('Thành công', 'Báo cáo của bạn đã được gửi và đang chờ xử lý.', [
        { text: 'OK', onPress: () => router.replace('/report/my-reports') }
      ]);
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể gửi báo cáo lúc này');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>Đóng</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gửi Báo Cáo</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        
        <Text style={styles.label}>Lý do báo cáo</Text>
        <View style={styles.reasonWrap}>
          {REASONS.map(r => (
            <TouchableOpacity 
              key={r.value} 
              style={[styles.reasonOption, reason === r.value && styles.reasonOptionActive]}
              onPress={() => setReason(r.value)}
            >
              <Text style={[styles.reasonText, reason === r.value && styles.reasonTextActive]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Mô tả chi tiết</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Hãy mô tả rõ hơn về vấn đề bạn gặp phải..."
          placeholderTextColor={Colors.textMuted}
          multiline
          numberOfLines={4}
          value={description}
          onChangeText={setDescription}
        />

        <Text style={styles.label}>Link bằng chứng (Tùy chọn)</Text>
        <TextInput
          style={styles.input}
          placeholder="https://..."
          placeholderTextColor={Colors.textMuted}
          value={evidenceUrls}
          onChangeText={setEvidenceUrls}
        />

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} 
          onPress={handleSubmit} 
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Gửi Báo Cáo</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, 
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.border 
  },
  backBtn: { width: 50 },
  backText: { color: Colors.primary, fontSize: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary },
  
  content: { padding: Spacing.lg },
  label: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, marginBottom: Spacing.sm, marginTop: Spacing.sm },
  
  reasonWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.md },
  reasonOption: { 
    paddingHorizontal: 12, paddingVertical: 8, 
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, 
    backgroundColor: '#fff' 
  },
  reasonOptionActive: { borderColor: Colors.primary, backgroundColor: '#EFF6FF' },
  reasonText: { color: Colors.textSecondary, fontSize: 14 },
  reasonTextActive: { color: Colors.primary, fontWeight: '500' },
  
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg
  },
  textArea: { height: 100, textAlignVertical: 'top' },

  footer: { padding: Spacing.lg, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: Colors.border },
  submitBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: Radius.lg,
    alignItems: 'center'
  },
  submitBtnDisabled: { backgroundColor: '#93C5FD' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
