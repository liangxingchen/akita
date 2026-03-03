import test from 'tape';
import akita from '../src/node';

test('Parser', (troot) => {
  troot.test('默认行为 - 使用 JSON.parse', (t) => {
    const client = akita.create({});

    client.get('http://localhost:28000/get').then((res) => {
      t.equal(typeof res, 'object', 'response is object');
      t.ok(res.url, 'has url property');
      t.end();
    }, t.end);
  });

  // 测试 2: 自定义解析器 - XML 解析模拟
  troot.test('自定义解析器 - XML 解析模拟', (t) => {
    let parserCalled = false;

    const customParser = (text: string) => {
      parserCalled = true;
      // 模拟 XML 解析器，返回解析后的对象
      return { parsed: true, text };
    };

    const client = akita.create({
      parser: customParser
    });

    client.get('http://localhost:28000/get').then((res) => {
      t.ok(parserCalled, 'custom parser was called');
      t.equal(res.parsed, true, 'response parsed by custom parser');
      t.ok(res.text, 'received raw text');
      t.end();
    }, t.end);
  });

  // 测试 3: 解析器错误 - 包装为 ParseError
  troot.test('解析器错误 - 包装为 ParseError', (t) => {
    const badParser = (_text: string) => {
      throw new Error('Custom parse error');
    };

    const client = akita.create({
      parser: badParser
    });

    client.get('http://localhost:28000/get').then(
      () => {
        t.fail('should not succeed');
        t.end();
      },
      (error) => {
        t.equal(error.type, 'parse', 'error type is parse');
        t.equal(error.code, 'PARSE_JSON_ERROR', 'error code is PARSE_JSON_ERROR');
        t.ok(error.cause, 'has cause property');
        t.equal(error.cause.message, 'Custom parse error', 'cause has correct message');
        t.end();
      }
    );
  });

  // 测试 4: 错误响应 - 使用自定义解析器
  troot.test('错误响应 - 使用自定义解析器', (t) => {
    const client = akita.create({
      parser: (text: string) => {
        try {
          return JSON.parse(text);
        } catch (_e) {
          // 如果解析失败，返回默认错误对象
          return { error: 'Parse failed', message: text };
        }
      }
    });

    client.get('http://localhost:28000/error/invalid-json').then(
      () => {
        t.fail('should not succeed');
        t.end();
      },
      (error) => {
        // 应该识别为服务器错误或 HTTP 错误
        t.ok(['server', 'http'].includes(error.type), 'error type is server or http');
        t.end();
      }
    );
  });

  // 测试 5: 204 No Content - 跳过解析器
  troot.test('204 No Content - 跳过解析器', (t) => {
    let parserCalled = false;

    const customParser = (_text: string) => {
      parserCalled = true;
      return { parsed: true };
    };

    const client = akita.create({
      parser: customParser
    });

    client.get('http://localhost:28000/204').then((res) => {
      t.equal(res, null, 'response is null for 204');
      t.notOk(parserCalled, 'parser should not be called for 204');
      t.end();
    }, t.end);
  });

  troot.end();
});
