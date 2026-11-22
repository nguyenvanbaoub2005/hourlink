/// <reference types="jest" />
import { parseSseChunk } from '../src/api/sse';

describe('parseSseChunk', () => {
  it('tách các event hoàn chỉnh và giữ phần dang dở trong rest', () => {
    const { events, rest } = parseSseChunk('event:token\ndata:Xin \n\nevent:token\ndata:chào\n\nevent:tok');
    expect(events).toEqual([
      { event: 'token', data: 'Xin ' },
      { event: 'token', data: 'chào' },
    ]);
    expect(rest).toBe('event:tok');
  });

  it('ghép lại đúng khi một event bị cắt giữa 2 chunk mạng', () => {
    const first = parseSseChunk('event:token\ndata:Hel');
    expect(first.events).toHaveLength(0);
    const second = parseSseChunk(first.rest + 'lo\n\n');
    expect(second.events).toEqual([{ event: 'token', data: 'Hello' }]);
    expect(second.rest).toBe('');
  });

  it('hỗ trợ CRLF và bỏ đúng 1 khoảng trắng sau "data:"', () => {
    const { events } = parseSseChunk('event: token\r\ndata: a  b\r\n\r\n');
    expect(events).toEqual([{ event: 'token', data: 'a  b' }]);
  });

  it('nối nhiều dòng data bằng xuống dòng', () => {
    const { events } = parseSseChunk('event:token\ndata:dòng 1\ndata:dòng 2\n\n');
    expect(events[0].data).toBe('dòng 1\ndòng 2');
  });

  it('giữ event "done" dù payload rỗng, bỏ event rỗng khác', () => {
    const { events } = parseSseChunk('event:done\n\n:keep-alive\n\n');
    expect(events).toEqual([{ event: 'done', data: '' }]);
  });
});
