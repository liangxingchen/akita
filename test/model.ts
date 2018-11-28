/* eslint no-undefined:0 */

import * as fs from 'fs';
import * as test from 'tape';
import akita, { Model } from '../src/node';

const client = akita.create({
  apiRoot: 'http://localhost:28000'
});

class Goods extends Model {
  static client = client;
  static path = '/goods';
  id: number;
  title: string;
}

class Order extends Model {
  static client = client;
  static path = '/users/:user/orders';

  pay(payment: string) {
    return this.post('pay', {
      body: {
        payment
      }
    });
  }
}

test('Model', (troot) => {
  troot.test('Goods.find()', async (t) => {
    let list = await Goods.find({ owner: 'maichong', repo: 'akita' });
    t.ok(Array.isArray(list));
    t.ok(list.length);
    list.forEach((goods) => {
      t.ok(Number.isInteger(goods.id));
      t.ok(goods.title);
    });
    t.end();
  });

  troot.test('Goods.paginate()', async (t) => {
    let res = await Goods.paginate({ owner: 'maichong', repo: 'akita' });
    t.ok(Array.isArray(res.results));
    t.ok(res.results.length);
    t.end();
  });

  troot.test('Goods.findByPk()', async (t) => {
    let goods = await Goods.findByPk(1001);
    t.equal(goods.title, 'iPhone');
    t.end();
  });

  troot.test('filters & search', async (t) => {
    let res = await Goods.paginate().where({ a: 1 });
    t.deepEqual(res.filters, { a: '1' });

    res = await Goods.paginate().where({ a: { $gt: 1 } });
    t.deepEqual(res.filters, { a: { $gt: '1' } });

    res = await Goods.paginate().where('a').gt(1).search('keyword');
    t.deepEqual(res.filters, { a: { $gt: '1' } });
    t.deepEqual(res.search, 'keyword');

    t.end();
  });

  troot.test('page & limit', async (t) => {
    let res = await Goods.paginate().where({ a: 1 }).page(2).limit(100);
    t.deepEqual(res.filters, { a: '1' });
    t.deepEqual(res.page, 2);
    t.deepEqual(res.limit, 100);

    t.end();
  });

  troot.test('remove', async (t) => {
    let res = await Order.remove(3).where('user', 1);
    t.equal(res, 1);
    res = await Order.remove(3).where('user', 2);
    t.equal(res, 0);

    let order = await Order.findOne({ user: 1 });
    res = await order.remove();
    t.equal(res, undefined);

    t.end();
  });

  troot.test('count', async (t) => {
    t.equal(await Goods.count(), 2);
    t.end();
  });

  troot.test('save', async (t) => {
    let goods = await Goods.findOne();
    goods.title = 'iPad';
    let res = await goods.save().json();
    t.equal(res.method, 'PATCH');
    t.equal(res.url, '/goods/1001');
    t.deepEqual(res.body, { id: 1001, title: 'iPad' });
    t.end();
  });

  troot.test('change record after save', async (t) => {
    let goods = await Goods.findOne();
    goods.title = 'iPad';
    let res = await goods.save();
    t.equal(res, undefined);

    t.deepEquals(goods.body, { id: 1001, title: 'iPad' });

    t.end();
  });

  troot.test('upload file when save', async (t) => {
    let goods = await Goods.findOne();
    goods.title = 'iPad';
    goods.file = fs.createReadStream(process.cwd() + '/LICENSE');
    let res = await goods.save().json();
    t.deepEqual(res.method, 'PATCH');
    t.equal(res.body.title, 'iPad');
    t.deepEqual(res.files.file.filename, 'LICENSE');
    t.end();
  });

  troot.test('actions', async (t) => {
    let order = await Order.findOne({ user: 1 });

    let res = await order.pay('alipay');
    t.deepEqual(res, { user: 1, order: 1, payment: 'alipay' });

    t.end();
  });

  troot.test('create', async (t) => {
    let item = await client('item').create({ name: 'test', title: 'hello' }).exec().json();
    t.equal(item.method, 'POST');
    t.equal(item.url, '/item');
    t.deepEqual(item.body, { name: 'test', title: 'hello' });
    t.end();
  });

  troot.test('update record', async (t) => {
    let item = await client('item').update(12, { name: 'test', title: 'hello' }).exec().json();
    t.equal(item.method, 'PATCH');
    t.equal(item.url, '/item/12');
    t.deepEqual(item.body, { name: 'test', title: 'hello' });
    t.end();
  });

  troot.test('update multi records', async (t) => {
    let item = await client('item').update({ name: 'test', title: 'hello' }).exec().json();
    t.equal(item.method, 'PATCH');
    t.equal(item.url, '/item');
    t.deepEqual(item.body, { name: 'test', title: 'hello' });
    t.end();
  });

  troot.test('status', async (t) => {
    t.equal(await Goods.find().exec().ok(), true);
    t.equal(await Goods.find().exec().status(), 200);
    t.equal(await Goods.find().exec().statusText(), 'OK');
    t.end();
  });

  troot.test('query', async (t) => {
    let item = await client('item').find({ a: '1' })
      .where({ b: '2', c: '3' })
      .where('d', '4')
      .where('e').eq('5')
      .where('f').ne('6')
      .where('g').regex('exp')
      .where('h').in(['a', 'b'])
      .where('i').nin(['c'])
      .where('j').lt('7')
      .where('k').lte('8')
      .where('l').gt('9')
      .where('m').gte('10')
      .limit(20)
      .sort('-sort')
      .arg('user', 'uid')
      .exec().json();

    t.deepEqual(item.query, {
      a: '1',
      b: '2',
      c: '3',
      d: '4',
      e: '5',
      f: { $ne: '6' },
      g: { $regex: 'exp' },
      h: { $in: ['a', 'b'] },
      i: { $nin: ['c'] },
      j: { $lt: '7' },
      k: { $lte: '8' },
      l: { $gt: '9' },
      m: { $gte: '10' },
      _limit: '20',
      _sort: '-sort',
      _user: 'uid'
    });
    t.end();
  });

  troot.test('watch', async (t) => {
    let stream = await Goods.watch();
    let event = await stream.read();
    t.equal(event.type, 'ADDED');
    t.equal(event.object.id, 1001);
    t.equal(event.object.title, 'iPhone');
    await event.object.save();
    event = await stream.read();
    t.equal(event.type, 'MODIFIED');
    t.equal(event.object.id, 1002);
    t.equal(event.object.title, 'iMac');
    t.end();
  });

  troot.test('watch event', async (t) => {
    let stream = await Goods.watch();
    stream.on('change', ({ type, object }) => {
      t.equal(type, 'ADDED');
      t.equal(object.id, 1001);
      t.equal(object.title, 'iPhone');
      stream.cancel();
      t.equal(stream.closed, true);
      t.end();
    });
  });

  troot.end();
});
