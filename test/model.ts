import test = require('tape');
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
  troot.test('watch', async (t) => {
    let query = Goods.watch();
    console.log('query', query);
    let result = query.exec();
    console.log('result', result);
    let stream = await result;
    console.log('stream', stream);
    let event = await stream.read();
    t.equal(event.type, 'ADDED');
    t.equal(event.object.id, 1);
    t.equal(event.object.title, 'iPhone');
    event = await stream.read();
    t.equal(event.type, 'MODIFIED');
    t.equal(event.object.id, 2);
    t.equal(event.object.title, 'iMac');
  });

  return;

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
    t.equal(res, 1);

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

  troot.end();
});
