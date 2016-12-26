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

type RequestOption = {
  method?:string,
  params?:Object,
  body?:Object,
  headers?:Object,
};

type Client = {
  setOptions(options: Object);
  create(options: Object):Client;
  request(path: string, RequestOption);
  get(path: string, options?: RequestOption);
  post(path: string, options?: RequestOption);
  put(path: string, options?: RequestOption);
  delete(path: string, options?: RequestOption);
  head(path: string, options?: RequestOption);
  options(path: string, options?: RequestOption);
  trace(path: string, options?: RequestOption);
  connect(path: string, options?: RequestOption);

  (path: string):AkitaQuery;
}

declare module 'akita' {
  declare var exports: Client;
}
