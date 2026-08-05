import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Linking, Modal, TextInput, Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Colors, Radius, Spacing } from '@constants/Colors';
import AppointmentApi from '@api/appointment';
import Avatar from '@components/Avatar';
import type { AppointmentItem } from '@types';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  PENDING:     { label: 'Chờ xác nhận', color: '#D97706', bg: '#FEF3C7', icon: 'time-outline' },
  CONFIRMED:   { label: 'Đã xác nhận',  color: '#15803D', bg: '#DCFCE7', icon: 'checkmark-circle-outline' },
  UPCOMING:    { label: 'Sắp diễn ra',  color: '#0284C7', bg: '#E0F2FE', icon: 'calendar-outline' },
  IN_PROGRESS: { label: 'Đang diễn ra', color: '#0D9488', bg: '#CCFBF1', icon: 'play-circle-outline' },
  COMPLETED:   { label: 'Hoàn thành',   color: '#9333EA', bg: '#F3E8FF', icon: 'ribbon-outline' },
  CANCELLED:   { label: 'Đã hủy',       color: '#64748B', bg: '#F1F5F9', icon: 'close-circle-outline' },
  DISPUTED:    { label: 'Có tranh chấp',color: '#DC2626', bg: '#FEE2E2', icon: 'alert-circle-outline' },
  RESCHEDULED: { label: 'Đề xuất đổi lịch', color: '#F97316', bg: '#FFEDD5', icon: 'repeat-outline' },
};

export default function AppointmentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [appointment, setAppointment] = useState<AppointmentItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Modal hoàn thành
  const [showModal, setShowModal] = useState<boolean>(false);
  const [actualDuration, setActualDuration] = useState<string>('60');
  const [contentCompleted, setContentCompleted] = useState<string>('');
  const [hasIssue, setHasIssue] = useState<boolean>(false);
  const [issueDescription, setIssueDescription] = useState<string>('');

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await AppointmentApi.getById(id);
      if (res.data?.data) {
        setAppointment(res.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching appointment detail:', err);
      Alert.alert('Lỗi', 'Không thể tải thông tin lịch hẹn.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      fetchDetail();
    }, [fetchDetail])
  );

  const [showLinkModal, setShowLinkModal] = useState(false);
  const [meetingLink, setMeetingLink] = useState('');

  const handleRespond = async (action: 'CONFIRM' | 'CANCEL', link?: string) => {
    if (!id || !appointment) return;
    const actionText = action === 'CONFIRM' ? 'xác nhận' : 'hủy';
    
    // Nếu là xác nhận và là Online, kiểm tra link
    if (action === 'CONFIRM' && (appointment.meetingType?.toUpperCase() === 'ONLINE' || (appointment as any).format === 'online')) {
      const existingLink = appointment.locationOrLink || (appointment as any).meetingLink;
      if (!existingLink && !link) {
        setShowLinkModal(true);
        return;
      }
    }

    Alert.alert(
      `${action === 'CONFIRM' ? 'Xác nhận' : 'Hủy'} lịch hẹn`,
      `Bạn có chắc chắn muốn ${actionText} lịch hẹn này?`,
      [
        { text: 'Bỏ qua', style: 'cancel' },
        {
          text: action === 'CONFIRM' ? 'Đồng ý' : 'Hủy lịch',
          style: action === 'CANCEL' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              setActionLoading(true);
              await AppointmentApi.respond(id, { 
                action, 
                reason: action === 'CANCEL' ? 'Người dùng hủy từ màn chi tiết' : undefined,
                locationOrLink: link
              });
              Alert.alert('Thành công', `Đã ${actionText} lịch hẹn.`);
              setShowLinkModal(false);
              fetchDetail();
            } catch (err: any) {
              Alert.alert('Lỗi', err?.response?.data?.message || `Không thể ${actionText} lịch hẹn.`);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleVerify = () => {
    if (!appointment) return;
    const isOffline = appointment.meetingType?.toUpperCase() === 'OFFLINE' || (appointment as any).format === 'offline';
    if (isOffline) {
      router.push(`/appointment/qr?id=${appointment.id}` as any);
    } else {
      router.push(`/appointment/otp?id=${appointment.id}` as any);
    }
  };

  const submitCompletion = async () => {
    if (!id) return;
    const durationNum = parseInt(actualDuration, 10);
    if (isNaN(durationNum) || durationNum <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập thời lượng thực tế hợp lệ.');
      return;
    }
    if (hasIssue && !issueDescription.trim()) {
      Alert.alert('Lỗi', 'Vui lòng mô tả vấn đề/tranh chấp phát sinh.');
      return;
    }

    try {
      setActionLoading(true);
      await AppointmentApi.confirmCompletion(id, {
        actualDurationMinutes: durationNum,
        contentCompleted: contentCompleted.trim() || 'Đã hoàn thành nội dung trao đổi',
        hasIssue,
        issueDescription: hasIssue ? issueDescription.trim() : undefined,
      });
      Alert.alert('Thành công', 'Đã gửi xác nhận hoàn thành buổi hỗ trợ.');
      setShowModal(false);
      fetchDetail();
    } catch (err: any) {
      Alert.alert('Lỗi', err?.response?.data?.message || 'Không thể xác nhận hoàn thành.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Đang tải chi tiết...</Text>
      </SafeAreaView>
    );
  }

  if (!appointment) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={Colors.textMuted} />
        <Text style={styles.errorTitle}>Không tìm thấy lịch hẹn</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Quay lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const statusStr = (appointment.status || 'PENDING').toUpperCase();
  const statusCfg = STATUS_CONFIG[statusStr] || STATUS_CONFIG.PENDING;
  const isOffline = appointment.meetingType?.toUpperCase() === 'OFFLINE' || (appointment as any).format === 'offline';
  const titleStr = appointment.title || (appointment as any).content || 'Buổi hỗ trợ kỹ năng';
  const tcAmount = appointment.timeCreditAmount || (appointment as any).timeCredit || 1;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi Tiết Lịch Hẹn</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
          <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main Info Box */}
        <View style={styles.sectionCard}>
          <Text style={styles.mainTitle}>{titleStr}</Text>
          {!!appointment.skillName && (
            <View style={styles.skillTag}>
              <Ionicons name="ribbon-outline" size={14} color="#0284C7" />
              <Text style={styles.skillText}>{appointment.skillName}</Text>
            </View>
          )}

          <Text style={styles.descText}>
            {appointment.description || (appointment as any).note || 'Không có mô tả chi tiết'}
          </Text>

          {/* Time Credit Banner */}
          <View style={styles.tcBanner}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="time" size={20} color={Colors.credit} />
              <Text style={styles.tcTitle}>Time Credit thanh toán</Text>
            </View>
            <Text style={styles.tcValue}>{tcAmount} TC</Text>
          </View>
        </View>

        {/* Schedule & Location */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Thời Gian & Địa Điểm</Text>
          
          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
            </View>
            <View style={styles.infoTextCol}>
              <Text style={styles.infoLabel}>Ngày hẹn</Text>
              <Text style={styles.infoValue}>{appointment.appointmentDate}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <Ionicons name="time-outline" size={18} color={Colors.primary} />
            </View>
            <View style={styles.infoTextCol}>
              <Text style={styles.infoLabel}>Khung giờ</Text>
              <Text style={styles.infoValue}>
                {appointment.startTime?.slice(0, 5)} - {appointment.endTime?.slice(0, 5)}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <Ionicons name={isOffline ? 'location-outline' : 'videocam-outline'} size={18} color={Colors.primary} />
            </View>
            <View style={styles.infoTextCol}>
              <Text style={styles.infoLabel}>Hình thức hỗ trợ</Text>
              <Text style={styles.infoValue}>{isOffline ? 'Trực tiếp (Offline)' : 'Trực tuyến (Online Video Call)'}</Text>
            </View>
          </View>

          {(!!appointment.locationOrLink || !!(appointment as any).meetingLink || !!(appointment as any).location) && (
            <View style={styles.infoRow}>
              <View style={styles.iconBox}>
                <Ionicons name="link-outline" size={18} color={Colors.primary} />
              </View>
              <View style={styles.infoTextCol}>
                <Text style={styles.infoLabel}>{isOffline ? 'Địa điểm gặp mặt' : 'Link họp / phòng học'}</Text>
                <TouchableOpacity
                  disabled={isOffline}
                  onPress={() => {
                    const link = appointment.locationOrLink || (appointment as any).meetingLink;
                    if (link && link.startsWith('http')) Linking.openURL(link);
                  }}
                >
                  <Text style={[styles.infoValue, !isOffline && { color: '#0284C7', textDecorationLine: 'underline' }]}>
                    {appointment.locationOrLink || (appointment as any).meetingLink || (appointment as any).location}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Participants */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Thành Viên Tham Gia</Text>

          <View style={styles.userBox}>
            <Avatar uri={appointment.providerAvatarUrl || (appointment as any).helper?.avatarUrl} name={appointment.providerName || (appointment as any).helper?.fullName} size={48} />
            <View style={styles.userInfo}>
              <Text style={styles.userRoleBadge}>NGƯỜI HỖ TRỢ (PROVIDER)</Text>
              <Text style={styles.userFullName}>
                {appointment.providerName || (appointment as any).helper?.fullName || 'Người hỗ trợ'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.userBox}>
            <Avatar uri={appointment.receiverAvatarUrl || (appointment as any).receiver?.avatarUrl} name={appointment.receiverName || (appointment as any).receiver?.fullName} size={48} />
            <View style={styles.userInfo}>
              <Text style={[styles.userRoleBadge, { color: '#9333EA' }]}>NGƯỜI NHẬN HỖ TRỢ (RECEIVER)</Text>
              <Text style={styles.userFullName}>
                {appointment.receiverName || (appointment as any).receiver?.fullName || 'Người nhận'}
              </Text>
            </View>
          </View>
        </View>

        {/* Additional details */}
        {(!!appointment.cancelReason || !!appointment.rescheduleProposedTime) && (
          <View style={[styles.sectionCard, { borderColor: '#FECACA', backgroundColor: '#FEF2F2' }]}>
            <Text style={[styles.sectionHeader, { color: '#DC2626' }]}>Thông Tin Phản Hồi</Text>
            {!!appointment.cancelReason && (
              <Text style={{ color: '#DC2626', fontSize: 13, marginTop: 4 }}>
                <Text style={{ fontWeight: '700' }}>Lý do hủy: </Text>
                {appointment.cancelReason}
              </Text>
            )}
            {!!appointment.rescheduleProposedTime && (
              <Text style={{ color: '#F97316', fontSize: 13, marginTop: 4 }}>
                <Text style={{ fontWeight: '700' }}>Thời gian đề xuất mới: </Text>
                {appointment.rescheduleProposedTime}
              </Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Footer Actions */}
      {(statusStr === 'PENDING' || statusStr === 'RESCHEDULED' || statusStr === 'UPCOMING' || statusStr === 'IN_PROGRESS') && (
        <View style={styles.footer}>
          {(statusStr === 'PENDING' || statusStr === 'RESCHEDULED') && (
            <View style={styles.footerRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: Colors.success }]}
                onPress={() => handleRespond('CONFIRM')}
                disabled={actionLoading}
              >
                {actionLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnTextWhite}>Chấp nhận lịch</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA' }]}
                onPress={() => handleRespond('CANCEL')}
                disabled={actionLoading}
              >
                <Text style={{ color: '#DC2626', fontWeight: '600' }}>Từ chối</Text>
              </TouchableOpacity>
            </View>
          )}

          {(statusStr === 'UPCOMING') && (
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#0D9488' }]} onPress={handleVerify}>
              <Ionicons name={isOffline ? 'qr-code' : 'keypad'} size={18} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.btnTextWhite}>Bắt Đầu / Xác Thực {isOffline ? 'QR Code' : 'OTP'}</Text>
            </TouchableOpacity>
          )}

          {statusStr === 'IN_PROGRESS' && (
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.primary }]} onPress={() => setShowModal(true)}>
              <Ionicons name="checkmark-done-circle" size={18} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.btnTextWhite}>Xác Nhận Hoàn Thành Buổi Hỗ Trợ</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Completion Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Xác Nhận Hoàn Thành</Text>
            <Text style={styles.modalSub}>Vui lòng xác nhận thời lượng và kết quả buổi trao đổi kỹ năng.</Text>

            <Text style={styles.inputLabel}>Thời lượng thực tế (phút):</Text>
            <TextInput
              style={styles.input}
              value={actualDuration}
              onChangeText={setActualDuration}
              keyboardType="numeric"
              placeholder="Ví dụ: 60"
            />

            <Text style={styles.inputLabel}>Nội dung đã hoàn thành / trao đổi:</Text>
            <TextInput
              style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
              value={contentCompleted}
              onChangeText={setContentCompleted}
              multiline
              placeholder="Mô tả tóm tắt những gì hai bên đã trao đổi..."
            />

            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.textPrimary }}>Có tranh chấp / vấn đề phát sinh?</Text>
                <Text style={{ fontSize: 12, color: Colors.textSecondary }}>Bật nếu buổi hỗ trợ không đạt chất lượng hoặc vi phạm</Text>
              </View>
              <Switch value={hasIssue} onValueChange={setHasIssue} trackColor={{ false: '#CBD5E1', true: '#FECACA' }} thumbColor={hasIssue ? '#DC2626' : '#F8FAFC'} />
            </View>

            {hasIssue && (
              <>
                <Text style={[styles.inputLabel, { color: '#DC2626' }]}>Mô tả chi tiết vấn đề:</Text>
                <TextInput
                  style={[styles.input, { height: 70, textAlignVertical: 'top', borderColor: '#FECACA', backgroundColor: '#FEF2F2' }]}
                  value={issueDescription}
                  onChangeText={setIssueDescription}
                  multiline
                  placeholder="Vui lòng ghi rõ lý do để admin hỗ trợ giải quyết tranh chấp..."
                />
              </>
            )}

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: Colors.bgCard }]} onPress={() => setShowModal(false)}>
                <Text style={{ color: Colors.textPrimary, fontWeight: '600' }}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: hasIssue ? '#DC2626' : Colors.primary }]}
                onPress={submitCompletion}
                disabled={actionLoading}
              >
                {actionLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnTextWhite}>Gửi Xác Nhận</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Provide Link Modal */}
      <Modal visible={showLinkModal} transparent animationType="fade" onRequestClose={() => setShowLinkModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Cung Cấp Link Họp</Text>
            <Text style={styles.modalSub}>Vì đây là buổi hỗ trợ Online, bạn cần cung cấp link Google Meet, Zoom... để người nhận tham gia.</Text>
            
            <Text style={styles.inputLabel}>Link họp / Phòng học *</Text>
            <TextInput
              style={styles.input}
              value={meetingLink}
              onChangeText={setMeetingLink}
              placeholder="https://meet.google.com/..."
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: Colors.bgCard }]} onPress={() => setShowLinkModal(false)}>
                <Text style={{ color: Colors.textPrimary, fontWeight: '600' }}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: Colors.success }]}
                onPress={() => {
                  if (!meetingLink.trim()) {
                    Alert.alert('Lỗi', 'Vui lòng nhập link họp hợp lệ!');
                    return;
                  }
                  handleRespond('CONFIRM', meetingLink.trim());
                }}
                disabled={actionLoading}
              >
                {actionLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnTextWhite}>Xác Nhận</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgScreen },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
  loadingText: { marginTop: 12, color: Colors.textSecondary },
  errorTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginTop: 12, marginBottom: 16 },
  backBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: Colors.primary, borderRadius: Radius.md },
  backBtnText: { color: '#FFF', fontWeight: '600' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerBack: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  statusText: { fontSize: 12, fontWeight: '700' },

  scrollContent: { padding: Spacing.md, paddingBottom: 40, gap: 16 },

  sectionCard: {
    backgroundColor: '#FFF',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  mainTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  skillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    marginBottom: 12,
  },
  skillText: { fontSize: 13, color: '#0284C7', fontWeight: '600', marginLeft: 6 },
  descText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22, marginBottom: 16 },

  tcBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: Radius.md,
  },
  tcTitle: { fontSize: 13, fontWeight: '600', color: '#92400E', marginLeft: 6 },
  tcValue: { fontSize: 16, fontWeight: '700', color: '#B45309' },

  sectionHeader: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  iconBox: {
    width: 38, height: 38, borderRadius: 10, backgroundColor: Colors.bgCard,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  infoTextCol: { flex: 1 },
  infoLabel: { fontSize: 12, color: Colors.textMuted, marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },

  userBox: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  userInfo: { marginLeft: 12, flex: 1 },
  userRoleBadge: { fontSize: 11, fontWeight: '700', color: Colors.primary, marginBottom: 2 },
  userFullName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 12 },

  footer: {
    padding: Spacing.md,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Radius.md,
  },
  btnTextWhite: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: Spacing.lg },
  modalCard: { backgroundColor: '#FFF', borderRadius: Radius.xl, padding: Spacing.lg, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 10 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6, textAlign: 'center' },
  modalSub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', marginBottom: 16, lineHeight: 18 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, marginBottom: 6, marginTop: 10 },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: Colors.textPrimary },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  modalBtnRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
});
