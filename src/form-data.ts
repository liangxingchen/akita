// just for weixin

export default class FormData {
  public append(name: string, value: string | Blob) {
    this[name] = value;
  }

  // eslint-disable-next-line no-undef
  [key: string]: any;
}
