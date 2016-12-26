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

declare class Client {
  setOptions(options: Object);
  create(options: Object):Client;
  get(apiName: string, params?: Object, header?: Object, options?: Object);
  post(apiName: string, data?: Object, header?: Object, options?: Object);
  put(apiName: string, data?: Object, header?: Object, options?: Object);
  delete(apiName: string, data?: Object, header?: Object, options?: Object);
  head(apiName: string, data?: Object, header?: Object, options?: Object);
  options(apiName: string, data?: Object, header?: Object, options?: Object);
  trace(apiName: string, data?: Object, header?: Object, options?: Object);
  connect(apiName: string, data?: Object, header?: Object, options?: Object);

  (path: string):Query;
}

declare module 'akita' {
  declare var exports: Client;
}
