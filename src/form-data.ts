// 仅供微信小程序兼容使用

export default class FormData {
  public append(name: string, value: string | Blob) {
    this[name] = value;
  }

  [key: string]: any;
}
