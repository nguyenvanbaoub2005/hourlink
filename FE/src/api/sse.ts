/** Parser Server-Sent Events thuần (không phụ thuộc native) — tách riêng để unit test. */

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
