/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-12-26
 * @author Liang <liang@maichong.it>
 */

'use strict';

const stringify = require('qs/lib/stringify');

// 有效HTTP方法列表
const methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'TRACE', 'CONNECT'];

class Client {
  constructor(options) {
    this.options = options || {};
  }

  create(options) {
    return new Client(options);
  }

  setOptions(options) {
    this.options = Object.assign({}, this.options, options);
  }

  request(path, options) {
    options = options || {};
    if (options.params) {
      path += '?' + stringify(options.params);
    }

    if (this.options.apiRoot) {
      path = this.options.apiRoot + path;
    }

    let fetch = this.options.fetch;

    if (!fetch) {
      if (typeof window !== 'undefined') {
        fetch = window.fetch;
      } else if (typeof global !== 'undefined') {
        fetch = global.fetch;
      } else if (typeof self !== 'undefined') {
        fetch = self.fetch;
      }
    }

    return fetch(path, options).then(res => res.json()).then((data) => {
      if (data && data.error) {
        let error = new Error(data.error);
        if (data.code) {
          error.code = data.code;
        }
        return Promise.reject(error)
      }
      return Promise.resolve(data);
    })
  }

  get(path, params, options) {
    options = options || {};
    options.method = 'GET';
    options.params = params;
    return this.request(path, options);
  }

  delete(path, params, options) {
    options = options || {};
    options.method = 'DELETE';
    options.params = params;
    return this.request(path, options);
  }

  head(path, params, options) {
    options = options || {};
    options.method = 'HEAD';
    options.params = params;
    return this.request(path, options);
  }

  options(path, params, options) {
    options = options || {};
    options.method = 'OPTIONS';
    options.params = params;
    return this.request(path, options);
  }

  trace(path, params, options) {
    options = options || {};
    options.method = 'TRACE';
    options.params = params;
    return this.request(path, options);
  }

  connect(path, params, options) {
    options = options || {};
    options.method = 'CONNECT';
    options.params = params;
    return this.request(path, options);
  }

  post(path, body, options) {
    options = options || {};
    options.method = 'POST';
    options.body = body;
    return this.request(path, options);
  }

  put(path, body, options) {
    options = options || {};
    options.method = 'PUT';
    options.body = body;
    return this.request(path, options);
  }
}


module.exports = new Client();
