/* eslint no-use-before-define:0 */

import akita from './client';
import { Client, ClientOptions } from '..';

export default function inject(fetch: any, FormData: any, ua?: string) {
  function setUA(client: Client) {
    if (!client._options.init) {
      client._options.init = {};
    }
    let init = client._options.init;
    if (!init.headers) {
      init.headers = {};
    }
    if (!init.headers['User-Agent']) {
      init.headers['User-Agent'] = ua;
    }
  }

  function setOptions(options) {
    this._setOptions(options);
    if (ua) {
      setUA(this);
    }
  }

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
      if (!client._options.fetch) {
        client.setOptions({ fetch });
      }
      /* istanbul ignore else */
      if (!client._options.FormData) {
        // 还未发送请求，新实例
        client.setOptions({ FormData });
      }
    }
    client.create = newCreate;
    client.resolve = newResolve;
    if (ua) {
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
