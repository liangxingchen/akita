/**
 * query
 * @copyright Maichong Software Ltd. 2017 http://maichong.it
 * @date 2017-01-19
 * @author Lei <zhao@maichong.it>
 */

'use strict';

const test = require('tape');
const client = require('../lib/node').resolve('query');
const github = require('../lib/node').create();

client.setOptions({ apiRoot: 'http://localhost' });
github.setOptions({ apiRoot: 'https://api.github.com', debug: true });

const Model = client('res');

test('Query', function (troot) {
  test('findOne by id', (t) => {
    t.deepEqual(
      client('/res').findById(1).inspect(),
      { method: 'GET', url: 'http://localhost/res/1' }
    );
    t.end();
  });

  test('findOne by id & filters', (t) => {
    t.deepEqual(
      Model.findById(1).where('user', 1).inspect(),
      { method: 'GET', url: 'http://localhost/res/1?user=1' }
    );
    t.end();
  });

  test('findOne', (t) => {
    t.deepEqual(
      Model.findOne({ foo: 'bar' }).inspect(),
      { method: 'GET', url: 'http://localhost/res?foo=bar&_limit=1' }
    );
    t.deepEqual(
      Model.findOne().inspect(),
      { method: 'GET', url: 'http://localhost/res?_limit=1' }
    );
    t.end();
  });

  test('find', (t) => {
    t.deepEqual(
      Model.find().where('user', 1).inspect(),
      { method: 'GET', url: 'http://localhost/res?user=1' }
    );
    t.deepEqual(
      Model.find().where({ user: 1 }).inspect(),
      { method: 'GET', url: 'http://localhost/res?user=1' }
    );
    t.deepEqual(
      Model.find({ user: 1 }).inspect(),
      { method: 'GET', url: 'http://localhost/res?user=1' }
    );
    t.deepEqual(
      Model.find().where('user').eq(1).inspect(),
      { method: 'GET', url: 'http://localhost/res?user=1' }
    );
    t.end();
  });

  test('paginate', (t) => {
    t.deepEqual(
      Model.paginate().where('user', 1).inspect(),
      { method: 'GET', url: 'http://localhost/res/paginate?user=1' }
    );
    t.deepEqual(
      Model.paginate().where({ user: 1 }).inspect(),
      { method: 'GET', url: 'http://localhost/res/paginate?user=1' }
    );
    t.deepEqual(
      Model.paginate({ user: 1 }).inspect(),
      { method: 'GET', url: 'http://localhost/res/paginate?user=1' }
    );
    t.deepEqual(
      Model.paginate().where('user').eq(1).inspect(),
      { method: 'GET', url: 'http://localhost/res/paginate?user=1' }
    );
    t.end();
  });

  test('param', (t) => {
    t.deepEqual(
      Model.find().param('user', 1).inspect(),
      { method: 'GET', url: 'http://localhost/res?_user=1' }
    );
    t.deepEqual(
      Model.find().param({ user: 1 }).inspect(),
      { method: 'GET', url: 'http://localhost/res?_user=1' }
    );
    t.deepEqual(
      Model.find().param({ user: 1 }).param('group', 2).inspect(),
      { method: 'GET', url: 'http://localhost/res?_user=1&_group=2' }
    );
    t.deepEqual(
      Model.remove().param({ user: 1 }).inspect(),
      { method: 'DELETE', url: 'http://localhost/res?_user=1' }
    );
    t.deepEqual(
      Model.findById(12).param({ user: 1 }).inspect(),
      { method: 'GET', url: 'http://localhost/res/12?_user=1' }
    );
    t.end();
  });

  test('search', (t) => {
    t.deepEqual(
      Model.find().search('keyword').inspect(),
      { method: 'GET', url: 'http://localhost/res?_search=keyword' }
    );
    t.deepEqual(
      Model.remove().search('keyword').inspect(),
      { method: 'DELETE', url: 'http://localhost/res?_search=keyword' }
    );
    t.deepEqual(
      Model.findById(12).search('keyword').inspect(),
      { method: 'GET', url: 'http://localhost/res/12?_search=keyword' }
    );
    t.end();
  });

  test('where', (t) => {
    t.deepEqual(
      Model.find().where('user', 1).where('status', 100).inspect(),
      {
        method: 'GET',
        url: 'http://localhost/res?user=1&status=100'
      }
    );
    t.deepEqual(
      Model.find().where({ user: 1, status: 100 }).inspect(),
      {
        method: 'GET',
        url: 'http://localhost/res?user=1&status=100'
      }
    );
    t.deepEqual(
      Model.find().where({ user: 1 }).where({ status: 100 }).inspect(),
      {
        method: 'GET',
        url: 'http://localhost/res?user=1&status=100'
      }
    );
    t.end();
  });

  test('where gt', (t) => {
    t.deepEqual(
      Model.find().where('status').gt(100).inspect(),
      {
        method: 'GET',
        url: 'http://localhost/res?status%5B%24gt%5D=100'
      }
    );
    t.deepEqual(
      Model.find().where({ user: 1 }).where('status').gt(100).inspect(),
      {
        method: 'GET',
        url: 'http://localhost/res?user=1&status%5B%24gt%5D=100'
      }
    );
    t.end();
  });

  test('where gt & lt', (t) => {
    t.deepEqual(
      Model.find().where({ user: 1 }).where('status').gt(100).lt(600).inspect(),
      {
        method: 'GET',
        url: 'http://localhost/res?user=1&status%5B%24gt%5D=100&status%5B%24lt%5D=600'
      }
    );
    t.end();
  });

  test('where gte & lte', (t) => {
    t.deepEqual(
      Model.find().where({ user: 1 }).where('status').gte(100).lte(600).inspect(),
      {
        method: 'GET',
        url: 'http://localhost/res?user=1&status%5B%24gte%5D=100&status%5B%24lte%5D=600'
      }
    );
    t.end();
  });

  test('count', (t) => {
    t.deepEqual(
      Model.count().where('user', 1).where('status', 100).inspect(),
      {
        method: 'GET',
        url: 'http://localhost/res/count?user=1&status=100'
      }
    );
    t.deepEqual(
      Model.count({ user: 1, status: 100 }).inspect(),
      {
        method: 'GET',
        url: 'http://localhost/res/count?user=1&status=100'
      }
    );
    t.end();
  });

  test('limit', (t) => {
    t.deepEqual(
      Model.find().limit(100).inspect(),
      { method: 'GET', url: 'http://localhost/res?_limit=100' }
    );
    t.end();
  });

  test('sort', (t) => {
    t.deepEqual(
      Model.find().sort('-createdAt').inspect(),
      { method: 'GET', url: 'http://localhost/res?_sort=-createdAt' }
    );
    t.end();
  });

  test('page', (t) => {
    t.deepEqual(
      Model.find().page(2).limit(10).sort('-createdAt').inspect(),
      {
        method: 'GET',
        url: 'http://localhost/res?_limit=10&_page=2&_sort=-createdAt'
      }
    );
    t.deepEqual(
      Model.find().page(2).inspect(),
      {
        method: 'GET',
        url: 'http://localhost/res?_page=2'
      }
    );
    t.end();
  });

  test('create', (t) => {
    t.deepEqual(
      Model.create({ title: 'my book' }).inspect(),
      {
        method: 'POST',
        url: 'http://localhost/res',
        headers: { 'Content-Type': 'application/json' },
        body: '{\"title\":\"my book\"}'
      }
    );
    t.end();
  });

  test('update by id', (t) => {
    t.deepEqual(
      Model.update(1, { title: 'my book' }).inspect(),
      {
        method: 'PATCH',
        url: 'http://localhost/res/1',
        headers: { 'Content-Type': 'application/json' },
        body: '{\"title\":\"my book\"}'
      }
    );
    t.end();
  });

  test('update by filters', (t) => {
    t.deepEqual(
      Model.update({ status: 400 }).where({ status: 300 }).limit(100).inspect(),
      {
        method: 'PATCH',
        url: 'http://localhost/res?status=300&_limit=100',
        headers: { 'Content-Type': 'application/json' },
        body: '{\"status\":400}'
      }
    );
    t.end();
  });

  test('remove by id', (t) => {
    t.deepEqual(
      Model.remove(123).inspect(),
      {
        method: 'DELETE',
        url: 'http://localhost/res/123'
      }
    );
    t.end();
  });

  test('remove by filters', (t) => {
    t.deepEqual(
      Model.remove({ status: 400 }).where({ price: { $gt: 300 } }).limit(100).inspect(),
      {
        method: 'DELETE',
        url: 'http://localhost/res?status=400&price%5B%24gt%5D=300&_limit=100'
      }
    );
    t.end();
  });

  test('remove by id & filters', (t) => {
    t.deepEqual(
      Model.remove(2).where({ price: { $gt: 300 } }).inspect(),
      {
        method: 'DELETE',
        url: 'http://localhost/res/2?price%5B%24gt%5D=300'
      }
    );
    t.end();
  });

  test('exec', (t) => {
    github('repos/maichong').findById('akita').then((res) => {
      t.equal(res.name, 'akita');
      t.end();
    }, t.end);
  });

  troot.end();
});
