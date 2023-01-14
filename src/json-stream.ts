import * as Debugger from 'debug';
import * as Akita from '..';
import { Readable } from 'stream';

const debug = Debugger('akita:json-stream');

function uint8ArrayToString(data: Uint8Array | string) {
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

export default class JsonStream<T> {
  closed: boolean;
  _stream: Readable | ReadableStream;
  _queue: T[];
  _resolve: Function;
  _reject: Function;
  // eslint-disable-next-line no-undef
  _reader: ReadableStreamDefaultReader<any>;
  _cache: string;
  _reducer: Akita.Reducer<any>;
  _listeners: {
    [name: string]: Function[];
  };

  constructor(stream: Readable | ReadableStream, reducer: Akita.Reducer<any>) {
    this.closed = false;
    this._stream = stream;
    this._queue = [];
    this._cache = '';
    this._reducer = reducer;
    this._listeners = {};

    // @ts-ignore
    if (stream.getReader) {
      this._reader = (stream as ReadableStream).getReader();
      const read = ({ done, value }) => {
        if (this.closed) return;
        this._receive(value || (done && this._cache ? '\n' : ''));
        if (done) {
          this._close();
        } else {
          this._reader.read().then(read, this._onError);
        }
      };
      this._reader.read().then(read, this._onError);
    } else {
      (stream as Readable).on('data', this._receive);
      (stream as Readable).on('close', this._close);
    }
  }

  _receive = (data: Uint8Array | string) => {
    let string = uint8ArrayToString(data);
    debug('receive', string);
    if (this.closed) return;
    this._cache += string;
    this._parse();
  };

  _parse() {
    if (this.closed || !this._cache) return;
    let index = this._cache.indexOf('\n');
    if (index < 0) return;
    let line = this._cache.substr(0, index).trim();
    this._cache = this._cache.substr(index + 1);
    if (line) {
      let json;
      try {
        json = JSON.parse(line);
      } catch (e) {
        this._onError(e);
        return;
      }
      if (this._reducer && json.object) {
        json.object = this._reducer(json.object);
      }
      if (this.listenerCount('data')) {
        while (this._queue.length) {
          this.emit('data', this._queue.shift());
        }
        this.emit('data', json);
      }
      if (this._resolve) {
        this._resolve(json);
        this._resolve = null;
        this._reject = null;
      } else if (!this.listenerCount('data')) {
        this._queue.push(json);
      }
      this._parse();
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
    if (this.closed) return;
    this.closed = true;
    if (this.listenerCount('close')) {
      this.emit('close');
    }
    if (this._resolve) {
      this._resolve(undefined);
      this._resolve = null;
      this._reject = null;
    }

    // @ts-ignore
    if (!this._stream.getReader) {
      // @ts-ignore
      this._stream.removeListener('data', this._receive);
      // @ts-ignore
      this._stream.removeListener('close', this._close);
    }

    delete this._stream;
    delete this._reader;
    delete this._cache;
    delete this._reducer;
    this._listeners = {};
  };

  on(name: string, fn): this {
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
    if (!this._listeners[name]) return;
    this._listeners[name] = this._listeners[name].filter((f) => f !== fn);
    return this;
  }

  removeAllListeners(name: string): this {
    delete this._listeners[name];
    return this;
  }

  read(): Promise<T> {
    if (this._queue.length) {
      return Promise.resolve(this._queue.shift());
    }
    if (this.closed) return Promise.reject(new Error('Can not read from closed stream.'));
    return new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
  }

  close() {
    if (this.closed) return;
    debug('close json stream');
    // @ts-ignore
    if (this._stream.cancel) {
      (this._stream as ReadableStream).cancel();
    } else {
      (this._stream as Readable).destroy();
      (this._stream as Readable).removeListener('data', this._receive);
    }
    this._close();
  }
}
