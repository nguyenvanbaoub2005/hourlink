import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Modal,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import UserApi from '@api/user';
import RatingApi, { RatingItem } from '@api/rating';
import Avatar from '@components/Avatar';
import { Colors, Radius } from '@constants/Colors';

/** Mirror com.hourlink.user.dto.PublicProfileResponse */
type PublicProfile = {
  id: string;
  fullName: string;
  avatarUrl?: string;
  bio?: string;
  region?: string;
  occupation?: string;
  languages?: string;
  userType?: string;
  isVerified?: boolean;
  reputationScore?: number;
  completedSessions?: number;
  cancelRate?: number;
  joinedAt?: string;
  skills?: {
    id: string;
    name: string;
    categoryName?: string;
    level?: string;
    format?: string;
    duration?: number;
  }[];
};

const LEVEL_LABEL: Record<string, string> = {
  BEGINNER: 'Cơ bản',
  INTERMEDIATE: 'Trung cấp',
  ADVANCED: 'Nâng cao',
  EXPERT: 'Chuyên gia',
};

const FORMAT_LABEL: Record<string, string> = {
  ONLINE: 'Trực tuyến',
  OFFLINE: 'Trực tiếp',
  BOTH: 'Cả hai',
};

interface Props {
  visible: boolean;
  userId?: string;
  onClose: () => void;
}

/**
 * UserProfileSheet — Bottom sheet xem hồ sơ công khai của một người dùng.
 *
 * Dùng ở màn chat khi bấm vào tên người đang trò chuyện. Hiển thị đúng những
 * thông tin backend cho phép công khai (không có email / số điện thoại).
 */
export default function UserProfileSheet({ visible, userId, onClose }: Props) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [ratings, setRatings] = useState<RatingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !userId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      UserApi.getUserById(userId),
      RatingApi.getRatingsByUser(userId),
    ])
      .then(([profileRes, ratingsRes]) => {
        if (!cancelled) {
          setProfile((profileRes.data as any)?.data ?? null);
          setRatings((ratingsRes.data as any)?.data ?? []);
        }
      })
      .catch((e: any) => {
        if (!cancelled) {
          setError(e?.response?.data?.message ?? 'Không tải được hồ sơ. Vui lòng thử lại.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [visible, userId]);

  const joinedLabel = (() => {
    if (!profile?.joinedAt) return null;
    const d = new Date(profile.joinedAt);
    if (isNaN(d.getTime())) return null;
    return `Tham gia từ ${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  })();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : error ? (
            <View style={styles.center}>
              <Ionicons name="alert-circle-outline" size={44} color={Colors.textMuted} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : !profile ? null : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* ── Đầu hồ sơ ─────────────────────────────────── */}
              <View style={styles.header}>
                <Avatar uri={profile.avatarUrl} name={profile.fullName} size={68} />
                <View style={{ flex: 1, gap: 3 }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name} numberOfLines={1}>
                      {profile.fullName}
                    </Text>
                    {profile.isVerified && (
                      <Ionicons name="checkmark-circle" size={17} color={Colors.primary} />
                    )}
                  </View>
                  {!!profile.occupation && <Text style={styles.sub}>{profile.occupation}</Text>}
                  {!!profile.region && (
                    <View style={styles.metaRow}>
                      <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
                      <Text style={styles.meta}>{profile.region}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* ── Chỉ số uy tín (mục 9.19) ──────────────────── */}
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>
                    {(profile.reputationScore ?? 0).toFixed(1)}
                  </Text>
                  <Text style={styles.statLabel}>Điểm uy tín</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{profile.completedSessions ?? 0}</Text>
                  <Text style={styles.statLabel}>Buổi hoàn thành</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>
                    {Math.round((profile.cancelRate ?? 0) * 100)}%
                  </Text>
                  <Text style={styles.statLabel}>Tỷ lệ hủy</Text>
                </View>
              </View>

              {/* ── Giới thiệu ────────────────────────────────── */}
              {!!profile.bio && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Giới thiệu</Text>
                  <Text style={styles.bodyText}>{profile.bio}</Text>
                </View>
              )}

              {/* ── Ngôn ngữ ──────────────────────────────────── */}
              {!!profile.languages && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Ngôn ngữ</Text>
                  <Text style={styles.bodyText}>{profile.languages}</Text>
                </View>
              )}

              {/* ── Kỹ năng đang chia sẻ ──────────────────────── */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Kỹ năng có thể hỗ trợ{' '}
                  {profile.skills?.length ? `(${profile.skills.length})` : ''}
                </Text>
                {profile.skills && profile.skills.length > 0 ? (
                  profile.skills.map((s) => (
                    <View key={s.id} style={styles.skillCard}>
                      <View style={styles.skillIcon}>
                        <Ionicons name="school-outline" size={18} color={Colors.secondary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.skillName} numberOfLines={1}>
                          {s.name}
                        </Text>
                        <Text style={styles.skillMeta} numberOfLines={1}>
                          {[
                            s.categoryName,
                            s.level ? LEVEL_LABEL[s.level] ?? s.level : null,
                            s.format ? FORMAT_LABEL[s.format] ?? s.format : null,
                            s.duration ? `${s.duration} phút` : null,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>Người này chưa đăng kỹ năng nào.</Text>
                )}
              </View>

              {/* ── Đánh giá gần nhất ─────────────────── */}
              {ratings.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Đánh giá ({ratings.length})
                  </Text>
                  {ratings.slice(0, 3).map((r) => (
                    <View key={r.id} style={styles.reviewCard}>
                      <View style={styles.reviewHeader}>
                        <Avatar uri={r.fromUserAvatar} name={r.fromUserName} size={32} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.reviewerName} numberOfLines={1}>
                            {r.fromUserName}
                          </Text>
                          <View style={{ flexDirection: 'row', gap: 2 }}>
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Ionicons
                                key={s}
                                name={s <= r.score ? 'star' : 'star-outline'}
                                size={12}
                                color="#F59E0B"
                              />
                            ))}
                          </View>
                        </View>
                      </View>
                      {!!r.comment && (
                        <Text style={styles.reviewComment} numberOfLines={2}>
                          {r.comment}
                        </Text>
                      )}
                    </View>
                  ))}
                  {ratings.length > 3 && (
                    <Text style={styles.moreRatings}>+ {ratings.length - 3} đánh giá khác</Text>
                  )}
                </View>
              )}

              {!!joinedLabel && <Text style={styles.joined}>{joinedLabel}</Text>}
            </ScrollView>
          )}

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingBottom: 22,
    paddingHorizontal: 20,
    maxHeight: '88%',
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 16,
  },
  center: { paddingVertical: 50, alignItems: 'center', gap: 10 },
  errorText: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },

  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 19, fontWeight: '700', color: '#0F172A', flexShrink: 1 },
  sub: { fontSize: 13, color: Colors.secondary, fontWeight: '500' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { fontSize: 12, color: Colors.textMuted },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.lg,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statBox: { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: '#E2E8F0' },
  statValue: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  statLabel: { fontSize: 11, color: Colors.textMuted },

  section: { marginTop: 18 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 8 },
  bodyText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  emptyText: { fontSize: 13, color: Colors.textMuted, fontStyle: 'italic' },

  skillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 8,
  },
  skillIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skillName: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  skillMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },

  joined: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: 18 },

  closeBtn: {
    marginTop: 16,
    backgroundColor: '#F1F5F9',
    paddingVertical: 13,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  closeText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },

  reviewCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    marginBottom: 8,
    gap: 6,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reviewerName: { fontSize: 13, fontWeight: '600', color: '#0F172A' },
  reviewComment: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
  moreRatings: { fontSize: 12, color: Colors.primary, textAlign: 'center', marginTop: 4 },
});
