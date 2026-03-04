import type { Readable } from 'stream';
import Debugger from 'debug';

const debug = Debugger('akita:line-stream');

/**
 * 将 Uint8Array 或 string 转换为 UTF-8 字符串
 */
export function uint8ArrayToString(data: Uint8Array | string): string {
  if (typeof data === 'string') return data;
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(data)) return data.toString('utf-8');
  if (typeof TextDecoder !== 'undefined') return new TextDecoder('utf-8').decode(data);
  let str = '';
  // eslint-disable-next-line
  for (let i = 0; i < data.length; i += 1) {
    str += String.fromCharCode(data[i]);
  }
  return str;
}

/**
 * 行流基类
 *
 * 按 \n 分割流数据，每次读取返回一行
 * 支持浏览器 ReadableStream 和 Node.js Readable
 */
export default class LineStream<T = string> {
  closed: boolean;
  _stream: Readable | ReadableStream;
  _queue: T[];
  _resolve: null | ((res: any) => void);
  _reject: null | ((error: Error) => void);
  _reader: null | ReadableStreamDefaultReader<any>;
  _cache: string;
  _listeners: {
    [name: string]: Function[];
  };

  constructor(stream: Readable | ReadableStream) {
    this.closed = false;
    this._stream = stream;
    this._queue = [];
    this._cache = '';
    this._listeners = {};
    this._resolve = null;
    this._reject = null;
    this._reader = null;

    // @ts-ignore
    if (stream.getReader) {
      this._reader = (stream as ReadableStream).getReader();
      const read = ({ done, value }: any) => {
        if (this.closed) return;
        this._receive(value || (done && this._cache ? '\n' : ''));
        if (done) {
          this._close();
        } else if (this._reader) {
          this._reader.read().then(read, this._onError);
        }
      };
      this._reader.read().then(read, this._onError);
    } else {
      (stream as Readable).on('data', this._receive);
      (stream as Readable).on('close', this._close);
    }
  }

  /**
   * 接收数据并转换为字符串
   */
  _receive = (data: Uint8Array | string) => {
    let string = uint8ArrayToString(data);
    debug('receive', string);
    if (this.closed) return;
    this._cache += string;
    this._parse();
  };

  /**
   * 解析缓存中的数据，提取完整的行
   * 子类可重写此方法以实现自定义解析逻辑
   */
  _parse() {
    if (this.closed || !this._cache) return;
    let index = this._cache.indexOf('\n');
    if (index < 0) return;
    let line = this._cache.substring(0, index).trim();
    this._cache = this._cache.substring(index + 1);

    if (line) {
      this._emitData(line as any);
    }
    this._parse();
  }

  /**
   * 发出数据项
   */
  _emitData(data: T) {
    if (this.listenerCount('data')) {
      while (this._queue.length) {
        this.emit('data', this._queue.shift());
      }
      this.emit('data', data);
    }

    if (this._resolve) {
      this._resolve(data);
      this._resolve = null;
      this._reject = null;
    } else if (!this.listenerCount('data')) {
      this._queue.push(data);
    }
  }

  _onError = (error: Error) => {
    if (this.listenerCount('error')) {
      this.emit('error', error);
    }
    if (this._reject) {
      this._reject(error);
      this._resolve = null;
      this._reject = null;
    }
    if (!this.closed) this._close();
  };

  _close = () => {
    debug('_close');
    const wasClosed = this.closed;
    this.closed = true;

    if (this._resolve) {
      this._resolve(undefined);
      this._resolve = null;
      this._reject = null;
    }

    if (!wasClosed) {
      if (this.listenerCount('close')) {
        this.emit('close');
      }
    }

    // @ts-ignore
    if (!this._stream?.getReader) {
      // @ts-ignore
      this._stream.removeListener('data', this._receive);
      // @ts-ignore
      this._stream.removeListener('close', this._close);
    }

    // @ts-ignore
    this._stream = null;
    this._reader = null;
    // @ts-ignore
    this._cache = null;
    // @ts-ignore
    this._listeners = {};
  };

  on(name: string, fn: Function): this {
    if (!this._listeners[name]) {
      this._listeners[name] = [];
    }
    this._listeners[name].push(fn);
    return this;
  }

  emit(name: string, ...args: any[]) {
    if (!this._listeners[name]) return;
    this._listeners[name].forEach((fn) => {
      fn.apply(null, args);
    });
  }

  listenerCount(name: string): number {
    return (this._listeners[name] || []).length;
  }

  removeListener(name: string, fn: Function): this {
    if (!this._listeners[name]) return this;
    this._listeners[name] = this._listeners[name].filter((f) => f !== fn);
    return this;
  }

  removeAllListeners(name: string): this {
    delete this._listeners[name];
    return this;
  }

  /**
   * 从数据流中读取一条数据
   *
   * 如果流已关闭且无数据可用，返回 undefined
   * 如果有缓存数据，立即返回，否则等待下一条数据
   */
  read(): Promise<T | undefined> {
    if (this._queue.length) {
      return Promise.resolve(this._queue.shift() as T);
    }
    if (this.closed) return Promise.reject(new Error('Can not read from closed stream.'));
    return new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
  }

  /**
   * 关闭流
   */
  close() {
    if (this.closed) return;
    debug('close line stream');
    this.closed = true;
    const stream = this._stream;
    if (stream) {
      // @ts-ignore
      if (stream.destroy) {
        // @ts-ignore
        stream.destroy();
      } else {
        // @ts-ignore
        stream.removeListener('data', this._receive);
        // @ts-ignore
        stream.removeListener('close', this._close);
      }
    }
  }
}
