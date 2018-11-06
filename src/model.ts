import Debugger = require('debug');
import methods from './methods';
import Query from './query';
import * as Akita from '..';

const debug = Debugger('akita:model');

export default class Model {
  static path: string;
  static client: Akita.Client;
  static pk: string;
  static get: (path: string, init?: Akita.RequestInit) => Akita.Result<any>;
  static post: (path: string, init?: Akita.RequestInit) => Akita.Result<any>;
  static upload: (path: string, init?: Akita.RequestInit) => Akita.Result<any>;
  static put: (path: string, init?: Akita.RequestInit) => Akita.Result<any>;
  static patch: (path: string, init?: Akita.RequestInit) => Akita.Result<any>;
  static delete: (path: string, init?: Akita.RequestInit) => Akita.Result<any>;
  __params?: any;
  get: (path: string, init?: Akita.RequestInit) => Akita.Result<any>;
  post: (path: string, init?: Akita.RequestInit) => Akita.Result<any>;
  upload: (path: string, init?: Akita.RequestInit) => Akita.Result<any>;
  put: (path: string, init?: Akita.RequestInit) => Akita.Result<any>;
  patch: (path: string, init?: Akita.RequestInit) => Akita.Result<any>;
  delete: (path: string, init?: Akita.RequestInit) => Akita.Result<any>;

  constructor(data?: any, params?: any) {
    if (data) {
      Object.assign(this, data);
    }
    if (params) {
      Object.defineProperty(this, '__params', {
        value: Object.assign({}, params),
        writable: true,
        enumerable: false,
        configurable: true
      });
    }
  }

  /**
   * Create record
   * @param {Object} [data]
   * @returns {Query}
   */
  static create(data: any): Akita.Query<any> {
    let query = new Query(this, 'create');
    query._data = data || {};
    return query;
  }

  /**
   * @example
   * // Update one record by id
   * await Blog.update(12, { title: 'hello' });
   * // Update multi records by filter
   * await Blog.update({ hot: true }).where('views').gt(100);
   * // Update one record by id and filter
   * await Blog.update(123,{ hot: true }).where('views').gt(100);
   * // Update multi records with limit and sort
   * await Blog.update({ hot: true }).sort('-createdAt').limit(100)
   * @param {Object|string|number} id
   * @param {Object} [data]
   * @returns {Query}
   */
  static update(id: string | number, data?: any): Akita.Query<any> {
    let query = new Query(this, 'update');
    if (data) {
      query._data = data;
    }
    /* istanbul ignore else */
    if (id && data) {
      query._id = id;
      query._data = data;
    } else if (typeof id === 'object') {
      query._data = id;
    }
    return query;
  }

  /**
   * @example
   * // Remove one record by id
   * await Blog.remove(195);
   * // Remove multi records by filter
   * await Blog.remove().where('status', 800);
   * await Blog.remove({ status:800 });
   * // Remove one record by id and filter
   * await Blog.remove(195).where('status', 800);
   * // Remove multi records with limit and sort
   * await Blog.remove().where('status', 800).limit(100).sort('-createdAt');
   * @param {string|number|Object} [conditions]
   * @returns {Query}
   */
  static remove(conditions?: string | number | any): Akita.Query<number> {
    let query = new Query<number>(this, 'remove');
    if (conditions !== null && typeof conditions === 'object') {
      query.where(conditions);
    } else if (conditions !== undefined) {
      query._id = conditions;
    }
    return query;
  }

  /**
   * @example
   * await Blog.count();
   * await Blog.count().where('status', 800);
   * await Blog.count({ status:800 });
   * @param {Object} [conditions]
   * @returns {Query}
   */
  static count(conditions?: any): Akita.Query<number> {
    let query = new Query<number>(this, 'count');
    if (conditions) {
      query.where(conditions);
    }
    return query;
  }

  /**
   * Find records without paging.
   * @example
   * await Blog.find().where('status', 800);
   * await Blog.find({ status:800 });
   * @param {Object} [conditions]
   * @returns {Query}
   */
  static watch(conditions?: any): Akita.Query<Akita.ChangeStream<any>> {
    let query = new Query<Akita.ChangeStream<any>>(this, 'watch');
    if (conditions) {
      query.where(conditions);
    }
    return query;
  }

  /**
   * Find records without paging.
   * @example
   * await Blog.find().where('status', 800);
   * await Blog.find({ status:800 });
   * @param {Object} [conditions]
   * @returns {Query}
   */
  static find(conditions?: any): Akita.Query<any[]> {
    let query = new Query<any[]>(this, 'find');
    if (conditions) {
      query.where(conditions);
    }
    return query;
  }

  /**
   * Find records with paging.
   * @example
   * await Blog.paginate().where('status', 800);
   * await Blog.paginate({ status:800 }).page(2);
   * @param {Object} [conditions]
   * @returns {Query}
   */
  static paginate(conditions?: any): Akita.Query<Akita.PaginateResult<any>> {
    let query = new Query<Akita.PaginateResult<any>>(this, 'paginate');
    if (conditions) {
      query.where(conditions);
    }
    return query;
  }

  /**
   * @example
   * // Find one record by filter
   * var blog = await Blog.findOne().where('status', 800);
   * var blog = await Blog.findOne({status:800});
   * @param {Object} [conditions]
   * @returns {Query}
   */
  static findOne(conditions?: any): Akita.Query<any | null> {
    let query = new Query(this, 'findOne');
    query.limit(1);
    if (conditions) {
      /* istanbul ignore else */
      if (typeof conditions === 'object') {
        query.where(conditions);
      } else {
        throw new Error('Akita Error: invalid params for Query#findOne()');
      }
    }
    return query;
  }

  /**
   * find record by id
   * @param {string|number} id
   * @returns {Query}
   */
  static findByPk(id: string | number): Akita.Query<any> {
    let query = new Query(this, 'findByPk');
    query._id = id;
    return query;
  }

  static request(path: string, init?: Akita.RequestInit, query?: Akita.Query<any> | null, reducer?: Akita.Reducer<any>) {
    let p = this.path || '';

    if (!p.endsWith('/') && path) {
      p += '/';
    }
    if (path.startsWith('/')) {
      path = path.substr(1);
    }
    path = p + path;

    if (path && init && (init.query || init.body)) {
      let queryParams = init.query && Object.assign({}, init.query);
      let bodyParams = init.body && (typeof init.body === 'object') && Object.assign({}, init.body);
      let params = {};
      let queryEmits = [];
      let bodyEmits = [];
      path = path.replace(/:\w+/g, (match) => {
        let key = match.substr(1); // trim :
        if (queryParams && queryParams.hasOwnProperty(key)) {
          queryEmits.push(key);
          params[key] = queryParams[key];
          return encodeURIComponent(queryParams[key]);
        }
        if (bodyParams && bodyParams.hasOwnProperty(key)) {
          bodyEmits.push(key);
          params[key] = bodyParams[key];
          return encodeURIComponent(bodyParams[key]);
        }
        return match;
      });
      if (query && (queryEmits.length || bodyEmits.length)) {
        query._params = params;
      }
      if (queryParams && queryEmits.length) {
        queryEmits.forEach((key) => {
          delete queryParams[key];
        });
        init = Object.assign({}, init, { query: queryParams });
      }
      if (bodyParams && bodyParams.length) {
        bodyEmits.forEach((key) => {
          delete bodyParams[key];
        });
        init = Object.assign({}, init, { body: bodyParams });
      }
    }

    return this.client.request(path, init, query, reducer);
  }

  request(path: string, init?: Akita.RequestInit, reducer?: Akita.Reducer<any>): Akita.Result<any> {
    const M = <typeof Akita.Model>this.constructor;
    const pk = M.pk || 'id';
    let id = this[pk];
    if (!id) {
      let method = (init && init.method) || 'GET';
      throw new Error(`Can not get pk field (${pk}) for ${method}: '${path}'`);
    }
    id = encodeURIComponent(id);
    if (!path || path.startsWith('/')) {
      path = id + path;
    } else {
      path = `${id}/${path}`;
    }
    let fullPath = `${M.path}/${path}`;
    let matchs = fullPath.match(/:\w+/g);
    if (matchs) {
      init = Object.assign({}, init);
      let query = Object.assign({}, init.query);
      matchs.forEach((match) => {
        let key = match.substr(1);
        if (!query.hasOwnProperty(key)) {
          if (this.__params && this.__params.hasOwnProperty(key)) {
            query[key] = this.__params[key];
          } else if (this.hasOwnProperty(key)) {
            query[key] = this[key];
          } else if (this.hasOwnProperty(key)) {
            query[key] = this[key];
          }
        }
      });
      init.query = query;
    }
    return M.request(path, init, null, reducer);
  }

  save(init?: Akita.RequestInit): Akita.Result<void> {
    return this.request('', Object.assign({}, {
      method: 'PATCH',
      body: this.toJSON()
    }, init), () => undefined);
  }

  remove(init?: Akita.RequestInit): Akita.Result<number> {
    return this.request('', Object.assign({}, {
      method: 'DELETE'
    }, init), (json: any) => (json && json.removed) || 0);
  }

  toJSON(): any {
    let json: any = {};
    // eslint-disable-next-line no-restricted-syntax
    for (let key in this) {
      if (this.hasOwnProperty(key)) {
        json[key] = this[key];
      }
    }
    return json;
  }
}

methods.forEach((method: string) => {
  Model[method] = function (path: string, init?: Akita.RequestInit) {
    debug(`${this.name}.${method}`, path, init || '');
    init = init || {};
    init.method = method.toUpperCase();
    return this.request(path, init, null);
  };

  Model.prototype[method] = function (path: string, init?: Akita.RequestInit) {
    const M = this.constructor;
    debug(`${M.name}.prototype.${method}`, path, init || '');
    init = init || {};
    init.method = method.toUpperCase();
    return this.request(path, init);
  };
});
