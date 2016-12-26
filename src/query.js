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

  lt(value) {
    this._conditions[this._lastCondition] = {
      $lt: value
    };
    return this;
  }

  gt(value) {
    this._conditions[this._lastCondition] = {
      $gt: value
    };
    return this;
  }

  remove() {
    this._op = 'remove';
    return this;
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
