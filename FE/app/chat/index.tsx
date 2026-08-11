import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ChatApi from '@api/chat';
import Avatar from '@components/Avatar';
import { useChatStore } from '@store/chatStore';
import { initFirebaseAuth, isRealtimeReady } from '@lib/firebase';
import { Colors } from '@constants/Colors';
import { formatConversationTime } from '@utils/chatFormat';
import type { Conversation, MessageType } from '@types';

/** Nhãn ngắn cho loại tin nhắn cuối. */
const PREVIEW_LABEL: Partial<Record<MessageType, string>> = {
  IMAGE: 'Ảnh',
  DOCUMENT: 'Tài liệu',
  LOCATION: 'Vị trí',
  MEETING_LINK: 'Link họp',
  RESCHEDULE_PROPOSAL: 'Đề xuất đổi lịch',
};

export default function ConversationListScreen() {
  const router = useRouter();
  const { conversations, setConversations, setRealtimeReady } = useChatStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchConversations = useCallback(async () => {
    try {
      const res = await ChatApi.getConversations();
      setConversations(res.data?.data ?? []);
    } catch (e) {
      console.log('Lỗi tải danh sách trò chuyện:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [setConversations]);

  useFocusEffect(
    useCallback(() => {
      // Đăng nhập Firebase một lần để bật realtime; thất bại thì vẫn dùng REST
      initFirebaseAuth().then(() => setRealtimeReady(isRealtimeReady()));
      fetchConversations();
    }, [fetchConversations, setRealtimeReady])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return conversations;
    return conversations.filter(
      (c) =>
        c.otherUserName?.toLowerCase().includes(keyword) ||
        c.skillName?.toLowerCase().includes(keyword) ||
        c.communityActivityTitle?.toLowerCase().includes(keyword) ||
        c.lastMessagePreview?.toLowerCase().includes(keyword)
    );
  }, [conversations, search]);

  const openConversation = (item: Conversation) => {
    router.push({
      pathname: '/chat/[id]' as any,
      params: {
        id: item.id,
        otherName: item.otherUserName,
        otherUserId: item.otherUserId,
        otherAvatarUrl: item.otherUserAvatarUrl ?? '',
        skillName: item.communityActivityTitle ?? item.skillName ?? '',
        sourceType: item.sourceType,
      },
    });
  };

  const renderItem = ({ item }: { item: Conversation }) => {
    const unread = item.unreadCount > 0;
    const previewLabel = item.lastMessageType ? PREVIEW_LABEL[item.lastMessageType] : undefined;

    return (
      <TouchableOpacity
        style={styles.row}
        activeOpacity={0.7}
        onPress={() => openConversation(item)}
        onLongPress={() => {
          Alert.alert(
            'Tùy chọn trò chuyện',
            `Bạn có muốn ẩn trò chuyện với ${item.otherUserName}?`,
            [
              { text: 'Hủy', style: 'cancel' },
              {
                text: 'Ẩn',
                style: 'destructive',
                onPress: async () => {
                  try {
                    await ChatApi.hideConversation(item.id);
                    fetchConversations();
                  } catch (e) {
                    Alert.alert('Lỗi', 'Không thể ẩn cuộc trò chuyện');
                  }
                }
              }
            ]
          );
        }}
      >
        {/* Ảnh đại diện thật, không có thì rơi về avatar chữ */}
        <Avatar
          uri={item.otherUserAvatarUrl}
          name={item.otherUserName}
          size={48}
          showDot={item.isActive && !item.isBlockedByMe && !item.hasBlockedMe}
        />

        {/* Nội dung */}
        <View style={styles.rowBody}>
          <Text style={styles.name} numberOfLines={1}>
            {item.otherUserName}
          </Text>
          {!!(item.communityActivityTitle ?? item.skillName) && (
            <Text style={styles.skill} numberOfLines={1}>
              {item.sourceType === 'COMMUNITY_ACTIVITY' ? 'Hoạt động: ' : ''}
              {item.communityActivityTitle ?? item.skillName}
            </Text>
          )}
          <Text
            style={[styles.preview, unread && styles.previewUnread]}
            numberOfLines={1}
          >
            {previewLabel ? `[${previewLabel}] ` : ''}
            {item.lastMessagePreview ?? 'Bắt đầu cuộc trò chuyện'}
          </Text>
        </View>

        {/* Thời gian + badge */}
        <View style={styles.rowMeta}>
          <Text style={[styles.time, unread && styles.timeUnread]}>
            {formatConversationTime(item.lastMessageAt ?? item.createdAt)}
          </Text>
          {unread && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {item.unreadCount > 99 ? '99+' : item.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tin nhắn</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* ── Ô tìm kiếm ─────────────────────────────────────────── */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm cuộc trò chuyện..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Danh sách ──────────────────────────────────────────── */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="chatbubbles-outline" size={52} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>
            {search ? 'Không tìm thấy cuộc trò chuyện' : 'Chưa có cuộc trò chuyện nào'}
          </Text>
          <Text style={styles.emptyDesc}>
            {search
              ? 'Thử từ khoá khác xem sao'
              : 'Cuộc trò chuyện sẽ mở ra sau khi một lời mời hỗ trợ được chấp nhận'}
          </Text>
          {!search && (
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push('/profile/invitations' as any)}
            >
              <Text style={styles.emptyBtnText}>Xem lời mời của tôi</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  backBtn: { width: 38, height: 38, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#0F172A' },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#0F172A', padding: 0 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  separator: { height: 1, backgroundColor: '#F1F5F9', marginLeft: 76 },

  rowBody: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  skill: { fontSize: 12, color: Colors.secondary },
  preview: { fontSize: 13, color: Colors.textMuted },
  previewUnread: { color: '#334155', fontWeight: '600' },

  rowMeta: { alignItems: 'flex-end', gap: 6 },
  time: { fontSize: 11, color: Colors.textMuted },
  timeUnread: { color: Colors.secondary, fontWeight: '600' },
  badge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginTop: 8 },
  emptyDesc: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 19 },
  emptyBtn: {
    marginTop: 14,
    backgroundColor: Colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 12,
  },
  emptyBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
