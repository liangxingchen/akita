/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-12-26
 * @author Liang <liang@maichong.it>
 */

declare class AkitaQuery {
  where(conditions: Object|string):AkitaQuery;
  where(conditions: string, value: any):AkitaQuery;

  compute(type: string, value: any) :AkitaQuery;

  eq(value: any):AkitaQuery;
  equals(value: any):AkitaQuery;

  // less than
  lt(value: any):AkitaQuery;
  lte(value: any):AkitaQuery;

  // greater than
  gt(value: any):AkitaQuery;
  gte(value: any):AkitaQuery;


  limit(size: number):AkitaQuery;
  page(size: number):AkitaQuery;
  sort(sortBy: string):AkitaQuery;

  create(data: Object):AkitaQuery;
  update(data: Object):AkitaQuery;
  update(id: string|number, data: Object):AkitaQuery;

  remove(conditions?: Object|string|number):AkitaQuery;

  count(conditions?: Object):AkitaQuery;

  find(conditions?: Object):AkitaQuery;

  findOne(conditions?: Object|number|string):AkitaQuery;
  findAll():AkitaQuery;
}

type RequestInit = {
  method?:string,
  params?:Object,
  body?:Object,
  headers?:Object,
  mode?:string,
  credentials?:string,
};

type Client = {
  setOptions(options: Object);
  create(options: Object):Client;
  resolve(key: string):Client;
  request(path: string, RequestOption);
  get(path: string, init?: RequestInit);
  post(path: string, init?: RequestInit);
  put(path: string, init?: RequestInit);
  delete(path: string, init?: RequestInit);
  head(path: string, init?: RequestInit);
  options(path: string, init?: RequestInit);
  trace(path: string, init?: RequestInit);
  connect(path: string, init?: RequestInit);

  (path: string):AkitaQuery;
}

declare module 'akita' {
  declare var exports: Client;
}
