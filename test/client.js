/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-12-26
 * @author Liang <liang@maichong.it>
 */

import test from 'tape';
import client from '../src/node';

const client2 = client.resolve('http');

client.setOptions({ init: { headers: { Agent: 'Akita' } } });
client2.setOptions({ apiRoot: 'https://httpbin.org/', debug: true });

test('HTTP', (troot) => {
  troot.test('test get', (t) => {
    client.get('https://httpbin.org/get').then((res) => {
      if (!res) {
        t.fail('Error res');
        return;
      }
      t.end();
    }, t.end);
  });

  troot.test('test query', (t) => {
    client.get('https://httpbin.org/get', { query: { foo: { bar: 'baz' } } }).then((res) => {
      t.equal(res.url, 'https://httpbin.org/get?foo[bar]=baz');
      t.end();
    }, t.end);
  });

  troot.test('test headers', (t) => {
    client.get('https://httpbin.org/get', { headers: { foo: 'bar' } }).then((res) => {
      t.equal(res.headers.Foo, 'bar');
      t.equal(res.headers.Agent, 'Akita');
      t.end();
    }, t.end);
  });

  troot.test('test post', (t) => {
    client.post('https://httpbin.org/post', {
      body: { foo: 'bar' }
    }).then((res) => {
      if (res.data !== '{"foo":"bar"}' || res.headers['Content-Type'] !== 'application/json') {
        t.fail('Error');
        return;
      }
      t.end();
    }, t.end);
  });

  troot.test('test post form data', (t) => {
    client.post('https://httpbin.org/post', {
      body: { foo: 'bar' },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }).then((res) => {
      t.equal(res.headers['Content-Type'], 'application/x-www-form-urlencoded');
      t.deepEqual(res.form, { foo: 'bar' });
      t.end();
    }, t.end);
  });

  troot.test('test upload', (t) => {
    client.upload('https://httpbin.org/post', {
      body: {
        foo: 'bar',
        // file: fs.createReadStream(process.cwd() + '/LICENSE')
      }
    }).then((res) => {
      t.deepEqual(
        { foo: 'bar' },
        res.form
      );
      t.end();
    }, t.end);
  });

  troot.test('test text', (t) => {
    client.get('https://httpbin.org/get').text().then((res) => {
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
