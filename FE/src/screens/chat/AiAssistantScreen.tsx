import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { streamAiChat, type AiChatMessage } from '@api/aichat';
import { useColors } from '@theme';

interface UiMessage extends AiChatMessage {
  id: string;
  isError?: boolean;
}

const SUGGESTIONS = [
  'Time Credit là gì?',
  'Cách đăng yêu cầu hỗ trợ?',
  'AI gợi ý người hỗ trợ thế nào?',
  'Quy trình xác nhận buổi học?',
];

const GREETING: UiMessage = {
  id: 'greeting',
  role: 'model',
  content:
    'Xin chào! Mình là Trợ lý HourLink 👋\nMình có thể giải đáp về Time Credit, cách đăng yêu cầu, gợi ý của AI và lịch hẹn. Bạn cần giúp gì?',
};

let idCounter = 0;
const nextId = () => `m${Date.now()}_${idCounter++}`;

export default function AiAssistantScreen() {
  const colors = useColors();
  const router = useRouter();
  const [messages, setMessages] = useState<UiMessage[]>([GREETING]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const listRef = useRef<FlatList<UiMessage>>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, []);

  const send = useCallback(
    async (text: string) => {
      const question = text.trim();
      if (!question || streaming) return;

      const userMsg: UiMessage = { id: nextId(), role: 'user', content: question };
      const replyId = nextId();
      // Lịch sử gửi lên BE: bỏ lời chào và tin lỗi; Gemini yêu cầu bắt đầu bằng lượt của user
      const history: AiChatMessage[] = [...messages, userMsg]
        .filter((m) => m.id !== 'greeting' && !m.isError && m.content)
        .map(({ role, content }) => ({ role, content }));

      setMessages((prev) => [...prev, userMsg, { id: replyId, role: 'model', content: '' }]);
      setInput('');
      setStreaming(true);
      scrollToEnd();

      const controller = new AbortController();
      abortRef.current = controller;

      await streamAiChat(
        history,
        {
          onToken: (token) => {
            setMessages((prev) =>
              prev.map((m) => (m.id === replyId ? { ...m, content: m.content + token } : m)),
            );
            scrollToEnd();
          },
          onError: (message) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === replyId ? { ...m, content: m.content || message, isError: !m.content } : m,
              ),
            );
          },
        },
        controller.signal,
      );
      setStreaming(false);
    },
    [messages, streaming, scrollToEnd],
  );

  const stop = () => abortRef.current?.abort();

  const renderItem = ({ item }: { item: UiMessage }) => {
    const mine = item.role === 'user';
    const waiting = !mine && streaming && item.content === '';
    return (
      <View style={[styles.row, mine ? styles.rowMine : styles.rowBot]}>
        {!mine && (
          <View style={[styles.avatar, { backgroundColor: colors.primaryContainer }]}>
            <Ionicons name="sparkles" size={16} color={colors.primary} />
          </View>
        )}
        <View
          style={[
            styles.bubble,
            mine
              ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 }
              : {
                  backgroundColor: item.isError ? colors.errorContainer : colors.surfaceContainer,
                  borderBottomLeftRadius: 4,
                },
          ]}
        >
          {waiting ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text
              style={{
                color: mine
                  ? colors.onPrimary
                  : item.isError
                    ? colors.onErrorContainer
                    : colors.onSurface,
                fontSize: 15,
                lineHeight: 22,
              }}
              selectable
            >
              {item.content}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityLabel="Quay lại"
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={26} color={colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.onSurface }]}>Trợ lý HourLink</Text>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            Gemini · trả lời theo thời gian thực
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ListFooterComponent={
            messages.length === 1 ? (
              <View style={styles.chips}>
                {SUGGESTIONS.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.chip, { borderColor: colors.outline }]}
                    onPress={() => send(s)}
                  >
                    <Text style={{ color: colors.primary, fontSize: 13 }}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : undefined
          }
        />

        <View style={[styles.inputBar, { borderTopColor: colors.outlineVariant }]}>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.surfaceContainer, color: colors.onSurface },
            ]}
            placeholder="Hỏi Trợ lý HourLink..."
            placeholderTextColor={colors.onSurfaceVariant}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            editable={!streaming}
            onSubmitEditing={() => send(input)}
          />
          {streaming ? (
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: colors.error }]}
              onPress={stop}
              accessibilityLabel="Dừng"
            >
              <Ionicons name="stop" size={20} color={colors.onError} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.sendBtn,
                { backgroundColor: input.trim() ? colors.primary : colors.surfaceContainerHigh },
              ]}
              onPress={() => send(input)}
              disabled={!input.trim()}
              accessibilityLabel="Gửi"
            >
              <Ionicons
                name="send"
                size={18}
                color={input.trim() ? colors.onPrimary : colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerText: { marginLeft: 8 },
  title: { fontSize: 17, fontWeight: '700' },
  subtitle: { fontSize: 12 },
  list: { padding: 12, paddingBottom: 4 },
  row: { flexDirection: 'row', marginBottom: 10, alignItems: 'flex-end' },
  rowMine: { justifyContent: 'flex-end' },
  rowBot: { justifyContent: 'flex-start' },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  bubble: { maxWidth: '80%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6, marginLeft: 36 },
  chip: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 7 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    maxHeight: 110,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
