// @flow

import isBuffer from 'is-buffer';
import Debugger from 'debug';
import type Query from './query';

const debug = Debugger('akita:response');

export default class Response {
  _query: ?Query | null;
  _responsePromise: Promise<any>;

  constructor(promise: Promise<any>, query?: Query | null) {
    this._query = query;
    this._responsePromise = promise.then((res) => {
      if (debug.enabled) debug('response status:', res.status, res.statusText);
      return res;
    }, (error) => {
      if (debug.enabled) debug('fetch error:', error.message);
      return Promise.reject(error);
    });
  }

  response(): Promise<Object> {
    return this._responsePromise;
  }

  stream(): Promise<stream$Readable> {
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
    return this.response().then((res) => res.size);
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
    return this.response().then((res) => res.text());
  }

  /**
   * 获取JSON数据
   * @returns {Promise.<any>}
   */
  json(): Promise<any> {
    return this.response().then((res) => {
      if (res.status === 204) {
        return null;
      }
      return res.json().then((json) => {
        debug('response json:', json);
        if (res.status === 404 && this._query && ['findById', 'remove'].indexOf(this._query._op) > -1) {
          debug('return null when ' + this._query._op + ' 404');
          return null;
        }
        if (json && json.error && ['0', 'null', 'none'].indexOf(json.error) < 0) {
          let error = new Error(json.error);
          // $Flow error.code
          error.code = json.code || json.errorCode || 0;
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
  then(onSuccess: Function, onFail: Function): Promise<any> {
    return this.json().then(onSuccess, onFail);
  }

  catch(onFail: Function): Promise<void> {
    return this.json().catch(onFail);
  }
}
