/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-12-26
 * @author Liang <liang@maichong.it>
 */

declare class Akita$Query {
  param(key: Object):Akita$Query;
  param(key: string, value: any):Akita$Query;

  search(keyword: string):Akita$Query;

  where(conditions: Object|string):Akita$Query;
  where(conditions: string, value: any):Akita$Query;

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
  update(data?: Object):Akita$Query;
  update(id: string|number, data: Object):Akita$Query;
  remove(conditions?: Object|string|number):Akita$Query;
  count(conditions?: Object):Akita$Query;
  find(conditions?: Object):Akita$Query;
  findById(conditions: number|string):Akita$Query;
  findOne(conditions?: Object):Akita$Query;
  findAll(conditions?: Object):Akita$Query;
  inspect():Object;

  then(resolve?: Function, reject?: Function):Promise<Object>;
  catch(reject: Function):Promise<Object>;
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

type Akita$Client = {
  setOptions(options: Object):void;
  create(options: Object):Akita$Client;
  resolve(key: string):Akita$Client;
  request(path: string, RequestInit):RequestResult;
  get(path: string, init?: RequestInit):RequestResult;
  post(path: string, init?: RequestInit):RequestResult;
  upload(path: string, init?: RequestInit):RequestResult;
  put(path: string, init?: RequestInit):RequestResult;
  patch(path: string, init?: RequestInit):RequestResult;
  delete(path: string, init?: RequestInit):RequestResult;
  head(path: string, init?: RequestInit):RequestResult;
  options(path: string, init?: RequestInit):RequestResult;
  trace(path: string, init?: RequestInit):RequestResult;
  connect(path: string, init?: RequestInit):RequestResult;

  (path: string):Akita$Query;
}

declare module 'akita' {
  declare var exports: Akita$Client;
}

declare module 'akita-node' {
  declare var exports: Akita$Client;
}
