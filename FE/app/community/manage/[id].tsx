import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput, Image, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '@constants/Colors';
import CommunityApi from '@api/community';
import UserProfileSheet from '@components/UserProfileSheet';
import type { ActivityResponse, ParticipantResponse } from '@types';

export default function ManageParticipantsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [participants, setParticipants] = useState<ParticipantResponse[]>([]);
  const [activity, setActivity] = useState<ActivityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Trạng thái chọn người để xác nhận
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [actualHours, setActualHours] = useState('2');
  const [hoursById, setHoursById] = useState<Record<string, string>>({});
  const [confirmNote, setConfirmNote] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [markingAbsent, setMarkingAbsent] = useState(false);
  const [profileUserId, setProfileUserId] = useState<string>();
  const [previewImage, setPreviewImage] = useState<string>();

  const fetchParticipants = async () => {
    try {
      const [participantsRes, activityRes] = await Promise.all([
        CommunityApi.getParticipants(id as string, 0, 100),
        CommunityApi.getActivityDetail(id as string),
      ]);
      setParticipants(participantsRes.data?.data?.content || []);
      setActivity(activityRes.data?.data || null);
    } catch (e: any) {
      Alert.alert('Lỗi', e?.response?.data?.message || 'Không thể tải danh sách người tham gia.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, [id]);

  const toggleSelect = (participantId: string) => {
    const next = new Set(selectedIds);
    if (next.has(participantId)) next.delete(participantId);
    else next.add(participantId);
    setSelectedIds(next);
  };

  const selectAll = () => {
    const registered = participants.filter(p => p.status === 'REGISTERED').map(p => p.id);
    if (selectedIds.size === registered.length) {
      setSelectedIds(new Set()); // Bỏ chọn hết
    } else {
      setSelectedIds(new Set(registered)); // Chọn hết
    }
  };

  const handleConfirm = async () => {
    if (activity && new Date(activity.endTime) > new Date()) {
      return Alert.alert('Chưa thể xác nhận', 'Chỉ có thể xác nhận sau khi hoạt động kết thúc.');
    }
    if (selectedIds.size === 0) {
      Alert.alert('Lỗi', 'Vui lòng chọn ít nhất 1 người để xác nhận.');
      return;
    }
    const confirmations = Array.from(selectedIds).map(participantId => ({
      participantId,
      actualHours: parseFloat(hoursById[participantId] || actualHours),
      confirmNote: confirmNote.trim() || undefined,
    }));
    if (confirmations.some(item => !Number.isFinite(item.actualHours) || item.actualHours < 0.5)) {
      return Alert.alert('Lỗi', 'Số giờ của mỗi người phải từ 0.5 giờ.');
    }

    try {
      setConfirming(true);
      await CommunityApi.confirmParticipants(id as string, {
        confirmations,
      });
      Alert.alert('Thành công', `Đã xác nhận và cộng Credit theo số giờ thực tế cho ${selectedIds.size} người.`);
      setSelectedIds(new Set());
      setHoursById({});
      fetchParticipants();
    } catch (e: any) {
      Alert.alert('Lỗi', e.response?.data?.message || 'Không thể xác nhận.');
    } finally {
      setConfirming(false);
    }
  };

  const handleMarkAbsent = () => {
    if (activity && new Date(activity.endTime) > new Date()) {
      Alert.alert('Chưa thể xử lý', 'Chỉ có thể đánh dấu vắng sau khi hoạt động kết thúc.');
      return;
    }
    if (selectedIds.size === 0) {
      Alert.alert('Chưa chọn người', 'Vui lòng chọn ít nhất một người tham gia.');
      return;
    }

    Alert.alert('Đánh dấu vắng mặt?', `${selectedIds.size} người được chọn sẽ không nhận Credit.`, [
      { text: 'Quay lại', style: 'cancel' },
      {
        text: 'Đánh dấu vắng',
        style: 'destructive',
        onPress: async () => {
          try {
            setMarkingAbsent(true);
            await CommunityApi.markParticipantsAbsent(
              id as string,
              Array.from(selectedIds),
              confirmNote.trim() || undefined,
            );
            Alert.alert('Đã cập nhật', `Đã đánh dấu vắng mặt ${selectedIds.size} người.`);
            setSelectedIds(new Set());
            setHoursById({});
            setConfirmNote('');
            await fetchParticipants();
          } catch (e: any) {
            Alert.alert('Lỗi', e.response?.data?.message || 'Không thể đánh dấu vắng mặt.');
          } finally {
            setMarkingAbsent(false);
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: ParticipantResponse }) => {
    const isRegistered = item.status === 'REGISTERED';
    const isSelected = selectedIds.has(item.id);

    return (
      <View
        style={[styles.card, isSelected && styles.cardSelected]}
      >
        <View style={styles.cardRow}>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => toggleSelect(item.id)}
            disabled={!isRegistered}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected, disabled: !isRegistered }}
            accessibilityLabel={isRegistered ? `Chọn ${item.userName} để xác nhận` : `${item.userName} đã được xử lý`}
          >
            {isRegistered ? (
              <Ionicons
                name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                size={24}
                color={isSelected ? Colors.primary : Colors.border}
              />
            ) : item.status === 'CONFIRMED' ? (
              <Ionicons name="checkmark-done-circle" size={24} color="#059669" />
            ) : item.status === 'ABSENT' ? (
              <Ionicons name="close-circle" size={24} color="#DC2626" />
            ) : (
              <Ionicons name="ban" size={24} color={Colors.textMuted} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => setProfileUserId(item.userId)}
            accessibilityRole="button"
            accessibilityLabel={`Xem hồ sơ của ${item.userName}`}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>{item.userName.charAt(0).toUpperCase()}</Text>
            </View>

            <View style={styles.userInfo}>
              <Text style={styles.userName}>{item.userName}</Text>
              {item.status === 'CONFIRMED' ? (
                <Text style={styles.statusConfirmed}>Đã xác nhận ({item.actualHours}h)</Text>
              ) : item.status === 'REGISTERED' ? (
                <Text style={styles.statusRegistered}>Chờ xác nhận</Text>
              ) : item.status === 'ABSENT' ? (
                <Text style={styles.statusAbsent}>Vắng mặt{item.confirmNote ? ` · ${item.confirmNote}` : ''}</Text>
              ) : (
                <Text style={styles.statusCancelled}>Đã hủy</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          {isRegistered && isSelected && (
            <TextInput
              style={styles.itemHours}
              value={hoursById[item.id] || actualHours}
              onChangeText={(value) => setHoursById(current => ({ ...current, [item.id]: value }))}
              keyboardType="decimal-pad"
              placeholder="Giờ"
            />
          )}
        </View>

        {!!item.evidence?.length && (
          <View style={styles.evidenceSection}>
            <View style={styles.evidenceHeader}>
              <Ionicons name="camera-outline" size={17} color="#0D9488" />
              <Text style={styles.evidenceTitle}>Minh chứng ({item.evidence.length} ảnh)</Text>
              {!!item.evidenceSubmittedAt && (
                <Text style={styles.evidenceDate}>
                  {new Date(item.evidenceSubmittedAt).toLocaleDateString('vi-VN')}
                </Text>
              )}
            </View>
            <View style={styles.evidenceImages}>
              {item.evidence.map(evidence => (
                <TouchableOpacity key={evidence.id} onPress={() => setPreviewImage(evidence.fileUrl)}>
                  <Image source={{ uri: evidence.fileUrl }} style={styles.evidenceThumbnail} />
                </TouchableOpacity>
              ))}
            </View>
            {!!item.evidenceNote && <Text style={styles.evidenceNote}>{item.evidenceNote}</Text>}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý người tham gia</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <>
          <View style={styles.topActions}>
            <TouchableOpacity onPress={selectAll}>
              <Text style={styles.selectAllText}>Chọn tất cả chờ xác nhận</Text>
            </TouchableOpacity>
            <Text style={styles.countText}>{selectedIds.size} đang chọn</Text>
          </View>

          {activity && new Date(activity.endTime) > new Date() && (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>Có thể xác nhận sau {new Date(activity.endTime).toLocaleString('vi-VN')}.</Text>
            </View>
          )}

          <FlatList
            data={participants}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<Text style={styles.emptyText}>Chưa có ai đăng ký.</Text>}
          />

          <View style={styles.bottomBar}>
            <View style={styles.hoursInputRow}>
              <Text style={styles.hoursLabel}>Số giờ mặc định:</Text>
              <TextInput 
                style={styles.hoursInput}
                value={actualHours}
                onChangeText={setActualHours}
                keyboardType="numeric"
              />
            </View>
            <TextInput
              style={styles.noteInput}
              value={confirmNote}
              onChangeText={setConfirmNote}
              placeholder="Ghi chú xác nhận / lý do vắng mặt"
              placeholderTextColor={Colors.textMuted}
            />
            <Text style={styles.creditRule}>Credit được cộng theo quy đổi 1 giờ thực tế = 1 TC.</Text>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.absentBtn, (selectedIds.size === 0 || confirming || markingAbsent) && styles.disabledBtn]}
                onPress={handleMarkAbsent}
                disabled={selectedIds.size === 0 || confirming || markingAbsent}
              >
                {markingAbsent
                  ? <ActivityIndicator color="#DC2626" />
                  : <Text style={styles.absentBtnText}>Đánh dấu vắng</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, (selectedIds.size === 0 || confirming || markingAbsent) && styles.disabledBtn]}
                onPress={handleConfirm}
                disabled={selectedIds.size === 0 || confirming || markingAbsent}
              >
                {confirming ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmBtnText}>Xác nhận & Tặng Credit</Text>}
              </TouchableOpacity>
            </View>
          </View>

          <UserProfileSheet
            visible={!!profileUserId}
            userId={profileUserId}
            onClose={() => setProfileUserId(undefined)}
          />

          <Modal visible={!!previewImage} transparent animationType="fade" onRequestClose={() => setPreviewImage(undefined)}>
            <View style={styles.previewOverlay}>
              <TouchableOpacity style={styles.previewClose} onPress={() => setPreviewImage(undefined)}>
                <Ionicons name="close" size={30} color="#FFFFFF" />
              </TouchableOpacity>
              {!!previewImage && <Image source={{ uri: previewImage }} style={styles.previewImage} resizeMode="contain" />}
            </View>
          </Modal>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary },
  
  topActions: { flexDirection: 'row', justifyContent: 'space-between', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  selectAllText: { color: Colors.primary, fontWeight: 'bold' },
  countText: { color: Colors.textMuted },
  
  list: { padding: Spacing.md },
  card: { backgroundColor: '#fff', padding: Spacing.md, borderRadius: Radius.md, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  cardSelected: { borderColor: Colors.primary, backgroundColor: '#F0FDF4' },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  selectButton: { paddingVertical: 8, paddingRight: 12 },
  profileButton: { flex: 1, flexDirection: 'row', alignItems: 'center', minWidth: 0 },
  userInfo: { flex: 1, minWidth: 0 },
  evidenceSection: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  evidenceHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  evidenceTitle: { color: '#0D9488', fontWeight: '700', fontSize: 13 },
  evidenceDate: { marginLeft: 'auto', color: Colors.textMuted, fontSize: 11 },
  evidenceImages: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 9 },
  evidenceThumbnail: { width: 64, height: 64, borderRadius: Radius.sm, backgroundColor: '#E2E8F0' },
  evidenceNote: { color: Colors.textSecondary, fontSize: 13, lineHeight: 18, marginTop: 8 },
  
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarLetter: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  userName: { fontSize: 16, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 4 },
  statusRegistered: { color: '#D97706', fontSize: 13 },
  statusConfirmed: { color: '#059669', fontSize: 13, fontWeight: 'bold' },
  statusAbsent: { color: '#DC2626', fontSize: 13, fontWeight: '600' },
  statusCancelled: { color: '#EF4444', fontSize: 13 },
  
  emptyText: { textAlign: 'center', color: Colors.textMuted, marginTop: 40 },
  
  bottomBar: { padding: Spacing.md, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: Colors.border },
  hoursInputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  hoursLabel: { fontSize: 15, fontWeight: '500', marginRight: 12 },
  hoursInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 8, flex: 1, fontSize: 16 },
  itemHours: { width: 64, borderWidth: 1, borderColor: Colors.primary, borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 6, textAlign: 'center' },
  noteInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  notice: { marginHorizontal: Spacing.md, marginTop: 10, padding: 10, backgroundColor: '#FEF3C7', borderRadius: Radius.md },
  noticeText: { color: '#92400E', fontSize: 13 },
  creditRule: { color: Colors.textMuted, fontSize: 12, marginBottom: 10 },
  actionRow: { flexDirection: 'row', gap: 10 },
  absentBtn: { flex: 1, borderWidth: 1, borderColor: '#DC2626', padding: 14, borderRadius: Radius.md, alignItems: 'center' },
  absentBtnText: { color: '#DC2626', fontSize: 14, fontWeight: 'bold' },
  confirmBtn: { flex: 1.4, backgroundColor: Colors.primary, padding: 14, borderRadius: Radius.md, alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  disabledBtn: { opacity: 0.5 },
  previewOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', alignItems: 'center', justifyContent: 'center' },
  previewClose: { position: 'absolute', right: 18, top: 50, zIndex: 2, padding: 8 },
  previewImage: { width: '95%', height: '82%' },
});
