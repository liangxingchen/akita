/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-12-26
 * @author Liang <liang@maichong.it>
 */

'use strict';

const stringify = require('qs/lib/stringify');
const Query = require('./query');

// 有效HTTP方法列表
const methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'TRACE', 'CONNECT'];

const instances = {};

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

  client.request = function request(path, options) {
    options = options || {};
    if (options.params) {
      path += '?' + stringify(options.params);
    }

    if (options.body && typeof options.body === 'object') {
      if (!options.headers) {
        options.headers = {};
      }
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }

    if (client.options.apiRoot) {
      path = client.options.apiRoot + path;
    }

    let fetch = client.options.fetch;

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
    });
  };

  methods.forEach(function (method) {
    client[method.toLowerCase()] = function (path, options) {
      options = options || {};
      options.method = method;
      return client.request(path, options);
    }
  });

  return client;
}

module.exports = create();
