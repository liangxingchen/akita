/* eslint no-use-before-define:0 */

import * as qs from 'qs';
import methods from './methods';
import Model from './model';
import Request from './request';
import { isUint8Array, isReadableStream, isFile } from './utils';
import * as Akita from '..';

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
    if (!body || typeof body !== 'object' || !FormData || isUint8Array(body) || body instanceof FormData) return body;

    // 检查是否需要上传文件
    let form: FormData = null;

    function addField(path: string, value: any) {
      if (value === undefined) return;
      if (!isReadableStream(value) && !isFile(value) && !isUint8Array(value)) {
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
      if (isReadableStream(value) || isFile(value) || isUint8Array(value)) {
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

  client._updateProgress = function () {
    if (client._updateProgressTimer || !client._options.onProgress) return;
    client._updateProgressTimer = setTimeout(() => {
      client._updateProgressTimer = 0;
      if (!client._options.onProgress) return;
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
    client[method] = function (path: string, init?: Akita.RequestInit) {
      init = init || {};
      init.method = method.toUpperCase();
      return client.request(path, init);
    };
  });

  return client;
}

export default resolve('default');
export { Model };
