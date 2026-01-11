// 仅供微信小程序兼容使用

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
    return this.data[name] !== undefined;
  }

  set(name: string, value: string) {
    this.data[name] = value;
  }

  forEach(callbackfn: (value: string, key: string, parent: Headers) => void, thisArg?: any) {
    for (let key in this.data) {
      callbackfn.call(thisArg, this.data[key], key, this);
    }
  }
}
