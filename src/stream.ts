import Debugger = require('debug');
import * as Akita from '..';
import { Readable } from 'stream';

const debug = Debugger('akita:stream');

export default class ChangeStream<T> {
  closed: boolean;
  _stream: Readable | ReadableStream;
  _queue: Akita.Change<T>[];
  _resolve: Function;
  _reject: Function;
  _reader: ReadableStreamReader;
  _handler: (data: Buffer) => void;
  _close: () => void;
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

    const parseLine = () => {
      if (this.closed) return;
      let index = this._cache.indexOf('\n');
      if (index < 0) return;
      let line = this._cache.substr(0, index);
      this._cache = this._cache.substr(index + 1);
      if (line) {
        let json = JSON.parse(line);
        if (!json.type || !json.object) {
          let error = new Error('Invalid change stream data');
          if (this.listenerCount('error')) {
            this.emit('error', error);
          }
          if (this._reject) {
            this._reject(error);
            this._resolve = null;
            this._reject = null;
            return;
          }
        }
        if (this._reducer) {
          json.object = this._reducer(json.object);
        }
        if (this.listenerCount('change')) {
          while (this._queue.length) {
            this.emit('change', this._queue.shift());
          }
          this.emit('change', json);
        }
        if (this._resolve) {
          this._resolve(json);
          this._resolve = null;
          this._reject = null;
        } else if (!this.listenerCount('change')) {
          this._queue.push(json);
        }
      }
      parseLine();
    };

    this._handler = (data: Buffer | string) => {
      if (this.closed) return;
      let string = data.toString();
      debug('receive', string);
      this._cache += string;
      parseLine();
    };

    this._close = () => {
      if (this.closed) return;
      this.closed = true;
      if (this.listenerCount('close')) {
        this.emit('close');
      }
      delete this._stream;
      delete this._reader;
      delete this._cache;
      delete this._reducer;
      delete this._handler;
      this._listeners = {};
      this._queue = [];
    };

    // @ts-ignore
    if (stream.getReader) {
      this._reader = (stream as ReadableStream).getReader();
      const read = ({ done, value }) => {
        if (this.closed) return;
        this._handler(value || '');
        if (done) {
          this._close();
        }
        this._reader.read().then(read);
      };
      this._reader.read().then(read);
    } else {
      (stream as Readable).on('data', this._handler);
      (stream as Readable).on('close', this._close);
    }
  }

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

  read(): Promise<{ type: Akita.ChangeType; object: T }> {
    if (this.closed) return Promise.reject(new Error('Can not read from closed stream.'));
    if (this._queue.length) {
      return Promise.resolve(this._queue.shift());
    }
    return new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
  }

  cancel() {
    if (this.closed) throw new Error('Can not cancel closed stream.');
    debug('cancel watch');
    // @ts-ignore
    if (this._stream.cancel) {
      (this._stream as ReadableStream).cancel();
    } else {
      (this._stream as Readable).destroy();
      (this._stream as Readable).removeListener('data', this._handler);
    }
    this._close();
  }
}
