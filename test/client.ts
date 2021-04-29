import * as fs from 'fs';
import * as test from 'tape';
import * as http from 'http';
import client from '../src/node';
import { version } from '../package.json';

const client2 = client.resolve('http');

client.setOptions({
  init: { headers: { Agent: 'Akita' } },
  // onRequest: (request) =>
  //   new Promise((resolve) => {
  //     console.log('request:', request.url);
  //     // resolve
  //   }),
  onResponse: (request) => {
    console.log('res ->', request.url, request.res.statusText);
  },
  onDecode: async (request) => {
    request.value = JSON.parse(request.raw);
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
      t.equal(res.headers['user-agent'], `Akita/${version} (+https://github.com/maichong/akita)`);
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

  troot.test('cancel json stream', async (t) => {
    let stream = await client2.get('/goods/watch').jsonStream();
    let event = await stream.read();
    t.equal(event.type, 'ADDED');
    t.equal(event.object.id, 1001);
    t.equal(event.object.title, 'iPhone');

    // 500ms 后从前端关闭
    setTimeout(() => stream.cancel(), 500);
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
          stream.cancel();
          t.equal(stream.closed, true, 'stream should be closed');
          t.end();
        });
      });
  });

  troot.end();
});
