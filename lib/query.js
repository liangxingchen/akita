/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-12-26
 * @author Liang <liang@maichong.it>
 */

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
   * let blogs = await akita('api/blog')
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
   * Find records with paging.
   * @example
   * await akita('api/blog').where('status', 800).find();
   * await akita('api/blog').find({ status:800 });
   * @param {Object} [conditions]
   * @returns {Query}
   */
  me.find = function (conditions) {
    me._op = 'find';
    if (conditions) {
      return me.where(conditions);
    }
    return me;
  };

  /**
   * @example
   * // Find one record by id
   * let blog = await akita('api/blog').findOne(123);
   * // Find one record by filter
   * let blog = await akita('api/blog').where('status', 800).findOne();
   * let blog = await akita('api/blog').findOne({status:800});
   * // Find one record by id and filter
   * let blog = await akita('api/blog').findOne(123).where({status:800});
   * @param {number|string|Object} [conditions]
   * @returns {Query}
   */
  me.findOne = function (conditions) {
    me._op = 'findOne';
    if (conditions) {
      if (typeof conditions === 'object') {
        return me.where(conditions);
      }
      me._id = conditions;
    }
    return me;
  };

  /**
   * Find records without paging.
   * @param {Object} [conditions]
   * @returns {Query}
   */
  me.findAll = function (conditions) {
    me._op = 'findAll';
    if (conditions && typeof conditions === 'object') {
      return me.where(conditions);
    }
    return me;
  };

  /**
   * Execute the query.
   * @returns {Promise<*>}
   */
  me.exec = function () {
    if (!me._promise) {
      let init = me._createInit();
      let path = init.path;
      delete init.path;
      var p;
      switch (me._op) {
        case 'create':
          p = me._client.post(path, init);
          break;
        case 'update':
          p = me._client.put(path, init);
          break;
        case 'remove':
          p = me._client.delete(path, init);
          break;
        case 'find':
        case 'findAll':
          p = me._client.get(path, init);
          break;
        case 'findOne':
          p = me._client.get(path, init).then(function (result) {
            if (!me._id) {
              if (result && result.results && result.results.length) {
                return Promise.resolve(result.results[0]);
              }
              return Promise.resolve(null);
            }
            return Promise.resolve(result);
          });
          break;
        case 'count':
          p = me._client.get(path, init).then(function (result) {
            return Promise.resolve(result.count);
          });
          break;
      }
      me._promise = p;
    }
    return me._promise;
  };

  me.inspect = function () {
    let init = me._createInit();
    let path = init.path;
    delete init.path;
    switch (me._op) {
      case 'create':
        init.method = 'POST';
        break;
      case 'update':
        init.method = 'PUT';
        break;
      case 'remove':
        init.method = 'DELETE';
        break;
      case 'find':
      case 'findAll':
      case 'findOne':
      case 'count':
        init.method = 'GET';
        break;
    }
    return me._client.request(path, init, true);
  };

  me._createInit = function () {
    var init = { path: me._path };
    var params = null;

    if (me._params) {
      params = Object.assign({}, me._params);
    }

    if (me._filters) {
      if (!params) {
        params = {};
      }
      params.filters = me._filters;
    }

    if (me._limit) {
      if (!params) {
        params = {};
      }
      params.limit = me._limit;
    }

    if (me._page) {
      if (!params) {
        params = {};
      }
      params.page = me._page;
    }

    if (me._sort) {
      if (!params) {
        params = {};
      }
      params.sort = me._sort;
    }

    if (me._id && ['findOne', 'remove', 'update'].indexOf(me._op) > -1) {
      init.path += '/' + me._id;
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
      case 'findAll':
        init.path += '/all';
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
