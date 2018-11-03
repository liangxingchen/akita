import test = require('tape');
import akita, { Model } from '../src/node';

const client = akita.create({
  apiRoot: 'http://localhost:28000'
});

class Goods extends Model {
  static client = client;
  static path = '/goods';
  static pk = 'name';
}

class Order extends Model {
  static client = client;
  static path = '/users/:user/order';
}

test('Model', (troot) => {
  troot.test('Goods.find()', async (t) => {
    let list = await Goods.find({ owner: 'maichong', repo: 'akita' });
    t.ok(Array.isArray(list));
    t.ok(list.length);
    list.forEach((goods) => {
      t.ok(Number.isInteger(goods.id));
      t.ok(goods.title);
    })
    t.end();
  });

  troot.test('Branch.findByPk()', async (t) => {
    let branch = await Branch.findByPk('master')
      .where({ owner: 'maichong', repo: 'akita' });
    t.equal(branch.name, 'master');
    t.end();
  });

  troot.test('record action', async (t) => {
    let branch = new Branch({ owner: 'maichong', repo: 'akita', name: 'master' });
    t.deepEqual(
      branch.getProtection(),
      {
        method: 'GET',
        url: 'https://api.github.com/repos/maichong/akita/branches/master/protection'
      }
    );
    t.end();
  });

  troot.test('remove record', async (t) => {
    let item = new AnyThing({
      id: 'abc'
    });

    t.equal(await item.remove(), undefined, 'remove() return void');

    t.deepEqual(AnyThing.client.latest, {
      method: 'DELETE',
      url: 'https://httpbin.org/anything/abc'
    });

    t.end();
  });

  troot.test('save record', async (t) => {
    let item = new AnyThing({
      id: 'test'
    });

    t.equal(await item.save(), undefined, 'save() return void');

    t.deepEqual(AnyThing.client.latest, {
      method: 'PATCH',
      url: 'https://httpbin.org/anything/test',
      headers: { 'Content-Type': 'application/json' },
      body: '{"id":"test"}'
    });

    t.end();
  });

  troot.test('create record', async (t) => {
    let item = await AnyThing.create({ title: 'test' });

    t.ok(item instanceof AnyThing, 'item instanceof AnyThing');

    t.deepEqual(AnyThing.client.latest, {
      method: 'POST',
      url: 'https://httpbin.org/anything',
      headers: { 'Content-Type': 'application/json' },
      body: '{"title":"test"}'
    });

    t.end();
  });

  troot.end();
});
