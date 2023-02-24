import * as Debugger from 'debug';
import * as qs from 'qs';
import { Readable } from 'stream';
import JsonStream from './json-stream';
import { isReadableStream, isUint8Array } from './utils';
import * as Akita from '..';

const debug = Debugger('akita:request');

function execHooks(request: Akita.Request<any>, hooks: Akita.RequestHook | Akita.RequestHook[]): void | Promise<void> {
  let promise: void | Promise<void>;
  if (Array.isArray(hooks)) {
    hooks.forEach((h) => {
      if (promise) {
        promise = promise.then(() => {
          let p = h(request);
          return p ? p : Promise.resolve();
        });
      } else {
        promise = h(request);
      }
    });
  } else {
    promise = hooks(request);
  }
  if (promise) {
    return promise.then(() => Promise.resolve());
  }
}

export default class Request<T> {
  client: Akita.Client;
  _fetch: any;
  url: string;
  init: Akita.RequestInit;
  res?: Response;
  _reducer?: Akita.Reducer<T>;
  _jsPromise: Promise<Akita.JsonStream<any>>;
  raw?: string;
  value?: any;
  _steps: number;
  _responsePromise: Promise<Response>;
  _bufferPromise: Promise<Buffer>;
  _blobPromise: Promise<Blob>;
  _textPromise: Promise<string>;
  _dataPromise: Promise<any>;
  _endAt: number;

  constructor(client: Akita.Client, fetch: Function, url: string, init: any, reducer?: Akita.Reducer<T>) {
    this.client = client;
    this._reducer = reducer;
    this._fetch = fetch;
    this.url = url;
    this.init = init || {};
    this._steps = 0;

    let promise;
    // onEncode
    if (init.body && client.options.onEncode) {
      debug('exec onEncode');
      promise = execHooks(this as any, client.options.onEncode);
    }

    // onRequest
    if (client.options.onRequest) {
      debug('exec onRequest');
      if (promise) {
        promise = promise.then(() => execHooks(this as any, client.options.onRequest));
      } else {
        promise = execHooks(this as any, client.options.onRequest);
      }
    }

    if (promise) {
      promise = promise.then(() => this._send());
    } else {
      promise = this._send();
    }

    this._responsePromise = promise;
  }

  _addStep() {
    this._steps += 1;
    if (this._steps >= 3) {
      this._endAt = Date.now();
    }
    this.client._updateProgress();
  }

  _end() {
    this._endAt = Date.now();
    this.client._updateProgress();
  }

  _send() {
    let { client, url, init } = this;

    // headers
    let headers = init.headers || {};

    if (client.options.init) {
      init = Object.assign({}, client.options.init, init);
      if (client.options.init.headers) {
        headers = Object.assign({}, client.options.init.headers, headers);
      }
    }

    init.headers = headers;
    this.init = init;

    if (debug.enabled) {
      debug(init.method, url, JSON.stringify(init));
    }

    if (init.body && typeof init.body === 'object') {
      init.body = client.createBody(init.body);
      let FormData = client.getFormDataClass();

      if (!isUint8Array(init.body) && !(FormData && init.body instanceof FormData) && !isReadableStream(init.body)) {
        // 如果是普通POST请求，转换成JSON或urlencoded
        if (!init.headers) {
          init.headers = {};
        }
        if (!init.headers['Content-Type'] || init.headers['Content-Type'].indexOf('json') > -1) {
          if (!init.headers['Content-Type']) {
            init.headers['Content-Type'] = 'application/json';
          }
          init.body = JSON.stringify(init.body);
        } else if (init.headers['Content-Type'] === 'application/x-www-form-urlencoded') {
          init.body = qs.stringify(init.body);
        } else {
          /* istanbul ignore next */
          throw new Error(`Akita Error: Unsupported Content-Type ${init.headers['Content-Type']}`);
        }
      }
    }
    this._addStep();
    if (debug.enabled) {
      debug('fetch', url, JSON.stringify(init));
    }
    let promise: Promise<Response> = this._fetch(url, init).then(
      (res) => {
        this._addStep();
        debug('response:', this.url, res.status, res.statusText);
        this.res = res;
        // onResponse
        if (client.options.onResponse) {
          debug('exec onResponse');
          let p = execHooks(this as any, client.options.onResponse);
          if (p) {
            return p.then(() => {
              return Promise.resolve(res);
            });
          }
        }
        return Promise.resolve(res);
      },
      (error) => {
        debug('fetch error:', error.message);
        this._end();
        return Promise.reject(error);
      }
    );
    return promise;
  }

  response(): Promise<Response> {
    if (!this._endAt) this._end();
    return this._responsePromise;
  }

  stream(): Promise<Readable | ReadableStream> {
    // @ts-ignore
    if (this.res) return Promise.resolve(this.res.body);
    return this._responsePromise.then((res) => {
      this._end();
      return res.body;
    });
  }

  jsonStream(): Promise<JsonStream<any>> {
    if (!this._jsPromise) {
      this._jsPromise = this.stream().then((stream) => new JsonStream(stream, this._reducer));
    }
    // @ts-ignore
    return this._jsPromise;
  }

  ok(): Promise<boolean> {
    if (this.res) return Promise.resolve(this.res.ok);
    return this._responsePromise.then((res) => res.ok);
  }

  status(): Promise<number> {
    if (this.res) return Promise.resolve(this.res.status);
    return this._responsePromise.then((res) => res.status);
  }

  statusText(): Promise<string> {
    if (this.res) return Promise.resolve(this.res.statusText);
    return this._responsePromise.then((res) => res.statusText);
  }

  size(): Promise<number> {
    // @ts-ignore res.size
    if (this.res) return Promise.resolve(this.res.size || parseInt(this.res.headers.get('Content-Length')) || 0);
    // @ts-ignore res.size
    return this._responsePromise.then((res) => res.size || parseInt(res.headers.get('Content-Length')) || 0);
  }

  headers(): Promise<Headers> {
    if (this.res) return Promise.resolve(this.res.headers);
    return this._responsePromise.then((res) => res.headers);
  }

  /**
   * 获取Buffer数据
   * @returns {Promise.<any>}
   */
  buffer(): Promise<Buffer> {
    if (!this._bufferPromise) {
      this._bufferPromise = this._responsePromise.then((res) => {
        let fn = 'buffer';
        if (res.arrayBuffer) {
          fn = 'arrayBuffer';
        }
        return res[fn]().then(
          (buf) => {
            if (!isUint8Array(buf)) {
              if (typeof Buffer === 'function') {
                return Buffer.from(buf);
              }
              return buf;
            }
            this._addStep();
            return buf;
          },
          (error) => {
            debug('get buffer error:', error.message);
            this._end();
            return Promise.reject(error);
          }
        );
      });
    }
    return this._bufferPromise;
  }

  blob(): Promise<Blob> {
    if (!this._blobPromise) {
      this._blobPromise = this._responsePromise.then((res) =>
        res.blob().then(
          (blob) => {
            this._addStep();
            return blob;
          },
          (error) => {
            debug('get blob error:', error.message);
            this._end();
            return Promise.reject(error);
          }
        )
      );
    }
    return this._blobPromise;
  }

  /**
   * 获取文本数据
   * @returns {Promise<string>}
   */
  text(): Promise<string> {
    if (!this._textPromise) {
      if (this.raw) {
        this._textPromise = Promise.resolve(this.raw);
      } else {
        this._textPromise = this._responsePromise.then((res) =>
          res.text().then(
            (text) => {
              debug('response text:', text);
              this.raw = text;
              this._addStep();
              return text;
            },
            (error) => {
              debug('get text error:', error.message);
              this._end();
              return Promise.reject(error);
            }
          )
        );
      }
    }
    return this._textPromise;
  }

  _decode() {
    if (this.value !== undefined) return this.value;
    debug('_decode');
    let value;
    try {
      value = JSON.parse(this.raw);
    } catch (error) {
      return Promise.reject(new Error(`invalid json response body at ${this.url} ${error.message}`));
    }
    if (value?.error && ['0', 'null', 'none'].indexOf(value.error) < 0) {
      let error = new Error(value.error);
      Object.keys(value).forEach((key) => {
        if (['error', 'message', 'stack'].indexOf(key) === -1) {
          error[key] = value[key];
        }
      });
      return Promise.reject(error);
    }
    this.value = value;
    return value;
  }

  /**
   * 获取解析后的数据
   * @returns {Promise.<any>}
   */
  data(): Promise<T> {
    if (!this._dataPromise) {
      if (this.value !== undefined) {
        this._dataPromise = Promise.resolve(this.value);
      } else {
        this._dataPromise = this._responsePromise.then((res) => {
          if (res.status === 204) {
            this._addStep();
            return Promise.resolve(null);
          }
          return res.text().then(
            (text) => {
              this._end();
              debug('response text:', text);
              this.raw = text;

              const client = this.client;

              if (client.options.onDecode) {
                debug('exec onDecode');
                let promise = execHooks(this as any, client.options.onDecode);
                if (promise) {
                  return promise.then(() => Promise.resolve(this._decode()));
                }
              }
              return this._decode();
            },
            (error) => {
              debug('get text raw error:', error.message);
              this._end();
              return Promise.reject(error);
            }
          );
        });
      }
    }
    return this._dataPromise;
  }

  /**
   * 获取解析后的Object数据
   * @returns {Promise<any>}
   */
  then(onSuccess?: (value: T) => any, onFail?: (reason: any) => PromiseLike<never>): Promise<any> {
    if (this._reducer) {
      return this.data().then((json: any) => onSuccess(this._reducer(json)), onFail);
    }
    return this.data().then(onSuccess, onFail);
  }

  catch(onFail: (reason: any) => PromiseLike<never>): Promise<T> {
    return this.data().catch(onFail);
  }

  finally(fn: () => void) {
    return this.data().finally(fn);
  }
}
