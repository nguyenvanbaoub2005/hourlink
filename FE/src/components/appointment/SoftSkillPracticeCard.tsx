import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PracticeApi, { type PracticeAssessmentResponse } from '@api/practice';
import { Colors, Radius, Spacing } from '@constants/Colors';

interface Props {
  appointmentId: string;
  skillTitle: string;
  isMentor: boolean;
  mentorName: string;
  learnerName: string;
}

const SCORE_OPTIONS = [5, 6, 7, 8, 9, 10];

export default function SoftSkillPracticeCard({
  appointmentId,
  skillTitle,
  isMentor,
  mentorName,
  learnerName,
}: Props) {
  const [practice, setPractice] = useState<PracticeAssessmentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // Modal tạo/sửa đề bài thực hành (Mentor)
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [scenarioPrompt, setScenarioPrompt] = useState('');
  const [practiceCriteria, setPracticeCriteria] = useState('');

  // Form nộp bài thực hành (Learner)
  const [submissionText, setSubmissionText] = useState('');
  const [submissionLink, setSubmissionLink] = useState('');

  // Form chấm điểm 3 tiêu chí Kỹ năng mềm (Mentor)
  const [commScore, setCommScore] = useState<number>(8);
  const [appScore, setAppScore] = useState<number>(8);
  const [confScore, setConfScore] = useState<number>(8);
  const [mentorFeedback, setMentorFeedback] = useState('');

  // Modal xem Chứng nhận kỹ năng số
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  const loadPractice = useCallback(async () => {
    try {
      setLoading(true);
      const res = await PracticeApi.getByAppointment(appointmentId);
      const data = res.data?.data ?? null;
      setPractice(data);
      if (data) {
        setAssignmentTitle(data.assignmentTitle || '');
        setScenarioPrompt(data.scenarioPrompt || '');
        setPracticeCriteria(data.practiceCriteria || '');
        setSubmissionText(data.submissionText || '');
        setSubmissionLink(data.submissionLink || '');
        setCommScore(data.communicationScore ?? 8);
        setAppScore(data.applicationScore ?? 8);
        setConfScore(data.confidenceScore ?? 8);
        setMentorFeedback(data.mentorFeedback || '');
      }
    } catch {
      // Chưa có bài thực hành
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    loadPractice();
  }, [loadPractice]);

  const fillWithAiTemplate = async () => {
    try {
      setAiLoading(true);
      const res = await PracticeApi.getAiTemplate(skillTitle);
      const tpl = res.data?.data;
      if (tpl) {
        setAssignmentTitle(tpl.assignmentTitle);
        setScenarioPrompt(tpl.scenarioPrompt);
        setPracticeCriteria(tpl.practiceCriteria);
      }
    } catch {
      Alert.alert('Lỗi', 'Không thể lấy gợi ý tình huống từ AI.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!assignmentTitle.trim() || !scenarioPrompt.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tiêu đề và tình huống thực hành kỹ năng mềm.');
      return;
    }
    try {
      setSaving(true);
      const res = await PracticeApi.assignPractice(appointmentId, {
        assignmentTitle: assignmentTitle.trim(),
        scenarioPrompt: scenarioPrompt.trim(),
        practiceCriteria: practiceCriteria.trim() || undefined,
      });
      setPractice(res.data.data);
      setShowAssignModal(false);
      Alert.alert('Đã giao bài thực hành', 'Người học có thể xem tình huống và nộp kết quả thực hành ngay.');
    } catch (e: any) {
      Alert.alert('Lỗi', e?.response?.data?.message || 'Không thể giao bài thực hành.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitPractice = async () => {
    if (!submissionText.trim()) {
      Alert.alert('Thiếu nội dung', 'Vui lòng trình bày cách xử lý tình huống hoặc bài thu hoạch của bạn.');
      return;
    }
    try {
      setSaving(true);
      const res = await PracticeApi.submitPractice(appointmentId, {
        submissionText: submissionText.trim(),
        submissionLink: submissionLink.trim() || undefined,
      });
      setPractice(res.data.data);
      Alert.alert('Nộp bài thành công', 'Bài thực hành đã được gửi cho người hướng dẫn chấm điểm.');
    } catch (e: any) {
      Alert.alert('Lỗi', e?.response?.data?.message || 'Không thể nộp bài thực hành.');
    } finally {
      setSaving(false);
    }
  };

  const handleGrade = async () => {
    try {
      setSaving(true);
      const res = await PracticeApi.gradePractice(appointmentId, {
        communicationScore: commScore,
        applicationScore: appScore,
        confidenceScore: confScore,
        mentorFeedback: mentorFeedback.trim() || undefined,
      });
      const updated = res.data.data;
      setPractice(updated);
      if (updated.status === 'PASSED') {
        setShowCertificateModal(true);
      } else {
        Alert.alert('Đã gửi đánh giá', 'Người học sẽ nhận được góp ý để hoàn thiện và nộp lại.');
      }
    } catch (e: any) {
      Alert.alert('Lỗi', e?.response?.data?.message || 'Không thể chấm điểm bài thực hành.');
    } finally {
      setSaving(false);
    }
  };

  const shareCertificate = async () => {
    if (!practice?.certificateCode) return;
    await Share.share({
      message:
        `🎓 CHỨNG NHẬN HOÀN THÀNH KỸ NĂNG HOURLINK\n` +
        `• Học viên: ${practice.learnerName}\n` +
        `• Kỹ năng: ${practice.skillTitle}\n` +
        `• Bài thực hành: ${practice.assignmentTitle}\n` +
        `• Điểm tổng kết: ${practice.overallScore}/10 (${practice.certificateLevel})\n` +
        `• Người hướng dẫn: ${practice.mentorName}\n` +
        `• Mã xác thực: ${practice.certificateCode}`,
    });
  };

  if (loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <Ionicons name="school" size={20} color="#0D9488" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>Thực hành Kỹ năng mềm & Chứng nhận</Text>
          <Text style={styles.cardSub}>
            {practice
              ? practice.status === 'PASSED'
                ? `Đã cấp chứng nhận (${practice.certificateLevel} · ${practice.overallScore}/10)`
                : practice.status === 'SUBMITTED'
                  ? 'Học viên đã nộp bài — chờ chấm điểm'
                  : 'Đang thực hiện tình huống thực hành'
              : 'Kiểm chứng năng lực thực tế sau buổi trao đổi'}
          </Text>
        </View>
      </View>

      {/* TRƯỜNG HỢP 1: Chưa giao bài thực hành */}
      {!practice && (
        <View style={{ marginTop: 10 }}>
          {isMentor ? (
            <>
              <Text style={styles.descText}>
                Giao một tình huống thực hành kỹ năng mềm (Thuyết trình, Giao tiếp, Xử lý tình huống...) để chấm điểm và cấp Chứng nhận kỹ năng số cho {learnerName}.
              </Text>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => {
                  setShowAssignModal(true);
                  if (!assignmentTitle) void fillWithAiTemplate();
                }}
              >
                <Ionicons name="sparkles" size={17} color="#FFF" />
                <Text style={styles.primaryBtnText}>Giao bài thực hành (có AI gợi ý)</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.descText}>
              Người hướng dẫn ({mentorName}) chưa giao bài thực hành cho buổi hẹn này. Khi hoàn thành bài thực hành đạt từ 5.0/10, bạn sẽ nhận được Chứng nhận Kỹ năng Số HourLink.
            </Text>
          )}
        </View>
      )}

      {/* TRƯỜNG HỢP 2: Đã có bài thực hành */}
      {practice && (
        <View style={{ marginTop: 12 }}>
          <View style={styles.promptBox}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.promptLabel}>🎯 THỬ THÁCH THỰC HÀNH</Text>
              {isMentor && practice.status !== 'PASSED' && (
                <TouchableOpacity onPress={() => setShowAssignModal(true)}>
                  <Text style={{ color: Colors.primary, fontSize: 12, fontWeight: '700' }}>Sửa đề</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.promptTitle}>{practice.assignmentTitle}</Text>
            <Text style={styles.promptBody}>{practice.scenarioPrompt}</Text>
            {!!practice.practiceCriteria && (
              <View style={styles.criteriaBox}>
                <Text style={styles.criteriaTitle}>Tiêu chí đánh giá:</Text>
                <Text style={styles.criteriaText}>{practice.practiceCriteria}</Text>
              </View>
            )}
          </View>

          {/* Học viên nộp bài (khi chưa PASSED) */}
          {!isMentor && practice.status !== 'PASSED' && (
            <View style={styles.sectionBox}>
              <Text style={styles.boxHeading}>
                {practice.submissionText ? '📝 Bài thực hành của bạn (có thể cập nhật)' : '📝 Nộp bài giải quyết tình huống'}
              </Text>
              <TextInput
                style={styles.textArea}
                value={submissionText}
                onChangeText={setSubmissionText}
                multiline
                placeholder="Trình bày kịch bản giao tiếp, cách xử lý tình huống theo mô hình STAR hoặc 3 bài học áp dụng thực tế..."
                placeholderTextColor="#94A3B8"
              />
              <TextInput
                style={styles.input}
                value={submissionLink}
                onChangeText={setSubmissionLink}
                placeholder="Link video luyện nói / ghi âm / slide (Drive, YouTube... tùy chọn)"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmitPractice} disabled={saving}>
                {saving ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="paper-plane" size={16} color="#FFF" />
                    <Text style={styles.primaryBtnText}>
                      {practice.submissionText ? 'Cập nhật bài nộp' : 'Nộp bài thực hành'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Hiển thị bài đã nộp cho Mentor (hoặc khi đã chấm) */}
          {!!practice.submissionText && (isMentor || practice.status === 'PASSED') && (
            <View style={styles.submissionBox}>
              <Text style={styles.boxHeading}>📩 Bài làm của {practice.learnerName}</Text>
              <Text style={styles.submissionBody}>{practice.submissionText}</Text>
              {!!practice.submissionLink && (
                <TouchableOpacity
                  style={styles.linkRow}
                  onPress={() => Linking.openURL(practice.submissionLink!)}
                >
                  <Ionicons name="link" size={15} color="#2563EB" />
                  <Text style={styles.linkText} numberOfLines={1}>
                    {practice.submissionLink}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Mentor chấm điểm 3 tiêu chí Kỹ năng mềm */}
          {isMentor && practice.submissionText && practice.status !== 'PASSED' && (
            <View style={styles.gradeBox}>
              <Text style={styles.boxHeading}>🏅 Chấm điểm Kỹ năng mềm (Thang 10)</Text>
              {[
                { label: '1. Giao tiếp & Diễn đạt', val: commScore, set: setCommScore },
                { label: '2. Vận dụng tình huống thực tế', val: appScore, set: setAppScore },
                { label: '3. Tư duy phản biện & Sự tự tin', val: confScore, set: setConfScore },
              ].map((row) => (
                <View key={row.label} style={styles.scoreRow}>
                  <Text style={styles.scoreLabel}>{row.label}</Text>
                  <View style={styles.scorePills}>
                    {SCORE_OPTIONS.map((num) => (
                      <TouchableOpacity
                        key={num}
                        style={[styles.scorePill, row.val === num && styles.scorePillActive]}
                        onPress={() => row.set(num)}
                      >
                        <Text style={[styles.scorePillText, row.val === num && styles.scorePillTextActive]}>
                          {num}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}

              <TextInput
                style={[styles.textArea, { minHeight: 70, marginTop: 8 }]}
                value={mentorFeedback}
                onChangeText={setMentorFeedback}
                multiline
                placeholder="Nhận xét điểm mạnh và góp ý cải thiện kỹ năng mềm cho học viên..."
                placeholderTextColor="#94A3B8"
              />

              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: '#059669' }]}
                onPress={handleGrade}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="ribbon" size={17} color="#FFF" />
                    <Text style={styles.primaryBtnText}>
                      Chấm điểm ({((commScore + appScore + confScore) / 3).toFixed(1)}/10) & Cấp Chứng Nhận
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* KẾT QUẢ CHẤM ĐIỂM & THẺ CHỨNG NHẬN KỸ NĂNG SỐ */}
          {practice.overallScore !== undefined && practice.overallScore !== null && (
            <View
              style={[
                styles.certBanner,
                practice.status === 'PASSED' ? styles.certBannerPassed : styles.certBannerRevision,
              ]}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons
                    name={practice.status === 'PASSED' ? 'ribbon' : 'refresh-circle'}
                    size={22}
                    color={practice.status === 'PASSED' ? '#047857' : '#B45309'}
                  />
                  <Text
                    style={{
                      fontWeight: '800',
                      fontSize: 15,
                      color: practice.status === 'PASSED' ? '#065F46' : '#92400E',
                    }}
                  >
                    {practice.status === 'PASSED'
                      ? `CHỨNG NHẬN ${practice.certificateLevel} (${practice.overallScore}/10)`
                      : `CẦN BỔ SUNG (${practice.overallScore}/10)`}
                  </Text>
                </View>
                {practice.certificateCode && (
                  <Text style={styles.certCodeTag}>{practice.certificateCode}</Text>
                )}
              </View>

              <View style={styles.metricsRow}>
                <Text style={styles.metricItem}>🗣️ Giao tiếp: {practice.communicationScore}/10</Text>
                <Text style={styles.metricItem}>🎯 Tình huống: {practice.applicationScore}/10</Text>
                <Text style={styles.metricItem}>💡 Tự tin: {practice.confidenceScore}/10</Text>
              </View>

              {!!practice.mentorFeedback && (
                <Text style={styles.feedbackText}>
                  Nhận xét từ {practice.mentorName}: "{practice.mentorFeedback}"
                </Text>
              )}

              {practice.status === 'PASSED' && (
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                  <TouchableOpacity
                    style={[styles.certActionBtn, { backgroundColor: '#047857', flex: 1 }]}
                    onPress={() => setShowCertificateModal(true)}
                  >
                    <Ionicons name="medal-outline" size={16} color="#FFF" />
                    <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 13 }}>Xem Chứng Nhận Số</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.certActionBtn, { backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#6EE7B7' }]}
                    onPress={shareCertificate}
                  >
                    <Ionicons name="share-social-outline" size={16} color="#047857" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* MODAL GIAO BÀI THỰC HÀNH (MENTOR) */}
      <Modal visible={showAssignModal} transparent animationType="slide" onRequestClose={() => setShowAssignModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={styles.modalTitle}>Giao bài thực hành Kỹ năng mềm</Text>
              <TouchableOpacity onPress={() => setShowAssignModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.aiSuggestBtn} onPress={fillWithAiTemplate} disabled={aiLoading}>
              {aiLoading ? (
                <ActivityIndicator size="small" color="#7C3AED" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={16} color="#7C3AED" />
                  <Text style={styles.aiSuggestText}>✨ AI Gợi ý tình huống theo kỹ năng "{skillTitle}"</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>Tiêu đề thử thách thực hành</Text>
            <TextInput
              style={styles.input}
              value={assignmentTitle}
              onChangeText={setAssignmentTitle}
              placeholder="VD: Thực hành Elevator Pitch 2 phút"
            />

            <Text style={styles.fieldLabel}>Tình huống thực tế & Yêu cầu</Text>
            <TextInput
              style={[styles.textArea, { minHeight: 95 }]}
              value={scenarioPrompt}
              onChangeText={setScenarioPrompt}
              multiline
              placeholder="Mô tả tình huống giao tiếp/ứng xử cụ thể học viên cần giải quyết..."
            />

            <Text style={styles.fieldLabel}>Tiêu chí chấm điểm (Giao tiếp · Tình huống · Tự tin)</Text>
            <TextInput
              style={[styles.textArea, { minHeight: 70 }]}
              value={practiceCriteria}
              onChangeText={setPracticeCriteria}
              multiline
              placeholder="Các tiêu chí đánh giá..."
            />

            <TouchableOpacity style={styles.primaryBtn} onPress={handleAssign} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.primaryBtnText}>Lưu & Giao cho học viên</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL CHỨNG NHẬN KỸ NĂNG SỐ (VERIFIED DIGITAL CERTIFICATE) */}
      <Modal
        visible={showCertificateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCertificateModal(false)}
      >
        <View style={styles.modalOverlay}>
          {practice && (
            <View style={styles.certificateFrame}>
              <View style={styles.certificateInner}>
                <View style={styles.certSeal}>
                  <Ionicons name="ribbon" size={34} color="#D97706" />
                </View>
                <Text style={styles.certOrg}>HOURLINK TIME-BANKING ACADEMY</Text>
                <Text style={styles.certHeading}>CHỨNG NHẬN KỸ NĂNG SỐ</Text>
                <Text style={styles.certSubHeading}>VERIFIED PEER-LEARNING CERTIFICATE</Text>

                <Text style={styles.certPresentText}>Chứng nhận học viên</Text>
                <Text style={styles.certLearnerName}>{practice.learnerName}</Text>

                <Text style={styles.certPresentText}>Đã hoàn thành xuất sắc buổi trao đổi & thực hành</Text>
                <Text style={styles.certSkillName}>{practice.skillTitle}</Text>
                <Text style={styles.certAssignment}>Chủ đề thực hành: "{practice.assignmentTitle}"</Text>

                <View style={styles.certScoreBadge}>
                  <Text style={styles.certScoreText}>
                    Điểm thực hành: {practice.overallScore}/10 · Xếp loại: {practice.certificateLevel}
                  </Text>
                </View>

                <View style={styles.certFooterRow}>
                  <View>
                    <Text style={styles.certMetaLabel}>NGƯỜI HƯỚNG DẪN</Text>
                    <Text style={styles.certMetaValue}>{practice.mentorName}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.certMetaLabel}>MÃ XÁC THỰC SỐ</Text>
                    <Text style={styles.certMetaCode}>{practice.certificateCode}</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 18, width: '100%' }}>
                  <TouchableOpacity
                    style={[styles.primaryBtn, { flex: 1, marginTop: 0, backgroundColor: '#047857' }]}
                    onPress={shareCertificate}
                  >
                    <Ionicons name="share-social" size={16} color="#FFF" />
                    <Text style={styles.primaryBtnText}>Chia sẻ Chứng nhận</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.primaryBtn, { marginTop: 0, backgroundColor: '#E2E8F0', paddingHorizontal: 16 }]}
                    onPress={() => setShowCertificateModal(false)}
                  >
                    <Text style={{ color: '#0F172A', fontWeight: '700' }}>Đóng</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    marginTop: 16,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  cardSub: { fontSize: 12, color: '#0D9488', marginTop: 2, fontWeight: '600' },
  descText: { fontSize: 13, color: '#475569', lineHeight: 19 },
  primaryBtn: {
    marginTop: 12,
    backgroundColor: '#0D9488',
    borderRadius: Radius.md,
    paddingVertical: 11,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  promptBox: {
    backgroundColor: '#F0FDFA',
    borderRadius: Radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  promptLabel: { fontSize: 11, fontWeight: '800', color: '#0F766E', letterSpacing: 0.5 },
  promptTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginTop: 4 },
  promptBody: { fontSize: 13, color: '#334155', lineHeight: 19, marginTop: 6 },
  criteriaBox: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#CCFBF1',
  },
  criteriaTitle: { fontSize: 12, fontWeight: '700', color: '#0F766E' },
  criteriaText: { fontSize: 12, color: '#334155', lineHeight: 18, marginTop: 2 },
  sectionBox: { marginTop: 12 },
  boxHeading: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 8 },
  textArea: {
    minHeight: 84,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: Radius.md,
    padding: 10,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    textAlignVertical: 'top',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    marginTop: 8,
  },
  submissionBox: {
    marginTop: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  submissionBody: { fontSize: 13, color: '#1E293B', lineHeight: 19 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  linkText: { fontSize: 12, color: '#2563EB', textDecorationLine: 'underline', flex: 1 },
  gradeBox: {
    marginTop: 12,
    backgroundColor: '#FFFBEB',
    borderRadius: Radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  scoreRow: { marginBottom: 10 },
  scoreLabel: { fontSize: 12, fontWeight: '600', color: '#78350F', marginBottom: 5 },
  scorePills: { flexDirection: 'row', gap: 6 },
  scorePill: {
    width: 34,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scorePillActive: { backgroundColor: '#D97706', borderColor: '#B45309' },
  scorePillText: { fontSize: 13, fontWeight: '700', color: '#92400E' },
  scorePillTextActive: { color: '#FFFFFF' },
  certBanner: {
    marginTop: 12,
    borderRadius: Radius.md,
    padding: 12,
    borderWidth: 1,
  },
  certBannerPassed: { backgroundColor: '#ECFDF5', borderColor: '#6EE7B7' },
  certBannerRevision: { backgroundColor: '#FEF3C7', borderColor: '#FCD34D' },
  certCodeTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  metricsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  metricItem: { fontSize: 12, fontWeight: '600', color: '#065F46' },
  feedbackText: { fontSize: 13, fontStyle: 'italic', color: '#1E293B', marginTop: 8 },
  certActionBtn: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: 18,
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: 16,
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  aiSuggestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: Radius.md,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  aiSuggestText: { fontSize: 12, fontWeight: '700', color: '#6D28D9' },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#334155', marginTop: 8 },
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
});
