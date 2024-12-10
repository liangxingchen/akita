/* eslint no-use-before-define:0 */

import akita from './client';
import type { Client, ClientOptions } from '..';

export default function inject(fetch: any, FormData: any, ua?: string) {
  function setUA(client: Client) {
    if (!client.options.init) {
      client.options.init = {};
    }
    let init = client.options.init;
    if (!init.headers) {
      init.headers = {};
    }
    if (!init.headers['User-Agent']) {
      init.headers['User-Agent'] = ua;
    }
  }

  function setOptions(options: ClientOptions) {
    this._setOptions(options);
    if (ua) {
      setUA(this);
    }
  }

  // @ts-ignore _setOptions
  akita._setOptions = akita.setOptions;
  akita.setOptions = setOptions;

  akita.setOptions({ fetch, FormData });

  const create = akita.create;
  const resolve = akita.resolve;

  function newCreate(options?: ClientOptions) {
    options = options || {};
    /* istanbul ignore else */
    if (!options.fetch) {
      options.fetch = fetch;
    }
    /* istanbul ignore else */
    if (!options.FormData) {
      options.FormData = FormData;
    }
    let client = create(options);
    client.create = newCreate;
    client.resolve = newResolve;
    if (ua) {
      // @ts-ignore _setOptions
      client._setOptions = client.setOptions;
      client.setOptions = setOptions;
      setUA(client);
    }
    return client;
  }

  function newResolve(key: string) {
    let client = resolve(key);
    /* istanbul ignore else */
    if (!client._count) {
      // 还未发送请求，新实例
      /* istanbul ignore else */
      if (!client.options.fetch) {
        client.options.fetch = fetch;
      }
      /* istanbul ignore else */
      if (!client.options.FormData) {
        // 还未发送请求，新实例
        client.options.FormData = FormData;
      }
    }
    client.create = newCreate;
    client.resolve = newResolve;
    if (ua) {
      // @ts-ignore _setOptions
      client._setOptions = client.setOptions;
      client.setOptions = setOptions;
      setUA(client);
    }
    return client;
  }

  akita.create = newCreate;
  akita.resolve = newResolve;
  return akita;
}
