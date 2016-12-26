/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-12-26
 * @author Liang <liang@maichong.it>
 */

class Query {

  constructor(path, client) {
    this._client = client;
    this._conditions = null;
    this._lastCondition = null;
    this._op = 'find';
    this._opData = null;
    this._path = path;
    this._promise = null;
  }

  where(conditions, value) {
    if (typeof conditions === 'object') {
      this._conditions = Object.assign({}, this._conditions, conditions);
    } else {
      if (!this._conditions) {
        this._conditions = {};
      }

      if (value === undefined) {
        this._lastCondition = conditions;
      } else {
        this._conditions[conditions] = value;
      }
    }
    return this;
  }

  compute(type, value) {
    if (type.indexOf('$') >= 0) {
      this._conditions[this._lastCondition][type] = value;
    } else {
      this._conditions[this._lastCondition] = value;
    }
    this._lastCondition = null;
    return this;
  }

  equals(value) {
    this.compute('eq', value);
  }

  eq(value) {
    this.compute('eq', value);
  }

  lt(value) {
    this.compute('$lt', value);
  }

  lte(value) {
    this.compute('$lte', value);
  }

  gt(value) {
    this.compute('$gt', value);
  }

  gte(value) {
    this.compute('$gte', value);
  }

  limit(size) {
    this.compute('limit', size);
  }

  page(size) {
    this.compute('page', size);
  }

  sort(sortBy) {
    this.compute('sort', sortBy);
  }

  create(data) {
    this._op = 'create';
    this._opData = { data };
    return this;
  }

  update(id, data) {
    this._op = 'update';
    this._opData = { id, data };
    return this;
  }

  remove(conditions) {
    this._op = 'remove';
    this._opData = {data:conditions};
    return this;
  }
  count(conditions) {
    this._op = 'count';
    this._opData = {data:conditions};
  }
  exec() {
    if (!this._promise) {
      if (this._op == 'remove') {
        let url = this._client.options.apiRoot + this._path;
        this._promise = this._client.delete(url).then(onSuccess, onFail);
      }
    }
    return this._promise;
  }

  then(onSuccess, onFail) {
    return this.exec().then(onSuccess, onFail);
  }

  catch(onFail) {
    return this.exec().catch(onFail);
  }
}
