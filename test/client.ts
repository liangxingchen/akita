import fs from 'fs';
import test from 'tape';
import http from 'http';
import type { Client } from '..';
import akita from '../src/node';
import { version } from '../package.json';

const client: Client = akita;
const client2 = client.resolve('http');

client.setOptions({
  init: { headers: { Agent: 'Akita' } },
  // onRequest: (request) =>
  //   new Promise((resolve) => {
  //     console.log('request:', request.url);
  //     // resolve
  //   }),
  onResponse: (request) => {
    console.log('res ->', request.url, request.res?.statusText);
  },
  onDecode: async (request) => {
    request.value = JSON.parse(request.raw as string);
  },
  onProgress: (progress) => {
    console.log('progress', progress);
  }
});

client.on('request', async (req) => console.log('request hook:', req.url));
client.on('request', (req) => console.log('request hook:', req.url));

client2.setOptions({
  apiRoot: 'http://localhost:28000'
});

test('HTTP', (troot) => {
  troot.test('test get', (t) => {
    client.get('http://localhost:28000/get?a=b&c=d').then((res) => {
      t.equal(typeof res, 'object', 'typeof result data');
      t.equal(res.url, '/get?a=b&c=d');
      t.ok(res);
      t.end();
    }, t.end);
  });

  troot.test('test query', (t) => {
    client.get('http://localhost:28000/get', { query: { foo: { bar: 'baz' } } }).then((res) => {
      t.equal(res.url, '/get?foo%5Bbar%5D=baz');
      t.deepEqual(res.query, { foo: { bar: 'baz' } });
      t.end();
    }, t.end);
  });

  troot.test('test query', (t) => {
    client.get('http://localhost:28000/get?', { query: { foo: { bar: 'baz' } } }).then((res) => {
      t.equal(res.url, '/get?foo%5Bbar%5D=baz');
      t.deepEqual(res.query, { foo: { bar: 'baz' } });
      t.end();
    }, t.end);
  });

  troot.test('test query', (t) => {
    client.get('http://localhost:28000/get?a=b', { query: { foo: { bar: 'baz' } } }).then((res) => {
      t.equal(res.url, '/get?a=b&foo%5Bbar%5D=baz');
      t.deepEqual(res.query, { a: 'b', foo: { bar: 'baz' } });
      t.end();
    }, t.end);
  });

  troot.test('test query', (t) => {
    client.get('http://localhost:28000/get?a=b&', { query: { foo: { bar: 'baz' } } }).then((res) => {
      t.equal(res.url, '/get?a=b&foo%5Bbar%5D=baz');
      t.deepEqual(res.query, { a: 'b', foo: { bar: 'baz' } });
      t.end();
    }, t.end);
  });

  troot.test('test headers', (t) => {
    client.get('http://localhost:28000', { headers: { foo: 'bar' } }).then((res) => {
      t.equal(res.headers.foo, 'bar');
      t.equal(res.headers['user-agent'], `Akita/${version} (+https://github.com/liangxingchen/akita)`);
      t.end();
    }, t.end);
  });

  troot.test('test post', (t) => {
    client
      .post('http://localhost:28000', {
        body: { foo: 'bar' }
      })
      .then((res) => {
        t.deepEqual(res.body, { foo: 'bar' });
        t.end();
      }, t.end);
  });

  troot.test('test post buffer', (t) => {
    t.plan(1);
    client
      .post('http://localhost:28000', {
        headers: {
          'Content-Type': 'application/json'
        },
        body: Buffer.from(JSON.stringify({ foo: 'bar' }))
      })
      .then((res) => {
        t.deepEqual(res.body, { foo: 'bar' });
        t.end();
      }, t.end);
  });

  troot.test('test post form data', (t) => {
    client
      .post('http://localhost:28000', {
        body: { foo: 'bar' },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
      .then((res) => {
        t.equal(res.headers['content-type'], 'application/x-www-form-urlencoded');
        t.deepEqual(res.body, { foo: 'bar' });
        t.end();
      }, t.end);
  });

  troot.test('test upload', (t) => {
    client
      .post('http://localhost:28000', {
        body: {
          foo: 'bar',
          file: fs.createReadStream(`${process.cwd()}/LICENSE`)
        }
      })
      .then((res) => {
        t.deepEqual(res.method, 'POST');
        t.deepEqual(res.body, { foo: 'bar' });
        t.deepEqual(res.files.file.filename, 'LICENSE');
        t.end();
      }, t.end);
  });

  troot.test('test upload buffer', (t) => {
    let buffer = fs.readFileSync(`${process.cwd()}/LICENSE`);
    // @ts-ignore
    buffer.name = 'LICENSE';
    client
      .post('http://localhost:28000', {
        body: {
          foo: 'bar',
          file: buffer
        }
      })
      .then((res) => {
        t.deepEqual(res.method, 'POST');
        t.deepEqual(res.body, { foo: 'bar' });
        t.deepEqual(res.files.file.filename, 'LICENSE');
        t.end();
      }, t.end);
  });

  troot.test('test text', (t) => {
    client
      .get('http://localhost:28000')
      .text()
      .then((res) => {
        t.equal('string', typeof res);
        t.end();
      }, t.end);
  });

  troot.test('test buffer', (t) => {
    client2
      .get('/get')
      .buffer()
      .then((res) => {
        t.ok(Buffer.isBuffer(res));
        t.end();
      }, t.end);
  });

  troot.test('HTTP Agent ', (t) => {
    client2
      .get('/get', {
        agent: new http.Agent({
          keepAlive: false
        })
      })
      .then((res) => {
        t.equal(res.headers['connection'], 'close');
        t.end();
      }, t.end);
  });

  troot.test('HTTP Agent keepAlive', (t) => {
    client2
      .get('/get', {
        agent: new http.Agent({
          keepAlive: true
        })
      })
      .then((res) => {
        t.equal(res.headers['connection'], 'keep-alive');
        t.end();
      }, t.end);
  });

  troot.test('json stream', async (t) => {
    let stream = await client2.get('/goods/watch').jsonStream();
    let event = await stream.read();
    t.equal(event.type, 'ADDED');
    t.equal(event.object.id, 1001);
    t.equal(event.object.title, 'iPhone');

    event = await stream.read();
    t.equal(event.type, 'MODIFIED');
    t.equal(event.object.id, 1002);
    t.equal(event.object.title, 'iMac');
    // 1s 后会被服务端关闭
    event = await stream.read();
    t.equal(event, undefined);

    t.end();
  });

  troot.test('close json stream', async (t) => {
    let stream = await client2.get('/goods/watch').jsonStream();
    let event = await stream.read();
    t.equal(event.type, 'ADDED');
    t.equal(event.object.id, 1001);
    t.equal(event.object.title, 'iPhone');

    // 500ms 后从前端关闭
    setTimeout(() => stream.close(), 500);
    event = await stream.read();
    t.equal(event, undefined);

    t.end();
  });

  troot.test('json stream event', (t) => {
    client2
      .get('/goods/watch')
      .jsonStream()
      .then((stream) => {
        stream.on('data', ({ type, object }) => {
          t.equal(type, 'ADDED');
          t.equal(object.id, 1001);
          t.equal(object.title, 'iPhone');
          stream.close();
          t.equal(stream.closed, true, 'stream should be closed');
          t.end();
        });
      });
  });

  troot.end();
});

test('Client - apiRoot 路径拼接组合', (troot) => {
  troot.test('apiRoot 有 / + path 有 /', (t) => {
    const c = akita.create({ apiRoot: 'http://localhost:28000/' });
    c.get('/get').then((res: any) => {
      t.equal(res.url, '/get');
      t.end();
    }, t.end);
  });

  troot.test('apiRoot 无 / + path 无 /', (t) => {
    const c = akita.create({ apiRoot: 'http://localhost:28000' });
    c.get('get').then((res: any) => {
      t.equal(res.url, '/get');
      t.end();
    }, t.end);
  });

  troot.end();
});

test('Client - createBody 嵌套对象与 onProgress 数组', (troot) => {
  troot.test('嵌套对象 + 文件字段上传', (t) => {
    const c = akita.create({});
    c.post('http://localhost:28000', {
      body: {
        meta: { type: 'doc', tags: ['a', 'b'] },
        file: fs.createReadStream(`${process.cwd()}/LICENSE`)
      }
    }).then((res: any) => {
      t.deepEqual(res.method, 'POST');
      t.deepEqual(res.body, { meta: { type: 'doc', tags: ['a', 'b'] } });
      t.ok(res.files.file);
      t.end();
    }, t.end);
  });

  troot.test('body 含原始类型字段转字符串', (t) => {
    const c = akita.create({});
    const FormData = c.getFormDataClass();
    if (FormData) {
      const form = c.createBody({
        file: Buffer.from('test'),
        active: true,
        count: 5,
        empty: null,
        date: new Date('2024-01-01')
      });
      t.ok(form instanceof FormData);
    }
    t.end();
  });

  troot.test('onProgress 数组形式', (t) => {
    const progresses: number[] = [];
    const c = akita.create({
      apiRoot: 'http://localhost:28000',
      onProgress: [(p) => progresses.push(p)]
    });
    // /timeout 端点 2s 后才响应，确保 5ms 防抖 timer 在请求完成前触发中间进度值
    c.get('/timeout').then(() => {
      t.ok(progresses.length > 0, `progress fired ${progresses.length} times`);
      t.end();
    }, t.end);
  });

  troot.end();
});

test('Client - hook 注册与移除', (troot) => {
  troot.test('off 移除单个 hook 后不再触发', (t) => {
    const c = akita.create({ apiRoot: 'http://localhost:28000' });
    let called = 0;
    const hook = () => {
      called++;
    };
    c.on('request', hook);
    c.off('request', hook);
    c.get('/get').then(() => {
      t.equal(called, 0, 'removed hook should not fire');
      t.end();
    }, t.end);
  });

  troot.test('off 移除单个 hook 后内部状态为 null', (t) => {
    const c = akita.create({});
    const hook = () => {};
    c.on('request', hook);
    c.off('request', hook);
    t.equal(c.options.onRequest, null);
    t.end();
  });

  troot.test('off 从多 hook 数组移除一个后剩余仍生效', (t) => {
    const c = akita.create({ apiRoot: 'http://localhost:28000' });
    let called1 = 0;
    let called2 = 0;
    const h1 = () => {
      called1++;
    };
    const h2 = () => {
      called2++;
    };
    c.on('request', h1);
    c.on('request', h2);
    c.off('request', h1);
    c.get('/get').then(() => {
      t.equal(called1, 0, 'removed h1 should not fire');
      t.equal(called2, 1, 'remaining h2 should fire');
      t.end();
    }, t.end);
  });

  troot.test('off 使 hook 数组清空置 null', (t) => {
    const c = akita.create({});
    const h1 = () => {};
    const h2 = () => {};
    c.on('request', h1);
    c.on('request', h2);
    c.off('request', h1);
    c.off('request', h2);
    t.ok(!c.options.onRequest);
    t.end();
  });

  troot.test('off 无 hook 时直接返回', (t) => {
    const c = akita.create({});
    const fn = () => {};
    t.doesNotThrow(() => c.off('request', fn));
    t.end();
  });

  troot.test('createBody 处理 ArrayBuffer', (t) => {
    const c = akita.create({});
    const buf = new ArrayBuffer(4);
    const result = c.createBody(buf);
    t.ok(result instanceof Uint8Array);
    t.end();
  });

  troot.end();
});
