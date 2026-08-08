import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Linking, Modal, TextInput, Switch,
  Keyboard, TouchableWithoutFeedback
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Colors, Radius, Spacing } from '@constants/Colors';
import AppointmentApi from '@api/appointment';
import RatingApi from '@api/rating';
import Avatar from '@components/Avatar';
import CancelAppointmentModal from '@components/CancelAppointmentModal';
import DateTimePickerModal from '@components/DateTimePickerModal';
import { useAuthStore } from '@store/authStore';
import type { AppointmentItem, RatingResponse } from '@types';

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

  // Thông tin người dùng hiện tại (để xác định reviewee khi điều hướng Rating)
  const currentUser = useAuthStore((s) => s.user);

  // Modal hoàn thành
  const [showModal, setShowModal] = useState<boolean>(false);
  const [actualDuration, setActualDuration] = useState<string>('60');
  const [contentCompleted, setContentCompleted] = useState<string>('');
  const [hasIssue, setHasIssue] = useState<boolean>(false);
  const [issueDescription, setIssueDescription] = useState<string>('');
  // Thông tin đánh giá
  const [allRatings, setAllRatings] = useState<RatingResponse[]>([]);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await AppointmentApi.getById(id);
      if (res.data?.data) {
        const appt = res.data.data;
        setAppointment(appt);

        // Nếu đã hoàn thành, thử tải danh sách đánh giá
        if (appt.status === 'COMPLETED') {
          try {
            const ratingRes = await RatingApi.getRatingsForAppointment(id);
            if (ratingRes.data?.data) {
              setAllRatings(ratingRes.data.data);
            }
          } catch (e) {
            // Chưa đánh giá hoặc lỗi lấy đánh giá
            console.log('No rating found');
          }
        }
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
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleStart, setRescheduleStart] = useState('');
  const [rescheduleEnd, setRescheduleEnd] = useState('');
  const [reschedulePicker, setReschedulePicker] = useState<'date' | 'start' | 'end' | null>(null);

  const handleRespond = async (action: 'CONFIRM' | 'CANCEL', link?: string) => {
    if (!id || !appointment) return;

    if (action === 'CANCEL') {
      setShowCancelModal(true);
      return;
    }

    // Nếu là xác nhận và là Online, kiểm tra link
    if (action === 'CONFIRM' && (appointment.meetingType?.toUpperCase() === 'ONLINE' || (appointment as any).format === 'online')) {
      const existingLink = appointment.locationOrLink || (appointment as any).meetingLink;
      if ((!existingLink || !/^https?:\/\//i.test(existingLink)) && (!link || !/^https?:\/\//i.test(link))) {
        setShowLinkModal(true);
        return;
      }
    }

    Alert.alert(
      'Xác nhận lịch hẹn',
      'Bạn có chắc chắn muốn xác nhận lịch hẹn này?',
      [
        { text: 'Bỏ qua', style: 'cancel' },
        {
          text: 'Đồng ý',
          onPress: async () => {
            try {
              setActionLoading(true);
              await AppointmentApi.respond(id, {
                action,
                locationOrLink: link
              });
              Alert.alert('Thành công', 'Đã xác nhận lịch hẹn.');
              setShowLinkModal(false);
              fetchDetail();
            } catch (err: any) {
              Alert.alert('Lỗi', err?.response?.data?.message || 'Không thể xác nhận lịch hẹn.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const submitCancellation = async (reason: string) => {
    if (!id) return;
    try {
      setActionLoading(true);
      await AppointmentApi.respond(id, { action: 'CANCEL', reason });
      setShowCancelModal(false);
      Alert.alert('Đã hủy lịch hẹn', 'Lý do hủy đã được gửi cho người còn lại.');
      await fetchDetail();
    } catch (err: any) {
      Alert.alert('Lỗi', err?.response?.data?.message || 'Không thể hủy lịch hẹn.');
    } finally {
      setActionLoading(false);
    }
  };

  const openRescheduleModal = () => {
    if (!appointment) return;
    setRescheduleDate(appointment.appointmentDate || '');
    setRescheduleStart(appointment.startTime?.slice(0, 5) || '09:00');
    setRescheduleEnd(appointment.endTime?.slice(0, 5) || '10:00');
    setShowRescheduleModal(true);
  };

  const submitReschedule = async () => {
    if (!id) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(rescheduleDate)
        || !/^\d{2}:\d{2}$/.test(rescheduleStart)
        || !/^\d{2}:\d{2}$/.test(rescheduleEnd)) {
      Alert.alert('Thông tin chưa hợp lệ', 'Vui lòng chọn đầy đủ ngày, giờ bắt đầu và giờ kết thúc.');
      return;
    }
    if (rescheduleEnd <= rescheduleStart) {
      Alert.alert('Giờ chưa hợp lệ', 'Giờ kết thúc phải sau giờ bắt đầu.');
      return;
    }

    try {
      setActionLoading(true);
      await AppointmentApi.respond(id, {
        action: 'RESCHEDULE',
        newAppointmentDate: rescheduleDate,
        newStartTime: `${rescheduleStart}:00`,
        newEndTime: `${rescheduleEnd}:00`,
      });
      setShowRescheduleModal(false);
      Alert.alert('Thành công', 'Đã gửi đề xuất đổi lịch cho người còn lại.');
      fetchDetail();
    } catch (err: any) {
      Alert.alert('Lỗi', err?.response?.data?.message || 'Không thể đề xuất đổi lịch.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerify = () => {
    if (!appointment) return;
    const isOffline = appointment.meetingType?.toUpperCase() === 'OFFLINE' || (appointment as any).format === 'offline';
    const openVerification = (allowEarlyStart: boolean) => router.push({
      pathname: isOffline ? '/appointment/qr' : '/appointment/otp',
      params: {
        id: appointment.id,
        allowEarlyStart: allowEarlyStart ? 'true' : 'false',
      },
    } as any);
    const startAt = Date.parse(
      `${appointment.appointmentDate}T${appointment.startTime?.slice(0, 8) || '00:00:00'}`,
    );

    if (Number.isFinite(startAt) && Date.now() < startAt) {
      Alert.alert(
        'Chưa tới giờ hẹn',
        `Lịch bắt đầu lúc ${appointment.startTime?.slice(0, 5)} ngày ${appointment.appointmentDate}. Bạn vẫn muốn bắt đầu sớm?`,
        [
          { text: 'Chưa bắt đầu', style: 'cancel' },
          { text: 'Vẫn bắt đầu', onPress: () => openVerification(true) },
        ],
      );
      return;
    }

    openVerification(false);
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
      Alert.alert(
        hasIssue ? 'Đã gửi báo cáo' : 'Hoàn thành',
        hasIssue
          ? 'Lịch hẹn đã chuyển sang tranh chấp và Time Credit chưa được chuyển.'
          : 'Buổi hỗ trợ đã hoàn thành và Time Credit đã được chuyển.',
      );
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
  const canRespond = !appointment.proposedById || appointment.proposedById !== currentUser?.id;
  const isAwaitingResponse = statusStr === 'PENDING' || statusStr === 'RESCHEDULED';
  const canManageConfirmed = statusStr === 'CONFIRMED' || statusStr === 'UPCOMING';
  const endAt = Date.parse(`${appointment.appointmentDate}T${appointment.endTime?.slice(0, 8) || '00:00:00'}`);
  const isExpired = Number.isFinite(endAt) && endAt < Date.now();
  const canAccept = canRespond && !isExpired;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi Tiết Lịch Hẹn</Text>
        <TouchableOpacity
          style={styles.headerBack}
          onPress={() => {
            const isProvider = currentUser?.id === appointment?.providerId;
            const peerId = isProvider ? appointment?.receiverId : appointment?.providerId;
            router.push({ pathname: '/report/create', params: { targetId: peerId || appointment?.id, targetType: 'USER' } } as any);
          }}
        >
          <Ionicons name="alert-circle-outline" size={24} color={Colors.danger} />
        </TouchableOpacity>
      </View>

      <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg, alignSelf: 'center', marginBottom: Spacing.md }]}>
        <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
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

        {/* Thông tin đánh giá của đối tác (họ đánh giá mình) */}
        {(() => {
          const partnerRating = allRatings.find(r => r.reviewerId !== currentUser?.id);
          if (!partnerRating) return null;
          return (
            <View style={[styles.sectionCard, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0', marginTop: 16 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Avatar uri={partnerRating.reviewerAvatarUrl} name={partnerRating.reviewerName} size={28} />
                  <Text style={[styles.sectionHeader, { marginBottom: 0, color: '#166534', marginLeft: 8 }]}>
                    {partnerRating.reviewerName} đánh giá bạn
                  </Text>
                </View>
                <View style={{ flexDirection: 'row' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={partnerRating.overallStars >= star ? 'star' : 'star-outline'}
                      size={16}
                      color={partnerRating.overallStars >= star ? Colors.warning : Colors.border}
                    />
                  ))}
                </View>
              </View>

              {partnerRating.comment ? (
                <Text style={{ fontSize: 14, color: '#166534', fontStyle: 'italic', marginBottom: 12 }}>
                  "{partnerRating.comment}"
                </Text>
              ) : (
                <Text style={{ fontSize: 14, color: Colors.textMuted, fontStyle: 'italic', marginBottom: 12 }}>
                  Không có nhận xét.
                </Text>
              )}

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {partnerRating.punctualityScore !== undefined && partnerRating.punctualityScore !== null && (
                  <Text style={{ fontSize: 12, color: '#15803D' }}>⏱ Đúng giờ: <Text style={{ fontWeight: '600' }}>{partnerRating.punctualityScore}</Text></Text>
                )}
                {partnerRating.attitudeScore !== undefined && partnerRating.attitudeScore !== null && (
                  <Text style={{ fontSize: 12, color: '#15803D' }}>😊 Thái độ: <Text style={{ fontWeight: '600' }}>{partnerRating.attitudeScore}</Text></Text>
                )}
                {partnerRating.communicationScore !== undefined && partnerRating.communicationScore !== null && (
                  <Text style={{ fontSize: 12, color: '#15803D' }}>💬 Giao tiếp: <Text style={{ fontWeight: '600' }}>{partnerRating.communicationScore}</Text></Text>
                )}
                {partnerRating.qualityScore !== undefined && partnerRating.qualityScore !== null && (
                  <Text style={{ fontSize: 12, color: '#15803D' }}>🎓 Chất lượng: <Text style={{ fontWeight: '600' }}>{partnerRating.qualityScore}</Text></Text>
                )}
              </View>
            </View>
          );
        })()}

        {/* Thông tin đánh giá của tôi (mình đánh giá họ) */}
        {(() => {
          const myRating = allRatings.find(r => r.reviewerId === currentUser?.id);
          if (!myRating) return null;
          return (
            <View style={[styles.sectionCard, { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB', marginTop: 16 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Avatar uri={myRating.reviewerAvatarUrl} name={myRating.reviewerName} size={28} />
                  <Text style={[styles.sectionHeader, { marginBottom: 0, color: Colors.primary, marginLeft: 8 }]}>
                    Đánh giá của bạn
                  </Text>
                </View>
                <View style={{ flexDirection: 'row' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={myRating.overallStars >= star ? 'star' : 'star-outline'}
                      size={16}
                      color={myRating.overallStars >= star ? Colors.warning : Colors.border}
                    />
                  ))}
                </View>
              </View>

              {myRating.comment ? (
                <Text style={{ fontSize: 14, color: Colors.textSecondary, fontStyle: 'italic', marginBottom: 12 }}>
                  "{myRating.comment}"
                </Text>
              ) : (
                <Text style={{ fontSize: 14, color: Colors.textMuted, fontStyle: 'italic', marginBottom: 12 }}>
                  Không có nhận xét.
                </Text>
              )}

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {myRating.punctualityScore !== undefined && myRating.punctualityScore !== null && (
                  <Text style={{ fontSize: 12, color: Colors.textSecondary }}>⏱ Đúng giờ: <Text style={{ fontWeight: '600' }}>{myRating.punctualityScore}</Text></Text>
                )}
                {myRating.attitudeScore !== undefined && myRating.attitudeScore !== null && (
                  <Text style={{ fontSize: 12, color: Colors.textSecondary }}>😊 Thái độ: <Text style={{ fontWeight: '600' }}>{myRating.attitudeScore}</Text></Text>
                )}
                {myRating.communicationScore !== undefined && myRating.communicationScore !== null && (
                  <Text style={{ fontSize: 12, color: Colors.textSecondary }}>💬 Giao tiếp: <Text style={{ fontWeight: '600' }}>{myRating.communicationScore}</Text></Text>
                )}
                {myRating.qualityScore !== undefined && myRating.qualityScore !== null && (
                  <Text style={{ fontSize: 12, color: Colors.textSecondary }}>🎓 Chất lượng: <Text style={{ fontWeight: '600' }}>{myRating.qualityScore}</Text></Text>
                )}
              </View>
            </View>
          );
        })()}
      </ScrollView>

      {/* Footer Actions */}
      {(isAwaitingResponse || canManageConfirmed || statusStr === 'IN_PROGRESS' || statusStr === 'COMPLETED') && (
        <View style={styles.footer}>
          {isAwaitingResponse && canAccept && (
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

          {isAwaitingResponse && !canAccept && (
            <View style={styles.waitingBox}>
              <Ionicons name={isExpired ? 'alert-circle-outline' : 'hourglass-outline'} size={16} color="#B45309" />
              <Text style={styles.waitingText}>
                {isExpired ? 'Lịch đã quá giờ. Hãy đề xuất thời gian mới.' : 'Đang chờ người còn lại phản hồi đề xuất này'}
              </Text>
            </View>
          )}

          {isAwaitingResponse && (
            <View style={[styles.footerRow, { marginTop: 10 }]}>
              <TouchableOpacity style={[styles.actionBtn, styles.secondaryBtn]} onPress={openRescheduleModal} disabled={actionLoading}>
                <Ionicons name="calendar-outline" size={17} color="#2563EB" style={{ marginRight: 6 }} />
                <Text style={styles.secondaryBtnText}>Đổi lịch</Text>
              </TouchableOpacity>
              {!canAccept && (
                <TouchableOpacity style={[styles.actionBtn, styles.dangerBtn]} onPress={() => handleRespond('CANCEL')} disabled={actionLoading}>
                  <Text style={styles.dangerBtnText}>Hủy đề xuất</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {canManageConfirmed && (
            <>
              <View style={styles.footerRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#0D9488' }]}
                  onPress={handleVerify}
                >
                <Ionicons name={isOffline ? 'qr-code' : 'keypad'} size={18} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.btnTextWhite}>Bắt Đầu / Xác Thực {isOffline ? 'QR Code' : 'OTP'}</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.footerRow, { marginTop: 10 }]}>
                <TouchableOpacity style={[styles.actionBtn, styles.secondaryBtn]} onPress={openRescheduleModal} disabled={actionLoading}>
                  <Ionicons name="calendar-outline" size={17} color="#2563EB" style={{ marginRight: 6 }} />
                  <Text style={styles.secondaryBtnText}>Đổi lịch</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.dangerBtn]} onPress={() => handleRespond('CANCEL')} disabled={actionLoading}>
                  <Text style={styles.dangerBtnText}>Hủy lịch</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {statusStr === 'IN_PROGRESS' && (
            <View style={styles.footerRow}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.primary }]} onPress={() => setShowModal(true)}>
                <Ionicons name="checkmark-done-circle" size={18} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.btnTextWhite}>Xác Nhận Hoàn Thành</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Nút Đánh giá — chỉ hiện khi COMPLETED và CHƯA đánh giá */}
          {statusStr === 'COMPLETED' && !allRatings.find(r => r.reviewerId === currentUser?.id) && (() => {
            const isProvider = currentUser?.id === appointment.providerId;
            const otherUserId   = isProvider ? appointment.receiverId  : appointment.providerId;
            const otherUserName  = isProvider ? appointment.receiverName : appointment.providerName;
            const otherUserAvatar = isProvider ? appointment.receiverAvatarUrl : appointment.providerAvatarUrl;
            return (
              <View style={styles.footerRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#7C3AED' }]}
                  onPress={() =>
                    router.push({
                      pathname: '/rating',
                      params: {
                        appointmentId: appointment.id,
                        revieweeId: otherUserId ?? '',
                        revieweeName: otherUserName ?? '',
                        revieweeAvatar: otherUserAvatar ?? '',
                        appointmentTitle: titleStr,
                      },
                    } as any)
                  }
                >
                  <Ionicons name="star" size={18} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.btnTextWhite}>Đánh giá {otherUserName ?? 'người dùng'}</Text>
                </TouchableOpacity>
              </View>
            );
          })()}
        </View>
      )}

      {/* Completion Modal */}
      <CancelAppointmentModal
        visible={showCancelModal}
        appointmentTitle={appointment.title}
        loading={actionLoading}
        onClose={() => setShowCancelModal(false)}
        onSubmit={submitCancellation}
      />

      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Xác Nhận Hoàn Thành</Text>
              <Text style={styles.modalSub}>
                {hasIssue
                  ? 'Lịch hẹn sẽ chuyển sang tranh chấp và Time Credit chưa được chuyển.'
                  : 'Chỉ cần một người xác nhận. Lịch hẹn sẽ hoàn thành và Time Credit được chuyển ngay.'}
              </Text>

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
                  {actionLoading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.btnTextWhite}>{hasIssue ? 'Gửi Báo Cáo' : 'Hoàn Tất'}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Reschedule Modal */}
      <Modal visible={showRescheduleModal} transparent animationType="slide" onRequestClose={() => setShowRescheduleModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Đề Xuất Đổi Lịch</Text>
            <Text style={styles.modalSub}>Chọn thời gian mới. Người còn lại cần chấp nhận trước khi lịch được xác nhận lại.</Text>

            <Text style={styles.inputLabel}>Ngày hẹn mới *</Text>
            <TouchableOpacity style={styles.pickerField} onPress={() => setReschedulePicker('date')}>
              <Ionicons name="calendar-outline" size={19} color="#2563EB" />
              <Text style={styles.pickerFieldText}>{rescheduleDate || 'Chọn ngày'}</Text>
              <Ionicons name="chevron-down" size={18} color={Colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.footerRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Bắt đầu *</Text>
                <TouchableOpacity style={styles.pickerField} onPress={() => setReschedulePicker('start')}>
                  <Ionicons name="time-outline" size={18} color="#2563EB" />
                  <Text style={styles.pickerFieldText}>{rescheduleStart || 'Chọn giờ'}</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Kết thúc *</Text>
                <TouchableOpacity style={styles.pickerField} onPress={() => setReschedulePicker('end')}>
                  <Ionicons name="time-outline" size={18} color="#2563EB" />
                  <Text style={styles.pickerFieldText}>{rescheduleEnd || 'Chọn giờ'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: Colors.bgCard }]} onPress={() => setShowRescheduleModal(false)}>
                <Text style={{ color: Colors.textPrimary, fontWeight: '600' }}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#2563EB' }]} onPress={submitReschedule} disabled={actionLoading}>
                {actionLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnTextWhite}>Gửi đề xuất</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <DateTimePickerModal
          visible={reschedulePicker !== null}
          mode={reschedulePicker === 'date' ? 'date' : 'time'}
          initialValue={reschedulePicker === 'date'
            ? rescheduleDate
            : reschedulePicker === 'start' ? rescheduleStart : rescheduleEnd}
          title={reschedulePicker === 'date'
            ? 'Chọn ngày hẹn mới'
            : reschedulePicker === 'start' ? 'Chọn giờ bắt đầu' : 'Chọn giờ kết thúc'}
          onClose={() => setReschedulePicker(null)}
          onSelect={(value) => {
            if (reschedulePicker === 'date') setRescheduleDate(value);
            else if (reschedulePicker === 'start') setRescheduleStart(value);
            else setRescheduleEnd(value);
          }}
        />
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
                  if (!/^https?:\/\//i.test(meetingLink.trim())) {
                    Alert.alert('Lỗi', 'Link họp phải bắt đầu bằng http:// hoặc https://');
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
  waitingBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    paddingVertical: 12, borderRadius: Radius.md,
    backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A',
  },
  waitingText: { color: '#B45309', fontSize: 13, fontWeight: '600' },
  secondaryBtn: { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' },
  secondaryBtnText: { color: '#2563EB', fontWeight: '700', fontSize: 14 },
  dangerBtn: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  dangerBtnText: { color: '#DC2626', fontWeight: '700', fontSize: 14 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: Spacing.lg },
  modalCard: { backgroundColor: '#FFF', borderRadius: Radius.xl, padding: Spacing.lg, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 10 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6, textAlign: 'center' },
  modalSub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', marginBottom: 16, lineHeight: 18 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, marginBottom: 6, marginTop: 10 },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: Colors.textPrimary },
  pickerField: {
    minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  pickerFieldText: { flex: 1, color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  modalBtnRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
});
