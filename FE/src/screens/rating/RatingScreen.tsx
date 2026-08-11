import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Radius, Spacing } from '@constants/Colors';
import RatingApi from '@api/rating';
import Avatar from '@components/Avatar';

// ─── Các tiêu chí đánh giá ────────────────────────────────────
const CRITERIA = [
  { key: 'punctualityScore',    label: 'Đúng giờ',          icon: 'time-outline' },
  { key: 'attitudeScore',       label: 'Thái độ',           icon: 'happy-outline' },
  { key: 'communicationScore',  label: 'Giao tiếp',         icon: 'chatbubble-outline' },
  { key: 'qualityScore',        label: 'Chất lượng hỗ trợ', icon: 'school-outline' },
] as const;

type CriteriaKey = typeof CRITERIA[number]['key'];

// ─── Star Rating Component ────────────────────────────────────
function StarRating({
  value,
  onChange,
  size = 32,
  readonly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  readonly?: boolean;
}) {
  return (
    <View style={starStyles.row}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => !readonly && onChange?.(star)}
          activeOpacity={readonly ? 1 : 0.7}
          style={{ marginHorizontal: 2 }}
        >
          <Ionicons
            name={value >= star ? 'star' : 'star-outline'}
            size={size}
            color={value >= star ? Colors.warning : Colors.border}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const starStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
});

// ─── Main Screen ──────────────────────────────────────────────
/**
 * RatingScreen — Màn hình đánh giá sau khi Appointment hoàn thành.
 *
 * Nhận params từ router:
 *   - appointmentId: string
 *   - revieweeId: string
 *   - revieweeName: string
 *   - revieweeAvatar?: string
 *   - appointmentTitle?: string
 */
export default function RatingScreen() {
  const router = useRouter();
  const {
    appointmentId,
    revieweeId,
    revieweeName,
    revieweeAvatar,
    appointmentTitle,
  } = useLocalSearchParams<{
    appointmentId: string;
    revieweeId: string;
    revieweeName: string;
    revieweeAvatar?: string;
    appointmentTitle?: string;
  }>();

  // ── State ──────────────────────────────────────────────────
  const [overallStars, setOverallStars] = useState(0);
  const [criteriaScores, setCriteriaScores] = useState<Record<CriteriaKey, number>>({
    punctualityScore: 0,
    attitudeScore: 0,
    communicationScore: 0,
    qualityScore: 0,
  });
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Animation cho nút submit
  const scaleAnim = useState(new Animated.Value(1))[0];

  // Tự động tính overallStars từ trung bình các tiêu chí khi đủ
  useEffect(() => {
    const filled = Object.values(criteriaScores).filter((v) => v > 0);
    if (filled.length === CRITERIA.length) {
      const avg = filled.reduce((a, b) => a + b, 0) / filled.length;
      setOverallStars(Math.round(avg));
    }
  }, [criteriaScores]);

  const setCriteriaScore = (key: CriteriaKey, value: number) => {
    setCriteriaScores((prev) => ({ ...prev, [key]: value }));
  };

  const pressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();
  const pressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

  // ── Submit ─────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (overallStars === 0) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn ít nhất số sao tổng quát.');
      return;
    }
    if (!appointmentId || !revieweeId) {
      Alert.alert('Lỗi', 'Thiếu thông tin lịch hẹn. Vui lòng thử lại.');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        appointmentId,
        revieweeId,
        overallStars,
        comment: comment.trim() || undefined,
      };

      // Chỉ gửi các tiêu chí đã chấm
      CRITERIA.forEach(({ key }) => {
        if (criteriaScores[key] > 0) payload[key] = criteriaScores[key];
      });

      await RatingApi.submitRating(payload);
      setSubmitted(true);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || 'Không thể gửi đánh giá. Vui lòng thử lại.';
      Alert.alert('Lỗi', msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Submitted State ────────────────────────────────────────
  if (submitted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
          </View>
          <Text style={styles.successTitle}>Đánh giá thành công!</Text>
          <Text style={styles.successSubtitle}>
            Cảm ơn bạn đã đánh giá buổi hỗ trợ.{'\n'}
            Điểm uy tín của{' '}
            <Text style={{ color: Colors.primary, fontWeight: '700' }}>
              {revieweeName}
            </Text>{' '}
            đã được cập nhật.
          </Text>
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.doneBtnText}>Xong</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main Form ──────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đánh giá buổi hỗ trợ</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Thông tin người được đánh giá */}
        <View style={styles.revieweeCard}>
          <Avatar
            uri={revieweeAvatar}
            name={revieweeName || '?'}
            size={64}
          />
          <View style={styles.revieweeInfo}>
            <Text style={styles.revieweeLabel}>Đánh giá</Text>
            <Text style={styles.revieweeName}>{revieweeName || '—'}</Text>
            {appointmentTitle ? (
              <Text style={styles.appointmentTitle} numberOfLines={1}>
                {appointmentTitle}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Điểm sao tổng quát */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Đánh giá tổng quát</Text>
          <Text style={styles.sectionHint}>
            Nhấn vào ngôi sao để cho điểm (1–5)
          </Text>
          <View style={styles.overallStarRow}>
            <StarRating
              value={overallStars}
              onChange={setOverallStars}
              size={44}
            />
          </View>
          <Text style={styles.starLabel}>
            {overallStars === 0
              ? 'Chưa chấm điểm'
              : overallStars === 1
              ? 'Rất tệ'
              : overallStars === 2
              ? 'Tệ'
              : overallStars === 3
              ? 'Bình thường'
              : overallStars === 4
              ? 'Tốt'
              : 'Xuất sắc!'}
          </Text>
        </View>

        {/* Tiêu chí chi tiết */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tiêu chí chi tiết (tùy chọn)</Text>
          <Text style={styles.sectionHint}>
            Điểm chi tiết giúp cải thiện chất lượng cộng đồng
          </Text>
          {CRITERIA.map(({ key, label, icon }) => (
            <View key={key} style={styles.criteriaRow}>
              <View style={styles.criteriaLabel}>
                <Ionicons name={icon as any} size={18} color={Colors.primary} />
                <Text style={styles.criteriaText}>{label}</Text>
              </View>
              <StarRating
                value={criteriaScores[key]}
                onChange={(v) => setCriteriaScore(key, v)}
                size={26}
              />
            </View>
          ))}
        </View>

        {/* Nhận xét */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nhận xét (tùy chọn)</Text>
          <TextInput
            style={styles.commentInput}
            value={comment}
            onChangeText={setComment}
            placeholder="Chia sẻ trải nghiệm của bạn về buổi hỗ trợ này..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={4}
            maxLength={1000}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{comment.length}/1000</Text>
        </View>

        {/* Lưu ý */}
        <View style={styles.noteBox}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.secondary} />
          <Text style={styles.noteText}>
            Đánh giá của bạn sẽ ảnh hưởng đến điểm uy tín của người được đánh giá
            và thứ tự hiển thị trong kết quả tìm kiếm.
          </Text>
        </View>

        {/* Nút Submit */}
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            style={[
              styles.submitBtn,
              overallStars === 0 && styles.submitBtnDisabled,
            ]}
            onPress={handleSubmit}
            onPressIn={pressIn}
            onPressOut={pressOut}
            disabled={loading || overallStars === 0}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="send" size={18} color="#fff" />
                <Text style={styles.submitBtnText}>Gửi đánh giá</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgScreen,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.bgLight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Radius.full,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.md, gap: Spacing.md },

  // Reviewee card
  revieweeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgLight,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  revieweeInfo: { flex: 1 },
  revieweeLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  revieweeName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  appointmentTitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Section
  section: {
    backgroundColor: Colors.bgLight,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sectionHint: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: -4,
  },

  // Overall stars
  overallStarRow: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  starLabel: {
    textAlign: 'center',
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },

  // Criteria
  criteriaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  criteriaLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  criteriaText: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
  },

  // Comment
  commentInput: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
    fontSize: 14,
    color: Colors.textPrimary,
    minHeight: 100,
  },
  charCount: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'right',
    marginTop: -4,
  },

  // Note
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    gap: 6,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: Colors.secondary,
    lineHeight: 18,
  },

  // Submit button
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    marginTop: Spacing.sm,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    backgroundColor: Colors.textMuted,
    shadowOpacity: 0,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Success state
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  doneBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 48,
    marginTop: Spacing.md,
  },
  doneBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
