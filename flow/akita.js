/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-12-26
 * @author Liang <liang@maichong.it>
 */

declare class Akita$Query {
  where(conditions: Object|string):Akita$Query;
  where(conditions: string, value: any):Akita$Query;

  compute(type: string, value: any) :Akita$Query;

  eq(value: any):Akita$Query;
  equals(value: any):Akita$Query;

  // less than
  lt(value: any):Akita$Query;
  lte(value: any):Akita$Query;

  // greater than
  gt(value: any):Akita$Query;
  gte(value: any):Akita$Query;


  limit(size: number):Akita$Query;
  page(size: number):Akita$Query;
  sort(sortBy: string):Akita$Query;

  create(data: Object):Akita$Query;
  update(data: Object):Akita$Query;
  update(id: string|number, data: Object):Akita$Query;

  remove(conditions?: Object|string|number):Akita$Query;

  count(conditions?: Object):Akita$Query;

  find(conditions?: Object):Akita$Query;

  findOne(conditions?: Object|number|string):Akita$Query;
  findAll():Akita$Query;
}

type RequestInit = {
  method?:string,
  params?:Object,
  body?:Object,
  headers?:Object,
  mode?:string,
  credentials?:string,
};

type RequestResult={
  then(resolve?: Function, reject?: Function):Promise<Object>;
  catch(reject: Function):Promise<Object>;
  response():Promise<Object>;
};

type Client = {
  setOptions(options: Object);
  create(options: Object):Client;
  resolve(key: string):Client;
  request(path: string, RequestOption):RequestResult;
  get(path: string, init?: RequestInit):RequestResult;
  post(path: string, init?: RequestInit):RequestResult;
  put(path: string, init?: RequestInit):RequestResult;
  delete(path: string, init?: RequestInit):RequestResult;
  head(path: string, init?: RequestInit):RequestResult;
  options(path: string, init?: RequestInit):RequestResult;
  trace(path: string, init?: RequestInit):RequestResult;
  connect(path: string, init?: RequestInit):RequestResult;

  (path: string):Akita$Query;
}

declare module 'akita' {
  declare var exports: Client;
}

declare module 'akita-node' {
  declare var exports: Client;
}
