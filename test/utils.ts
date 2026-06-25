import test from 'tape';
import {
  AkitaError,
  detectNetworkErrorType,
  createNetworkError,
  createHTTPError,
  createParseError,
  createServerError,
  isUint8Array,
  isReadableStream,
  isFile,
  isAkitaError,
  isNetworkError,
  isHTTPError,
  isParseError,
  isServerError
} from '../src/utils';

test('Utils - detectNetworkErrorType 全分支覆盖', (troot) => {
  // timeout 分支：覆盖 message 含 timeout/timed out/请求超时，name 含 timeout/aborted
  troot.test('timeout - message 含 timeout', (t) => {
    t.equal(detectNetworkErrorType(new Error('request timeout')), 'timeout');
    t.end();
  });

  troot.test('timeout - message 含 timed out', (t) => {
    t.equal(detectNetworkErrorType(new Error('operation timed out')), 'timeout');
    t.end();
  });

  troot.test('timeout - message 含 请求超时', (t) => {
    t.equal(detectNetworkErrorType(new Error('请求超时')), 'timeout');
    t.end();
  });

  troot.test('timeout - name 含 timeout', (t) => {
    const err = new Error('some error');
    err.name = 'TimeoutError';
    t.equal(detectNetworkErrorType(err), 'timeout');
    t.end();
  });

  troot.test('timeout - name 含 aborted', (t) => {
    const err = new Error('some error');
    err.name = 'RequestAborted';
    t.equal(detectNetworkErrorType(err), 'timeout');
    t.end();
  });

  // dns_failed 分支：覆盖多种 DNS 相关错误消息
  troot.test('dns_failed - message 含 enotfound', (t) => {
    t.equal(detectNetworkErrorType(new Error('getaddrinfo ENOTFOUND example.com')), 'dns_failed');
    t.end();
  });

  troot.test('dns_failed - message 含 getaddrinfo', (t) => {
    t.equal(detectNetworkErrorType(new Error('getaddrinfo failed')), 'dns_failed');
    t.end();
  });

  troot.test('dns_failed - message 含 dns', (t) => {
    t.equal(detectNetworkErrorType(new Error('dns lookup error')), 'dns_failed');
    t.end();
  });

  troot.test('dns_failed - message 含 could not resolve', (t) => {
    t.equal(detectNetworkErrorType(new Error('could not resolve host')), 'dns_failed');
    t.end();
  });

  troot.test('dns_failed - message 含 域名解析失败', (t) => {
    t.equal(detectNetworkErrorType(new Error('域名解析失败')), 'dns_failed');
    t.end();
  });

  troot.test('dns_failed - message 含 name resolution failed', (t) => {
    t.equal(detectNetworkErrorType(new Error('name resolution failed')), 'dns_failed');
    t.end();
  });

  // cors 分支
  troot.test('cors - message 含 cors', (t) => {
    t.equal(detectNetworkErrorType(new Error('CORS error')), 'cors');
    t.end();
  });

  troot.test('cors - message 含 cross-origin', (t) => {
    t.equal(detectNetworkErrorType(new Error('cross-origin blocked')), 'cors');
    t.end();
  });

  troot.test('cors - message 含 access control allow origin', (t) => {
    t.equal(detectNetworkErrorType(new Error('No Access Control Allow Origin')), 'cors');
    t.end();
  });

  troot.test('cors - message 含 blocked by cors', (t) => {
    t.equal(detectNetworkErrorType(new Error('blocked by cors policy')), 'cors');
    t.end();
  });

  // connection_refused 分支
  troot.test('connection_refused - message 含 econnrefused', (t) => {
    t.equal(detectNetworkErrorType(new Error('ECONNREFUSED 127.0.0.1:8080')), 'connection_refused');
    t.end();
  });

  troot.test('connection_refused - message 含 connection refused', (t) => {
    t.equal(detectNetworkErrorType(new Error('connection refused')), 'connection_refused');
    t.end();
  });

  troot.test('connection_refused - message 含 connection reset', (t) => {
    t.equal(detectNetworkErrorType(new Error('connection reset by peer')), 'connection_refused');
    t.end();
  });

  troot.test('connection_refused - message 含 econnreset', (t) => {
    t.equal(detectNetworkErrorType(new Error('ECONNRESET')), 'connection_refused');
    t.end();
  });

  // network_unreachable 分支
  troot.test('network_unreachable - message 含 enetunreachable', (t) => {
    t.equal(detectNetworkErrorType(new Error('ENETUNREACHABLE')), 'network_unreachable');
    t.end();
  });

  troot.test('network_unreachable - message 含 network unreachable', (t) => {
    t.equal(detectNetworkErrorType(new Error('network unreachable')), 'network_unreachable');
    t.end();
  });

  troot.test('network_unreachable - message 含 unreachable', (t) => {
    t.equal(detectNetworkErrorType(new Error('host unreachable')), 'network_unreachable');
    t.end();
  });

  // offline 分支
  troot.test('offline - message 含 offline', (t) => {
    t.equal(detectNetworkErrorType(new Error('network offline')), 'offline');
    t.end();
  });

  troot.test('offline - message 含 no internet', (t) => {
    t.equal(detectNetworkErrorType(new Error('no internet connection')), 'offline');
    t.end();
  });

  troot.test('offline - message 含 network + not available', (t) => {
    t.equal(detectNetworkErrorType(new Error('network is not available')), 'offline');
    t.end();
  });

  // 末尾的特殊 fail 分支
  troot.test('timeout - message 含 fail timeout', (t) => {
    t.equal(detectNetworkErrorType(new Error('fail timeout')), 'timeout');
    t.end();
  });

  troot.test('offline - message 含 fail no connection', (t) => {
    t.equal(detectNetworkErrorType(new Error('fail no connection')), 'offline');
    t.end();
  });

  troot.test('dns_failed - message 含 fail dns', (t) => {
    t.equal(detectNetworkErrorType(new Error('fail dns')), 'dns_failed');
    t.end();
  });

  // unknown 兜底分支
  troot.test('unknown - 无法识别的错误', (t) => {
    t.equal(detectNetworkErrorType(new Error('some random error')), 'unknown');
    t.end();
  });

  // 空 message/name 边界
  troot.test('empty message - 无消息的错误', (t) => {
    const err = new Error('');
    t.equal(detectNetworkErrorType(err), 'unknown');
    t.end();
  });

  troot.end();
});

test('Utils - createServerError error 对象分支', (troot) => {
  // error 为对象且同时有 code 和 message
  troot.test('error 为对象 - 同时有 code 和 message', (t) => {
    const serverData = {
      error: { message: 'Custom error message', code: 'CUSTOM_CODE' }
    };
    const err = createServerError('GET', '/api', serverData);
    t.ok(err instanceof AkitaError);
    t.equal(err.type, 'server');
    t.equal(err.code, 'CUSTOM_CODE');
    t.equal(err.message, 'Custom error message');
    t.end();
  });

  // error 为对象但只有 message（无 code），此时 code 走 serverData.code
  troot.test('error 为对象 - 只有 message，外层有 code', (t) => {
    const serverData = {
      error: { message: 'Nested message only' },
      code: 'OUTER_CODE'
    };
    const err = createServerError('POST', '/api', serverData);
    t.equal(err.code, 'OUTER_CODE');
    t.equal(err.message, 'Nested message only');
    t.end();
  });

  // error 为对象，message 存在但 code 完全缺失，兜底 SERVER_ERROR
  troot.test('error 为对象 - 只有 message，无任何 code', (t) => {
    const serverData = {
      error: { message: 'Nested message no code' }
    };
    const err = createServerError('GET', '/api', serverData);
    t.equal(err.code, 'SERVER_ERROR');
    t.equal(err.message, 'Nested message no code');
    t.end();
  });

  troot.end();
});

test('Utils - isUint8Array 边界', (troot) => {
  troot.test('null/undefined 返回 false', (t) => {
    t.equal(isUint8Array(null), false);
    t.equal(isUint8Array(undefined), false);
    t.end();
  });

  troot.test('无 constructor 的对象返回 false', (t) => {
    // 创建无 constructor 的对象
    const obj = Object.create(null);
    t.equal(isUint8Array(obj), false);
    t.end();
  });

  troot.test('Uint8Array 实例返回 true', (t) => {
    t.equal(isUint8Array(new Uint8Array([1, 2, 3])), true);
    t.end();
  });

  troot.test('Buffer 实例返回 true（继承自 Uint8Array）', (t) => {
    t.equal(isUint8Array(Buffer.from('hello')), true);
    t.end();
  });

  troot.test('普通对象返回 false', (t) => {
    t.equal(isUint8Array({}), false);
    t.equal(isUint8Array('string'), false);
    t.equal(isUint8Array(123), false);
    t.end();
  });

  troot.end();
});

test('Utils - isReadableStream 边界', (troot) => {
  troot.test('readable 为 false 返回 false', (t) => {
    const fakeStream: any = { pipe: () => {}, readable: false };
    t.equal(isReadableStream(fakeStream), false);
    t.end();
  });

  troot.test('无 pipe 方法返回 false', (t) => {
    t.equal(isReadableStream({ readable: true }), false);
    // null/undefined 短路求值返回 falsy（非严格 false）
    t.notOk(isReadableStream(null));
    t.equal(isReadableStream({}), false);
    t.end();
  });

  troot.test('正常可读流返回 true', (t) => {
    const fakeStream: any = { pipe: () => {}, readable: true };
    t.equal(isReadableStream(fakeStream), true);
    t.end();
  });

  troot.end();
});

test('Utils - isFile 边界', (troot) => {
  troot.test('非 Blob 且无 File 特征返回 false', (t) => {
    // null/undefined 短路求值返回 falsy（非严格 false），用 notOk 验证
    t.notOk(isFile(null));
    t.notOk(isFile({}));
    t.notOk(isFile({ slice: () => {} })); // 缺 size 和 lastModified，短路返回 undefined
    t.end();
  });

  // 模拟浏览器 File 对象（有 slice/size/lastModified）
  troot.test('File-like 对象（有 slice/size/lastModified）返回 true', (t) => {
    const fakeFile: any = {
      slice: () => {},
      size: 1024,
      lastModified: Date.now()
    };
    // && 链返回最后的真值（lastModified 数字），用 ok 验证真值
    t.ok(isFile(fakeFile));
    t.end();
  });

  troot.end();
});

test('Utils - 错误工厂函数完整性', (troot) => {
  troot.test('createNetworkError 包含所有字段', (t) => {
    const original = new Error('timeout error');
    const err = createNetworkError(original, 'GET', 'http://example.com');
    t.equal(err.type, 'network');
    t.equal(err.code, 'NETWORK_TIMEOUT');
    t.equal(err.networkType, 'timeout');
    t.equal(err.url, 'http://example.com');
    t.equal(err.method, 'GET');
    t.equal(err.cause, original);
    t.ok(err.timestamp);
    t.end();
  });

  troot.test('createHTTPError 包含所有字段', (t) => {
    const err = createHTTPError(404, 'Not Found', 'POST', 'http://example.com');
    t.equal(err.type, 'http');
    t.equal(err.code, 'HTTP_404');
    t.equal(err.status, 404);
    t.equal(err.statusText, 'Not Found');
    t.equal(err.method, 'POST');
    t.ok(err.timestamp);
    t.end();
  });

  troot.test('createParseError 包含所有字段', (t) => {
    const original = new Error('unexpected token');
    const err = createParseError(original, 'GET', 'http://example.com', 'json');
    t.equal(err.type, 'parse');
    t.equal(err.code, 'PARSE_JSON_ERROR');
    t.equal(err.cause, original);
    t.equal(err.method, 'GET');
    t.ok(err.message.includes('Failed to parse json'));
    t.end();
  });

  troot.test('createServerError - 字符串 error 兜底 SERVER_ERROR', (t) => {
    const serverData = { error: 'Simple error message' };
    const err = createServerError('GET', '/api', serverData);
    t.equal(err.type, 'server');
    t.equal(err.code, 'SERVER_ERROR');
    t.equal(err.message, 'Simple error message');
    t.end();
  });

  troot.end();
});

test('Utils - 类型守卫函数完整性', (troot) => {
  troot.test('isAkitaError 对 AkitaError 和普通 Error 的判断', (t) => {
    const akitaErr = createHTTPError(500, 'Error', 'GET', '/');
    t.ok(isAkitaError(akitaErr));
    t.notOk(isAkitaError(new Error('regular')));
    t.notOk(isAkitaError(null));
    t.notOk(isAkitaError({}));
    t.end();
  });

  troot.test('isNetworkError 类型守卫', (t) => {
    const networkErr = createNetworkError(new Error('timeout'), 'GET', '/');
    const httpErr = createHTTPError(404, 'NF', 'GET', '/');
    t.ok(isNetworkError(networkErr));
    t.notOk(isNetworkError(httpErr));
    t.end();
  });

  troot.test('isHTTPError 类型守卫', (t) => {
    const httpErr = createHTTPError(404, 'NF', 'GET', '/');
    const networkErr = createNetworkError(new Error('timeout'), 'GET', '/');
    t.ok(isHTTPError(httpErr));
    t.notOk(isHTTPError(networkErr));
    t.end();
  });

  troot.test('isParseError 类型守卫', (t) => {
    const parseErr = createParseError(new Error('parse'), 'GET', '/', 'json');
    const httpErr = createHTTPError(404, 'NF', 'GET', '/');
    t.ok(isParseError(parseErr));
    t.notOk(isParseError(httpErr));
    t.end();
  });

  troot.test('isServerError 类型守卫', (t) => {
    const serverErr = createServerError('GET', '/', { error: 'msg' });
    const httpErr = createHTTPError(404, 'NF', 'GET', '/');
    t.ok(isServerError(serverErr));
    t.notOk(isServerError(httpErr));
    t.end();
  });

  troot.end();
});

test('Utils - AkitaError 构造函数边界', (troot) => {
  troot.test('无 options 参数时不崩溃', (t) => {
    const err = new AkitaError('msg', 'http', 'HTTP_500');
    t.equal(err.message, 'msg');
    t.equal(err.type, 'http');
    t.equal(err.code, 'HTTP_500');
    t.equal(err.url, undefined);
    t.end();
  });

  troot.test('name 属性固定为 AkitaError', (t) => {
    const err = new AkitaError('msg', 'http', 'HTTP_500');
    t.equal(err.name, 'AkitaError');
    t.end();
  });

  troot.end();
});
