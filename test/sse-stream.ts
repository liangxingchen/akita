import test from 'tape';
import { Readable } from 'stream';
import SSEStream from '../src/sse-stream';

function createMockStream(sseContent: string): Readable {
  let offset = 0;
  const chunkSize = 10;

  const stream = new Readable({
    read() {
      if (offset >= sseContent.length) {
        this.push(null);
        return;
      }

      const chunk = sseContent.substring(offset, offset + chunkSize);
      offset += chunkSize;
      this.push(chunk);
    }
  });

  return stream;
}

test('SSEStream tests', (troot) => {
  troot.test('SSEStream 基本事件解析', async (t) => {
    const sseContent = `data: {"type": "message_start"}

data: {"type": "content_block_delta", "index": 0}

`;

    const stream = createMockStream(sseContent);
    const sseStream = new SSEStream(stream);

    const event1 = await sseStream.read();
    t.ok(event1, 'first event should exist');
    t.equal(event1!.type, 'message', 'default event type should be message');
    t.equal(event1!.data, '{"type": "message_start"}', 'first event data should match');

    const event2 = await sseStream.read();
    t.ok(event2, 'second event should exist');
    t.equal(event2!.type, 'message', 'default event type should be message');
    t.equal(event2!.data, '{"type": "content_block_delta", "index": 0}', 'second event data should match');

    t.end();
  });

  troot.test('SSEStream 自定义事件类型', async (t) => {
    const sseContent = `event: message_start
data: {"id": "msg_123"}

event: content_block_delta
data: {"text": "Hello"}

`;

    const stream = createMockStream(sseContent);
    const sseStream = new SSEStream(stream);

    const event1 = await sseStream.read();
    t.ok(event1, 'first event should exist');
    t.equal(event1!.type, 'message_start', 'first event type should match');
    t.equal(event1!.data, '{"id": "msg_123"}', 'first event data should match');

    const event2 = await sseStream.read();
    t.ok(event2, 'second event should exist');
    t.equal(event2!.type, 'content_block_delta', 'second event type should match');
    t.equal(event2!.data, '{"text": "Hello"}', 'second event data should match');

    t.end();
  });

  troot.test('SSEStream 多行 data 拼接', async (t) => {
    const sseContent = `data: {"type": "chunk1"}
data: {"type": "chunk2"}

`;

    const stream = createMockStream(sseContent);
    const sseStream = new SSEStream(stream);

    const event = await sseStream.read();
    t.ok(event, 'event should exist');
    t.equal(event!.type, 'message', 'default event type should be message');
    t.equal(
      event!.data,
      '{"type": "chunk1"}\n{"type": "chunk2"}',
      'multiple data lines should be concatenated with newline'
    );

    t.end();
  });

  troot.test('SSEStream 注释行忽略', async (t) => {
    const sseContent = `: This is a comment
data: {"type": "test"}

`;

    const stream = createMockStream(sseContent);
    const sseStream = new SSEStream(stream);

    const event = await sseStream.read();
    t.ok(event, 'event should exist');
    t.equal(event!.data, '{"type": "test"}', 'comment lines should be ignored');

    t.end();
  });

  troot.test('SSEStream id 字段解析', async (t) => {
    const sseContent = `id: event_123
data: {"type": "test"}

`;

    const stream = createMockStream(sseContent);
    const sseStream = new SSEStream(stream);

    const event = await sseStream.read();
    t.ok(event, 'event should exist');
    t.equal(event!.id, 'event_123', 'id field should be parsed');

    t.end();
  });

  troot.test('SSEStream retry 字段解析', async (t) => {
    const sseContent = `retry: 5000
data: {"type": "test"}

`;

    const stream = createMockStream(sseContent);
    const sseStream = new SSEStream(stream);

    const event = await sseStream.read();
    t.ok(event, 'event should exist');
    t.equal(event!.retry, 5000, 'retry field should be parsed as number');

    t.end();
  });

  troot.test('SSEStream 事件监听模式', async (t) => {
    const sseContent = `event: test
data: hello

`;

    const stream = createMockStream(sseContent);
    const sseStream = new SSEStream(stream);

    const received: any[] = [];

    sseStream.on('data', (event: any) => {
      received.push(event);
    });

    await sseStream.read();
    t.equal(received.length, 1, 'should receive one event');
    t.equal(received[0].type, 'test', 'event type should match');
    t.equal(received[0].data, 'hello', 'event data should match');

    t.end();
  });

  troot.test('SSEStream 手动关闭', async (t) => {
    const sseContent = `data: test1

`;

    const stream = createMockStream(sseContent);
    const sseStream = new SSEStream(stream);

    const event1 = await sseStream.read();
    t.ok(event1, 'first event should exist');
    t.equal(event1!.data, 'test1', 'first event should match');

    sseStream.close();
    t.equal(sseStream.closed, true, 'stream should be closed');

    try {
      await sseStream.read();
      t.fail('should throw error when reading closed stream');
    } catch (error: any) {
      t.ok(error.message.includes('closed'), 'should throw closed error');
    }

    t.end();
  });

  troot.test('SSEStream 空数据不发出事件', async (t) => {
    const sseContent = `event: empty

data: valid

`;

    const stream = createMockStream(sseContent);
    const sseStream = new SSEStream(stream);

    const event = await sseStream.read();
    t.ok(event, 'event should exist');
    t.equal(event!.data, 'valid', 'should only receive valid event, empty event should be skipped');

    t.end();
  });

  troot.test('SSEStream data: [DONE] 格式', async (t) => {
    // OpenAI API 使用 data: [DONE] 作为结束标记
    const sseContent = `data: {"choices":[{"delta":{"content":"Hello"}}]}

data: [DONE]

`;

    const stream = createMockStream(sseContent);
    const sseStream = new SSEStream(stream);

    const event1 = await sseStream.read();
    t.ok(event1, 'first event should exist');
    t.equal(event1!.data, '{"choices":[{"delta":{"content":"Hello"}}]}', 'JSON data should be preserved');

    const event2 = await sseStream.read();
    t.ok(event2, 'second event should exist');
    t.equal(event2!.data, '[DONE]', 'DONE marker should be preserved as string');

    t.end();
  });

  troot.test('SSEStream 带空格字段解析', async (t) => {
    const sseContent = `event: my_event
data: {"type": "test"}

`;

    const stream = createMockStream(sseContent);
    const sseStream = new SSEStream(stream);

    const event = await sseStream.read();
    t.ok(event, 'event should exist');
    t.equal(event!.type, 'my_event', 'event type should match');
    t.equal(event!.data, '{"type": "test"}', 'data should match');

    t.end();
  });

  troot.end();
});
