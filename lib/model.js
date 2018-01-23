/**
 * @copyright Maichong Software Ltd. 2018 http://maichong.it
 * @date 2018-01-23
 * @author Liang <liang@maichong.it>
 */

'use strict';

var Query = require('./query');

function Model(path, client) {
  var me = this;
  me._path = path;
  me._client = client;

  /**
   * Create record
   * @param {Object} [data]
   * @returns {Query}
   */
  me.create = function (data) {
    var query = new Query(this._path, this._client, 'create');
    query._data = data || {};
    return query;
  };

  /**
   * @example
   * // Update one record by id
   * await akita('api/blog').update(12, { title: 'hello' });
   * // Update multi records by filter
   * await akita('api/blog').where('views').gt(100).update({ hot: true });
   * // Update one record by id and filter
   * await akita('api/blog').update(123,{ hot: true }).where('views').gt(100);
   * // Update multi records with limit and sort
   * await akita('api/blog').update({ hot: true }).sort('-createdAt').limit(100)
   * @param {Object|string|number} id
   * @param {Object} [data]
   * @returns {Query}
   */
  me.update = function (id, data) {
    var query = new Query(this._path, this._client, 'update');
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
  };

  /**
   * @example
   * // Remove one record by id
   * await akita('api/blog').remove(195);
   * // Remove multi records by filter
   * await akita('api/blog').where('status', 800).remove();
   * await akita('api/blog').remove({ status:800 });
   * // Remove one record by id and filter
   * await akita('api/blog').where('status', 800).remove(195);
   * // Remove multi records with limit and sort
   * await akita('api/blog').where('status', 800).remove().limit(100).sort('-createdAt');
   * @param {string|number|Object} [conditions]
   * @returns {Query}
   */
  me.remove = function (conditions) {
    var query = new Query(this._path, this._client, 'remove');
    if (typeof conditions === 'object') {
      query.where(conditions);
    } else {
      query._id = conditions;
    }
    return query;
  };

  /**
   * @example
   * await akita('api/blog').where('status', 800).count();
   * await akita('api/blog').count({ status:800 });
   * @param {Object} [conditions]
   * @returns {Query}
   */
  me.count = function (conditions) {
    var query = new Query(this._path, this._client, 'count');
    if (conditions) {
      query.where(conditions);
    }
    return query;
  };

  /**
   * Find records without paging.
   * @example
   * await akita('api/blog').where('status', 800).find();
   * await akita('api/blog').find({ status:800 });
   * @param {Object} [conditions]
   * @returns {Query}
   */
  me.find = function (conditions) {
    var query = new Query(this._path, this._client, 'find');
    if (conditions) {
      query.where(conditions);
    }
    return query;
  };

  /**
   * Find records with paging.
   * @example
   * await akita('api/blog').where('status', 800).find();
   * await akita('api/blog').find({ status:800 });
   * @param {Object} [conditions]
   * @returns {Query}
   */
  me.paginate = function (conditions) {
    var query = new Query(this._path, this._client, 'paginate');
    if (conditions) {
      query.where(conditions);
    }
    return query;
  };

  /**
   * @example
   * // Find one record by filter
   * var blog = await akita('api/blog').where('status', 800).findOne();
   * var blog = await akita('api/blog').findOne({status:800});
   * @param {Object} [conditions]
   * @returns {Query}
   */
  me.findOne = function (conditions) {
    var query = new Query(this._path, this._client, 'findOne');
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
  };

  /**
   * find record by id
   * @param {string|number} id
   * @returns {Query}
   */
  me.findById = function (id) {
    var query = new Query(this._path, this._client, 'findById');
    query._id = id;
    return query;
  };
}

module.exports = Model;
