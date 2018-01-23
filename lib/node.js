/**
 * @copyright Maichong Software Ltd. 2018 http://maichong.it
 * @date 2018-01-23
 * @author Liang <liang@maichong.it>
 */

'use strict';

var akita = require('./client');
var fetch = require('node-fetch');
var FormData = require('form-data');

akita.setOptions({ fetch: fetch, FormData: FormData });

var create = akita.create;
var resolve = akita.resolve;

function newCreate(options) {
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

function newResolve() {
  let client = resolve.apply(this, arguments);
  /* istanbul ignore else */
  if (!client._count) {
    // 还未发送请求，新实例
    /* istanbul ignore else */
    if (!client._options.fetch) {
      client.setOptions({ fetch: fetch });
    }
    /* istanbul ignore else */
    if (!client._options.FormData) {
      // 还未发送请求，新实例
      client.setOptions({ FormData: FormData });
    }
  }
  client.create = newCreate;
  client.resolve = newResolve;
  return client;
}

akita.create = newCreate;
akita.resolve = newResolve;

module.exports = akita;
