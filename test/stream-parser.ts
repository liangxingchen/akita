import test from 'tape';
import JsonStream from '../src/json-stream';
import { Readable } from 'stream';

function createMockStream(data: string[]): Readable {
  const stream = new Readable({
    read() {
      if (data.length > 0) {
        this.push(data.shift() + '\n');
      } else {
        this.push(null);
      }
    }
  });
  return stream;
}

test('JsonStream parser tests', (troot) => {
  troot.test('JsonStream 默认行为 - 使用 JSON.parse', async (t) => {
    const ndjsonData = [
      '{"type": "ADDED", "object": {"id": 1, "name": "item1"}}',
      '{"type": "MODIFIED", "object": {"id": 2, "name": "item2"}}'
    ];

    const stream = createMockStream([...ndjsonData]);
    const jsonStream = new JsonStream(stream, null, JSON.parse);

    const event1: any = await jsonStream.read();
    t.equal(event1.type, 'ADDED', 'first event type should be ADDED');
    t.equal(event1.object.id, 1, 'first event object id should be 1');
    t.equal(event1.object.name, 'item1', 'first event object name should be item1');

    const event2: any = await jsonStream.read();
    t.equal(event2.type, 'MODIFIED', 'second event type should be MODIFIED');
    t.equal(event2.object.id, 2, 'second event object id should be 2');
    t.equal(event2.object.name, 'item2', 'second event object name should be item2');

    t.end();
  });

  troot.test('JsonStream 自定义解析器工作', async (t) => {
    let parseCount = 0;
    const customParser = (text: string) => {
      parseCount++;
      const parsed = JSON.parse(text);
      if (parsed.object && parsed.object.name) {
        parsed.object.name = 'custom:' + parsed.object.name;
      }
      return parsed;
    };

    const ndjsonData = [
      '{"type": "ADDED", "object": {"id": 1, "name": "item1"}}',
      '{"type": "ADDED", "object": {"id": 2, "name": "item2"}}'
    ];

    const stream = createMockStream([...ndjsonData]);
    const jsonStream = new JsonStream(stream, null, customParser);

    const event1: any = await jsonStream.read();
    t.equal(event1.object.name, 'custom:item1', 'custom parser should transform name field');

    const event2: any = await jsonStream.read();
    t.equal(event2.object.name, 'custom:item2', 'custom parser should transform name field for second event');

    t.equal(parseCount, 2, 'custom parser should be called exactly 2 times');

    jsonStream.close();
    t.end();
  });

  troot.test('JsonStream 解析器错误处理', async (t) => {
    const badParser = () => {
      throw new Error('Parse error');
    };

    const ndjsonData = ['{"type": "ADDED", "object": {"id": 1}}'];

    const stream = createMockStream([...ndjsonData]);
    const jsonStream = new JsonStream(stream, null, badParser as any);

    try {
      await jsonStream.read();
      t.fail('should have thrown an error');
    } catch (error: any) {
      t.equal(error.message, 'Parse error', 'parser error should be propagated');
    }

    t.equal(jsonStream.closed, true, 'stream should be closed after error');

    t.end();
  });

  troot.test('JsonStream 解析器错误通过事件监听', (t) => {
    const badParser = () => {
      throw new Error('Event parse error');
    };

    const ndjsonData = ['{"type": "ADDED", "object": {"id": 1}}'];

    const stream = createMockStream([...ndjsonData]);
    const jsonStream = new JsonStream(stream, null, badParser as any);

    jsonStream.on('error', (error: Error) => {
      t.equal(error.message, 'Event parse error', 'error message should match');
      t.end();
    });

    jsonStream.read().catch(() => {
      // expected to reject, test completes via error event
    });
  });

  troot.end();
});
