import type { Readable } from 'stream';
import LineStream from './line-stream';
import type { Reducer } from '..';

/**
 * JSON 数据流
 *
 * 继承自 LineStream，在行分割的基础上添加 JSON 解析
 * 支持 NDJSON (Newline Delimited JSON) 格式
 */
export default class JsonStream<T> extends LineStream<T> {
  _reducer: Reducer<any> | null;
  _parser: (text: string) => any;

  constructor(stream: Readable | ReadableStream, reducer: Reducer<any> | null, parser: (text: string) => any) {
    super(stream);
    this._reducer = reducer;
    this._parser = parser || JSON.parse;
  }

  _parse() {
    if (this.closed || !this._cache) return;
    let index = this._cache.indexOf('\n');
    if (index < 0) return;
    let line = this._cache.substring(0, index).trim();
    this._cache = this._cache.substring(index + 1);

    if (line) {
      let json;
      try {
        json = this._parser(line);
      } catch (e) {
        this._onError(e as Error);
        return;
      }
      if (this._reducer && json.object) {
        json.object = this._reducer(json.object);
      }
      this._emitData(json as T);
    }

    this._parse();
  }

  close() {
    // @ts-ignore
    this._reducer = null;
    super.close();
  }
}
