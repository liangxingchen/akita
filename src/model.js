
// @flow

import Debugger from 'debug';
import methods from 'methods';
import Query from './query';

const debug = Debugger('akita:model');

export default class Model {
  static path: string;
  static client: Object;
  static pk: void | string;

  constructor(data: Object) {
    Object.assign(this, data);
  }

  /**
   * Create record
   * @param {Object} [data]
   * @returns {Query}
   */
  static create(data: Object): Query {
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
  static update(id: string | number, data?: Object): Query {
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
  static remove(conditions?: string | number | Object): Query {
    let query = new Query(this, 'remove');
    if (conditions !== null && typeof conditions === 'object') {
      query.where(conditions);
    } else {
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
  static count(conditions?: Object): Query {
    let query = new Query(this, 'count');
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
  static find(conditions?: Object): Query {
    let query = new Query(this, 'find');
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
  static paginate(conditions: Object): Query {
    let query = new Query(this, 'paginate');
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
  static findOne(conditions?: Object): Query {
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
  static findById(id: string | number): Query {
    let query = new Query(this, 'findById');
    query._id = id;
    return query;
  }

  save() {

  }

  remove() {

  }
}

methods.forEach((method: string) => {
  Model[method] = function (path: string, init?: akita$RequestInit, inspect?: boolean) {
    debug(this.name + '.' + method, path, init);
    let p = this.path || '';
    if (!p.endsWith('/')) {
      p += '/';
    }
    if (path.startsWith('/')) {
      path = path.substr(1);
    }
    path = p + path;
    init = init || {};
    init.method = method.toUpperCase();
    return this.client.request(path, init, null, inspect);
  };

  // $Flow prototype 可迭代
  Model.prototype[method] = function (path: string, init?: akita$RequestInit, inspect?: boolean) {
    const M = this.constructor;
    const pk = M.pk || 'id';
    debug(M.name + '.prototype.' + method, path, init);
    let id = this[pk];
    if (!id) {
      throw new Error(`Can not get pk field (${pk}) for ${method}: '${path}'`);
    }
    if (path.startsWith('/')) {
      path = id + path;
    } else {
      path = id + '/' + path;
    }
    return M[method](path, init, inspect);
  };
});
