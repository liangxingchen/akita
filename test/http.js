/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-12-26
 * @author Liang <liang@maichong.it>
 */

'use strict';

const fs = require('fs');
const test = require('tape');
const fetch = require('node-fetch');
const FormData = require('form-data');
const client = require('../lib/client');
const client2 = client.resolve('http');

global.FormData = FormData;
global.fetch = fetch;

client.setOptions({ fetch, FormData, init: { headers: { Agent: 'Akita' } } });
client2.setOptions({ apiRoot: 'https://httpbin.org/', debug: true });

test('HTTP', (troot) => {

  test('test get', (t) => {
    client.get('https://httpbin.org/get').then((res) => {
      if (!res) {
        return t.fail('Error res');
      }
      t.end();
    }, t.end)
  });

  test('test params', (t) => {
    client.get('https://httpbin.org/get', { params: { foo: { bar: 'baz' } } }).then((res) => {
      t.equal(res.url, 'https://httpbin.org/get?foo[bar]=baz');
      t.end();
    }, t.end)
  });

  test('test headers', (t) => {
    client.get('https://httpbin.org/get', { headers: { foo: 'bar' } }).then((res) => {
      t.equal(res.headers.Foo, 'bar');
      t.equal(res.headers.Agent, 'Akita');
      t.end();
    }, t.end)
  });

  test('test post', (t) => {
    client.post('https://httpbin.org/post', {
      body: { foo: 'bar' }
    }).then((res) => {
      if (res.data !== '{"foo":"bar"}' || res.headers['Content-Type'] !== 'application/json') {
        return t.fail('Error');
      }
      t.end();
    }, t.end)
  });

  test('test post form data', (t) => {
    client.post('https://httpbin.org/post', {
      body: { foo: 'bar' },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }).then((res) => {
      t.equal(res.headers['Content-Type'], 'application/x-www-form-urlencoded');
      t.deepEqual(res.form, { foo: 'bar' });
      t.end();
    }, t.end)
  });

  test('test upload', (t) => {
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

  test('test text', (t) => {
    client.get('https://httpbin.org/get').text().then((res) => {
      t.equal('string', typeof res);
      t.end();
    }, t.end);
  });

  test('test buffer', (t) => {
    client2.get('/get').buffer().then((res) => {
      t.ok(Buffer.isBuffer(res));
      t.end();
    }, t.end);
  });

  troot.end();
});
