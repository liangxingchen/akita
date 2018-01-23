/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-12-26
 * @author Liang <liang@maichong.it>
 */

'use strict';

var stringify = require('qs/lib/stringify');
var Model = require('./model');

// 有效HTTP方法列表
var methods = ['GET', 'POST', 'UPLOAD', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD', 'TRACE', 'CONNECT'];

var instances = {};

function resolve(key) {
  if (!instances[key]) {
    instances[key] = create();
  }
  return instances[key];
}

function create(options) {
  var client = function client(path) {
    return new Model(path, client);
  };

  client._options = options || {};

  // 已经发送请求的数量
  client._count = 0;
  client.create = create;
  client.resolve = resolve;
  client.setOptions = function (options) {
    var debug = options.debug;
    if (debug === true) {
      debug = function () {
        var args = ['Akita'].concat([].slice.call(arguments));
        console.log.apply(console, args);
      };
    }
    client._options = Object.assign({}, client._options, options, debug ? { debug: debug } : {});
  };

  function getFormDataClass() {
    var FormData = client._options.FormData;
    if (!FormData && typeof window === 'object' && window.FormData) {
      FormData = window.FormData;
    } else if (!FormData && typeof global === 'object' && global.FormData) {
      FormData = global.FormData;
    }
    return FormData;
  }

  client.request = function request(path, init, query, inspect) {
    init = Object.assign({}, init);
    if (init.params) {
      path += '?' + stringify(init.params);
      delete init.params;
    }

    if (init.body && typeof init.body === 'object') {

      var FormData = getFormDataClass();

      if (init.method === 'UPLOAD') {
        // 如果是UPLOAD
        init.method = 'POST';
        if (!FormData) {
          /* istanbul ignore next */
          throw new Error('Akita Error: Can not resolve FormData class when use upload method');
        }
        if (!(init.body instanceof FormData)) {
          // 自动构造 FormData
          var body = new FormData();
          for (var name in init.body) {
            body.append(name, init.body[name]);
          }
          init.body = body;
        }
      } else if (!FormData || !(init.body instanceof FormData)) {
        // 如果是普通POST请求，转换成JSON或urlencoded
        if (!init.headers) {
          init.headers = {};
        }
        if (!init.headers['Content-Type'] || init.headers['Content-Type'] === 'application/json') {
          init.headers['Content-Type'] = 'application/json';
          init.body = JSON.stringify(init.body);
        } else if (init.headers['Content-Type'] === 'application/x-www-form-urlencoded') {
          init.body = stringify(init.body);
        } else {
          /* istanbul ignore next */
          throw new Error('Akita Error: Unsupported Content-Type ' + init.headers['Content-Type']);
        }
      }
    }

    if (client._options.init) {
      init = Object.assign({}, client._options.init, init);
      if (client._options.init.headers) {
        init.headers = Object.assign({}, client._options.init.headers, init.headers)
      }
    }

    var apiRoot = client._options.apiRoot;
    if (apiRoot) {
      if (apiRoot[apiRoot.length - 1] === '/' && path[0] === '/') {
        path = path.substring(1);
      } else if (apiRoot[apiRoot.length - 1] !== '/' && path[0] !== '/') {
        path = '/' + path;
      }
      path = apiRoot + path;
    }

    if (inspect) {
      return Object.assign({}, init, {
        url: path
      });
    }

    var fetch = client._options.fetch;

    var debug = client._options.debug;

    if (!fetch) {
      if (typeof window !== 'undefined') {
        fetch = window.fetch;
      } else if (typeof global !== 'undefined') {
        fetch = global.fetch;
      } else if (typeof self !== 'undefined') {
        fetch = self.fetch;
      }
    }

    if (debug) {
      debug('fetch', path, init);
    }
    client._count++;

    var r = {};
    var status;
    var headers = {};
    var bufferPromise;
    var jsonPromise;

    var responsePromise = fetch(path, init).then(function (response) {
      status = response.status;
      response.headers.forEach(function (value, name) {
        headers[name] = value;
      });
      if (debug) debug('response status:', status, 'headers:' + JSON.stringify(headers));
      return Promise.resolve(response);
    }, function (error) {
      if (debug) debug('fetch error:', error.message);
      return Promise.reject(error);
    });

    /**
     * 获取Response
     * @returns {Promise.<Object>}
     */
    r.response = function () {
      return responsePromise;
    };

    /**
     * 获取Buffer数据
     * @returns {Promise.<any>}
     */
    r.buffer = function () {
      if (!bufferPromise) {
        bufferPromise = responsePromise.then(function (res) {
          var fn = 'buffer';
          if (res.arrayBuffer) {
            fn = 'arrayBuffer';
          }
          return res[fn]().catch(function (error) {
            if (debug) debug('get buffer error:', error.message);
            return Promise.reject(error);
          });
        });
      }
      return bufferPromise;
    };

    /**
     * 获取文本数据
     * @returns {Promise.<any>}
     */
    r.text = function () {
      return r.buffer().then(function (buffer) {
        return buffer.toString();
      });
    };

    /**
     * 获取JSON数据
     * @returns {Promise.<any>}
     */
    r.json = function () {
      if (!jsonPromise) {
        jsonPromise = responsePromise.then(function (res) {
          if (res.status === 204) {
            return {};
          }
          return res.json().then(function (json) {
            if (debug) debug('response json:', json);
            if (status === 404 && query && ['findById', 'remove'].indexOf(query._op) > -1) {
              if (debug) debug('return null when ' + query._op + ' 404');
              return null;
            }
            if (json && json.error && ['0', 'null', 'none'].indexOf(json.error) < 0) {
              var error = new Error(json.error);
              error.code = json.code || json.errorCode || 0;
              return Promise.reject(error)
            }
            return json;
          }, function (error) {
            if (debug) debug('json parse error:', error.message);
            return Promise.reject(error);
          });
        });
      }
      return jsonPromise;
    };

    /**
     * 获取JSON数据
     * @returns {Promise.<any>}
     */
    r.then = function (onSuccess, onFail) {
      return r.json().then(onSuccess, onFail);
    };
    r.catch = function (onFail) {
      return r.then(null, onFail);
    };
    return r;
  };

  methods.forEach(function (method) {
    client[method.toLowerCase()] = function (path, init) {
      if (client._options.debug) {
        try {
          client._options.debug(method, path, JSON.parse(JSON.stringify(init)));
        } catch (e) {
          client._options.debug(method, path, init);
        }
      }
      init = init || {};
      init.method = method;
      return client.request(path, init);
    }
  });

  return client;
}

module.exports = resolve('default');
