import test from 'tape';
import akita from '../src/node';

const client = akita.resolve('request-test');
client.setOptions({ apiRoot: 'http://localhost:28000' });

test('Request - 缓存快速路径与 reducer', (troot) => {
  troot.test('text() 第二次调用走 raw 缓存', (t) => {
    const req = client.get('/get');
    req
      .text()
      .then((first) => {
        return req.text().then((second) => ({ first, second }));
      })
      .then(({ first, second }) => {
        t.equal(typeof first, 'string');
        t.equal(first, second, '两次 text() 返回值应完全一致（缓存命中）');
        t.end();
      }, t.end);
  });

  troot.test('连续 await 触发 data() value 缓存', (t) => {
    const req = client.get('/get');
    req
      .then((data) => {
        return req.then().then((data2) => ({ data, data2 }));
      })
      .then(({ data, data2 }) => {
        t.deepEqual(data, data2, '两次 await 返回值应深度相等（缓存命中）');
        t.end();
      }, t.end);
  });

  // 覆盖 reducer 分支（then 中 _reducer 处理）
  troot.test('reducer 转换数据', (t) => {
    const req = client.request('/get', {}, (json: any) => ({
      transformed: true,
      originalUrl: json.url
    }));
    req.then((result: any) => {
      t.equal(result.transformed, true);
      t.ok(result.originalUrl);
      t.end();
    }, t.end);
  });

  // 覆盖 reducer 无 onSuccess 回调分支
  troot.test('reducer 无 onSuccess 回调', (t) => {
    const req = client.request('/get', {}, (json: any) => ({ reduced: json.url }));
    // 不传 onSuccess，触发 then 内 else 分支 return this._reducer(json)
    req.then().then((result: any) => {
      t.ok(result.reduced);
      t.end();
    }, t.end);
  });

  // 覆盖 finally() 方法
  troot.test('finally 方法执行', (t) => {
    const req = client.get('/get');
    let finallyCalled = false;
    req
      .finally(() => {
        finallyCalled = true;
      })
      .then(() => {
        t.equal(finallyCalled, true);
        t.end();
      }, t.end);
  });

  troot.end();
});

test('Request - 响应元数据方法', (troot) => {
  // 覆盖 res 已填充时的快速路径（ok/status/statusText/headers 直接返回）
  troot.test('ok/status/statusText 缓存快速路径', (t) => {
    const req = client.get('/get');
    req
      .response()
      .then(() => {
        // response() 后 this.res 已填充
        return Promise.all([req.ok(), req.status(), req.statusText(), req.headers(), req.size()]);
      })
      .then(([ok, status, statusText, headers, size]) => {
        t.equal(ok, true);
        t.equal(status, 200);
        t.equal(typeof statusText, 'string');
        t.ok(headers);
        t.equal(typeof size, 'number');
        t.end();
      }, t.end);
  });

  // 覆盖 stream() 的 res 已填充分支
  troot.test('stream() res 已填充分支', (t) => {
    const req = client.get('/goods/watch');
    req
      .response()
      .then(() => {
        // response() 后 this.res 已填充，stream() 走快速路径
        return req.stream();
      })
      .then((stream) => {
        t.ok(stream);
        t.end();
      }, t.end);
  });

  troot.end();
});
