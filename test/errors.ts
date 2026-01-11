import test from 'tape';
import type { Client } from '..';
import akita from '../src/node';
import { isAkitaError, isNetworkError, isHTTPError, isParseError, isServerError } from '../src/utils';

const client: Client = akita;
const client2 = client.resolve('error');

client2.setOptions({
  apiRoot: 'http://localhost:28000'
});

test('Error Handling', (troot) => {
  test('Network Errors', (t) => {
    t.test('timeout error', (t) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 500);

      client2.get('/timeout', { signal: controller.signal }).catch((error) => {
        clearTimeout(timeoutId);
        t.ok(isAkitaError(error), 'should be AkitaError');
        if (isNetworkError(error)) {
          t.equal(error.type, 'network', 'error type should be network');
          t.ok(error.networkType, 'should have networkType');
          t.ok(error.code.startsWith('NETWORK_'), 'code should start with NETWORK_');
          t.ok(error.url, 'should have url');
          t.ok(error.method, 'should have method');
          t.ok(error.cause, 'should have original error in cause');
          t.ok(error.timestamp, 'should have timestamp');
          t.end();
        } else {
          t.fail('error should be network error');
          t.end();
        }
      });
    });

    t.test('connection refused error', (t) => {
      client.get('http://localhost:29999/test').catch((error) => {
        t.ok(isAkitaError(error), 'should be AkitaError');
        if (isNetworkError(error)) {
          t.equal(error.type, 'network', 'error type should be network');
          t.ok(error.networkType, 'should have networkType (actual: ' + error.networkType + ')');
          t.ok(error.code.startsWith('NETWORK_'), 'code should start with NETWORK_');
          t.end();
        } else {
          t.fail('error should be network error');
          t.end();
        }
      });
    });

    t.end();
  });

  test('HTTP Errors', (t) => {
    t.test('400 Bad Request', (t) => {
      client2.get('/error/400').catch((error) => {
        t.ok(isAkitaError(error), 'should be AkitaError');
        if (isServerError(error)) {
          t.equal(error.type, 'server', 'error type should be server (has error field in body)');
          t.equal(error.message, 'Bad Request', 'message should match');
          t.equal(error.code, 'SERVER_ERROR', 'code should be SERVER_ERROR');
          t.ok(error.timestamp, 'should have timestamp');
          t.end();
        } else {
          t.fail('error should be server error');
          t.end();
        }
      });
    });

    t.test('401 Unauthorized', (t) => {
      client2.get('/error/401').catch((error) => {
        t.ok(isAkitaError(error), 'should be AkitaError');
        t.ok(error.type === 'server' || error.type === 'http', 'error should be server or http type');
        t.ok(error.code, 'should have code');
        t.ok(error.timestamp, 'should have timestamp');
        t.end();
      });
    });

    t.test('403 Forbidden', (t) => {
      client2.get('/error/403').catch((error) => {
        t.ok(isAkitaError(error), 'should be AkitaError');
        t.ok(error.type === 'server' || error.type === 'http', 'error should be server or http type');
        t.ok(error.code, 'should have code');
        t.ok(error.timestamp, 'should have timestamp');
        t.end();
      });
    });

    t.test('404 Not Found', (t) => {
      client2.get('/error/404').catch((error) => {
        t.ok(isAkitaError(error), 'should be AkitaError');
        t.ok(error.type === 'server' || error.type === 'http', 'error should be server or http type');
        t.ok(error.code, 'should have code');
        t.ok(error.timestamp, 'should have timestamp');
        t.end();
      });
    });

    t.test('500 Internal Server Error', (t) => {
      client2.get('/error/500').catch((error) => {
        t.ok(isAkitaError(error), 'should be AkitaError');
        t.ok(error.type === 'server' || error.type === 'http', 'error should be server or http type');
        t.ok(error.code, 'should have code');
        t.ok(error.timestamp, 'should have timestamp');
        t.end();
      });
    });

    t.test('503 Service Unavailable', (t) => {
      client2.get('/error/503').catch((error) => {
        t.ok(isAkitaError(error), 'should be AkitaError');
        t.ok(error.type === 'server' || error.type === 'http', 'error should be server or http type');
        t.ok(error.code, 'should have code');
        t.ok(error.timestamp, 'should have timestamp');
        t.end();
      });
    });

    t.test('404 with empty body', (t) => {
      client2.get('/error/empty-404').catch((error) => {
        t.ok(isAkitaError(error), 'should be AkitaError');
        if (isHTTPError(error)) {
          t.equal(error.type, 'http', 'error type should be http (no error field)');
          t.equal(error.status, 404, 'status should be 404');
          t.equal(error.code, 'HTTP_404', 'code should be HTTP_404');
          t.end();
        } else {
          t.fail('error should be HTTP error');
          t.end();
        }
      });
    });

    t.end();
  });

  test('Parse Errors', (t) => {
    t.test('invalid JSON', (t) => {
      client2.get('/error/invalid-json').catch((error) => {
        t.ok(isAkitaError(error), 'should be AkitaError');
        if (isParseError(error)) {
          t.equal(error.type, 'parse', 'error type should be parse');
          t.equal(error.code, 'PARSE_JSON_ERROR', 'code should be PARSE_JSON_ERROR');
          t.ok(error.message.includes('Failed to parse json'), 'message should indicate parse failure');
          t.ok(error.cause, 'should have original error in cause');
          t.ok(error.url, 'should have url');
          t.ok(error.method, 'should have method');
          t.ok(error.timestamp, 'should have timestamp');
          t.end();
        } else {
          t.fail('error should be parse error');
          t.end();
        }
      });
    });

    t.end();
  });

  test('Server Errors', (t) => {
    t.test('server error with custom code', (t) => {
      client2.get('/error/server-with-code').catch((error) => {
        t.ok(isAkitaError(error), 'should be AkitaError');
        if (isServerError(error)) {
          t.equal(error.type, 'server', 'error type should be server');
          t.equal(error.code, 'USER_NOT_FOUND', 'code should be USER_NOT_FOUND');
          t.equal(error.message, 'User not found', 'message should match server error');
          t.ok(error.timestamp, 'should have timestamp');
          t.end();
        } else {
          t.fail('error should be server error');
          t.end();
        }
      });
    });

    t.test('server error without custom code', (t) => {
      client2.get('/error/server-without-code').catch((error) => {
        t.ok(isServerError(error), 'should be server error');
        t.equal(error.type, 'server', 'error type should be server');
        t.equal(error.code, 'SERVER_ERROR', 'code should default to SERVER_ERROR');
        t.equal(error.message, 'Something went wrong', 'message should match server error');
        t.end();
      });
    });

    t.test('safe error values - error: "0"', (t) => {
      client2
        .get('/error/safe-values')
        .then((res) => {
          t.equal(res.data, 'success', 'should return data successfully when error is "0"');
          t.end();
        })
        .catch(t.end);
    });

    t.test('safe error values - error: "null"', (t) => {
      client2
        .get('/error/safe-null')
        .then((res) => {
          t.equal(res.data, 'success', 'should return data successfully when error is "null"');
          t.end();
        })
        .catch(t.end);
    });

    t.test('safe error values - error: "none"', (t) => {
      client2
        .get('/error/safe-none')
        .then((res) => {
          t.equal(res.data, 'success', 'should return data successfully when error is "none"');
          t.end();
        })
        .catch(t.end);
    });

    t.end();
  });

  test('Type Guards', (t) => {
    t.test('isAkitaError', (t) => {
      const akitaErr = new Error('test error') as any;
      akitaErr.type = 'network';
      akitaErr.code = 'NETWORK_TIMEOUT';

      const regularErr = new Error('regular error');

      t.notOk(isAkitaError(regularErr), 'should return false for regular Error');
      t.end();
    });

    t.test('isNetworkError', (t) => {
      const networkErr = new Error('test') as any;
      networkErr.type = 'network';
      networkErr.code = 'NETWORK_TIMEOUT';

      const httpErr = new Error('test') as any;
      httpErr.type = 'http';
      httpErr.code = 'HTTP_404';

      t.notOk(isNetworkError(httpErr), 'should return false for http error');
      t.end();
    });

    t.test('isHTTPError', (t) => {
      const httpErr = new Error('test') as any;
      httpErr.type = 'http';
      httpErr.code = 'HTTP_404';

      const networkErr = new Error('test') as any;
      networkErr.type = 'network';
      networkErr.code = 'NETWORK_TIMEOUT';

      t.notOk(isHTTPError(networkErr), 'should return false for network error');
      t.end();
    });

    t.test('isParseError', (t) => {
      const parseErr = new Error('test') as any;
      parseErr.type = 'parse';
      parseErr.code = 'PARSE_JSON_ERROR';

      const httpErr = new Error('test') as any;
      httpErr.type = 'http';
      httpErr.code = 'HTTP_404';

      t.notOk(isParseError(httpErr), 'should return false for http error');
      t.end();
    });

    t.test('isServerError', (t) => {
      const serverErr = new Error('test') as any;
      serverErr.type = 'server';
      serverErr.code = 'SERVER_ERROR';

      const httpErr = new Error('test') as any;
      httpErr.type = 'http';
      httpErr.code = 'HTTP_404';

      t.notOk(isServerError(httpErr), 'should return false for http error');
      t.end();
    });

    t.end();
  });

  test('Error Properties', (t) => {
    t.test('error contains timestamp', (t) => {
      client2.get('/error/500').catch((error) => {
        t.ok(error.timestamp, 'should have timestamp property');
        t.ok(typeof error.timestamp === 'number', 'timestamp should be a number');
        const timeDiff = Math.abs(Date.now() - error.timestamp);
        t.ok(timeDiff < 5000, 'timestamp should be recent (within 5 seconds)');
        t.end();
      });
    });

    t.test('error contains timestamp', (t) => {
      client2.get('/error/500').catch((error) => {
        t.ok(error.timestamp, 'should have timestamp property');
        t.ok(typeof error.timestamp === 'number', 'timestamp should be a number');
        const timeDiff = Math.abs(Date.now() - error.timestamp);
        t.ok(timeDiff < 5000, 'timestamp should be recent (within 5 seconds)');
        t.end();
      });
    });

    t.test('parse error has cause chain', (t) => {
      client2.get('/error/invalid-json').catch((error) => {
        t.ok(error.cause, 'should have cause property');
        t.ok(error.cause instanceof Error, 'cause should be an Error instance');
        t.ok(error.cause.message, 'cause should have message');
        t.end();
      });
    });

    t.end();
  });

  troot.end();
});
