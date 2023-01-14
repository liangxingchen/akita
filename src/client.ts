/* eslint no-use-before-define:0 */

import * as qs from 'qs';
import methods from './methods';
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
  const client: Akita.Client = {
    options: options || {}
  };

  // 已经发送请求的数量
  client._count = 0;
  client._progress = 1;
  client._tasks = [];
  client.create = create;
  client.resolve = resolve;
  client.setOptions = (opts: Object) => {
    Object.assign(client.options, opts);
  };

  client.on = (event, hook) => {
    let name = `on${event[0].toUpperCase()}${event.substr(1)}`;
    if (!client.options[name]) {
      client.options[name] = hook;
      return client;
    }
    if (Array.isArray(client.options[name])) {
      client.options[name].push(hook);
    } else {
      client.options[name] = [client.options[name], hook];
    }
    return client;
  };

  client.off = (event, hook) => {
    let name = `on${event[0].toUpperCase()}${event.substr(1)}`;
    if (!client.options[name]) {
      return client;
    }
    if (Array.isArray(client.options[name])) {
      client.options[name] = client.options[name].filter((f) => f !== hook);
      if (!client.options[name].length) client.options[name] = null;
    } else if (client.options[name] === hook) {
      client.options[name] = null;
    }
    return client;
  };

  client.getFormDataClass = function getFormDataClass(): typeof FormData {
    let FormData = client.options.FormData;
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
    if (!body || typeof body !== 'object' || isUint8Array(body) || isReadableStream(body)) return body;

    if (typeof ArrayBuffer === 'function' && body instanceof ArrayBuffer && typeof Uint8Array === 'function') {
      return new Uint8Array(body);
    }

    let FormData = client.getFormDataClass();
    if (!FormData || body instanceof FormData) return body;

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
    reducer?: Akita.Reducer<any>
  ): Akita.Request<any> {
    init = Object.assign({}, init);
    let queryParams = Object.assign({}, init.query);
    delete init.query;

    let queryString = qs.stringify(queryParams, client.options.qsOptions);
    if (queryString) {
      if (path.indexOf('?') < 0) {
        queryString = `?${queryString}`;
      } else if (path[path.length - 1] !== '&' && path[path.length - 1] !== '?') {
        queryString = `&${queryString}`;
      }
      path += queryString;
    }

    let apiRoot = client.options.apiRoot;
    if (apiRoot) {
      if (apiRoot[apiRoot.length - 1] === '/' && path[0] === '/') {
        path = path.substring(1);
      } else if (apiRoot[apiRoot.length - 1] !== '/' && path[0] !== '/') {
        path = `/${path}`;
      }
      path = apiRoot + path;
    }

    let fetch = client.options.fetch;

    if (!fetch) {
      if (typeof window !== 'undefined') {
        fetch = window.fetch.bind(window);
      } else if (typeof global !== 'undefined') {
        // @ts-ignore
        fetch = global.fetch;
      }
    }

    // @ts-ignore Request 与 Promise 兼容
    let req = new Request(client, fetch, path, init, reducer) as Akita.Request<any>;

    client._count += 1;
    client._tasks.push(req);

    client._updateProgress();
    return req;
  };

  client._updateProgress = function () {
    let now = Date.now();
    client._tasks = client._tasks.filter((t) => !t._endAt || now - t._endAt < 1000);
    if (client._tasks.find((t) => t._endAt)) {
      setTimeout(() => {
        client._updateProgress();
      }, 1000);
    }
    if (client._updateProgressTimer || !client.options.onProgress) return;
    client._updateProgressTimer = setTimeout(() => {
      client._updateProgressTimer = 0;
      if (!client.options.onProgress) return;
      let process = 1;
      let total = client._tasks.length * 3;
      if (total) {
        let steps = 0;
        client._tasks.forEach((r) => {
          steps += r._endAt ? 3 : r._steps;
        });
        process = steps / total;
      }
      if (process !== this._progress) {
        this._progress = process;
        if (Array.isArray(client.options.onProgress)) {
          client.options.onProgress.forEach((fn) => fn(process));
        } else {
          client.options.onProgress(process);
        }
      }
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
