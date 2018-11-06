import Debugger = require('debug');
import EventEmitter = require('events');
import * as Akita from '..';

const debug = Debugger('akita:stream');

export default class ChangeStream<T> extends EventEmitter {
  closed: boolean;
  _stream: NodeJS.ReadableStream | ReadableStream;
  _queue: Akita.Change<T>[];
  _resolve: Function;
  _reject: Function;
  _reader: ReadableStreamReader;
  _handler: (data: Buffer) => void;
  _cache: string;
  _reducer: Akita.Reducer<any>;

  constructor(stream: NodeJS.ReadableStream | ReadableStream, reducer: Akita.Reducer<any>) {
    super();
    this.closed = false;
    this._stream = stream;
    this._queue = [];
    this._cache = '';
    this._reducer = reducer;
    const parseLine = () => {
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
      let string = data.toString();
      debug('receive', string);
      this._cache += string;
      parseLine();
    };

    // @ts-ignore
    if (stream.getReader) {
      // @ts-ignore 浏览器 ReadableStream
      this._reader = stream.getReader();
      const read = ({ done, value }) => {
        this._handler(value || '');
        if (done) {
          this.closed = true;
        }
        this._reader.read().then(read);
      };
      this._reader.read().then(read);
    } else {
      // @ts-ignore NodeJS.ReadableStream
      stream.on('data', this._handler);
    }
  }

  read(): Promise<{ type: Akita.ChangeType, object: T }> {
    if (this.closed) return Promise.reject('Can not read from closed stream.');
    if (this._queue.length) {
      return Promise.resolve(this._queue.shift());
    }
    return new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
  }

  cancel() {
    if (this.closed) return Promise.reject('Can not cancel closed stream.');
    debug('cancel watch');
    // @ts-ignore
    if (this._stream.cancel) {
      // @ts-ignore 浏览器 ReadableStream
      this._stream.cancel();
    } else {
      // @ts-ignore NodeJS.ReadableStream
      this._stream.destroy();
    }
    this.closed = true;
  }
}
