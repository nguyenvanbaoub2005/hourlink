import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, RefreshControl, Image, Modal,
  Dimensions, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '@constants/Colors';
import SkillApi from '@api/skill';
import RatingApi from '@api/rating';
import { openChatWithUser } from '@utils/chatNav';
import type { RatingResponse } from '@types';
import Avatar from '@components/Avatar';

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
  const [modalTab, setModalTab] = useState<'intro' | 'skills' | 'reviews'>('intro');

  const [tutorRatings, setTutorRatings] = useState<RatingResponse[]>([]);
  const [loadingRatings, setLoadingRatings] = useState<boolean>(false);

  useEffect(() => {
    if (selectedSkill && modalVisible && modalTab === 'reviews') {
      fetchTutorRatings(selectedSkill.userId);
    }
  }, [selectedSkill, modalVisible, modalTab]);

  const fetchTutorRatings = async (userId: string) => {
    try {
      setLoadingRatings(true);
      const res = await RatingApi.getRatingsReceived(userId, 0, 10);
      setTutorRatings(res.data?.data?.content || []);
    } catch (error) {
      console.error("Error fetching tutor ratings", error);
    } finally {
      setLoadingRatings(false);
    }
  };

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
                    <Text style={styles.statScore}>{item.userReputationScore ? item.userReputationScore.toFixed(1) : '0.0'}</Text>
                  </View>
                  <Text style={styles.statDot}>•</Text>
                  <Text style={styles.statSessions}>{item.userCompletedSessions || 0} buổi hỗ trợ</Text>
                </View>
                <TouchableOpacity
                  style={styles.connectBtn}
                  onPress={() => {
                    setSelectedSkill(item);
                    setModalTab('intro');
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

      {/* ── Modal Chi tiết Người hỗ trợ ────────── */}
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
                {/* Top Bar */}
                <View style={styles.modalTopBar}>
                  <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalTopBtn}>
                    <Ionicons name="chevron-back" size={26} color="#0F172A" />
                  </TouchableOpacity>
                  <View style={styles.modalHandle} />
                  <TouchableOpacity
                    onPress={() => {
                      if (!selectedSkill) return;
                      setModalVisible(false);
                      openChatWithUser(
                        router,
                        selectedSkill.userId,
                        selectedSkill.userFullName ?? 'Thành viên',
                        () =>
                          router.push({
                            pathname: '/profile/send-invitation' as any,
                            params: {
                              receiverId: selectedSkill.userId,
                              receiverName: selectedSkill.userFullName ?? 'Thành viên',
                              skillId: selectedSkill.id,
                              skillName: selectedSkill.name,
                            },
                          })
                      );
                    }}
                    style={styles.modalTopBtn}
                  >
                    <Ionicons name="chatbubble-ellipses-outline" size={24} color="#0F172A" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                  {/* Header Profile Info */}
                  <View style={styles.modalProfileHeader}>
                    <View style={styles.modalAvatarWrap}>
                      {selectedSkill.userAvatarUrl ? (
                        <Image source={{ uri: selectedSkill.userAvatarUrl }} style={styles.modalAvatarImg} />
                      ) : (
                        <View style={styles.modalAvatarCircle}>
                          <Text style={styles.modalAvatarLetter}>
                            {selectedSkill.userFullName ? selectedSkill.userFullName.charAt(0).toUpperCase() : 'U'}
                          </Text>
                        </View>
                      )}
                      <View style={styles.onlineDot} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <View style={styles.modalNameRow}>
                        <Text style={styles.modalTutorName} numberOfLines={1}>
                          {selectedSkill.userFullName || 'Thành viên'}
                        </Text>
                      </View>
                      <Text style={styles.modalOccupation}>
                        {selectedSkill.userOccupation || selectedSkill.categoryName || 'Chuyên môn hỗ trợ'}
                      </Text>
                      <View style={styles.modalRatingRow}>
                        <View style={{ flexDirection: 'row', marginRight: 4 }}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Ionicons
                              key={star}
                              name="star"
                              size={14}
                              color={selectedSkill.userReputationScore && star <= selectedSkill.userReputationScore ? "#F59E0B" : "#CBD5E1"}
                            />
                          ))}
                        </View>
                        <Text style={styles.modalScoreText}>
                          {selectedSkill.userReputationScore ? selectedSkill.userReputationScore.toFixed(1) : '0.0'}
                        </Text>
                        <Text style={styles.modalSessionsText}>
                          ({selectedSkill.userCompletedSessions || 0} buổi)
                        </Text>
                      </View>
                      <View style={styles.modalLocRow}>
                        <Ionicons name="location-outline" size={13} color="#64748B" style={{ marginRight: 3 }} />
                        <Text style={styles.modalLocText}>
                          {selectedSkill.userRegion || selectedSkill.region || 'Chưa cập nhật'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* 3-Column Summary Box */}
                  <View style={styles.summaryCard}>
                    <View style={styles.summaryCol}>
                      <Text style={styles.summaryVal}>{selectedSkill.userCompletedSessions || 0} buổi</Text>
                      <Text style={styles.summaryLbl}>Hoàn thành</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryCol}>
                      <Text style={styles.summaryVal}>{selectedSkill.userReputationScore ? `${selectedSkill.userReputationScore.toFixed(1)}/5 ⭐` : '—'}</Text>
                      <Text style={styles.summaryLbl}>Đánh giá</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryCol}>
                      <Text style={styles.summaryVal}>—</Text>
                      <Text style={styles.summaryLbl}>Phản hồi</Text>
                    </View>
                  </View>

                  {/* Tabs Row */}
                  <View style={styles.modalTabsRow}>
                    {[
                      { key: 'intro', label: 'Giới thiệu' },
                      { key: 'skills', label: 'Kỹ năng' },
                      { key: 'reviews', label: 'Đánh giá' },
                    ].map((tab) => {
                      const active = modalTab === tab.key;
                      return (
                        <TouchableOpacity
                          key={tab.key}
                          style={[styles.modalTabItem, active && styles.modalTabItemActive]}
                          onPress={() => setModalTab(tab.key as any)}
                        >
                          <Text style={[styles.modalTabText, active && styles.modalTabTextActive]}>
                            {tab.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Tab Content Area */}
                  {modalTab === 'intro' && (
                    <View style={styles.tabContent}>
                      <View style={styles.bioCard}>
                        <Text style={styles.bioText}>
                          {selectedSkill.description || 'Chưa có lời giới thiệu chi tiết.'}
                        </Text>
                      </View>

                      <View style={styles.infoCard}>
                        <View style={styles.infoRowItem}>
                          <Text style={styles.infoRowLabel}>Khu vực</Text>
                          <Text style={styles.infoRowValue}>{selectedSkill.userRegion || selectedSkill.region || '—'}</Text>
                        </View>
                        <View style={styles.infoRowItem}>
                          <Text style={styles.infoRowLabel}>Thời gian rảnh</Text>
                          <Text style={styles.infoRowValue}>{selectedSkill.freeTime || '—'}</Text>
                        </View>
                        <View style={styles.infoRowItem}>
                          <Text style={styles.infoRowLabel}>Hình thức</Text>
                          <Text style={styles.infoRowValue}>{formatLabel(selectedSkill.format) || '—'}</Text>
                        </View>
                        <View style={[styles.infoRowItem, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                          <Text style={styles.infoRowLabel}>Thời lượng</Text>
                          <Text style={styles.infoRowValue}>{selectedSkill.duration ? `${selectedSkill.duration} phút / buổi` : '—'}</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {modalTab === 'skills' && (
                    <View style={styles.tabContent}>
                      <View style={styles.skillDetailCard}>
                        <View style={styles.skillTitleHeader}>
                          <Text style={styles.skillDetailTitle}>{selectedSkill.name}</Text>
                          <View style={styles.levelTag}><Text style={styles.levelTagText}>{levelLabel(selectedSkill.level)}</Text></View>
                        </View>
                        <View style={[styles.tagRow, { marginVertical: 8 }]}>
                          <View style={styles.catBadge}><Text style={styles.catBadgeText}>{selectedSkill.categoryName || 'Chuyên môn'}</Text></View>
                          <View style={styles.formatBadge}><Text style={styles.formatBadgeText}>{formatLabel(selectedSkill.format)}</Text></View>
                        </View>
                        <Text style={styles.skillDetailDesc}>
                          {selectedSkill.description || 'Chưa có mô tả chi tiết cho kỹ năng này.'}
                        </Text>
                        {selectedSkill.freeTime ? (
                          <View style={styles.skillFreeTimeBox}>
                            <Ionicons name="time-outline" size={16} color="#0284C7" style={{ marginRight: 6 }} />
                            <Text style={styles.skillFreeTimeText}>Lịch rảnh: {selectedSkill.freeTime}</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  )}

                  {modalTab === 'reviews' && (
                    <View style={styles.tabContent}>
                      <View style={styles.reviewSummaryBox}>
                        <Text style={styles.reviewSummaryScore}>{selectedSkill.userReputationScore ? selectedSkill.userReputationScore.toFixed(1) : '0.0'} / 5.0</Text>
                        <View style={{ flexDirection: 'row', marginVertical: 4 }}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Ionicons
                              key={s}
                              name="star"
                              size={16}
                              color={selectedSkill.userReputationScore && s <= selectedSkill.userReputationScore ? "#F59E0B" : "#CBD5E1"}
                            />
                          ))}
                        </View>
                        <Text style={styles.reviewSummaryCount}>Dựa trên {selectedSkill.userCompletedSessions || 0} buổi hỗ trợ</Text>
                      </View>

                      {loadingRatings ? (
                        <ActivityIndicator style={{ marginTop: 24 }} color={Colors.primary} />
                      ) : tutorRatings.length > 0 ? (
                        tutorRatings.map(rating => (
                          <View key={rating.id} style={styles.reviewCard}>
                            <View style={styles.reviewHeader}>
                              <Avatar uri={rating.reviewerAvatarUrl} name={rating.reviewerName} size={36} />
                              <View style={styles.reviewInfo}>
                                <Text style={styles.reviewerName}>{rating.reviewerName}</Text>
                                <Text style={styles.reviewDate}>{new Date(rating.createdAt).toLocaleDateString('vi-VN')}</Text>
                              </View>
                              <View style={{ flexDirection: 'row' }}>
                                {[1, 2, 3, 4, 5].map(s => (
                                  <Ionicons key={s} name={s <= rating.overallStars ? 'star' : 'star-outline'} size={14} color="#F59E0B" />
                                ))}
                              </View>
                            </View>
                            {rating.comment ? (
                              <Text style={styles.reviewComment}>{rating.comment}</Text>
                            ) : null}
                          </View>
                        ))
                      ) : (
                        <View style={{ paddingVertical: 24, alignItems: 'center', backgroundColor: '#fff', borderRadius: Radius.lg, borderWidth: 1, borderColor: '#F1F5F9' }}>
                          <Ionicons name="chatbubbles-outline" size={32} color="#CBD5E1" style={{ marginBottom: 8 }} />
                          <Text style={{ color: '#64748B', fontStyle: 'italic', fontSize: 13 }}>
                            Chưa có bài đánh giá chi tiết nào.
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </ScrollView>

                {/* Fixed Footer Buttons */}
                <View style={styles.modalBottomBar}>
                  <TouchableOpacity
                    style={styles.btnChat}
                    onPress={() => {
                      if (!selectedSkill) return;
                      setModalVisible(false);
                      openChatWithUser(
                        router,
                        selectedSkill.userId,
                        selectedSkill.userFullName ?? 'Thành viên',
                        () =>
                          router.push({
                            pathname: '/profile/send-invitation' as any,
                            params: {
                              receiverId: selectedSkill.userId,
                              receiverName: selectedSkill.userFullName ?? 'Thành viên',
                              skillId: selectedSkill.id,
                              skillName: selectedSkill.name,
                            },
                          })
                      );
                    }}
                  >
                    <Ionicons name="chatbubble-outline" size={18} color="#0D9488" style={{ marginRight: 6 }} />
                    <Text style={styles.btnChatText}>Nhắn tin</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.btnInvite}
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
                    <Ionicons name="calendar-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={styles.btnInviteText}>Gửi lời mời</Text>
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

  // Modal (Giao diện mới theo ảnh tham khảo)
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#F8FAFC', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, maxHeight: '92%', flex: 1 },
  modalTopBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 },
  modalTopBtn: { padding: 4 },
  modalHandle: { width: 40, height: 5, borderRadius: 3, backgroundColor: '#CBD5E1' },

  modalProfileHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: Radius.xl, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  modalAvatarWrap: { position: 'relative' },
  modalAvatarImg: { width: 68, height: 68, borderRadius: 34 },
  modalAvatarCircle: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#E0F2FE', justifyContent: 'center', alignItems: 'center' },
  modalAvatarLetter: { color: '#0284C7', fontSize: 26, fontWeight: 'bold' },
  onlineDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#10B981', borderWidth: 2, borderColor: '#fff', position: 'absolute', right: 2, bottom: 2 },

  modalNameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  modalTutorName: { fontSize: 18, fontWeight: 'bold', color: '#0F172A', flex: 1, marginRight: 8 },
  modalOccupation: { fontSize: 13, color: '#64748B', marginBottom: 6 },
  modalRatingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  modalScoreText: { fontSize: 13, fontWeight: 'bold', color: '#0F172A', marginRight: 4 },
  modalSessionsText: { fontSize: 12, color: '#64748B' },
  modalLocRow: { flexDirection: 'row', alignItems: 'center' },
  modalLocText: { fontSize: 12, color: '#64748B' },

  summaryCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: Radius.lg, paddingVertical: 14, marginVertical: 14, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 3, elevation: 1 },
  summaryCol: { flex: 1, alignItems: 'center' },
  summaryVal: { fontSize: 15, fontWeight: 'bold', color: '#0F172A' },
  summaryLbl: { fontSize: 12, color: '#64748B', marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: '#E2E8F0', height: '70%', alignSelf: 'center' },

  modalTabsRow: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: Radius.lg, marginBottom: 14, borderWidth: 1, borderColor: '#F1F5F9' },
  modalTabItem: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  modalTabItemActive: { borderBottomColor: '#0D9488' },
  modalTabText: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  modalTabTextActive: { color: '#0D9488', fontWeight: 'bold' },

  tabContent: { paddingBottom: 20 },
  bioCard: { backgroundColor: '#fff', borderRadius: Radius.lg, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  bioText: { fontSize: 14, color: '#334155', lineHeight: 22 },
  infoCard: { backgroundColor: '#fff', borderRadius: Radius.lg, padding: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  infoRowItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  infoRowLabel: { fontSize: 13, color: '#64748B' },
  infoRowValue: { fontSize: 13, fontWeight: '600', color: '#0F172A', flex: 1, textAlign: 'right', marginLeft: 16 },

  skillDetailCard: { backgroundColor: '#fff', borderRadius: Radius.lg, padding: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  skillTitleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  skillDetailTitle: { fontSize: 16, fontWeight: 'bold', color: '#0F172A', flex: 1, marginRight: 8 },
  skillDetailDesc: { fontSize: 14, color: '#475569', lineHeight: 22, marginTop: 4 },
  skillFreeTimeBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E0F2FE', padding: 10, borderRadius: Radius.md, marginTop: 12 },
  skillFreeTimeText: { fontSize: 13, color: '#0369A1', fontWeight: '500' },

  reviewSummaryBox: { backgroundColor: '#fff', borderRadius: Radius.lg, padding: 16, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  reviewSummaryScore: { fontSize: 24, fontWeight: 'bold', color: '#0F172A' },
  reviewSummaryCount: { fontSize: 12, color: '#64748B', marginTop: 2 },

  modalBottomBar: { flexDirection: 'row', gap: 12, paddingTop: 12, paddingBottom: 4, borderTopWidth: 1, borderTopColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  btnChat: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 13, borderRadius: Radius.lg, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#0D9488' },
  btnChatText: { fontSize: 15, fontWeight: 'bold', color: '#0D9488' },
  btnInvite: { flex: 1.2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 13, borderRadius: Radius.lg, backgroundColor: '#2563EB' },
  btnInviteText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  // Review items
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  reviewInfo: { flex: 1, marginLeft: 10 },
  reviewerName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  reviewDate: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  reviewComment: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18, marginTop: 4 },
});
