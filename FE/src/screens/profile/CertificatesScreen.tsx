import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import PracticeApi, { type PracticeAssessmentResponse } from '@api/practice';
import { Colors, Radius, Spacing } from '@constants/Colors';

export default function CertificatesScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'EARNED' | 'ISSUED'>('EARNED');
  const [earned, setEarned] = useState<PracticeAssessmentResponse[]>([]);
  const [issued, setIssued] = useState<PracticeAssessmentResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const [verifyCode, setVerifyCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [selectedCert, setSelectedCert] = useState<PracticeAssessmentResponse | null>(null);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      const [earnedRes, issuedRes] = await Promise.all([
        PracticeApi.getMyEarnedCertificates(),
        PracticeApi.getMyIssuedCertificates(),
      ]);
      setEarned(earnedRes.data?.data ?? []);
      setIssued(issuedRes.data?.data ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleVerify = async () => {
    if (!verifyCode.trim()) return;
    try {
      setVerifying(true);
      const res = await PracticeApi.verifyCertificate(verifyCode.trim());
      if (res.data?.data) {
        setSelectedCert(res.data.data);
      }
    } catch {
      Alert.alert('Không tìm thấy', `Mã chứng nhận "${verifyCode.trim()}" không tồn tại hoặc chưa được cấp.`);
    } finally {
      setVerifying(false);
    }
  };

  const shareCert = async (cert: PracticeAssessmentResponse) => {
    await Share.share({
      message:
        `🎓 CHỨNG NHẬN HOÀN THÀNH KỸ NĂNG HOURLINK\n` +
        `• Học viên: ${cert.learnerName}\n` +
        `• Kỹ năng: ${cert.skillTitle}\n` +
        `• Bài thực hành: ${cert.assignmentTitle}\n` +
        `• Điểm thực hành: ${cert.overallScore}/10 (${cert.certificateLevel})\n` +
        `• Người hướng dẫn: ${cert.mentorName}\n` +
        `• Mã xác thực số: ${cert.certificateCode}`,
    });
  };

  const data = tab === 'EARNED' ? earned : issued;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color="#0F172A" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={styles.headerTitle}>Chứng nhận Kỹ năng số</Text>
          <Text style={styles.headerSub}>Kiểm chứng năng lực thực hành kỹ năng mềm</Text>
        </View>
      </View>

      {/* Thanh tra cứu xác thực mã chứng nhận */}
      <View style={styles.verifyBar}>
        <Ionicons name="shield-checkmark-outline" size={18} color="#047857" />
        <TextInput
          style={styles.verifyInput}
          value={verifyCode}
          onChangeText={setVerifyCode}
          placeholder="Nhập mã xác thực (VD: HL-CERT-2026-XXXXXX)"
          placeholderTextColor="#94A3B8"
          autoCapitalize="characters"
        />
        <TouchableOpacity
          style={styles.verifyBtn}
          onPress={handleVerify}
          disabled={verifying || !verifyCode.trim()}
        >
          {verifying ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.verifyBtnText}>Tra cứu</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'EARNED' && styles.tabBtnActive]}
          onPress={() => setTab('EARNED')}
        >
          <Text style={[styles.tabText, tab === 'EARNED' && styles.tabTextActive]}>
            🎓 Đã đạt ({earned.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'ISSUED' && styles.tabBtnActive]}
          onPress={() => setTab('ISSUED')}
        >
          <Text style={[styles.tabText, tab === 'ISSUED' && styles.tabTextActive]}>
            👨‍🏫 Đã hướng dẫn & cấp ({issued.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : data.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="ribbon-outline" size={56} color="#0D9488" />
          <Text style={styles.emptyTitle}>
            {tab === 'EARNED' ? 'Chưa có chứng nhận kỹ năng nào' : 'Chưa cấp chứng nhận nào'}
          </Text>
          <Text style={styles.emptyDesc}>
            {tab === 'EARNED'
              ? 'Sau mỗi buổi hẹn trao đổi kỹ năng, hãy hoàn thành bài thực hành tình huống do người hướng dẫn giao và đạt từ 5.0/10 để nhận Chứng nhận Kỹ năng Số.'
              : 'Trong màn hình Chi tiết lịch hẹn mà bạn là Người hỗ trợ, hãy giao bài thực hành và chấm điểm để cấp chứng nhận cho học viên.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.certCard}
              activeOpacity={0.85}
              onPress={() => setSelectedCert(item)}
            >
              <View style={styles.certLeftIcon}>
                <Ionicons name="ribbon" size={26} color="#D97706" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.levelBadge}>{item.certificateLevel} · {item.overallScore}/10</Text>
                  <Text style={styles.codeText}>{item.certificateCode}</Text>
                </View>
                <Text style={styles.skillTitle}>{item.skillTitle}</Text>
                <Text style={styles.assignTitle} numberOfLines={1}>
                  Bài thực hành: {item.assignmentTitle}
                </Text>
                <Text style={styles.metaText}>
                  {tab === 'EARNED' ? `Hướng dẫn bởi: ${item.mentorName}` : `Học viên: ${item.learnerName}`}
                  {item.creditHours ? ` · ${item.creditHours} giờ` : ''}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        />
      )}

      {/* Modal Xem chi tiết Chứng nhận Kỹ năng số */}
      <Modal
        visible={!!selectedCert}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedCert(null)}
      >
        <View style={styles.modalOverlay}>
          {selectedCert && (
            <View style={styles.certificateFrame}>
              <View style={styles.certificateInner}>
                <View style={styles.certSeal}>
                  <Ionicons name="ribbon" size={34} color="#D97706" />
                </View>
                <Text style={styles.certOrg}>HOURLINK TIME-BANKING ACADEMY</Text>
                <Text style={styles.certHeading}>CHỨNG NHẬN KỸ NĂNG SỐ</Text>
                <Text style={styles.certSubHeading}>VERIFIED SOFT-SKILL & PEER LEARNING</Text>

                <Text style={styles.certPresentText}>Chứng nhận học viên</Text>
                <Text style={styles.certLearnerName}>{selectedCert.learnerName}</Text>

                <Text style={styles.certPresentText}>Đã hoàn thành khóa trao đổi & vượt qua bài thực hành</Text>
                <Text style={styles.certSkillName}>{selectedCert.skillTitle}</Text>
                <Text style={styles.certAssignment}>"{selectedCert.assignmentTitle}"</Text>

                <View style={styles.certScoreBadge}>
                  <Text style={styles.certScoreText}>
                    Điểm tổng kết: {selectedCert.overallScore}/10 · Xếp loại: {selectedCert.certificateLevel}
                  </Text>
                </View>

                <View style={styles.scoreBreakdown}>
                  <Text style={styles.scoreChip}>🗣️ Giao tiếp: {selectedCert.communicationScore}/10</Text>
                  <Text style={styles.scoreChip}>🎯 Tình huống: {selectedCert.applicationScore}/10</Text>
                  <Text style={styles.scoreChip}>💡 Tự tin: {selectedCert.confidenceScore}/10</Text>
                </View>

                <View style={styles.certFooterRow}>
                  <View>
                    <Text style={styles.certMetaLabel}>NGƯỜI HƯỚNG DẪN</Text>
                    <Text style={styles.certMetaValue}>{selectedCert.mentorName}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.certMetaLabel}>MÃ XÁC THỰC SỐ</Text>
                    <Text style={styles.certMetaCode}>{selectedCert.certificateCode}</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 16, width: '100%' }}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { flex: 1, backgroundColor: '#047857' }]}
                    onPress={() => shareCert(selectedCert)}
                  >
                    <Ionicons name="share-social" size={16} color="#FFF" />
                    <Text style={{ color: '#FFF', fontWeight: '700' }}>Chia sẻ</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#E2E8F0', paddingHorizontal: 18 }]}
                    onPress={() => setSelectedCert(null)}
                  >
                    <Text style={{ color: '#0F172A', fontWeight: '700' }}>Đóng</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  headerSub: { fontSize: 12, color: '#64748B', marginTop: 1 },
  verifyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 8,
  },
  verifyInput: { flex: 1, fontSize: 13, color: '#0F172A', paddingVertical: 6 },
  verifyBtn: {
    backgroundColor: '#047857',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  verifyBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#E2E8F0',
    borderRadius: Radius.md,
    padding: 3,
  },
  tabBtn: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 8 },
  tabBtnActive: { backgroundColor: '#FFFFFF' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  tabTextActive: { color: '#0F172A', fontWeight: '700' },
  list: { padding: 16, gap: 12 },
  certCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 10,
    gap: 12,
  },
  certLeftIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#047857',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  codeText: { fontSize: 11, fontWeight: '700', color: '#B45309' },
  skillTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginTop: 4 },
  assignTitle: { fontSize: 12, color: '#475569', marginTop: 2 },
  metaText: { fontSize: 12, color: '#64748B', marginTop: 4 },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A', marginTop: 12 },
  emptyDesc: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20, marginTop: 6 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: 18,
  },
  certificateFrame: {
    backgroundColor: '#FFFBEB',
    borderRadius: 18,
    padding: 6,
    borderWidth: 3,
    borderColor: '#D97706',
  },
  certificateInner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#FCD34D',
    alignItems: 'center',
  },
  certSeal: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  certOrg: { fontSize: 10, fontWeight: '800', color: '#B45309', letterSpacing: 1.4 },
  certHeading: { fontSize: 20, fontWeight: '900', color: '#065F46', marginTop: 4 },
  certSubHeading: { fontSize: 10, fontWeight: '700', color: '#64748B', letterSpacing: 1, marginBottom: 12 },
  certPresentText: { fontSize: 12, color: '#64748B', marginTop: 4 },
  certLearnerName: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginVertical: 4 },
  certSkillName: { fontSize: 16, fontWeight: '800', color: '#0D9488', marginTop: 4, textAlign: 'center' },
  certAssignment: { fontSize: 12, color: '#475569', fontStyle: 'italic', marginTop: 3, textAlign: 'center' },
  certScoreBadge: {
    marginTop: 12,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#6EE7B7',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  certScoreText: { fontSize: 12, fontWeight: '800', color: '#047857' },
  scoreBreakdown: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10, justifyContent: 'center' },
  scoreChip: { fontSize: 11, fontWeight: '700', color: '#065F46', backgroundColor: '#F0FDF4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  certFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  certMetaLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8' },
  certMetaValue: { fontSize: 13, fontWeight: '700', color: '#0F172A', marginTop: 2 },
  certMetaCode: { fontSize: 12, fontWeight: '800', color: '#B45309', marginTop: 2 },
  actionBtn: {
    paddingVertical: 11,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
});
