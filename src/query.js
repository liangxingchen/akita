
// @flow

import Debugger from 'debug';
import type Model from './model';

const debug = Debugger('akita:query');

export default class Query {
  model: Class<Model>;
  _filters: null | Object;
  _data: null | Object;
  _page: number;
  _limit: number;
  _sort: string;
  _id: null | any;
  _params: null | {
    [key: string]: any
  };
  _search: string;

  _op: string;
  _promise: null | Promise<any>;
  _lastField: string;

  /**
   * @param {Model} model
   * @param {string} op
   * @constructor
   */
  constructor(model: Class<Model>, op: string) {
    this.model = model;
    this._filters = null;
    this._data = null;
    this._page = 0;
    this._limit = 0;
    this._sort = '';
    this._id = null;
    this._params = null;
    this._search = '';

    this._op = op;
    this._promise = null;
    this._lastField = '';
  }

  /**
   * Add custom http query params
   * @param {string|Object} params
   * @param {any} [value]
   * @returns {Query}
   */
  param(params: string | Object, value?: any) {
    if (!this._params) {
      this._params = {};
    }
    if (typeof params === 'object') {
      Object.assign(this._params, params);
    } else {
      this._params[params] = value;
    }
    return this;
  }

  /**
   * @example
   * var blogs = await akita('api/blog')
   *                   .find()
   *                   .where({ username: 'Liang' })
   *                   .where('status', 5)
   *                   .where('views')
   *                   .gt(100)
   *                   .sort('-createdAt')
   *                   .limit(10)
   *                   .page(1);
   * @param {string|Object} conditions
   * @param {any} [value]
   * @returns {Query}
   */
  where(conditions: string | Object, value?: any) {
    if (!this._filters) {
      this._filters = {};
    }
    if (typeof conditions === 'object' && value === undefined) { // where({params:{foo:bar}})
      this._filters = Object.assign(this._filters, conditions);
    } else if (typeof conditions === 'string') {
      if (value === undefined) { // where('foo')
        this._lastField = conditions;
      } else {
        this._filters[conditions] = value;
      }
    } else {
      /* istanbul ignore next */
      throw new Error('Akita Error: invalid params for Query#where()');
    }
    return this;
  }

  /**
   * Specifies search param
   * @param keyword
   * @returns {Query}
   */
  search(keyword: string) {
    this._search = keyword;
    return this;
  }

  __filter(type: string, value: any) {
    if (!this._filters) {
      this._filters = {};
    }
    if (!this._lastField) {
      /* istanbul ignore next */
      throw new Error('Akita Error: you should invoke .where(string) before .' + type + '()');
    }

    if (type === 'eq') {
      this._filters[this._lastField] = value;
    } else {
      if (typeof this._filters[this._lastField] !== 'object') {
        this._filters[this._lastField] = {};
      }
      this._filters[this._lastField]['$' + type] = value;
    }
    return this;
  }

  eq(value: any) {
    return this.__filter('eq', value);
  }

  lt(value: any) {
    return this.__filter('lt', value);
  }

  lte(value: any) {
    return this.__filter('lte', value);
  }

  gt(value: any) {
    return this.__filter('gt', value);
  }

  gte(value: any) {
    return this.__filter('gte', value);
  }

  limit(size: number) {
    this._limit = size;
    return this;
  }

  page(value: number) {
    this._page = value;
    return this;
  }

  sort(value: string) {
    this._sort = value;
    return this;
  }

  /**
   * Execute the query.
   * @returns {Promise<*>}
   */
  exec() {
    if (!this._promise) {
      if (debug.enabled) {
        let str = 'Client("' + this.model.path + '").' + this._op;
        switch (this._op) {
          case 'findById':
            if (this._id === null) {
              throw new Error('id is not specified for findById');
            }
            str += '("' + this._id + '")';
            break;
          case 'remove':
            if (this._id === null) {
              throw new Error('id is not specified for remove');
            }
            str += '("' + this._id + '")';
            break;
          case 'update':
            if (this._id) {
              str += '("' + this._id + '", ' + JSON.stringify(this._data) + ')';
            } else {
              str += '(' + JSON.stringify(this._data) + ')';
            }
            break;
          case 'create':
            str += '(' + JSON.stringify(this._data) + ')';
            break;
          default:
            str += '()';
        }
        if (this._params) {
          let params: Object = this._params;
          str += Object.keys(this._params).map((key) => '.param("' + key + '", "' + params[key] + '")').join('');
        }
        if (this._filters) {
          str += '.where(' + JSON.stringify(this._filters) + ')';
        }
        if (this._search) {
          str += '.search("' + this._search + '")';
        }
        if (this._limit > 1) {
          str += '.limit(' + this._limit + ')';
        }
        if (this._page > 1) {
          str += '.page(' + this._page + ')';
        }
        if (this._sort) {
          str += '.sort(' + this._sort + ')';
        }
        debug(str);
      }
      let init = this._createInit();
      let path = init.path;
      delete init.path;
      let p;
      switch (this._op) {
        case 'findOne':
          // findOne = find + limit 1
          p = this.model.client.request(path, init, this).then((results) => {
            if (results.length) {
              return results[0];
            }
            return null;
          });
          break;
        case 'count':
          p = this.model.client.request(path, init, this).then((result) => result.count);
          break;
        default:
          p = this.model.client.request(path, init, this);
      }
      this._promise = p;
    }
    return this._promise;
  }

  inspect() {
    let init = this._createInit();
    let path = init.path;
    delete init.path;
    return this.model.client.request(path, init, this, true);
  }

  _createInit() {
    let init = {};
    init.method = 'GET';
    init.path = this.model.path;

    let params: { [k: string]: any } = {};

    if (this._params) {
      // params = {};
      let obj = this._params;
      Object.keys(obj).forEach((key) => {
        params['_' + key] = obj[key];
      });
    }

    if (this._filters) {
      params = Object.assign(params || {}, this._filters);
    }

    if (this._search) {
      if (!params) {
        params = {};
      }
      params._search = this._search;
    }

    if (this._limit) {
      if (!params) {
        params = {};
      }
      params._limit = this._limit;
    }

    if (this._page) {
      if (!params) {
        params = {};
      }
      params._page = this._page;
    }

    if (this._sort) {
      if (!params) {
        params = {};
      }
      params._sort = this._sort;
    }

    if (this._id && ['findById', 'remove', 'update'].indexOf(this._op) > -1) {
      init.path += '/' + encodeURIComponent(this._id);
    }

    if (this._data && ['create', 'update'].indexOf(this._op) > -1) {
      init.body = this._data;
    }

    init.params = params;
    switch (this._op) {
      case 'count':
        init.path += '/count';
        break;
      case 'paginate':
        init.path += '/paginate';
        break;
      case 'create':
        init.method = 'POST';
        break;
      case 'update':
        init.method = 'PATCH';
        break;
      case 'remove':
        init.method = 'DELETE';
        break;
      default:
        // find
        // findOne
        // findById
        // ...
    }
    return init;
  }

  then(onSuccess?: Function, onFail?: Function) {
    return this.exec().then(onSuccess, onFail);
  }

  catch(onFail: Function) {
    return this.exec().catch(onFail);
  }
}
