/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-12-26
 * @author Liang <liang@maichong.it>
 */

'use strict';

var stringify = require('qs/lib/stringify');
var Query = require('./query');

// 有效HTTP方法列表
var methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'TRACE', 'CONNECT'];

var instances = {};

function resolve(key) {
  if (!instances[key]) {
    instances[key] = create();
  }
  return instances[key];
}

function create(options) {
  const client = function client(path) {
    return new Query(path, client);
  };

  client.options = options || {};

  client.create = create;
  client.resolve = resolve;
  client.setOptions = function (options) {
    client.options = Object.assign({}, client.options, options);
  };

  client.request = function request(path, init) {
    init = init || {};
    if (init.params) {
      path += '?' + stringify(init.params);
    }

    if (init.body && typeof init.body === 'object') {
      if (!init.headers) {
        init.headers = {};
      }
      if (!init.headers['Content-Type']) {
        init.headers['Content-Type'] = 'application/json';
        init.body = JSON.stringify(init.body);
      } else if (init.headers['Content-Type'] === 'application/x-www-form-urlencoded') {
        init.body = stringify(init.body);
      }
    }

    if (client.options.init) {
      init = Object.assign({}, client.options.init, init);
    }

    if (client.options.apiRoot) {
      path = client.options.apiRoot + path;
    }

    var fetch = client.options.fetch;

    if (!fetch) {
      if (typeof window !== 'undefined') {
        fetch = window.fetch;
      } else if (typeof global !== 'undefined') {
        fetch = global.fetch;
      } else if (typeof self !== 'undefined') {
        fetch = self.fetch;
      }
    }

    var responsePromise = fetch(path, init);
    var resultPromise = null;
    var r = {};
    r.then = function (onSuccess, onFail) {
      if (!resultPromise) {
        resultPromise = r.response().then(function (response) {
          return response.json().then(function (data) {
            if (data && data.error && ['0', 'null', 'none'].indexOf(data.error) > -1) {
              var error = new Error(data.error);
              error.code = data.code || data.errorCode || 0;
              return Promise.reject(error)
            }
            return Promise.resolve(data);
          });
        });
      }
      return resultPromise.then(onSuccess, onFail);
    };
    r.catch = function (onFail) {
      return r.then(null, onFail);
    };
    r.response = function () {
      return responsePromise;
    };
    return r;
  };

  methods.forEach(function (method) {
    client[method.toLowerCase()] = function (path, init) {
      init = init || {};
      init.method = method;
      return client.request(path, init);
    }
  });

  return client;
}

module.exports = create();
