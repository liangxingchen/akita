
// @flow

import Debugger from 'debug';
import depd from 'depd';
import type Model from './model';

const debug = Debugger('akita:query');
const deprecate = depd('akita:query');

export default class Query {
  model: Class<Model>;
  _filters: null | Object;
  _data: null | Object;
  _page: number;
  _limit: number;
  _sort: string;
  _id: null | any;
  _args: null | {
    [key: string]: any
  };
  _params: void | Object; // 查询时，起到作用的路径参数列表
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
    this._args = null;
    this._search = '';

    this._op = op;
    this._promise = null;
    this._lastField = '';
  }

  /**
   * Add custom http query args
   * @param {string|Object} args
   * @param {any} [value]
   * @returns {Query}
   */
  arg(args: string | Object, value?: any) {
    if (!this._args) {
      this._args = {};
    }
    if (typeof args === 'object') {
      Object.assign(this._args, args);
    } else {
      this._args[args] = value;
    }
    return this;
  }

  /**
   * Add custom http query arg
   * @deprecated
   * @param {string|Object} args
   * @param {any} [value]
   * @returns {Query}
   */
  param(args: string | Object, value?: any) {
    deprecate('.param() deprecated, please use .arg() instand.');
    return this.arg(args, value);
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
    if (typeof conditions === 'object' && value === undefined) {
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
      this._debug();
      let init = this._createInit();
      let path = init.path;
      delete init.path;
      let p;
      // 处理请求
      switch (this._op) {
        case 'findOne':
          // findOne = find + limit 1
          p = this.model.request(path, init, this).then((results) => {
            if (!results || !Array.isArray(results)) {
              throw new Error(`Api error: GET ${path} should return an array.`);
            }
            if (results.length) {
              return results[0];
            }
            return null;
          });
          break;
        case 'count':
          p = this.model.request(path, init, this).then((result) => {
            if (!result || typeof result !== 'object' || !result.hasOwnProperty('count')) {
              throw new Error(`Api error: GET ${path} should return an object with count property.`);
            }
            return result.count;
          });
          break;
        default:
          p = this.model.request(path, init, this);
      }
      // 处理返回值
      let M = this.model;

      const createRecord = (data: Object) => new M(data, this._params);

      switch (this._op) {
        case 'findByPk':
        case 'findOne':
        case 'create':
          p = p.then(createRecord);
          break;
        case 'find':
          p = p.then((list) => list.map(createRecord));
          break;
        case 'paginate':
          p = p.then((res) => {
            if (res && res.results) {
              res.results = res.results.map(createRecord);
            }
          });
          break;
        default:
          break;
      }
      this._promise = p;
    }
    return this._promise;
  }

  inspect() {
    this._debug();
    let init = this._createInit();
    let path = init.path;
    delete init.path;
    return this.model.request(path, init, this, true);
  }

  _debug() {
    if (debug.enabled) {
      let str = '';
      const M = this.model;
      if (M.name === 'AnonymousModel') {
        str = 'Client("' + M.path + '").';
      } else {
        str = M.name + '.';
      }
      str += this._op;
      switch (this._op) {
        case 'findByPk':
          if (this._id === null) {
            throw new Error('id is not specified for findByPk');
          }
          str += '(' + JSON.stringify(this._id) + ')';
          break;
        case 'remove':
          if (this._id !== null) {
            str += '(' + JSON.stringify(this._id) + ')';
          } else {
            // remove multi
            str += '()';
          }
          break;
        case 'update':
          if (this._id) {
            str += '(' + JSON.stringify(this._id) + ', ' + JSON.stringify(this._data) + ')';
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
      if (this._args) {
        let args: Object = this._args;
        str += Object.keys(this._args)
          .map((key) => '.arg("' + key + '", ' + JSON.stringify(args[key]) + ')')
          .join('');
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
  }

  _createInit() {
    let init = {};
    init.method = 'GET';
    let path = '';

    let query: { [k: string]: any } = {};

    if (this._args) {
      let obj = this._args;
      Object.keys(obj).forEach((key) => {
        query['_' + key] = obj[key];
      });
    }

    if (this._filters) {
      Object.assign(query, this._filters);
    }

    if (this._search) {
      query._search = this._search;
    }

    if (this._limit) {
      query._limit = this._limit;
    }

    if (this._page) {
      query._page = this._page;
    }

    if (this._sort) {
      query._sort = this._sort;
    }

    if (this._id && ['findByPk', 'remove', 'update'].indexOf(this._op) > -1) {
      path += '/' + encodeURIComponent(this._id);
    }

    if (this._data && ['create', 'update'].indexOf(this._op) > -1) {
      init.body = this._data;
    }

    switch (this._op) {
      case 'count':
        path += '/count';
        break;
      case 'paginate':
        path += '/paginate';
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
      // findByPk
      // ...
    }
    init.path = path;
    init.query = query;
    return init;
  }

  then(onSuccess?: Function, onFail?: Function) {
    return this.exec().then(onSuccess, onFail);
  }

  catch(onFail: Function) {
    return this.exec().catch(onFail);
  }
}
