/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-12-26
 * @author Liang <liang@maichong.it>
 */

declare class Query {
  where(conditions: Object|string):Query;
  where(conditions: string, value: any):Query;

  compute(type: string, value: any) :Query;

  eq(value: any):Query;
  equals(value: any):Query;

  // less than
  lt(value: any):Query;
  lte(value: any):Query;

  // greater than
  gt(value: any):Query;
  gte(value: any):Query;


  limit(size: number):Query;
  page(size: number):Query;
  sort(sortBy: string):Query;

  create(data: Object):Query;
  update(data: Object):Query;
  update(id: string|number, data: Object):Query;

  remove(conditions?: Object|string|number):Query;

  count(conditions?: Object):Query;

  find(conditions?: Object):Query;

  findOne(conditions?: Object|number|string):Query;
  findAll():Query;
}

type RequestOption = {
  method?:string,
  params?:Object,
  body?:Object,
  headers?:Object,
};

declare class Client {
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

  (path: string):Query;
}

declare module 'akita' {
  declare var exports: Client;
}
