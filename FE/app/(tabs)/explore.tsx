import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, RefreshControl, Image, Modal,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '@constants/Colors';
import SkillApi from '@api/skill';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Types
type CategoryItem = { id: string; name: string; description?: string };
type SkillItem = {
  id: string;
  name: string;
  description: string;
  level: string;
  format: string;
  duration?: number;
  freeTime?: string;
  region?: string;
  categoryId: string;
  categoryName: string;
  userId: string;
  userFullName?: string;
  userAvatarUrl?: string;
  userReputationScore?: number;
  userCompletedSessions?: number;
  userRegion?: string;
  userOccupation?: string;
};

export default function ExploreScreen() {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null); // null = Tất cả, 'ONLINE', 'OFFLINE', 'BOTH'
  const [selectedRegion, setSelectedRegion] = useState<string>(''); // '' = Toàn quốc

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Modal chi tiết kỹ năng / người hỗ trợ
  const [selectedSkill, setSelectedSkill] = useState<SkillItem | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  const fetchCategories = async () => {
    try {
      const res = await SkillApi.getCategories();
      if (res.data && res.data.data) {
        setCategories(res.data.data);
      }
    } catch (e) {
      console.log('Lỗi tải danh mục:', e);
    }
  };

  const fetchSkills = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const params: any = {};
      if (keyword.trim()) params.keyword = keyword.trim();
      if (selectedCategoryId) params.categoryId = selectedCategoryId;
      if (selectedFormat) params.format = selectedFormat;
      if (selectedRegion.trim()) params.region = selectedRegion.trim();

      const res = await SkillApi.searchSkills(params);
      if (res.data && res.data.data) {
        setSkills(res.data.data);
      } else {
        setSkills([]);
      }
    } catch (e) {
      console.log('Lỗi tìm kiếm người hỗ trợ:', e);
      setSkills([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchSkills();
    }, [selectedCategoryId, selectedFormat, selectedRegion])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSkills(true);
  };

  const handleSearchSubmit = () => {
    fetchSkills();
  };

  const formatLabel = (fmt: string) => {
    switch (fmt) {
      case 'ONLINE': return 'Trực tuyến 💻';
      case 'OFFLINE': return 'Trực tiếp 🤝';
      case 'BOTH': return 'Cả hai 🌐';
      default: return fmt;
    }
  };

  const levelLabel = (lvl: string) => {
    switch (lvl) {
      case 'BEGINNER': return 'Mới bắt đầu';
      case 'INTERMEDIATE': return 'Trung bình';
      case 'ADVANCED': return 'Nâng cao';
      case 'EXPERT': return 'Chuyên gia';
      default: return lvl || 'Cơ bản';
    }
  };

  const getCategoryEmoji = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('lập trình')) return '💻';
    if (lower.includes('ngôn ngữ')) return '🌍';
    if (lower.includes('thiết kế')) return '🎨';
    if (lower.includes('kinh doanh')) return '📊';
    if (lower.includes('giáo dục')) return '📚';
    if (lower.includes('sức khỏe')) return '💪';
    if (lower.includes('nghệ thuật')) return '🎵';
    return '✨'; // Khác
  };

  const renderAvatar = (item: SkillItem) => {
    if (item.userAvatarUrl) {
      return <Image source={{ uri: item.userAvatarUrl }} style={styles.avatar} />;
    }
    const letter = item.userFullName ? item.userFullName.charAt(0).toUpperCase() : 'U';
    return (
      <View style={styles.avatarFallback}>
        <Text style={styles.avatarLetter}>{letter}</Text>
      </View>
    );
  };

  // Lấy danh sách kỹ năng nổi bật thực tế từ DB (không tạo dữ liệu giả lập)
  const trendingSkills = Array.from(new Set(skills.map(s => s.name))).slice(0, 10);

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Khám phá</Text>
        <Text style={styles.headerSub}>Tìm kiếm & lọc người hỗ trợ theo kỹ năng</Text>
      </View>

      {/* ── Search Bar ──────────────────────────────────────────────────── */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={Colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo kỹ năng, tên người hỗ trợ..."
            placeholderTextColor={Colors.textMuted}
            value={keyword}
            onChangeText={setKeyword}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {keyword.length > 0 && (
            <TouchableOpacity onPress={() => { setKeyword(''); }} style={{ padding: 4 }}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearchSubmit}>
          <Ionicons name="filter" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* ── Danh mục (Theo mẫu ảnh grid 4x2) ───────────────────────────── */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Danh mục</Text>
          <View style={styles.categoryGrid}>
            {categories.map((cat) => {
              const active = selectedCategoryId === cat.id;
              const emoji = getCategoryEmoji(cat.name);
              const count = skills.filter(s => s.categoryId === cat.id || s.categoryName === cat.name).length;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryCard, active && styles.categoryCardActive]}
                  onPress={() => setSelectedCategoryId(active ? null : cat.id)}
                >
                  <View style={[styles.catIconCircle, active && styles.catIconCircleActive]}>
                    <Text style={styles.catEmojiText}>{emoji}</Text>
                  </View>
                  <Text style={[styles.catCardName, active && styles.catCardNameActive]} numberOfLines={1}>
                    {cat.name}
                  </Text>
                  <Text style={[styles.catStatText, active && styles.catStatTextActive]}>
                    {count} kỹ năng
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Kỹ năng hot / nổi bật (Chỉ hiển thị khi có dữ liệu thật) ───── */}
        {trendingSkills.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Kỹ năng nổi bật 🔥</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
              {trendingSkills.map((skName) => {
                const active = keyword.toLowerCase() === skName.toLowerCase();
                return (
                  <TouchableOpacity
                    key={skName}
                    style={[styles.trendingPill, active && styles.trendingPillActive]}
                    onPress={() => setKeyword(active ? '' : skName)}
                  >
                    <Text style={[styles.trendingPillText, active && styles.trendingPillTextActive]}>{skName}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ── Bộ lọc Hình thức (Format) & Khu vực (Region) ─────────────── */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Hình thức hỗ trợ</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
            {[
              { label: 'Tất cả', value: null },
              { label: 'Trực tuyến 💻', value: 'ONLINE' },
              { label: 'Trực tiếp 🤝', value: 'OFFLINE' },
              { label: 'Cả hai 🌐', value: 'BOTH' },
            ].map((item) => {
              const active = selectedFormat === item.value;
              return (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.formatPill, active && styles.formatPillActive]}
                  onPress={() => setSelectedFormat(active ? null : item.value)}
                >
                  <Text style={[styles.formatPillText, active && styles.formatPillTextActive]}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Khu vực / Tỉnh thành</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
            {[
              { label: 'Toàn quốc', value: '' },
              { label: 'Hà Nội', value: 'Hà Nội' },
              { label: 'TP. HCM', value: 'HCM' },
              { label: 'Đà Nẵng', value: 'Đà Nẵng' },
              { label: 'Huế', value: 'Huế' },
            ].map((reg) => {
              const active = selectedRegion === reg.value;
              return (
                <TouchableOpacity
                  key={reg.label}
                  style={[styles.regionPill, active && styles.regionPillActive]}
                  onPress={() => setSelectedRegion(active ? '' : reg.value)}
                >
                  <Ionicons
                    name="location-outline"
                    size={14}
                    color={active ? '#fff' : Colors.textMuted}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={[styles.regionPillText, active && styles.regionPillTextActive]}>{reg.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Danh sách kết quả (Người hỗ trợ) ──────────────────────────── */}
        <View style={styles.resultHeader}>
          <Text style={styles.resultTitle}>
            Danh sách người hỗ trợ ({skills.length})
          </Text>
          {(selectedCategoryId || selectedFormat || selectedRegion || keyword) ? (
            <TouchableOpacity
              onPress={() => {
                setSelectedCategoryId(null);
                setSelectedFormat(null);
                setSelectedRegion('');
                setKeyword('');
              }}
            >
              <Text style={styles.clearFilterText}>Xóa bộ lọc</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={{ marginTop: 8, color: Colors.textMuted }}>Đang tìm kiếm người hỗ trợ...</Text>
          </View>
        ) : skills.length === 0 ? (
          /* Không được tạo dữ liệu giả lập theo yêu cầu user */
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="people-outline" size={40} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>Chưa có dữ liệu người hỗ trợ phù hợp</Text>
            <Text style={styles.emptyDesc}>
              Hiện tại chưa có kỹ năng hoặc người hỗ trợ nào khớp với bộ lọc của bạn. Hãy thử đổi từ khóa hoặc chọn danh mục khác nhé!
            </Text>
          </View>
        ) : (
          skills.map((item, index) => (
            <View key={item.id} style={styles.card}>
              {/* Top row: Avatar & Tutor Info */}
              <View style={styles.cardHeader}>
                {renderAvatar(item)}
                <View style={styles.tutorInfo}>
                  <View style={styles.tutorNameRow}>
                    <Text style={styles.tutorName}>{item.userFullName || 'Thành viên HourLink'}</Text>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.primary} style={{ marginLeft: 4 }} />
                  </View>
                  <Text style={styles.tutorSub}>
                    {item.userOccupation || 'Người hỗ trợ'} • 📍 {item.userRegion || item.region || 'Toàn quốc'}
                  </Text>
                </View>
                <View style={styles.badgeIndex}>
                  <Text style={styles.badgeIndexText}>#{index + 1}</Text>
                </View>
              </View>

              {/* Middle row: Skill Info */}
              <View style={styles.skillBox}>
                <View style={styles.skillTitleRow}>
                  <Text style={styles.skillName}>{item.name}</Text>
                  <View style={styles.levelTag}>
                    <Text style={styles.levelTagText}>{levelLabel(item.level)}</Text>
                  </View>
                </View>

                {item.description ? (
                  <Text style={styles.skillDesc} numberOfLines={2}>{item.description}</Text>
                ) : null}

                <View style={styles.tagRow}>
                  <View style={styles.formatBadge}>
                    <Text style={styles.formatBadgeText}>{formatLabel(item.format)}</Text>
                  </View>
                  <View style={styles.catBadge}>
                    <Text style={styles.catBadgeText}>{item.categoryName || 'Khác'}</Text>
                  </View>
                </View>
              </View>

              {/* Bottom footer: Stats & Action */}
              <View style={styles.cardFooter}>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Ionicons name="star" size={16} color="#F59E0B" />
                    <Text style={styles.statScore}>{item.userReputationScore?.toFixed(1) || '5.0'}</Text>
                  </View>
                  <Text style={styles.statDot}>•</Text>
                  <Text style={styles.statSessions}>{item.userCompletedSessions || 0} buổi hỗ trợ</Text>
                </View>
                <TouchableOpacity
                  style={styles.connectBtn}
                  onPress={() => {
                    setSelectedSkill(item);
                    setModalVisible(true);
                  }}
                >
                  <Text style={styles.connectBtnText}>Kết nối</Text>
                  <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* ── Modal Chi tiết Kỹ năng / Người hỗ trợ ───────────────────────── */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedSkill && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Chi tiết Người hỗ trợ</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color={Colors.textPrimary} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ maxHeight: 400 }}>
                  <View style={styles.modalTutorRow}>
                    {renderAvatar(selectedSkill)}
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.tutorName}>{selectedSkill.userFullName || 'Thành viên'}</Text>
                      <Text style={styles.tutorSub}>⭐ Uy tín: {selectedSkill.userReputationScore?.toFixed(1) || '5.0'} • {selectedSkill.userCompletedSessions || 0} buổi</Text>
                      <Text style={styles.tutorSub}>📍 Khu vực: {selectedSkill.userRegion || selectedSkill.region || 'Toàn quốc'}</Text>
                    </View>
                  </View>

                  <View style={styles.modalDivider} />

                  <Text style={styles.modalSectionLabel}>Kỹ năng cung cấp:</Text>
                  <Text style={styles.modalSkillName}>{selectedSkill.name}</Text>
                  <View style={[styles.tagRow, { marginTop: 8 }]}>
                    <View style={styles.catBadge}><Text style={styles.catBadgeText}>{selectedSkill.categoryName}</Text></View>
                    <View style={styles.formatBadge}><Text style={styles.formatBadgeText}>{formatLabel(selectedSkill.format)}</Text></View>
                    <View style={styles.levelTag}><Text style={styles.levelTagText}>{levelLabel(selectedSkill.level)}</Text></View>
                  </View>

                  <Text style={[styles.modalSectionLabel, { marginTop: 16 }]}>Mô tả chi tiết:</Text>
                  <Text style={styles.modalDescText}>
                    {selectedSkill.description || 'Chưa có mô tả chi tiết cho kỹ năng này.'}
                  </Text>

                  {selectedSkill.freeTime ? (
                    <>
                      <Text style={[styles.modalSectionLabel, { marginTop: 16 }]}>Thời gian rảnh:</Text>
                      <Text style={styles.modalDescText}>{selectedSkill.freeTime}</Text>
                    </>
                  ) : null}
                </ScrollView>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.modalBtnCancel}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.modalBtnCancelText}>Nhắn tin</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalBtnAction}
                    onPress={() => {
                      setModalVisible(false);
                      if (selectedSkill) {
                        router.push({
                          pathname: '/profile/send-invitation' as any,
                          params: {
                            receiverId: selectedSkill.userId,
                            receiverName: selectedSkill.userFullName ?? 'Thành viên',
                            skillId: selectedSkill.id,
                            skillName: selectedSkill.name,
                          },
                        });
                      }
                    }}
                  >
                    <Text style={styles.modalBtnActionText}>Gửi lời mời hỗ trợ</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.sm, backgroundColor: '#fff' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.textPrimary },
  headerSub: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },

  // Search bar
  searchContainer: { flexDirection: 'row', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 8 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: Radius.lg, paddingHorizontal: 12, height: 42 },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  searchButton: { width: 42, height: 42, backgroundColor: Colors.primary, borderRadius: Radius.lg, justifyContent: 'center', alignItems: 'center' },

  scrollContent: { paddingBottom: 40 },

  sectionContainer: { marginTop: Spacing.md, paddingHorizontal: Spacing.md },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  pillRow: { gap: 8, paddingBottom: 4 },

  // Category Grid (4 columns x 2 rows matching photo)
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  categoryCard: {
    width: (SCREEN_WIDTH - Spacing.md * 2 - 30) / 4,
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  categoryCardActive: { backgroundColor: '#EFF6FF', borderColor: '#3B82F6', borderWidth: 1.5 },
  catIconCircle: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  catIconCircleActive: { backgroundColor: '#DBEAFE' },
  catEmojiText: { fontSize: 22 },
  catCardName: { fontSize: 12, fontWeight: '600', color: '#334155', textAlign: 'center' },
  catCardNameActive: { color: '#1D4ED8', fontWeight: '700' },
  catStatText: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  catStatTextActive: { color: '#3B82F6', fontWeight: '600' },

  // Trending pills
  trendingPill: { backgroundColor: '#FFF7ED', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: '#FFEDD5' },
  trendingPillActive: { backgroundColor: '#EA580C', borderColor: '#EA580C' },
  trendingPillText: { fontSize: 12, color: '#C2410C', fontWeight: '600' },
  trendingPillTextActive: { color: '#fff', fontWeight: '700' },

  formatPill: { backgroundColor: '#F1F5F9', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16 },
  formatPillActive: { backgroundColor: '#E0F2FE', borderWidth: 1, borderColor: '#0284C7' },
  formatPillText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  formatPillTextActive: { color: '#0284C7', fontWeight: '700' },

  regionPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: Colors.border },
  regionPillActive: { backgroundColor: '#0F172A', borderColor: '#0F172A' },
  regionPillText: { fontSize: 12, color: Colors.textSecondary },
  regionPillTextActive: { color: '#fff', fontWeight: '600' },

  // Result header
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  resultTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.textPrimary },
  clearFilterText: { fontSize: 13, color: '#DC2626', fontWeight: '600' },

  // Loading & Empty
  loadingBox: { padding: 40, alignItems: 'center' },
  emptyBox: { margin: Spacing.md, padding: 32, backgroundColor: '#fff', borderRadius: Radius.xl, alignItems: 'center', borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed' },
  emptyIconWrap: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 6, textAlign: 'center' },
  emptyDesc: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },

  // Tutor Cards
  card: { backgroundColor: '#fff', marginHorizontal: Spacing.md, marginBottom: Spacing.md, borderRadius: Radius.xl, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 46, height: 46, borderRadius: 23 },
  avatarFallback: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#0284C7', justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  tutorInfo: { flex: 1, marginLeft: 12 },
  tutorNameRow: { flexDirection: 'row', alignItems: 'center' },
  tutorName: { fontSize: 16, fontWeight: 'bold', color: Colors.textPrimary },
  tutorSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  badgeIndex: { backgroundColor: '#FFF7ED', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#FFEDD5' },
  badgeIndexText: { fontSize: 12, fontWeight: 'bold', color: '#D97706' },

  skillBox: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: Radius.lg, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  skillTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  skillName: { fontSize: 16, fontWeight: '700', color: '#0F172A', flex: 1, marginRight: 8 },
  levelTag: { backgroundColor: '#E0F2FE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  levelTagText: { fontSize: 11, fontWeight: '600', color: '#0369A1' },
  skillDesc: { fontSize: 13, color: '#475569', lineHeight: 18, marginBottom: 8 },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  formatBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  formatBadgeText: { fontSize: 11, color: '#334155', fontWeight: '500' },
  catBadge: { backgroundColor: '#F3E8FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  catBadgeText: { fontSize: 11, color: '#6B21A8', fontWeight: '500' },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flexDirection: 'row', alignItems: 'center' },
  statScore: { fontSize: 14, fontWeight: 'bold', color: '#0F172A', marginLeft: 4 },
  statDot: { marginHorizontal: 6, color: Colors.textMuted },
  statSessions: { fontSize: 13, color: Colors.textMuted },

  connectBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.lg },
  connectBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: Spacing.lg },
  modalContainer: { backgroundColor: '#fff', borderRadius: Radius.xl, padding: Spacing.lg, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md, paddingBottom: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary },
  modalTutorRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  modalDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 12 },
  modalSectionLabel: { fontSize: 13, fontWeight: 'bold', color: Colors.textMuted, marginBottom: 4 },
  modalSkillName: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary },
  modalDescText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  modalFooter: { flexDirection: 'row', gap: 12, marginTop: Spacing.lg, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border },
  modalBtnCancel: { flex: 1, paddingVertical: 12, borderRadius: Radius.lg, backgroundColor: '#F1F5F9', alignItems: 'center' },
  modalBtnCancelText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  modalBtnAction: { flex: 2, paddingVertical: 12, borderRadius: Radius.lg, backgroundColor: Colors.primary, alignItems: 'center' },
  modalBtnActionText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
