/* eslint no-use-before-define:0 */

// @flow

import fetch from 'node-fetch-unix';
import FormData from 'form-data';
import akita, { Model } from './client';

akita.setOptions({ fetch, FormData });

const create = akita.create;
const resolve = akita.resolve;

function newCreate(options?: Object) {
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
  return client;
}

akita.create = newCreate;
akita.resolve = newResolve;

export default akita;
export { Model };
