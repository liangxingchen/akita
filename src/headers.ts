// just for weixin

export default class Headers {
  data: {
    [key: string]: string;
  };

  constructor() {
    this.data = {};
  }

  append(name: string, value: string) {
    this.data[name] = value;
  }

  delete(name: string) {
    delete this.data[name];
  }

  get(name: string): string | null {
    return this.data[name] || null;
  }

  has(name: string): boolean {
    return typeof this.data[name] !== 'undefined';
  }

  set(name: string, value: string) {
    this.data[name] = value;
  }

  forEach(callbackfn: (value: string, key: string, parent: Headers) => void, thisArg?: any) {
    // eslint-disable-next-line guard-for-in
    for (let key in this.data) {
      callbackfn.call(thisArg, this.data[key], key, this);
    }
  }
}
