import Debugger = require('debug');
import * as Akita from '..';

const debug = Debugger('akita:stream');

export default class ChangeStream<T> {
  constructor(stream, reducer: Akita.Reducer<any>) {

  }

  read(): Promise<{ type: Akita.ChangeType, object: T }> {
    return null;
  }

  on(event: string, fn: Function) {
  }

  close() {
  }
}
