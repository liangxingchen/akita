/* eslint no-use-before-define:0 */

import * as Debugger from 'debug';
import * as qs from 'qs';
import isBuffer = require('is-buffer');
import methods from './methods';
import Model from './model';
import Request from './request';
import * as Akita from '..';

const debug = Debugger('akita:client');

const INSTANCES = {};

function isStream(value: any): boolean {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.pipe === 'function' &&
    value.readable !== false &&
    typeof value._readableState === 'object'
  );
}

// Browser File
function isFile(value: any): boolean {
  return value && typeof value === 'object' && typeof value.slice === 'function' && value.size && value.lastModified;
}

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
  client._tasks = [];
  client.create = create;
  client.resolve = resolve;
  client.setOptions = (opts: Object) => {
    client._options = Object.assign({}, client._options, opts);
  };

  client.getFormDataClass = function getFormDataClass(): typeof FormData {
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
  };

  client.createBody = function (body: any): Object | FormData {
    let FormData = client.getFormDataClass();
    if (
      !body ||
      typeof body !== 'object' ||
      !FormData ||
      isBuffer(body) ||
      body instanceof ArrayBuffer ||
      body instanceof FormData
    )
      return body;

    // 检查是否需要上传文件
    let form: FormData = null;

    function addField(path: string, value: any) {
      if (value === undefined) return;
      if (!isStream(value) && !isFile(value)) {
        if (typeof value === 'boolean' || typeof value === 'number' || value === null || value instanceof Date) {
          value = String(value);
        } else if (typeof value === 'object') {
          // array or object
          // eslint-disable-next-line guard-for-in
          for (let key in value) {
            addField(`${path}[${key}]`, value[key]);
          }
          return;
        }
      }
      form.append(path, value);
    }

    // eslint-disable-next-line guard-for-in
    for (let key in body) {
      let value = body[key];
      if (isStream(value) || isFile(value)) {
        // upload file
        form = new FormData();
        // eslint-disable-next-line no-loop-func
        Object.keys(body).forEach((path) => addField(path, body[path]));
        break;
      }
    }
    return form || body;
  };

  client.request = function request(
    path: string,
    init?: Akita.RequestInit,
    query?: Akita.Query<any>,
    reducer?: Akita.Reducer<any>
  ): Akita.Request<any> {
    init = Object.assign({}, init);
    let queryParams = Object.assign({}, init.query);
    delete init.query;

    let queryString = qs.stringify(queryParams, client._options.qsOptions);
    if (queryString) {
      if (path.indexOf('?') < 0) {
        queryString = `?${queryString}`;
      } else if (path[path.length - 1] !== '&' && path[path.length - 1] !== '?') {
        queryString = `&${queryString}`;
      }
      path += queryString;
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

    let fetch = client._options.fetch;

    if (!fetch) {
      if (typeof window !== 'undefined') {
        fetch = window.fetch.bind(window);
      } else if (typeof global !== 'undefined') {
        // @ts-ignore
        fetch = global.fetch;
      }
    }

    // @ts-ignore Request 与 Promise 兼容
    let req = new Request(client, fetch, path, init, query, reducer) as Akita.Request<any>;

    client._count += 1;
    client._tasks.push(req);

    client._updateProgress();
    return req;
  };

  client._updateProgress = function (req?: Akita.Request<any>) {
    if (req) {
      client._tasks = client._tasks.filter((r) => r !== req);
    }
    if (client._updateProgressTimer || !client._options.onProgress) return;
    client._updateProgressTimer = setTimeout(() => {
      client._updateProgressTimer = 0;
      let progress = 1;
      let total = client._tasks.length * 3;
      if (total) {
        let steps = 0;
        client._tasks.forEach((r) => {
          steps += r._steps;
        });
        progress = steps / total;
      }
      client._options.onProgress(progress);
    }, 5);
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
