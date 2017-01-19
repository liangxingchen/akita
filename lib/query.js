/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-12-26
 * @author Liang <liang@maichong.it>
 */



function Query(path, client) {
  var me = this;
  me._client = client;
  me._conditions = { data: {} };
  me._lastCondition = null;
  me._op = 'find';
  me._path = path;
  me._promise = null;

  me.where = function (conditions, value) {
    if (!me._conditions.data.params) {
      me._conditions.data.params = {};
    }
    if (typeof conditions === 'object') {   // where({params:{foo:bar}})
      if (conditions && conditions.params) {
        me._conditions.data = Object.assign({}, me._conditions.data, conditions);
      } else {  // where({foo:bar})
        me._conditions.data.params.filters = Object.assign({}, me._conditions.data.params.filters, conditions);
      }
    } else {
      if (value === undefined) {  // where('foo')
        me._lastCondition = conditions;
      } else {      // where('foo','bar')
        if (!me._conditions.data.params.filters) {
          me._conditions.data.params.filters = {};
        }
        me._conditions.data.params.filters[conditions] = value;
      }
    }
    return me;
  };

  me._compute = function (type, value) {
    if (!me._conditions.data.params) {
      me._conditions.data.params = {};
    }
    if (type.indexOf('$') >= 0) {
      if (me._lastCondition) {
        if (!me._conditions.data.params.filters) {
          me._conditions.data.params.filters = {};
        }
        if (!me._conditions.data.params.filters[me._lastCondition]) {
          me._conditions.data.params.filters[me._lastCondition] = {};
        }
        if (type === '$eq') {
          me._conditions.data.params.filters[me._lastCondition] = value;
        } else {
          me._conditions.data.params.filters[me._lastCondition][type.split('$')[1]] = value;
        }
      }
    } else {
      me._conditions.data.params[type] = value;
    }
    me._lastCondition = null;
    return me;
  };

  me.eq = function (value) {

    return me._compute('$eq', value);
  };
  me.equals = function (value) {
    return me._compute('$eq', value);
  };

  me.lt = function (value) {
    return me._compute('$lt', value);
  };

  me.lte = function (value) {
    return me._compute('$lte', value);
  };

  me.gt = function (value) {
    return me._compute('$gt', value);
  };

  me.gte = function (value) {
    return me._compute('$gte', value);
  };

  me.limit = function (size) {
    return me._compute('limit', size);
  };

  me.page = function (size) {
    return me._compute('page', size);
  };

  me.sort = function (sortBy) {
    return me._compute('sort', sortBy);
  };

  me.create = function (data) {
    me._op = 'create';
    if (data && data.body) {
      me._conditions.data = data;
    } else {
      me._conditions.data = { body: data };
    }
    return me;
  };

  me.update = function (id, data) {
    me._op = 'update';
    var newData = {};
    if (typeof id === 'object') {
      newData = id;
      id = null;
    } else {
      newData = data;
    }
    if (newData && newData.body) {
      me._conditions.data = newData;
    } else {
      me._conditions.data = { body: newData };
    }
    if (id) {
      me._conditions.id = id;
    }

    return me;
  };

  me.remove = function (conditions) {
    me._op = 'remove';
    if (typeof conditions === 'object') {
      if (conditions && conditions.body) {
        me._conditions.data = conditions;
      } else {
        me._conditions.data = { body: conditions };
      }
    } else {
      me._conditions.id = conditions;
    }
    return me;
  };

  me.count = function (conditions) {
    me._op = 'count';
    if (conditions && conditions.params) {
      me._conditions.data = conditions;
    } else {
      me._conditions.data = { params: conditions };
    }
    return me;
  };

  me.find = function (conditions) {
    me._op = 'find';
    if (conditions && conditions.params) {
      me._conditions.data = conditions;
    } else {
      me._conditions.data = { params: conditions };
    }
    return me;
  };

  me.findOne = function (conditions) {
    me._op = 'find';
    if (typeof conditions === 'object') {
      if (conditions && conditions.params) {
        me._conditions.data = conditions;
      } else {
        me._conditions.data = { params: conditions };
      }
    } else {
      me._conditions.id = conditions;
    }
    return me;
  };

  me.findAll = function () {
    me._op = 'find';
    me._conditions.data = {};
    return me;
  };

  me.exec = function () {
    if (!me._promise) {
      var url = me._path;
      var data;
      if (me._conditions && me._conditions.data) {
        data = me._conditions.data;
      }
      if (me._conditions && me._conditions.id) {
        url += '/' + me._conditions.id;
      }
      me._conditions = { data: {} };
      var p;
      switch (me._op) {
        case 'create':
          p = me._client.post(url, data);
          break;
        case 'update':
          p = me._client.put(url, data);
          break;
        case 'remove':
          p = me._client.delete(url, data);
          break;
        case 'count':
          p = me._client.get(url, data);
          break;
        case 'find':
          p = me._client.get(url, data);
          break;
        default:
          p = new Promise;
      }
      me._promise = p;
    }
    return me._promise;
  };

  me.then = function (onSuccess, onFail) {

    return me.exec().then(onSuccess, onFail);
  };

  me.catch = function (onFail) {
    return me.exec().catch(onFail);
  };
}

module.exports = Query;
