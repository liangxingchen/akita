import { IStringifyOptions } from 'qs';
import { Readable } from 'stream';
import { Agent } from 'http';
import { Agent as HttpsAgent } from 'https';

export class Model {
  static path: string;
  static pk: string;
  static client: Client;

  constructor(data?: any, params?: any);

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

  request(path: string, init?: RequestInit, reducer?: Reducer<any>): Result<any>;
  save(init?: RequestInit): Result<void>;
  remove(init?: RequestInit): Result<void>;

  // HTTP
  get(path: string, init?: RequestInit): Result<any>;
  post(path: string, init?: RequestInit): Result<any>;
  put(path: string, init?: RequestInit): Result<any>;
  patch(path: string, init?: RequestInit): Result<any>;
  delete(path: string, init?: RequestInit): Result<any>;
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

export interface PaginateResult<T> {
  limit: number;
  total: number;
  totalPage: number;
  page: number;
  previous: number;
  next: number;
  results: T[];
}

export interface RequestInit {
  // akita
  path?: string;
  query?: any;

  // fetch standard
  method?: string;
  body?: any;
  headers?: any;
  mode?: string;
  credentials?: string;
  redirect?: 'follow' | 'manual' | 'error';
  signal?: any;

  // node-fetch
  follow?: number;
  timeout?: number;
  compress?: boolean;
  size?: number;
  agent?: Agent | HttpsAgent;
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
  qsOptions?: IStringifyOptions;
}

export interface Client {
  _options: ClientOptions;
  _count: number;

  (path: string): typeof Model;
  setOptions(options: ClientOptions): void;
  create(options: ClientOptions): Client;
  resolve(key: string): Client;
  request(path: string, init?: RequestInit, query?: Query<any>, reducer?: Reducer<any>): Result<any>;
  createBody(body: any): Object | FormData;

  // HTTTP
  get(path: string, init?: RequestInit): Result<any>;
  post(path: string, init?: RequestInit): Result<any>;
  put(path: string, init?: RequestInit): Result<any>;
  patch(path: string, init?: RequestInit): Result<any>;
  delete(path: string, init?: RequestInit): Result<any>;
}

declare const akita: Client;

export default akita;
