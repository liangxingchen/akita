/**
 * query
 * @copyright Maichong Software Ltd. 2017 http://maichong.it
 * @date 2017-01-19
 * @author Lei <zhao@maichong.it>
 */

'use strict';

const assert = require('assert');
const fetch = require('node-fetch');
const client = require('../lib/client').resolve('query');

client.setOptions({ apiRoot: 'http://localhost/', fetch });

function deepEqual(obj1, obj2) {
  try {
    assert.deepEqual(obj1, obj2);
  } catch (error) {
    console.log('error:\n' + JSON.stringify(obj1) + '\n' + JSON.stringify(obj2));
    throw error;
  }
}

describe('Query', function () {
  it('findOne by id', function () {
    deepEqual(
      client('res').findById(1).inspect(),
      { method: 'GET', url: 'http://localhost/res/1' }
    );
  });
  it('findOne by id & filters', function () {
    deepEqual(
      client('res').findById(1).where('user', 1).inspect().params,
      { user: 1 }
    );
  });
  it('findOne', function () {
    deepEqual(
      client('res').findOne({ foo: 'bar' }).inspect(),
      { params: { foo: 'bar', _limit: 1 }, method: 'GET', url: 'http://localhost/res/all?foo=bar&_limit=1' }
    );
  });

  it('find', function () {
    deepEqual(
      client('res').find().where('user', 1).inspect(),
      { params: { user: 1 }, method: 'GET', url: 'http://localhost/res?user=1' }
    );
    deepEqual(
      client('res').find().where({ user: 1 }).inspect(),
      { params: { user: 1 }, method: 'GET', url: 'http://localhost/res?user=1' }
    );
    deepEqual(
      client('res').find().where('user').eq(1).inspect(),
      { params: { user: 1 }, method: 'GET', url: 'http://localhost/res?user=1' }
    );
  });

  it('findAll', function () {
    deepEqual(
      client('res').findAll().where('user', 1).inspect(),
      { params: { user: 1 }, method: 'GET', url: 'http://localhost/res/all?user=1' }
    );
    deepEqual(
      client('res').findAll().where({ user: 1 }).inspect(),
      { params: { user: 1 }, method: 'GET', url: 'http://localhost/res/all?user=1' }
    );
    deepEqual(
      client('res').findAll().where('user').eq(1).inspect(),
      { params: { user: 1 }, method: 'GET', url: 'http://localhost/res/all?user=1' }
    );
  });

  it('where', function () {
    deepEqual(
      client('res').find().where('user', 1).where('status', 100).inspect(),
      {
        params: { user: 1, status: 100 },
        method: 'GET',
        url: 'http://localhost/res?user=1&status=100'
      }
    );
    deepEqual(
      client('res').find().where({ user: 1, status: 100 }).inspect(),
      {
        params: { user: 1, status: 100 },
        method: 'GET',
        url: 'http://localhost/res?user=1&status=100'
      }
    );
    deepEqual(
      client('res').find().where({ user: 1 }).where({ status: 100 }).inspect(),
      {
        params: { user: 1, status: 100 },
        method: 'GET',
        url: 'http://localhost/res?user=1&status=100'
      }
    );
  });

  it('where gt', function () {
    deepEqual(
      client('res').find().where({ user: 1 }).where('status').gt(100).inspect(),
      {
        params: { user: 1, status: { $gt: 100 } },
        method: 'GET',
        url: 'http://localhost/res?user=1&status%5B%24gt%5D=100'
      }
    );
  });

  it('where gt & lt', function () {
    deepEqual(
      client('res').find().where({ user: 1 }).where('status').gt(100).lt(600).inspect(),
      {
        params: { user: 1, status: { $gt: 100, $lt: 600 } },
        method: 'GET',
        url: 'http://localhost/res?user=1&status%5B%24gt%5D=100&status%5B%24lt%5D=600'
      }
    );
  });

  it('count', function () {
    deepEqual(
      client('res').count().where('user', 1).where('status', 100).inspect(),
      {
        params: { user: 1, status: 100 },
        method: 'GET',
        url: 'http://localhost/res/count?user=1&status=100'
      }
    );
    deepEqual(
      client('res').count({ user: 1, status: 100 }).inspect(),
      {
        params: { user: 1, status: 100 },
        method: 'GET',
        url: 'http://localhost/res/count?user=1&status=100'
      }
    );
  });

  it('limit', function () {
    deepEqual(
      client('res').limit(100).inspect(),
      { params: { _limit: 100 }, method: 'GET', url: 'http://localhost/res?_limit=100' }
    );
  });

  it('sort', function () {
    deepEqual(
      client('res').sort('-createdAt').inspect(),
      { params: { _sort: '-createdAt' }, method: 'GET', url: 'http://localhost/res?_sort=-createdAt' }
    );
  });

  it('page', function () {
    deepEqual(
      client('res').page(2).limit(10).sort('-createdAt').inspect(),
      {
        params: { _sort: '-createdAt', _page: 2, _limit: 10 },
        method: 'GET',
        url: 'http://localhost/res?_limit=10&_page=2&_sort=-createdAt'
      }
    );
  });

  it('create', function () {
    deepEqual(
      client('res').create({ title: 'my book' }).inspect(),
      {
        method: 'POST',
        url: 'http://localhost/res',
        headers: { 'Content-Type': 'application/json' },
        body: '{\"title\":\"my book\"}'
      }
    );
  });

  it('update by id', function () {
    deepEqual(
      client('res').update(1, { title: 'my book' }).inspect(),
      {
        method: 'PATCH',
        url: 'http://localhost/res/1',
        headers: { 'Content-Type': 'application/json' },
        body: '{\"title\":\"my book\"}'
      }
    );
  });

  it('update by filters', function () {
    deepEqual(
      client('res').where({ status: 300 }).update({ status: 400 }).limit(100).inspect(),
      {
        method: 'PATCH',
        url: 'http://localhost/res?status=300&_limit=100',
        params: {
          status: 300,
          _limit: 100
        },
        headers: { 'Content-Type': 'application/json' },
        body: '{\"status\":400}'
      }
    );
  });

  it('remove by id', function () {
    deepEqual(
      client('res').remove(123).inspect(),
      {
        method: 'DELETE',
        url: 'http://localhost/res/123'
      }
    );
  });

  it('remove by filters', function () {
    deepEqual(
      client('res').where({ price: { $gt: 300 } }).remove({ status: 400 }).limit(100).inspect(),
      {
        method: 'DELETE',
        url: 'http://localhost/res?price%5B%24gt%5D=300&status=400&_limit=100',
        params: {
          price: { $gt: 300 },
          status: 400,
          _limit: 100
        }
      }
    );
  });

  it('remove by id & filters', function () {
    deepEqual(
      client('res').where({ price: { $gt: 300 } }).remove(2).inspect(),
      {
        method: 'DELETE',
        url: 'http://localhost/res/2?price%5B%24gt%5D=300',
        params: {
          price: { $gt: 300 }
        }
      }
    );
  });
});
