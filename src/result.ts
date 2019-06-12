import * as isBuffer from 'is-buffer';
import * as Debugger from 'debug';
import ChangeStream from './stream';
import { Readable } from 'stream';
import * as Akita from '..';

const debug = Debugger('akita:result');

export default class Result<T> {
  _query?: Akita.Query<T>;
  _responsePromise: Promise<Response>;
  _path: string;
  _init: Akita.RequestInit;
  _reducer?: Akita.Reducer<T>;
  _csPromise: Promise<Akita.ChangeStream<any>>;

  constructor(fetch: Function, path: string, init: Akita.RequestInit, query?: Akita.Query<T> | null, reducer?: Akita.Reducer<T>) {
    this._query = query;
    this._reducer = reducer;
    this._path = path;
    this._init = init;

    let promise = fetch(path, init);
    if (debug.enabled) {
      promise = promise.then((res) => {
        debug('response status:', res.status, res.statusText);
        return res;
      }, (error) => {
        debug('fetch error:', error.message);
        return Promise.reject(error);
      });
    }
    this._responsePromise = promise;
  }

  response(): Promise<Response> {
    return this._responsePromise;
  }

  stream(): Promise<Readable | ReadableStream> {
    return this.response().then((res) => res.body);
  }

  ok(): Promise<boolean> {
    return this.response().then((res) => res.ok);
  }

  status(): Promise<number> {
    return this.response().then((res) => res.status);
  }

  statusText(): Promise<string> {
    return this.response().then((res) => res.statusText);
  }

  size(): Promise<number> {
    // @ts-ignore res.size
    return this.response().then((res) => res.size || parseInt(res.headers.get('Content-Length')) || 0);
  }

  headers(): Promise<Headers> {
    return this.response().then((res) => res.headers);
  }

  /**
   * 获取Buffer数据
   * @returns {Promise.<any>}
   */
  buffer(): Promise<Buffer> {
    return this.response().then((res) => {
      let fn = 'buffer';
      if (res.arrayBuffer) {
        fn = 'arrayBuffer';
      }
      return res[fn]().then((buf) => {
        if (!isBuffer(buf) && buf instanceof ArrayBuffer && typeof Buffer === 'function') {
          return Buffer.from(buf);
        }
        return buf;
      }, (error) => {
        debug('get buffer error:', error.message);
        return Promise.reject(error);
      });
    });
  }

  blob(): Promise<Blob> {
    return this.response().then((res) => res.blob());
  }

  /**
   * 获取文本数据
   * @returns {Promise<string>}
   */
  text(): Promise<string> {
    return this.response().then((res) => res.text().then((text) => {
      debug('response text:', text);
      return text;
    }));
  }

  /**
   * 获取JSON数据
   * @returns {Promise.<any>}
   */
  json(): Promise<any> {
    return this.response().then((res) => {
      if (res.status === 204) {
        return Promise.resolve();
      }
      return res.text().then((text) => {
        debug('response text:', text);
        if (res.status === 404 && this._query && ['findByPk', 'remove'].indexOf(this._query._op) > -1) {
          debug(`return null when ${this._query._op} 404`);
          return null;
        }
        let json;
        try {
          json = JSON.parse(text);
        } catch (error) {
          return Promise.reject(new Error(`invalid json response body at ${this._path} ${error.message}`));
        }
        if (json && json.error && ['0', 'null', 'none'].indexOf(json.error) < 0) {
          let error = new Error(json.error);
          Object.keys(json).forEach((key) => {
            if (['error', 'message', 'stack'].indexOf(key) === -1) {
              error[key] = json[key];
            }
          });
          return Promise.reject(error);
        }
        return json;
      }, (error) => {
        debug('json parse error:', error.message);
        return Promise.reject(error);
      });
    });
  }

  /**
   * 获取JSON数据
   * @returns {Promise<any>}
   */
  then(onSuccess?: (value: T) => any, onFail?: (reason: any) => PromiseLike<never>): Promise<any> {
    if (this._query && this._query._op === 'watch') {
      if (!this._csPromise) {
        this._csPromise = this.stream().then((stream) => new ChangeStream(stream, this._reducer));
      }
      // @ts-ignore
      return this._csPromise.then(onSuccess, onFail);
    }
    if (this._reducer) {
      return this.json().then((json: any) => onSuccess(this._reducer(json)), onFail);
    }
    return this.json().then(onSuccess, onFail);
  }

  catch(onFail: (reason: any) => PromiseLike<never>): Promise<void> {
    return this.json().catch(onFail);
  }

  finally(fn: () => void) {
    return this.json().finally(fn);
  }
}
