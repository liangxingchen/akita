// just for weixin

import FormData from './form-data';
import Headers from './headers';
import type * as Akita from '..';

function uint8ArrayToString(data: Uint8Array) {
  let text = '';
  // eslint-disable-next-line @typescript-eslint/prefer-for-of
  for (let i = 0; i < data.length; i++) {
    text += String.fromCharCode(data[i]);
  }
  return text;
}

export default function fetch(url: string, init: Akita.RequestInit): Promise<Response> {
  return new Promise((resolve, reject) => {
    let response = {
      url,
      ok: true,
      redirected: false,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      _result: null as any,
      get body() {
        throw new Error('Akita streaming not support for Weixin');
      },
      get blob() {
        throw new Error('Akita streaming not support for Weixin');
      },
      arrayBuffer(): Promise<ArrayBuffer> {
        return Promise.resolve(response._result);
      },
      json(): Promise<any> {
        return response.text().then((text) => JSON.parse(text));
      },
      text(): Promise<string> {
        if (typeof response._result === 'string') {
          return Promise.resolve(response._result);
        }
        let arr = new Uint8Array(response._result);
        let str = uint8ArrayToString(arr);
        str = decodeURIComponent(escape(str)); // 没有这一步中文会乱码
        return Promise.resolve(str);
      }
    };

    // wx 请求
    let req: any = {
      method: init.method,
      url,
      header: init.headers,
      dataType: 'text',
      responseType: 'arraybuffer'
    };

    if (req.method === 'PATCH') {
      if (!req.header) {
        req.header = {};
      }
      req.method = 'PUT';
      req.header['akita-method'] = 'PATCH';
    }

    // 检测上传
    let fn = 'request';
    if (init.body instanceof FormData) {
      for (let key in init.body) {
        let value = init.body[key];
        if (value && typeof value === 'object' && value.filePath && Object.keys(value).length === 1) {
          req.name = key;
          req.filePath = value.filePath;
          delete init.body[key];
        }
      }
      if (req.filePath) {
        fn = 'uploadFile';
        req.formData = init.body;
      }
    }

    if (fn === 'request') {
      req.data = init.body;
    }

    req.success = function (res: any) {
      response._result = res.data;
      if (res.header) {
        for (let key in res.header) {
          response.headers.append(key, res.header[key]);
        }
      }
      response.status = res.statusCode;
      if (response.status !== 200) {
        response.statusText = 'Unknown';
      }
      if (response.status >= 400) {
        response.ok = false;
      }
      // @ts-ignore
      resolve(response);
    };

    req.fail = function (res: any) {
      if (res?.errMsg) {
        reject(new Error(res.errMsg));
      } else {
        reject(res);
      }
    };

    // @ts-ignore
    wx[fn](req);
  });
}
