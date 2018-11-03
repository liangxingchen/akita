
export class Model {
  static path: string;
  static pk: string;
  static client: Client;

  static create<T>(this: { new(): T }, data: Object): Query<T>;
  static update<T>(this: { new(): T }, data?: Object): Query<T>;
  static update<T>(this: { new(): T }, id: string | number, data: any): Query<T>;
  static remove<T>(this: { new(): T }, conditions?: any | string | number): Query<void>;
  static count<T>(this: { new(): T }, conditions?: any): Query<number>;
  static paginate<T>(this: { new(): T }, conditions?: any): Query<PaginateResult<T>>;
  static find<T>(this: { new(): T }, conditions?: any): Query<T[]>;
  static findByPk<T>(this: { new(): T }, conditions: number | string): Query<T | null>;
  static findOne<T>(this: { new(): T }, conditions?: any): Query<T | null>;
  static request<T>(this: { new(): T }, path: string, init?: RequestInit, query?: Query<any> | null): Response<any>;
  static get(path: string, init?: RequestInit): Response<any>;
  static post(path: string, init?: RequestInit): Response<any>;
  static upload(path: string, init?: RequestInit): Response<any>;
  static put(path: string, init?: RequestInit): Response<any>;
  static patch(path: string, init?: RequestInit): Response<any>;
  static delete(path: string, init?: RequestInit): Response<any>;

  constructor(data?: any, params?: any);
  request(path: string, init?: RequestInit): Response<any>;
  save(): Response<void>;
  remove(init?: RequestInit): Response<void>;
}

interface Model extends HttpMixed {
}

export interface Query<R> extends PromiseLike<R> {
  _op: string;
  _params: any;

  arg(args: any): this;
  arg(key: string, value: any): this;

  search(keyword: string): this;

  where(conditions: Object | string): this;
  where(conditions: string, value: any): this;

  eq(value: any): this;

  // less than
  lt(value: any): this;
  lte(value: any): this;

  // greater than
  gt(value: any): this;
  gte(value: any): this;

  limit(size: number): this;
  page(size: number): this;
  sort(sortBy: string): this;
}

export interface HttpMixed {
  get(path: string, init?: RequestInit): Response<any>;
  post(path: string, init?: RequestInit): Response<any>;
  upload(path: string, init?: RequestInit): Response<any>;
  put(path: string, init?: RequestInit): Response<any>;
  patch(path: string, init?: RequestInit): Response<any>;
  delete(path: string, init?: RequestInit): Response<any>;
}

export interface PaginateResult<T> {
  total: number;
  page: number;
  limit: number;
  totalPage: number;
  previous: number;
  next: number;
  search: string;
  results: T[];
}

export interface RequestInit {
  path?: string;
  method?: string;
  query?: any;
  body?: any;
  headers?: any;
  mode?: string;
  credentials?: string;
}

export interface Response<R> extends PromiseLike<R> {
  response(): Promise<Object>;
  stream(): Promise<NodeJS.ReadableStream>;
  ok(): Promise<boolean>;
  status(): Promise<number>;
  statusText(): Promise<string>;
  size(): Promise<number>;
  headers(): Promise<Headers>;
  buffer(): Promise<Buffer>;
  blob(): Promise<Blob>;
  text(): Promise<String>;
  json(): Promise<any>;
}

export interface ClientOptions {
  apiRoot?: string;
  init?: RequestInit;
  fetch?: Function;
  FormData?: typeof FormData;
}

export interface Client extends HttpMixed {
  setOptions(options: any): void;
  create(options: any): Client;
  resolve(key: string): Client;
  request(path: string, init?: RequestInit, query?: Query<any>): Response<any>;
  _options: ClientOptions;
  _count: number;
  (path: string): typeof Model;
}

declare var akita: Client;

export default akita;
