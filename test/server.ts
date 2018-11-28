import stream = require('stream');
import http = require('http');
import Koa = require('koa');
import Router = require('koa-router');
import bodyParser = require('koa-bodyparser');
import { PaginateResult } from '..';
const asyncBusboy = require('async-busboy');

const router = new Router();
const app = new Koa();

require('koa-qs')(app);
app.use(bodyParser());

app.use(async (ctx, next) => {
  const FILES = {};
  // @ts-ignore
  ctx.files = FILES;
  if (!ctx.request.is('multipart/*')) return next();
  return asyncBusboy(ctx.req).then((res) => {
    const files = res.files;
    const fields = res.fields;
    files.forEach((file) => {
      let fieldname = file.fieldname;
      if (FILES[fieldname]) {
        if (Array.isArray(FILES[fieldname])) {
          FILES[fieldname].push(file);
        } else {
          FILES[fieldname] = [FILES[fieldname], file];
        }
      } else {
        FILES[fieldname] = file;
      }
    });
    ctx.request.body = fields;
    return next();
  });
});

const data = {
  users: [
    { id: 1, username: 'Jack' },
    { id: 2, username: 'Tom' }
  ],
  goods: [
    { id: 1001, title: 'iPhone' },
    { id: 1002, title: 'iMac' }
  ],
  orders: [
    { id: 1, user: 1, goods: 1 },
    { id: 2, user: 1, goods: 1 },
    { id: 3, user: 1, goods: 2 },
    { id: 4, user: 2, goods: 1 },
  ]
};

// list
router.get('/goods', (ctx) => {
  ctx.body = data.goods;
});

// paginate
router.get('/goods/paginate', (ctx) => {
  let filters = {};
  for (let key in ctx.query) {
    if (key[0] === '_') continue;
    filters[key] = ctx.query[key];
  }
  let result: PaginateResult<any> = {
    total: data.goods.length,
    page: parseInt(ctx.query._page) || 1,
    limit: parseInt(ctx.query._limit) || 1,
    totalPage: 1,
    previous: 0,
    next: 0,
    search: ctx.query._search || '',
    results: data.goods,
    filters
  };
  ctx.body = result;
});

// count
router.get('/goods/count', (ctx) => {
  ctx.body = {
    count: data.goods.length
  };
});

router.get('/goods/watch', (ctx) => {
  let s = new stream.PassThrough();
  ctx.body = s;
  ctx.type = 'json';

  s.write(JSON.stringify({ type: 'ADDED', object: data.goods[0] }) + '\n');

  setTimeout(() => {
    s.write(JSON.stringify({ type: 'MODIFIED', object: data.goods[1] }) + '\n');
    s.destroy();
  }, 1000);
});

// detail
router.get('/goods/:id', (ctx) => {
  for (let goods of data.goods) {
    if (String(goods.id) === ctx.params.id) {
      ctx.body = goods;
      return;
    }
  }
});

// remove
router.delete('/users/:user/orders/:id', (ctx) => {
  let id = parseInt(ctx.params.id);
  let order = data.orders[id - 1];
  if (!order || order.user !== parseInt(ctx.params.user)) {
    return;
  }
  ctx.body = {
    removed: 1
  };
});

// orders list
router.get('/users/:user/orders', (ctx) => {
  let user = parseInt(ctx.params.user);
  ctx.body = data.orders.filter((o) => o.user === user);
});

// action
router.post('/users/:user/orders/:id/pay', (ctx) => {
  ctx.body = {
    user: parseInt(ctx.params.user),
    order: parseInt(ctx.params.id),
    // @ts-ignore
    payment: ctx.request.body.payment
  };
});

app.use(router.routes());

app.use((ctx) => {
  ctx.body = {
    method: ctx.method,
    url: ctx.url,
    headers: ctx.headers,
    query: ctx.query,
    body: ctx.request.body,
    // @ts-ignore
    files: ctx.files
  };
});


const server = http.createServer(app.callback());

export default server;
