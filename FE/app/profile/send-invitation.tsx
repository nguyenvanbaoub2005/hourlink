import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, Radius } from '@constants/Colors';
import InvitationApi from '@api/invitation';

const FORMAT_OPTIONS = [
  { label: 'Trực tuyến 💻', value: 'ONLINE' },
  { label: 'Trực tiếp 🤝', value: 'OFFLINE' },
  { label: 'Cả hai 🌐',    value: 'BOTH'    },
];

const DURATION_OPTIONS = [
  { label: '30 phút', value: 30 },
  { label: '1 giờ',   value: 60 },
  { label: '90 phút', value: 90 },
  { label: '2 giờ',   value: 120 },
];

const TIME_SUGGESTIONS = [
  'Tối thứ Hai (19:00)',
  'Tối thứ Ba (19:00)',
  'Tối thứ Tư (19:00)',
  'Tối thứ Năm (19:00)',
  'Tối thứ Sáu (19:00)',
  'Sáng thứ Bảy (9:00)',
  'Tối thứ Bảy (19:00)',
  'Chủ nhật cả ngày',
];

export default function SendInvitationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    receiverId: string;
    receiverName: string;
    skillId?: string;
    skillName?: string;
    helpRequestId?: string;
  }>();

  const [content, setContent] = useState('');
  const [message, setMessage] = useState('');
  const [proposedTime, setProposedTime] = useState('');
  const [format, setFormat] = useState<string>('ONLINE');
  const [duration, setDuration] = useState<number>(60);
  const [submitting, setSubmitting] = useState(false);

  const handleSend = async () => {
    if (!content.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập nội dung yêu cầu hỗ trợ.');
      return;
    }
    if (!params.receiverId) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin người nhận.');
      return;
    }

    setSubmitting(true);
    try {
      await InvitationApi.sendInvitation({
        receiverId: params.receiverId,
        skillId: params.skillId || undefined,
        helpRequestId: params.helpRequestId || undefined,
        content: content.trim(),
        message: message.trim() || undefined,
        proposedTime: proposedTime.trim() || undefined,
        duration,
        format,
      });

      Alert.alert(
        '🎉 Gửi thành công!',
        `Lời mời đã được gửi đến ${params.receiverName}. Bạn sẽ nhận được thông báo khi họ phản hồi.`,
        [
          {
            text: 'Xem lời mời đã gửi',
            onPress: () => {
              router.back();
              router.push('/profile/invitations' as any);
            }
          },
          { text: 'OK', onPress: () => router.back() },
        ]
      );
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? 'Không thể gửi lời mời. Vui lòng thử lại.';
      Alert.alert('Lỗi', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navIcon}>
          <Ionicons name="chevron-back" size={26} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gửi lời mời hỗ trợ</Text>
        <View style={{ width: 38 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Người nhận */}
          <View style={styles.receiverCard}>
            <View style={styles.receiverAvatar}>
              <Text style={styles.receiverLetter}>
                {params.receiverName ? params.receiverName.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.receiverLabel}>Gửi lời mời đến</Text>
              <Text style={styles.receiverName}>{params.receiverName ?? '—'}</Text>
              {params.skillName ? (
                <Text style={styles.receiverSkill}>📚 Kỹ năng: {params.skillName}</Text>
              ) : null}
            </View>
            <Ionicons name="send" size={22} color={Colors.primary} />
          </View>

          {/* Nội dung yêu cầu */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              Nội dung yêu cầu <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.textArea, { height: 110 }]}
              placeholder="Mô tả chi tiết bạn cần được hỗ trợ gì, trình độ hiện tại và mục tiêu muốn đạt được..."
              placeholderTextColor={Colors.textMuted}
              multiline
              value={content}
              onChangeText={setContent}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{content.length} / 500</Text>
          </View>

          {/* Hình thức */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              Hình thức hỗ trợ <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.optionRow}>
              {FORMAT_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.optionBtn, format === opt.value && styles.optionBtnActive]}
                  onPress={() => setFormat(opt.value)}
                >
                  <Text style={[styles.optionText, format === opt.value && styles.optionTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Thời lượng */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Thời lượng mỗi buổi</Text>
            <View style={styles.optionRow}>
              {DURATION_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.optionBtnSm, duration === opt.value && styles.optionBtnActive]}
                  onPress={() => setDuration(opt.value)}
                >
                  <Text style={[styles.optionText, duration === opt.value && styles.optionTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Thời gian đề xuất */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Thời gian đề xuất</Text>
            <TextInput
              style={styles.input}
              placeholder="Ví dụ: Tối thứ Bảy 19:00"
              placeholderTextColor={Colors.textMuted}
              value={proposedTime}
              onChangeText={setProposedTime}
            />
            {/* Gợi ý nhanh */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {TIME_SUGGESTIONS.map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.timeSuggest, proposedTime === t && styles.timeSuggestActive]}
                    onPress={() => setProposedTime(proposedTime === t ? '' : t)}
                  >
                    <Text style={[styles.timeSuggestText, proposedTime === t && styles.timeSuggestTextActive]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Tin nhắn giới thiệu */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Tin nhắn giới thiệu (tùy chọn)</Text>
            <TextInput
              style={[styles.textArea, { height: 80 }]}
              placeholder="Giới thiệu bản thân và lý do bạn muốn học với người này..."
              placeholderTextColor={Colors.textMuted}
              multiline
              value={message}
              onChangeText={setMessage}
              textAlignVertical="top"
            />
          </View>

          {/* Info box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={18} color="#0284C7" style={{ marginRight: 8 }} />
            <Text style={styles.infoText}>
              Sau khi gửi, người hỗ trợ sẽ nhận được thông báo và có thể chấp nhận, từ chối hoặc đề xuất thời gian khác.
            </Text>
          </View>
        </ScrollView>

        {/* Bottom Send Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.sendBtn, submitting && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="send" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.sendBtnText}>Gửi lời mời</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  navIcon: { padding: 4 },

  scrollContent: { padding: Spacing.md, paddingBottom: 20 },

  receiverCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', padding: 16, borderRadius: 16,
    borderWidth: 1, borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  receiverAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  receiverLetter: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  receiverLabel: { fontSize: 12, color: Colors.textMuted },
  receiverName: { fontSize: 16, fontWeight: 'bold', color: '#0F172A', marginTop: 2 },
  receiverSkill: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },

  fieldGroup: { marginBottom: 18 },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 8 },
  required: { color: '#EF4444' },

  input: {
    backgroundColor: '#fff', borderRadius: Radius.lg,
    borderWidth: 1, borderColor: '#E2E8F0',
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: '#0F172A',
  },
  textArea: {
    backgroundColor: '#fff', borderRadius: Radius.lg,
    borderWidth: 1, borderColor: '#E2E8F0',
    paddingHorizontal: 14, paddingTop: 12,
    fontSize: 14, color: '#0F172A',
  },
  charCount: { fontSize: 11, color: Colors.textMuted, textAlign: 'right', marginTop: 4 },

  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionBtn: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: Radius.lg,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  optionBtnSm: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.lg,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  optionBtnActive: { backgroundColor: '#ECFDF5', borderColor: Colors.primary },
  optionText: { fontSize: 13, color: '#475569', fontWeight: '500' },
  optionTextActive: { color: Colors.primary, fontWeight: '700' },

  timeSuggest: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0',
  },
  timeSuggestActive: { backgroundColor: '#EFF6FF', borderColor: '#3B82F6' },
  timeSuggestText: { fontSize: 12, color: '#475569' },
  timeSuggestTextActive: { color: '#1D4ED8', fontWeight: '600' },

  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#E0F2FE', padding: 14, borderRadius: 12,
    borderWidth: 1, borderColor: '#BAE6FD', marginBottom: 8,
  },
  infoText: { flex: 1, fontSize: 13, color: '#0369A1', lineHeight: 19 },

  footer: {
    padding: 16, backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#E2E8F0',
  },
  sendBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primary, paddingVertical: 15, borderRadius: Radius.lg,
  },
  sendBtnDisabled: { opacity: 0.6 },
  sendBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
