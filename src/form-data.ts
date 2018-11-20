// just for weixin

export default class FormData {
  [key: string]: any;

  append(name: string, value: string | Blob) {
    this[name] = value;
  }
}
