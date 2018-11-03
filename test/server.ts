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
  if (ctx.method !== 'POST') return next();
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
  ctx.body = data.users;
});

// paginate
router.get('/goods/paginate', (ctx) => {
  let result: PaginateResult<any> = {
    total: data.goods.length,
    page: parseInt(ctx.query._page) || 1,
    limit: parseInt(ctx.query._limit) || 1,
    totalPage: 1,
    previous: 0,
    next: 0,
    search: '',
    results: data.goods
  };
  ctx.body = result;
});

// remove
router.delete('/users/:user/orders/:id', (ctx) => {

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
