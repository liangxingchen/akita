/* eslint no-use-before-define:0 */

// @flow

import Debugger from 'debug';
import qs from 'qs';
import methods from 'methods';
import Model from './model';
import Response from './response';
import type Query from './query';

const debug = Debugger('akita:client');

const INSTANCES = {};

function resolve(key: string) {
  if (!INSTANCES[key]) {
    INSTANCES[key] = create();
  }
  return INSTANCES[key];
}

function create(options?: Object) {
  const client = function client(path: string) {
    return class AnonymousModel extends Model {
      static path = path;
      static client = client;
    };
  };

  client._options = options || {};

  // 已经发送请求的数量
  client._count = 0;
  client.create = create;
  client.resolve = resolve;
  client.setOptions = (opts: Object) => {
    client._options = Object.assign({}, client._options, opts);
  };

  function getFormDataClass() {
    let FormData = client._options.FormData;
    if (!FormData && typeof window === 'object' && window.FormData) {
      FormData = window.FormData;
    } else if (!FormData && typeof global === 'object' && global.FormData) {
      FormData = global.FormData;
    }
    return FormData;
  }

  client.request = function request(path: string, init?: akita$RequestInit, query?: Query | null, inspect?: boolean) {
    init = Object.assign({}, init);
    if (init.params) {
      let paramsString = qs.stringify(init.params);
      if (paramsString) {
        path += '?' + paramsString;
      }
      delete init.params;
    }

    if (init.body && typeof init.body === 'object') {
      let FormData = getFormDataClass();

      if (init.method === 'UPLOAD') {
        // 如果是UPLOAD
        init.method = 'POST';
        if (!FormData) {
          /* istanbul ignore next */
          throw new Error('Akita Error: Can not resolve FormData class when use upload method');
        }
        if (!(init.body instanceof FormData)) {
          // 自动构造 FormData
          let body = new FormData();
          for (let name in init.body) {
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
          init.body = qs.stringify(init.body);
        } else {
          /* istanbul ignore next */
          throw new Error('Akita Error: Unsupported Content-Type ' + init.headers['Content-Type']);
        }
      }
    }

    if (client._options.init) {
      init = Object.assign({}, client._options.init, init);
      if (client._options.init.headers) {
        init.headers = Object.assign({}, client._options.init.headers, init.headers);
      }
    }

    let apiRoot = client._options.apiRoot;
    if (apiRoot) {
      if (apiRoot[apiRoot.length - 1] === '/' && path[0] === '/') {
        path = path.substring(1);
      } else if (apiRoot[apiRoot.length - 1] !== '/' && path[0] !== '/') {
        path = '/' + path;
      }
      path = apiRoot + path;
    }

    if (debug.enabled) {
      debug(init.method, path, JSON.stringify(init));
    }

    if (inspect) {
      return Object.assign({}, init, {
        url: path
      });
    }

    let fetch = client._options.fetch;

    if (!fetch) {
      if (typeof window !== 'undefined') {
        fetch = window.fetch;
      } else if (typeof global !== 'undefined') {
        fetch = global.fetch;
      }
    }

    client._count += 1;

    return new Response(fetch(path, init));
  };

  methods.forEach((method) => {
    client[method] = function (path, init) {
      init = init || {};
      init.method = method.toUpperCase();
      return client.request(path, init);
    };
  });

  return client;
}

export default resolve('default');
export { Model };
