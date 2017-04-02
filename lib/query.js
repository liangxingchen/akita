/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-12-26
 * @author Liang <liang@maichong.it>
 */

'use strict';

/**
 * @param {string} path
 * @param {AkitaClient} client
 * @constructor
 */
function Query(path, client) {
  var me = this;
  me._path = path;
  me._client = client;
  me._filters = null;
  me._data = null;
  me._page = null;
  me._limit = null;
  me._sort = null;
  me._id = null;
  me._params = null;
  me._search = null;

  me._op = 'find';
  me._promise = null;
  me._lastField = null;

  /**
   * Add custom http query params
   * @param params
   * @param value
   * @returns {Query}
   */
  me.param = function (params, value) {
    if (!me._params) {
      me._params = {};
    }
    if (typeof params === 'object') {
      Object.assign(me._params, params);
    } else {
      me._params[params] = value;
    }
    return me;
  };

  /**
   * @example
   * var blogs = await akita('api/blog')
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
  me.where = function (conditions, value) {
    if (!me._filters) {
      me._filters = {};
    }
    if (typeof conditions === 'object' && value === undefined) {   // where({params:{foo:bar}})
      me._filters = Object.assign(me._filters, conditions);
    } else if (typeof conditions === 'string') {
      if (value === undefined) {  // where('foo')
        me._lastField = conditions;
      } else {
        me._filters[conditions] = value;
      }
    } else {
      throw new Error('Akita Error: invalid params for Query#where()');
    }
    return me;
  };

  /**
   * Specifies search param
   * @param keyword
   * @returns {Query}
   */
  me.search = function (keyword) {
    me._search = keyword;
    return me;
  };

  function filter(type, value) {
    if (!me._filters) {
      me._filters = {};
    }
    if (me._lastField === undefined) {
      throw new Error('Akita Error: you should invoke .where(string) before .' + type + '()');
    }

    if (type === 'eq') {
      me._filters[me._lastField] = value;
    } else {
      if (typeof me._filters[me._lastField] !== 'object') {
        me._filters[me._lastField] = {};
      }
      me._filters[me._lastField]['$' + type] = value;
    }
    return me;
  }

  me.eq = function (value) {
    return filter('eq', value);
  };

  me.lt = function (value) {
    return filter('lt', value);
  };

  me.lte = function (value) {
    return filter('lte', value);
  };

  me.gt = function (value) {
    return filter('gt', value);
  };

  me.gte = function (value) {
    return filter('gte', value);
  };

  me.limit = function (size) {
    me._limit = size;
    return me;
  };

  me.page = function (value) {
    me._page = value;
    return me;
  };

  me.sort = function (value) {
    me._sort = value;
    return me;
  };

  /**
   * Create record
   * @param {Object} [data]
   * @returns {Query}
   */
  me.create = function (data) {
    me._op = 'create';
    if (data) {
      me._data = data;
    }
    return me;
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
    me._op = 'update';
    if (!me._data) {
      me._data = {};
    }
    if (id && data) {
      me._id = id;
      me._data = data;
    } else if (typeof id === 'object') {
      Object.assign(me._data, id);
    }
    return me;
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
    me._op = 'remove';
    if (conditions) {
      if (typeof conditions === 'object') {
        return me.where(conditions);
      } else {
        me._id = conditions;
      }
    }
    return me;
  };

  /**
   * @example
   * await akita('api/blog').where('status', 800).count();
   * await akita('api/blog').count({ status:800 });
   * @param {Object} [conditions]
   * @returns {Query}
   */
  me.count = function (conditions) {
    me._op = 'count';
    if (conditions) {
      return me.where(conditions);
    }
    return me;
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
    me._op = 'find';
    if (conditions && typeof conditions === 'object') {
      return me.where(conditions);
    }
    return me;
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
    me._op = 'paginate';
    if (conditions) {
      return me.where(conditions);
    }
    return me;
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
    me._op = 'findOne';
    me.limit(1);
    if (conditions) {
      if (typeof conditions === 'object') {
        return me.where(conditions);
      } else {
        throw new Error('Akita Error: invalid params for Query#findOne()');
      }
    }
    return me;
  };

  /**
   * find record by id
   * @param {string|number} id
   * @returns {Query}
   */
  me.findById = function (id) {
    me._op = 'findById';
    me._id = id;
    return me;
  };

  /**
   * Execute the query.
   * @returns {Promise<*>}
   */
  me.exec = function () {
    if (!me._promise) {
      var debug = me._client._options.debug;
      if (debug) {
        var str = 'Query("' + me._path + '").' + me._op;
        switch (me._op) {
          case 'findById':
            str += '("' + me._id + '")';
            break;
          case 'remove':
            str += '("' + me._id + '")';
            break;
          case 'update':
            if (me._id) {
              str += '("' + me._id + '", ' + JSON.stringify(me._data) + ')';
            } else {
              str += '(' + JSON.stringify(me._data) + ')';
            }
            break;
          case 'create':
            str += '(' + JSON.stringify(me._data) + ')';
            break;
          default:
            str += '()';
        }
        if (me._params) {
          for (var key in me._params) {
            str += '.param("' + key + '", "' + me._params[key] + '")';
          }
        }
        if (me._filters) {
          str += '.where(' + JSON.stringify(me._filters) + ')';
        }
        if (me._search) {
          str += '.search("' + me._search + '")';
        }
        if (me._limit > 1) {
          str += '.limit(' + me._limit + ')';
        }
        if (me._page > 1) {
          str += '.page(' + me._page + ')';
        }
        if (me._sort) {
          str += '.sort(' + me._sort + ')';
        }
        debug(str);
      }
      var init = me._createInit();
      var path = init.path;
      delete init.path;
      var p;
      switch (me._op) {
        case 'findOne':
          // findOne = find + limit 1
          p = me._client.request(path, init, me).then(function (results) {
            if (results.length) {
              return Promise.resolve(results[0]);
            } else {
              return Promise.resolve(null);
            }
          });
          break;
        case 'count':
          p = me._client.request(path, init, me).then(function (result) {
            return Promise.resolve(result.count);
          });
          break;
        default:
          p = me._client.request(path, init, me);
      }
      me._promise = p;
    }
    return me._promise;
  };

  me.inspect = function () {
    var init = me._createInit();
    var path = init.path;
    delete init.path;
    return me._client.request(path, init, me, true);
  };

  me._createInit = function () {
    var init = { path: me._path, method: 'GET' };

    var params = null;

    if (me._params) {
      params = {};
      for (var key in me._params) {
        params['_' + key] = me._params[key];
      }
    }

    if (me._filters) {
      params = Object.assign(params || {}, me._filters);
    }

    if (me._search) {
      if (!params) {
        params = {};
      }
      params._search = me._search;
    }

    if (me._limit) {
      if (!params) {
        params = {};
      }
      params._limit = me._limit;
    }

    if (me._page) {
      if (!params) {
        params = {};
      }
      params._page = me._page;
    }

    if (me._sort) {
      if (!params) {
        params = {};
      }
      params._sort = me._sort;
    }

    if (me._id && ['findById', 'remove', 'update'].indexOf(me._op) > -1) {
      init.path += '/' + encodeURIComponent(me._id);
    }

    if (me._data && ['create', 'update'].indexOf(me._op) > -1) {
      init.body = me._data;
    }

    if (params) {
      init.params = params;
    }
    switch (me._op) {
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
    }
    return init;
  };

  me.then = function (onSuccess, onFail) {
    return me.exec().then(onSuccess, onFail);
  };

  me.catch = function (onFail) {
    return me.exec().catch(onFail);
  };
}

module.exports = Query;
