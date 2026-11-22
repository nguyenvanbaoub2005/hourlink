import { fetch as expoFetch } from 'expo/fetch';
import * as SecureStore from 'expo-secure-store';
import Config from '@constants/Config';
import { TOKEN_KEY } from './axiosInstance';

export interface AiChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface StreamHandlers {
  onToken: (text: string) => void;
  onDone?: () => void;
  onError?: (message: string) => void;
}

/** Tách buffer SSE thành các event hoàn chỉnh; phần còn dang dở trả về trong `rest`. */
export function parseSseChunk(buffer: string): {
  events: { event: string; data: string }[];
  rest: string;
} {
  const normalized = buffer.replace(/\r\n/g, '\n');
  const blocks = normalized.split('\n\n');
  const rest = blocks.pop() ?? '';
  const events = blocks
    .map((block) => {
      let event = 'message';
      const data: string[] = [];
      for (const line of block.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        else if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''));
      }
      return { event, data: data.join('\n') };
    })
    .filter((e) => e.data.length > 0 || e.event === 'done');
  return { events, rest };
}

/**
 * Gọi Trợ lý AI (BE → Gemini) và nhận câu trả lời theo luồng (Server-Sent Events).
 * Dùng `expo/fetch` vì fetch mặc định của React Native không hỗ trợ đọc response.body dạng stream.
 */
export async function streamAiChat(
  messages: AiChatMessage[],
  handlers: StreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  let finished = false;
  const finish = () => {
    if (!finished) {
      finished = true;
      handlers.onDone?.();
    }
  };

  try {
    const response = await expoFetch(`${Config.API_URL}/ai-chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ messages }),
      signal,
    });

    if (!response.ok || !response.body) {
      handlers.onError?.(`Không kết nối được Trợ lý AI (HTTP ${response.status}).`);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const { events, rest } = parseSseChunk(buffer);
      buffer = rest;
      for (const e of events) {
        if (e.event === 'token') handlers.onToken(e.data);
        else if (e.event === 'error') handlers.onError?.(e.data);
        else if (e.event === 'done') finish();
      }
    }
    finish();
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      finish();
      return;
    }
    handlers.onError?.('Mất kết nối tới Trợ lý AI. Hãy kiểm tra mạng và thử lại.');
  }
}
