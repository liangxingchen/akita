import fs = require('fs');
import test = require('tape');
import client from '../src/node';
import { version } from '../package.json';

const client2 = client.resolve('http');

client.setOptions({ init: { headers: { Agent: 'Akita' } } });
client2.setOptions({ apiRoot: 'http://localhost:28000' });

test('HTTP', (troot) => {
  troot.test('test get', (t) => {
    client.get('http://localhost:28000/get').then((res) => {
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

  troot.test('test headers', (t) => {
    client.get('http://localhost:28000', { headers: { foo: 'bar' } }).then((res) => {
      t.equal(res.headers.foo, 'bar');
      t.equal(res.headers['user-agent'], `Akita/${version} (+https://github.com/maichong/akita)`);
      t.end();
    }, t.end);
  });

  troot.test('test post', (t) => {
    client.post('http://localhost:28000', {
      body: { foo: 'bar' }
    }).then((res) => {
      t.deepEqual(res.body, { foo: 'bar' });
      t.end();
    }, t.end);
  });

  troot.test('test post buffer', (t) => {
    t.plan(1);
    client.post('http://localhost:28000', {
      headers: {
        'Content-Type': 'application/json'
      },
      body: Buffer.from(JSON.stringify({ foo: 'bar' }))
    }).then((res) => {
      t.deepEqual(res.body, { foo: 'bar' });
      t.end();
    }, t.end);
  });

  troot.test('test post form data', (t) => {
    client.post('http://localhost:28000', {
      body: { foo: 'bar' },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }).then((res) => {
      t.equal(res.headers['content-type'], 'application/x-www-form-urlencoded');
      t.deepEqual(res.body, { foo: 'bar' });
      t.end();
    }, t.end);
  });

  troot.test('test upload', (t) => {
    client.upload('http://localhost:28000', {
      body: {
        foo: 'bar',
        file: fs.createReadStream(process.cwd() + '/LICENSE')
      }
    }).then((res) => {
      t.deepEqual(res.method, 'POST');
      t.deepEqual(res.body, { foo: 'bar' });
      t.deepEqual(res.files.file.filename, 'LICENSE');
      t.end();
    }, t.end);
  });

  troot.test('test text', (t) => {
    client.get('http://localhost:28000').text().then((res) => {
      t.equal('string', typeof res);
      t.end();
    }, t.end);
  });

  troot.test('test buffer', (t) => {
    client2.get('/get').buffer().then((res) => {
      t.ok(Buffer.isBuffer(res));
      t.end();
    }, t.end);
  });

  troot.end();
});
