import type { Readable } from 'stream';
import LineStream from './line-stream';
import type { SSEEvent } from '..';

export default class SSEStream extends LineStream<SSEEvent> {
  _dataBuffer: string;
  _eventType: string;
  _lastEventId: string;
  _retryMs: number;

  constructor(stream: Readable | ReadableStream) {
    super(stream);
    this._dataBuffer = '';
    this._eventType = '';
    this._lastEventId = '';
    this._retryMs = 0;
  }

  _parse() {
    if (this.closed || !this._cache) return;

    let index = this._cache.indexOf('\n');
    if (index < 0) return;

    let line = this._cache.substring(0, index);
    this._cache = this._cache.substring(index + 1);

    if (line === '') {
      this._dispatchEvent();
    } else {
      line = line.trim();
      if (line) {
        this._processLine(line);
      }
    }

    this._parse();
  }

  _processLine(line: string) {
    if (line.startsWith(':')) return;

    const { field, value } = this._parseField(line);

    switch (field) {
      case 'data':
        this._dataBuffer += value + '\n';
        break;

      case 'event':
        this._eventType = value;
        break;

      case 'id':
        if (!value.includes('\0')) {
          this._lastEventId = value;
        }
        break;

      case 'retry':
        if (/^\d+$/.test(value)) {
          this._retryMs = parseInt(value, 10);
        }
        break;
    }
  }

  _parseField(line: string): { field: string; value: string } {
    const colonIndex = line.indexOf(':');

    if (colonIndex >= 0) {
      const field = line.substring(0, colonIndex);
      let value = line.substring(colonIndex + 1);

      // SSE 规范：只去除一个前导空格
      if (value.startsWith(' ')) {
        value = value.substring(1);
      }

      return { field, value };
    }

    return { field: line, value: '' };
  }

  _dispatchEvent() {
    if (this._dataBuffer.endsWith('\n')) {
      this._dataBuffer = this._dataBuffer.slice(0, -1);
    }

    if (!this._dataBuffer) {
      this._resetBuffers();
      return;
    }

    const event: SSEEvent = {
      type: this._eventType || 'message',
      data: this._dataBuffer
    };

    if (this._lastEventId) {
      event.id = this._lastEventId;
    }

    if (this._retryMs > 0) {
      event.retry = this._retryMs;
    }

    this._emitData(event);
    this._resetBuffers();
  }

  _resetBuffers() {
    this._dataBuffer = '';
    this._eventType = '';
  }

  get lastEventId(): string {
    return this._lastEventId;
  }

  get retryInterval(): number {
    return this._retryMs;
  }
}
