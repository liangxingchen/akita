import 'babel-polyfill';
import test from 'tape';
import akita, { Model } from '../src/node';

const client = akita.create({
  apiRoot: 'https://api.github.com'
});

const httpbin = akita.create({
  apiRoot: 'https://httpbin.org/'
});

class Branch extends Model {
  static client = client;
  static path = '/repos/:owner/:repo/branches';
  static pk = 'name';

  getProtection() {
    return this.get('protection', null, true);
  }
}

class AnyThing extends Model {
  static client = httpbin;
  static path = '/anything';
}

test('Model', (troot) => {
  troot.test('Branch.find()', async (t) => {
    t.deepEqual(
      Branch.find({ owner: 'maichong', repo: 'akita' }).inspect(),
      { method: 'GET', url: 'https://api.github.com/repos/maichong/akita/branches' }
    );
    t.end();
  });

  troot.test('Branch.findById()', async (t) => {
    let branch = await Branch.findById('master')
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
