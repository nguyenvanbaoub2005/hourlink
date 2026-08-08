import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import CommunityApi from '@api/community';
import { Colors, Radius, Spacing } from '@constants/Colors';
import type { ParticipantResponse } from '@types';

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function ActivityEvidenceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [participant, setParticipant] = useState<ParticipantResponse | null>(null);
  const [selected, setSelected] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>();

  const load = async () => {
    try {
      const response = await CommunityApi.getMyParticipation(id);
      const data = response.data.data;
      setParticipant(data);
      setNote(data.evidenceNote ?? '');
    } catch (error: any) {
      Alert.alert('Lỗi', error?.response?.data?.message ?? 'Không thể tải thông tin tham gia.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const pickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Cần quyền truy cập', 'Vui lòng cho phép HourLink truy cập thư viện ảnh.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES,
      orderedSelection: true,
      quality: 0.8,
    });
    if (result.canceled) return;

    const oversized = result.assets.find(asset => (asset.fileSize ?? 0) > MAX_FILE_SIZE);
    if (oversized) {
      Alert.alert('Ảnh quá lớn', 'Mỗi ảnh minh chứng không được vượt quá 5 MB.');
      return;
    }
    setSelected(result.assets.slice(0, MAX_IMAGES));
  };

  const submit = async () => {
    if (selected.length === 0 && !participant?.evidence?.length) {
      Alert.alert('Thiếu ảnh', 'Vui lòng chọn ít nhất một ảnh minh chứng.');
      return;
    }
    if (note.trim().length > 500) {
      Alert.alert('Ghi chú quá dài', 'Ghi chú chỉ được tối đa 500 ký tự.');
      return;
    }

    const formData = new FormData();
    selected.forEach((asset, index) => {
      const uploadFile = asset.file ?? ({
        uri: asset.uri,
        name: asset.fileName ?? `minh-chung-${index + 1}.jpg`,
        type: asset.mimeType ?? 'image/jpeg',
      } as any);
      formData.append('files', uploadFile as any);
    });
    formData.append('note', note.trim());

    try {
      setSubmitting(true);
      const response = await CommunityApi.submitEvidence(id, formData);
      setParticipant(response.data.data);
      setSelected([]);
      Alert.alert('Đã gửi minh chứng', participant?.status === 'CONFIRMED'
        ? 'Minh chứng đã được bổ sung vào hồ sơ hoạt động.'
        : 'Tổ chức có thể xem ảnh trước khi xác nhận số giờ.');
    } catch (error: any) {
      Alert.alert('Không thể gửi', error?.response?.data?.message ?? 'Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !participant) {
    return <SafeAreaView style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></SafeAreaView>;
  }

  const hasEnded = new Date(participant.activityEndTime) <= new Date();
  const canSubmit = participant.status !== 'CANCELLED' && hasEnded;
  const images = selected.length > 0
    ? selected.map((asset, index) => ({ id: `${asset.uri}-${index}`, url: asset.uri }))
    : (participant.evidence ?? []).map(item => ({ id: item.id, url: item.fileUrl }));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Minh Chứng Tham Gia</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.activityTitle}>{participant.activityTitle}</Text>
        <Text style={styles.meta}>Kết thúc: {new Date(participant.activityEndTime).toLocaleString('vi-VN')}</Text>

        {!canSubmit && (
          <View style={styles.notice}>
            <Ionicons name="information-circle-outline" size={20} color="#92400E" />
            <Text style={styles.noticeText}>
              {participant.status === 'CANCELLED'
                ? 'Đăng ký này đã bị hủy nên không thể gửi minh chứng.'
                : 'Bạn chỉ có thể gửi minh chứng sau khi hoạt động kết thúc.'}
            </Text>
          </View>
        )}

        {participant.status === 'CONFIRMED' && (
          <View style={styles.confirmedNotice}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#047857" />
            <Text style={styles.confirmedNoticeText}>Bạn đã được xác nhận và nhận Credit. Minh chứng gửi thêm sẽ được lưu vào hồ sơ hoạt động.</Text>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ảnh minh chứng ({images.length}/{MAX_IMAGES})</Text>
          {canSubmit && (
            <TouchableOpacity onPress={pickImages}>
              <Text style={styles.changeText}>{images.length ? 'Chọn lại' : 'Chọn ảnh'}</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.helper}>Chọn từ 1–5 ảnh, tối đa 5 MB mỗi ảnh.</Text>

        {images.length > 0 ? (
          <View style={styles.imageGrid}>
            {images.map(image => (
              <TouchableOpacity key={image.id} onPress={() => setPreviewUrl(image.url)}>
                <Image source={{ uri: image.url }} style={styles.thumbnail} />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <TouchableOpacity style={styles.emptyPicker} onPress={pickImages} disabled={!canSubmit}>
            <Ionicons name="images-outline" size={42} color={Colors.primary} />
            <Text style={styles.emptyTitle}>Chọn ảnh tham gia hoạt động</Text>
            <Text style={styles.helper}>Ảnh check-in, ảnh hoạt động hoặc giấy xác nhận</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.sectionTitle}>Ghi chú</Text>
        <TextInput
          style={[styles.noteInput, !canSubmit && styles.disabled]}
          value={note}
          onChangeText={setNote}
          editable={canSubmit}
          multiline
          maxLength={500}
          placeholder="Mô tả ngắn về quá trình tham gia (không bắt buộc)"
          placeholderTextColor={Colors.textMuted}
        />
        <Text style={styles.counter}>{note.length}/500</Text>

        {selected.length > 0 && participant.evidence?.length > 0 && (
          <Text style={styles.replaceWarning}>Ảnh mới sẽ thay thế bộ minh chứng đã gửi trước đó.</Text>
        )}

        <TouchableOpacity
          style={[styles.submitButton, (!canSubmit || submitting) && styles.disabledButton]}
          onPress={submit}
          disabled={!canSubmit || submitting}
        >
          {submitting
            ? <ActivityIndicator color="#FFFFFF" />
            : <Text style={styles.submitText}>{participant.evidence?.length ? 'Cập nhật minh chứng' : 'Gửi minh chứng'}</Text>}
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={!!previewUrl} transparent animationType="fade" onRequestClose={() => setPreviewUrl(undefined)}>
        <View style={styles.previewOverlay}>
          <TouchableOpacity style={styles.previewClose} onPress={() => setPreviewUrl(undefined)}>
            <Ionicons name="close" size={30} color="#FFFFFF" />
          </TouchableOpacity>
          {!!previewUrl && <Image source={{ uri: previewUrl }} style={styles.previewImage} resizeMode="contain" />}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: Colors.border },
  iconButton: { width: 32, height: 32, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  content: { padding: Spacing.md, paddingBottom: 36 },
  activityTitle: { fontSize: 21, fontWeight: '700', color: Colors.textPrimary },
  meta: { color: Colors.textMuted, marginTop: 6, marginBottom: 18 },
  notice: { flexDirection: 'row', gap: 8, padding: 12, backgroundColor: '#FEF3C7', borderRadius: Radius.md, marginBottom: 18 },
  noticeText: { flex: 1, color: '#92400E', lineHeight: 19 },
  confirmedNotice: { flexDirection: 'row', gap: 8, padding: 12, backgroundColor: '#D1FAE5', borderRadius: Radius.md, marginBottom: 18 },
  confirmedNoticeText: { flex: 1, color: '#047857', lineHeight: 19 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginTop: 12, marginBottom: 8 },
  changeText: { color: Colors.primary, fontWeight: '700', marginTop: 12 },
  helper: { color: Colors.textMuted, fontSize: 13, lineHeight: 18 },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginVertical: 14 },
  thumbnail: { width: 96, height: 96, borderRadius: Radius.md, backgroundColor: '#E2E8F0' },
  emptyPicker: { height: 170, borderWidth: 1.5, borderStyle: 'dashed', borderColor: Colors.primary, borderRadius: Radius.lg, marginVertical: 14, alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#F0FDFA' },
  emptyTitle: { color: Colors.primary, fontWeight: '700' },
  noteInput: { minHeight: 110, padding: 12, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, backgroundColor: '#FFFFFF', color: Colors.textPrimary, textAlignVertical: 'top' },
  counter: { textAlign: 'right', color: Colors.textMuted, fontSize: 12, marginTop: 4 },
  replaceWarning: { color: '#B45309', fontSize: 13, marginTop: 8 },
  submitButton: { marginTop: 20, padding: 15, borderRadius: Radius.md, backgroundColor: Colors.primary, alignItems: 'center' },
  submitText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  disabled: { backgroundColor: '#F1F5F9' },
  disabledButton: { opacity: 0.5 },
  previewOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', alignItems: 'center', justifyContent: 'center' },
  previewClose: { position: 'absolute', right: 18, top: 50, zIndex: 2, padding: 8 },
  previewImage: { width: '95%', height: '82%' },
});
