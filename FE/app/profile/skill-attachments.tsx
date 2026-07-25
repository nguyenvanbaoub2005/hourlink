import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, Alert, Image, Modal, ScrollView,
  Platform, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Colors } from '@constants/Colors';
import SkillApi from '@api/skill';

// ─── Types ─────────────────────────────────────────────────────────────────────
type Attachment = {
  id: string;
  fileUrl: string;
  publicId: string;
  originalName: string;
  fileType: 'IMAGE' | 'DOCUMENT';
  fileSize: number;
  createdAt: string;
};

// ─── Helpers ────────────────────────────────────────────────────────────────────
function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(fileType: string, originalName: string): string {
  if (fileType === 'IMAGE') return 'image';
  const ext = originalName?.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf') return 'document-text';
  if (['doc', 'docx'].includes(ext)) return 'document';
  if (['ppt', 'pptx'].includes(ext)) return 'easel';
  return 'attach';
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function SkillAttachmentsScreen() {
  const router = useRouter();
  const { skillId, skillName } = useLocalSearchParams<{ skillId: string; skillName: string }>();

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fetchAttachments = useCallback(async () => {
    if (!skillId) return;
    try {
      const res = await SkillApi.getAttachments(skillId);
      setAttachments(res.data?.data ?? []);
    } catch (e) {
      console.error('Lỗi tải attachments:', e);
    } finally {
      setLoading(false);
    }
  }, [skillId]);

  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  // ── Upload ──────────────────────────────────────────────────────────────────
  const uploadFile = async (uri: string, name: string, type: string) => {
    if (!skillId) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name: name,
        type: type,
      } as any);

      await SkillApi.uploadAttachment(skillId, formData);
      Alert.alert('Thành công ✅', 'File đã được upload!');
      await fetchAttachments();
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? 'Không thể upload file. Vui lòng thử lại.';
      Alert.alert('Lỗi', msg);
    } finally {
      setUploading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền truy cập ảnh trong cài đặt.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const name = asset.fileName ?? `image_${Date.now()}.jpg`;
      const type = asset.mimeType ?? 'image/jpeg';
      await uploadFile(asset.uri, name, type);
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      ],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      await uploadFile(asset.uri, asset.name, asset.mimeType ?? 'application/octet-stream');
    }
  };

  const showUploadOptions = () => {
    Alert.alert(
      '📎 Thêm minh chứng',
      'Chọn loại file bạn muốn upload',
      [
        { text: '🖼️ Tải ảnh lên', onPress: pickImage },
        { text: '📄 Tải tệp lên', onPress: pickDocument },
        { text: 'Hủy', style: 'cancel' },
      ]
    );
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = (attachment: Attachment) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc muốn xóa "${attachment.originalName}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await SkillApi.deleteAttachment(attachment.id);
              setAttachments(prev => prev.filter(a => a.id !== attachment.id));
            } catch (e) {
              Alert.alert('Lỗi', 'Không thể xóa file này.');
            }
          },
        },
      ]
    );
  };

  // ── Render item ─────────────────────────────────────────────────────────────
  const renderItem = ({ item }: { item: Attachment }) => {
    const isImage = item.fileType === 'IMAGE';
    const iconName = getFileIcon(item.fileType, item.originalName) as any;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => isImage ? setPreviewImage(item.fileUrl) : Linking.openURL(item.fileUrl)}
        activeOpacity={0.85}
      >
        {/* Thumbnail / Icon */}
        <View style={[styles.thumbBox, isImage && styles.thumbBoxImg]}>
          {isImage ? (
            <Image source={{ uri: item.fileUrl }} style={styles.thumb} resizeMode="cover" />
          ) : (
            <View style={styles.docIconBox}>
              <Ionicons name={iconName} size={30} color={Colors.primary} />
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.cardInfo}>
          <Text style={styles.fileName} numberOfLines={1}>{item.originalName}</Text>
          <View style={styles.metaRow}>
            <View style={[styles.typeBadge, isImage ? styles.badgeImg : styles.badgeDoc]}>
              <Text style={[styles.typeText, isImage ? styles.typeTextImg : styles.typeTextDoc]}>
                {isImage ? '🖼️ Ảnh' : '📄 Tài liệu'}
              </Text>
            </View>
            <Text style={styles.sizeText}>{formatBytes(item.fileSize)}</Text>
          </View>
          <Text style={styles.openHint}>{isImage ? 'Nhấn để xem ảnh' : 'Nhấn để mở file'}</Text>
        </View>

        {/* Delete button */}
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="trash-outline" size={20} color="#ef4444" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navIcon}>
          <Ionicons name="chevron-back" size={26} color="#0F172A" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Minh chứng kỹ năng</Text>
          <Text style={styles.headerSub} numberOfLines={1}>{skillName}</Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, uploading && { opacity: 0.5 }]}
          onPress={showUploadOptions}
          disabled={uploading}
        >
          {uploading
            ? <ActivityIndicator size="small" color="#fff" />
            : <Ionicons name="add" size={22} color="#fff" />
          }
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : attachments.length === 0 ? (
        <View style={styles.emptyBox}>
          <View style={styles.emptyIllustration}>
            <Ionicons name="cloud-upload-outline" size={60} color={Colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Chưa có minh chứng nào</Text>
          <Text style={styles.emptyDesc}>
            Upload ảnh chứng chỉ, bằng cấp, hay tài liệu để tăng độ tin cậy và thu hút người học.
          </Text>
          <TouchableOpacity style={styles.uploadBtn} onPress={showUploadOptions}>
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.uploadBtnText}>Thêm minh chứng đầu tiên</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={attachments}
          keyExtractor={i => i.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <TouchableOpacity style={styles.addMoreRow} onPress={showUploadOptions} disabled={uploading}>
              <View style={styles.addMoreLeft}>
                <View style={styles.addMoreIcon}>
                  {uploading
                    ? <ActivityIndicator size="small" color={Colors.primary} />
                    : <Ionicons name="add" size={22} color={Colors.primary} />
                  }
                </View>
                <Text style={styles.addMoreText}>{uploading ? 'Đang upload...' : 'Thêm minh chứng mới'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          }
        />
      )}

      {/* Image Preview Modal */}
      <Modal visible={!!previewImage} transparent animationType="fade" onRequestClose={() => setPreviewImage(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setPreviewImage(null)}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setPreviewImage(null)}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            {previewImage && (
              <Image
                source={{ uri: previewImage }}
                style={styles.previewImg}
                resizeMode="contain"
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  navIcon: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },
  headerSub: { fontSize: 12, color: '#64748B', marginTop: 1 },
  addBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },

  // Empty state
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyBox: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, gap: 12,
  },
  emptyIllustration: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: '#ECFDF5',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  emptyDesc: {
    fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22,
  },
  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: 14, marginTop: 8,
  },
  uploadBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },

  // List
  list: { padding: 16, gap: 12 },

  addMoreRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    borderWidth: 1.5, borderColor: Colors.primary, borderStyle: 'dashed',
    marginBottom: 4,
  },
  addMoreLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  addMoreIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center',
  },
  addMoreText: { fontSize: 15, fontWeight: '600', color: Colors.primary },

  // Card
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 16, padding: 12,
    borderWidth: 1, borderColor: '#E2E8F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    gap: 12,
  },
  thumbBox: {
    width: 64, height: 64, borderRadius: 12,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  thumbBoxImg: { borderWidth: 1, borderColor: '#E2E8F0' },
  thumb: { width: '100%', height: '100%' },
  docIconBox: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#ECFDF5',
  },
  cardInfo: { flex: 1 },
  fileName: { fontSize: 14, fontWeight: '600', color: '#0F172A', marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  badgeImg: { backgroundColor: '#EFF6FF' },
  badgeDoc: { backgroundColor: '#FFF7ED' },
  typeText: { fontSize: 11, fontWeight: '600' },
  typeTextImg: { color: '#3B82F6' },
  typeTextDoc: { color: '#F97316' },
  sizeText: { fontSize: 12, color: '#94A3B8' },
  openHint: { fontSize: 11, color: Colors.primary, fontWeight: '500' },

  deleteBtn: {
    padding: 8, borderRadius: 10, backgroundColor: '#FEF2F2',
  },

  // Preview modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalContent: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  modalClose: {
    position: 'absolute', top: 52, right: 20, zIndex: 10,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  previewImg: { width: '95%', height: '80%' },
});
