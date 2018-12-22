import { Readable } from 'stream';

export class Model {
  static path: string;
  static pk: string;
  static client: Client;

  static create<T>(this: { new(): T }, data: Object): Query<T>;
  static update<T>(this: { new(): T }, data?: Object): Query<T>;
  static update<T>(this: { new(): T }, id: string | number, data: any): Query<T>;
  static remove<T>(this: { new(): T }, conditions?: any | string | number): Query<number>;
  static count<T>(this: { new(): T }, conditions?: any): Query<number>;
  static paginate<T>(this: { new(): T }, conditions?: any): Query<PaginateResult<T>>;
  static find<T>(this: { new(): T }, conditions?: any): Query<T[]>;
  static findByPk<T>(this: { new(): T }, conditions: number | string): Query<T | null>;
  static findOne<T>(this: { new(): T }, conditions?: any): Query<T | null>;
  static watch<T>(this: { new(): T }, conditions?: any): Query<ChangeStream<T>>;
  static request<T>(this: { new(): T }, path: string, init?: RequestInit, query?: Query<any> | null, reducer?: Reducer<any>): Result<any>;
  static get(path: string, init?: RequestInit): Result<any>;
  static post(path: string, init?: RequestInit): Result<any>;
  static put(path: string, init?: RequestInit): Result<any>;
  static patch(path: string, init?: RequestInit): Result<any>;
  static delete(path: string, init?: RequestInit): Result<any>;

  constructor(data?: any, params?: any);
  request(path: string, init?: RequestInit, reducer?: Reducer<any>): Result<any>;
  save(init?: RequestInit): Result<void>;
  remove(init?: RequestInit): Result<void>;
}

interface Model extends HttpMixed {
}

export type ChangeType = 'ADDED' | 'MODIFIED' | 'DELETED';

export interface Change<T> {
  type: ChangeType;
  object: T;
}

export interface ChangeStream<T> {
  readonly closed: boolean;
  read(): Promise<Change<T>>;
  on(event: 'change', fn: (data: Change<T>) => void): this;
  on(event: 'error', fn: (error: Error) => void): this;
  on(event: 'close', fn: () => void): this;
  removeListener(name: string, fn: Function): this;
  removeAllListeners(name: string): this;
  cancel(): void;
}

export interface Query<R> extends Promise<R> {
  _op: string;
  _params: any;

  arg(args: any): this;
  arg(key: string, value: any): this;

  search(keyword: string): this;

  where(conditions: Object | string): this;
  where(conditions: string, value: any): this;

  eq(value: any): this;
  ne(value: any): this;

  regex(value: string): this;

  in(value: any[]): this;
  nin(value: any[]): this;

  // less than
  lt(value: any): this;
  lte(value: any): this;

  // greater than
  gt(value: any): this;
  gte(value: any): this;

  limit(size: number): this;
  page(size: number): this;
  sort(sortBy: string): this;

  exec(): Result<R>;
}

export interface HttpMixed {
  get(path: string, init?: RequestInit): Result<any>;
  post(path: string, init?: RequestInit): Result<any>;
  put(path: string, init?: RequestInit): Result<any>;
  patch(path: string, init?: RequestInit): Result<any>;
  delete(path: string, init?: RequestInit): Result<any>;
}

export interface PaginateResult<T> {
  total: number;
  page: number;
  limit: number;
  totalPage: number;
  previous: number;
  next: number;
  search: string;
  filters: any;
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

export interface Reducer<T> {
  (json: any): T;
}

export interface Result<R> extends Promise<R> {
  response(): Promise<Response>;
  stream(): Promise<Readable | ReadableStream>;
  ok(): Promise<boolean>;
  status(): Promise<number>;
  statusText(): Promise<string>;
  size(): Promise<number>;
  headers(): Promise<Headers>;
  buffer(): Promise<Buffer>;
  blob(): Promise<Blob>;
  text(): Promise<string>;
  json(): Promise<any>;
}

export interface ClientOptions {
  apiRoot?: string;
  init?: RequestInit;
  fetch?: Function;
  FormData?: typeof FormData;
}

export interface Client extends HttpMixed {
  setOptions(options: ClientOptions): void;
  create(options: ClientOptions): Client;
  resolve(key: string): Client;
  request(path: string, init?: RequestInit, query?: Query<any>, reducer?: Reducer<any>): Result<any>;
  _options: ClientOptions;
  _count: number;
  createBody(body: any): Object | FormData;
  (path: string): typeof Model;
}

declare const akita: Client;

export default akita;
