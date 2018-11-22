/* eslint no-use-before-define:0 */

import Debugger = require('debug');
import qs = require('qs');
import isBuffer = require('is-buffer');
import methods from './methods';
import Model from './model';
import Result from './result';
import * as Akita from '..';

const debug = Debugger('akita:client');

const INSTANCES = {};

function resolve(key: string) {
  if (!INSTANCES[key]) {
    INSTANCES[key] = create();
  }
  return INSTANCES[key];
}

function create(options?: Akita.ClientOptions) {
  // @ts-ignore
  const client: Akita.Client = function client(path: string): typeof Akita.Model {
    // @ts-ignore
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

  function getFormDataClass(): typeof FormData {
    let FormData = client._options.FormData;
    // @ts-ignore window.FormData
    if (!FormData && typeof window === 'object' && window.FormData) {
      // @ts-ignore window.FormData
      FormData = window.FormData;
      // @ts-ignore window.FormData
    } else if (!FormData && typeof global === 'object' && global.FormData) {
      // @ts-ignore global.FormData
      FormData = global.FormData;
    }
    return FormData;
  }

  client.request = function request(path: string, init?: Akita.RequestInit, query?: Akita.Query<any>, reducer?: Akita.Reducer<any>): Akita.Result<any> {
    init = Object.assign({}, init);
    let queryParams = Object.assign({}, init.query);
    delete init.query;

    let queryString = qs.stringify(queryParams);
    if (queryString) {
      path += `?${queryString}`;
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
      } else if (!isBuffer(body) && !(FormData && body instanceof FormData) && !(body instanceof ArrayBuffer)) {
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
          throw new Error(`Akita Error: Unsupported Content-Type ${init.headers['Content-Type']}`);
        }
      }
    }

    if (client._options.init) {
      init = Object.assign({}, client._options.init, init);
      if (client._options.init.headers) {
        init.headers = Object.assign({}, client._options.init.headers, init.headers);
      }
    }

    if (!init.headers) {
      init.headers = {};
    }

    let apiRoot = client._options.apiRoot;
    if (apiRoot) {
      if (apiRoot[apiRoot.length - 1] === '/' && path[0] === '/') {
        path = path.substring(1);
      } else if (apiRoot[apiRoot.length - 1] !== '/' && path[0] !== '/') {
        path = `/${path}`;
      }
      path = apiRoot + path;
    }

    if (debug.enabled) {
      debug(init.method, path, JSON.stringify(init));
    }

    let fetch = client._options.fetch;

    if (!fetch) {
      if (typeof window !== 'undefined') {
        fetch = window.fetch;
      } else if (typeof global !== 'undefined') {
        // @ts-ignore
        fetch = global.fetch;
      }
    }

    client._count += 1;

    return new Result(fetch, path, init, query, reducer);
  };

  methods.forEach((method) => {
    client[method] = function (path: string, init?: RequestInit) {
      init = init || {};
      init.method = method.toUpperCase();
      return client.request(path, init);
    };
  });

  return client;
}

export default resolve('default');
export { Model };
