import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import SkillApi, { type SkillAttachmentResponse } from '@api/skill';
import { Colors, Radius, Spacing } from '@constants/Colors';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const formatBytes = (bytes?: number) => {
  if (!bytes || bytes <= 0) return 'Không rõ dung lượng';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const documentIcon = (name: string): IoniconName => {
  const extension = name.split('.').pop()?.toLowerCase();
  if (extension === 'pdf') return 'document-text-outline';
  if (extension === 'ppt' || extension === 'pptx') return 'easel-outline';
  return 'document-outline';
};

export default function PublicSkillEvidenceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string | string[];
    skillName?: string | string[];
    ownerName?: string | string[];
  }>();
  const skillId = Array.isArray(params.id) ? params.id[0] : params.id;
  const skillName = Array.isArray(params.skillName) ? params.skillName[0] : params.skillName;
  const ownerName = Array.isArray(params.ownerName) ? params.ownerName[0] : params.ownerName;

  const [attachments, setAttachments] = useState<SkillAttachmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const loadEvidence = useCallback(async () => {
    if (!skillId) {
      setError('Không tìm thấy kỹ năng cần xem minh chứng.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await SkillApi.getAttachments(skillId);
      setAttachments(response.data?.data ?? []);
    } catch (requestError: any) {
      const status = requestError?.response?.status;
      const serverMessage = requestError?.response?.data?.message;
      setAttachments([]);
      setError(
        serverMessage
        ?? (status === 403
          ? 'Minh chứng này không còn được công khai.'
          : 'Không thể tải minh chứng. Vui lòng thử lại.'),
      );
    } finally {
      setLoading(false);
    }
  }, [skillId]);

  useEffect(() => {
    loadEvidence();
  }, [loadEvidence]);

  const openAttachment = async (attachment: SkillAttachmentResponse) => {
    if (attachment.fileType === 'IMAGE') {
      setPreviewImage(attachment.fileUrl);
      return;
    }

    try {
      const supported = await Linking.canOpenURL(attachment.fileUrl);
      if (!supported) {
        Alert.alert('Không thể mở tài liệu', 'Thiết bị không hỗ trợ liên kết của tài liệu này.');
        return;
      }
      await Linking.openURL(attachment.fileUrl);
    } catch {
      Alert.alert('Không thể mở tài liệu', 'Vui lòng kiểm tra kết nối mạng rồi thử lại.');
    }
  };

  const renderItem = ({ item }: { item: SkillAttachmentResponse }) => {
    const isImage = item.fileType === 'IMAGE';
    const imageFailed = failedImages.has(item.id);

    return (
      <TouchableOpacity
        style={styles.evidenceCard}
        activeOpacity={0.82}
        onPress={() => void openAttachment(item)}
        accessibilityRole="button"
        accessibilityLabel={`${isImage ? 'Xem ảnh' : 'Mở tài liệu'} ${item.originalName}`}
      >
        <View style={[styles.previewBox, !isImage && styles.documentPreview]}>
          {isImage && !imageFailed ? (
            <Image
              source={{ uri: item.fileUrl }}
              style={styles.thumbnail}
              resizeMode="cover"
              onError={() => setFailedImages((current) => new Set(current).add(item.id))}
            />
          ) : (
            <Ionicons
              name={isImage ? 'image-outline' : documentIcon(item.originalName)}
              size={30}
              color={isImage ? '#64748B' : '#0D9488'}
            />
          )}
        </View>

        <View style={styles.evidenceInfo}>
          <Text style={styles.fileName} numberOfLines={2}>{item.originalName || 'Minh chứng kỹ năng'}</Text>
          <View style={styles.fileMetaRow}>
            <View style={[styles.fileTypeBadge, isImage ? styles.imageBadge : styles.documentBadge]}>
              <Ionicons
                name={isImage ? 'image-outline' : 'document-text-outline'}
                size={12}
                color={isImage ? '#2563EB' : '#C2410C'}
              />
              <Text style={[styles.fileTypeText, { color: isImage ? '#2563EB' : '#C2410C' }]}>
                {isImage ? 'Ảnh' : 'Tài liệu'}
              </Text>
            </View>
            <Text style={styles.fileSize}>{formatBytes(item.fileSize)}</Text>
          </View>
          <Text style={styles.openHint}>{isImage ? 'Nhấn để xem toàn màn hình' : 'Nhấn để mở tài liệu'}</Text>
        </View>

        <Ionicons name="chevron-forward" size={19} color="#94A3B8" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Quay lại hồ sơ"
        >
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Minh chứng kỹ năng</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>{skillName || 'Kỹ năng đang chia sẻ'}</Text>
        </View>
        <View style={styles.headerPlaceholder} />
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.stateDescription}>Đang tải minh chứng...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <View style={styles.stateIconError}>
            <Ionicons name="alert-circle-outline" size={34} color="#B45309" />
          </View>
          <Text style={styles.stateTitle}>Chưa thể xem minh chứng</Text>
          <Text style={styles.stateDescription}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadEvidence}>
            <Ionicons name="refresh" size={17} color="#FFFFFF" />
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : attachments.length === 0 ? (
        <View style={styles.centerState}>
          <View style={styles.stateIconEmpty}>
            <Ionicons name="shield-checkmark-outline" size={34} color="#0D9488" />
          </View>
          <Text style={styles.stateTitle}>Chưa có minh chứng</Text>
          <Text style={styles.stateDescription}>
            {ownerName || 'Người hỗ trợ'} chưa đăng ảnh, chứng chỉ hoặc tài liệu cho kỹ năng này.
          </Text>
        </View>
      ) : (
        <FlatList
          data={attachments}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={(
            <View style={styles.introCard}>
              <View style={styles.introIcon}>
                <Ionicons name="shield-checkmark" size={22} color="#047857" />
              </View>
              <View style={styles.introText}>
                <Text style={styles.introTitle}>{attachments.length} minh chứng công khai</Text>
                <Text style={styles.introDescription}>
                  Ảnh và tài liệu do người hỗ trợ cung cấp để bổ sung độ tin cậy cho kỹ năng.
                </Text>
              </View>
            </View>
          )}
        />
      )}

      <Modal
        visible={Boolean(previewImage)}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImage(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setPreviewImage(null)}
            accessibilityRole="button"
            accessibilityLabel="Đóng ảnh minh chứng"
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          {previewImage && (
            <Image source={{ uri: previewImage }} style={styles.fullImage} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0',
  },
  headerText: { flex: 1, alignItems: 'center', paddingHorizontal: 10 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  headerSubtitle: { fontSize: 11, color: '#64748B', marginTop: 2, maxWidth: '100%' },
  headerPlaceholder: { width: 40 },
  centerState: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 34,
  },
  stateIconError: {
    width: 70, height: 70, borderRadius: 24, backgroundColor: '#FFF7ED',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  stateIconEmpty: {
    width: 70, height: 70, borderRadius: 24, backgroundColor: '#CCFBF1',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  stateTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', textAlign: 'center' },
  stateDescription: { fontSize: 13, lineHeight: 20, color: '#64748B', textAlign: 'center', marginTop: 8 },
  retryButton: {
    flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: Colors.primary,
    paddingHorizontal: 18, paddingVertical: 11, borderRadius: Radius.lg, marginTop: 18,
  },
  retryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  listContent: { padding: Spacing.md, paddingBottom: 32 },
  introCard: {
    flexDirection: 'row', gap: 12, backgroundColor: '#ECFDF5', borderRadius: Radius.xl,
    borderWidth: 1, borderColor: '#A7F3D0', padding: 14, marginBottom: 14,
  },
  introIcon: {
    width: 42, height: 42, borderRadius: 14, backgroundColor: '#D1FAE5',
    alignItems: 'center', justifyContent: 'center',
  },
  introText: { flex: 1 },
  introTitle: { fontSize: 14, fontWeight: '800', color: '#065F46' },
  introDescription: { fontSize: 12, lineHeight: 18, color: '#047857', marginTop: 3 },
  evidenceCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl, borderWidth: 1, borderColor: '#E2E8F0', padding: 12,
    marginBottom: 10, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  previewBox: {
    width: 64, height: 64, borderRadius: 14, overflow: 'hidden', backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
  },
  documentPreview: { backgroundColor: '#CCFBF1' },
  thumbnail: { width: '100%', height: '100%' },
  evidenceInfo: { flex: 1 },
  fileName: { fontSize: 14, lineHeight: 19, fontWeight: '700', color: '#0F172A' },
  fileMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  fileTypeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7,
    paddingVertical: 3, borderRadius: 10,
  },
  imageBadge: { backgroundColor: '#DBEAFE' },
  documentBadge: { backgroundColor: '#FFEDD5' },
  fileTypeText: { fontSize: 10, fontWeight: '700' },
  fileSize: { fontSize: 11, color: '#64748B' },
  openHint: { fontSize: 11, color: '#0D9488', marginTop: 6, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(2,6,23,0.94)', alignItems: 'center', justifyContent: 'center' },
  modalClose: {
    position: 'absolute', zIndex: 2, right: 18, top: 54, width: 44, height: 44,
    borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center',
  },
  fullImage: { width: '100%', height: '84%' },
});
