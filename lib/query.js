/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-12-26
 * @author Liang <liang@maichong.it>
 */



function Query(path, client) {
  var me = this;
  me._client = client;
  me._conditions = {};
  me._lastCondition = null;
  me._op = 'find';
  me._path = path;
  me._promise = null;

  me.where = function (conditions, value) {
    if (typeof conditions === 'object') {
      me._conditions.data = Object.assign({}, me._conditions.data, conditions);
    } else {
      if (value === undefined) {
        me._lastCondition = conditions;
      } else {
        me._conditions.data[conditions] = value;
      }
    }
    return me;
  };

  me.compute = function (type, value) {
    if(me._lastCondition) {
      if (type.indexOf('$') >= 0) {
        me._conditions.data[me._lastCondition][type] = value;
      } else {
        me._conditions.data[me._lastCondition] = value;
      }
    }
    me._lastCondition = null;
    return me;
  };

  me.equals = function (value) {
    me.compute('eq', value);
  };

  me.eq = function (value) {
    me.compute('eq', value);
  };

  me.lt = function (value) {
    me.compute('$lt', value);
  };

  me.lte = function (value) {
    me.compute('$lte', value);
  };

  me.gt = function (value) {
    me.compute('$gt', value);
  };

  me.gte = function (value) {
    me.compute('$gte', value);
  };

  me.limit = function (size) {
    me.compute('limit', size);
  };

  me.page = function (size) {
    me.compute('page', size);
  };

  me.sort = function (sortBy) {
    me.compute('sort', sortBy);
  };

  me.create = function (data) {
    me._op = 'create';
    me._conditions = { data };
    return me;
  };

  me.update = function (id, data) {
    me._op = 'update';
    if (typeof id === 'object') {
      me._conditions = { data: id };
    } else {
      me._conditions = Object.assign({ id }, data);
    }
    return me;
  };

  me.remove = function (conditions) {
    me._op = 'remove';
    if (typeof conditions === 'object') {
      me._conditions = { data: conditions };
    } else {
      me._conditions = { id: conditions };
    }
    return me;
  };

  me.count = function (conditions) {
    me._op = 'count';
    me._conditions = { data: conditions };
    return me;
  };

  me.find = function (conditions) {
    me._op = 'find';
    me._conditions = { data: conditions };
    return me;
  };

  me.findOne = function (conditions) {
    me._op = 'find';
    if (typeof conditions === 'object') {
      me._conditions = { data: conditions };
    } else {
      me._conditions = { id: conditions };
    }
    return me;
  };

  me.findAll = function () {
    me._op = 'find';
    me._conditions = {};
    return me;
  };

  me.exec = function () {
    if (!me._promise) {
      var url = me._path;
      var data;
      if(me._conditions && me._conditions.data){
        data = me._conditions.data;
      }
      if (me._conditions && me._conditions.id) {
        url += '/' + me._conditions.id;
      }
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
