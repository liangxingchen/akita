/* eslint no-use-before-define:0 */

// @flow

import Debugger from 'debug';
import depd from 'depd';
import qs from 'qs';
import methods from './methods';
import Model from './model';
import Response from './response';
import type Query from './query';

const debug = Debugger('akita:client');
const deprecate = depd('akita:client');

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
      deprecate('akita.request(path, init): init.params deprecated, please use init.query instand.');
    }
    let queryParams = Object.assign({}, init.query || init.params);
    delete init.query;
    delete init.params;

    let queryString = qs.stringify(queryParams);
    if (queryString) {
      path += '?' + queryString;
    }

    if (init.headers) {
      init.headers = Object.assign({}, init.headers);
    }

    if (init.body && typeof init.body === 'object') {
      let body: Object = init.body;
      let FormData = getFormDataClass();

      if (init.method === 'UPLOAD') {
        // 如果是UPLOAD
        init.method = 'POST';
        if (!FormData) {
          /* istanbul ignore next */
          throw new Error('Akita Error: Can not resolve FormData class when use upload method');
        }
        if (!(body instanceof FormData)) {
          // 自动构造 FormData
          let form = new FormData();
          Object.keys(body).forEach((name) => form.append(name, body[name]));
          init.body = form;
        }
      } else if (!FormData || !(body instanceof FormData)) {
        // 如果是普通POST请求，转换成JSON或urlencoded
        if (!init.headers) {
          init.headers = {};
        }
        if (!init.headers['Content-Type'] || init.headers['Content-Type'] === 'application/json') {
          init.headers['Content-Type'] = 'application/json';
          init.body = JSON.stringify(body);
        } else if (init.headers['Content-Type'] === 'application/x-www-form-urlencoded') {
          init.body = qs.stringify(body);
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

    client.latest = Object.assign({}, init, {
      url: path
    });

    if (inspect) {
      return client.latest;
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

    return new Response(fetch, path, init, query);
  };

  methods.forEach((method) => {
    client[method] = function (path: string, init?: akita$RequestInit, inspect?: boolean) {
      init = init || {};
      init.method = method.toUpperCase();
      return client.request(path, init, null, inspect);
    };
  });

  return client;
}

export default resolve('default');
export { Model };
