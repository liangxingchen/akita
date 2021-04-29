/* eslint spaced-comment:0 */

/// <reference types="node"/>
/// <reference lib="dom"/>

import { IStringifyOptions } from 'qs';
import { Readable } from 'stream';
import { Agent } from 'http';
import { Agent as HttpsAgent } from 'https';

export class Model {
  static path: string;
  static pk: string;
  static client: Client;

  constructor(data?: any, params?: any);

  static create<T>(this: { new (): T }, data: any): Query<T>;
  static update<T>(this: { new (): T }, data?: any): Query<T>;
  static update<T>(this: { new (): T }, id: string | number, data: any): Query<T>;
  static remove<T>(this: { new (): T }, conditions?: any | string | number): Query<number>;
  static count<T>(this: { new (): T }, conditions?: any): Query<number>;
  static paginate<T>(this: { new (): T }, conditions?: any): Query<PaginateResult<T>>;
  static find<T>(this: { new (): T }, conditions?: any): Query<T[]>;
  static findByPk<T>(this: { new (): T }, conditions: number | string): Query<T | null>;
  static findOne<T>(this: { new (): T }, conditions?: any): Query<T | null>;
  static watch<T>(this: { new (): T }, conditions?: any): Query<ChangeStream<T>>;
  static request<T>(
    this: { new (): T },
    path: string,
    init?: RequestInit,
    query?: Query<any> | null,
    reducer?: Reducer<any>
  ): Request<any>;
  static get(path: string, init?: RequestInit): Request<any>;
  static post(path: string, init?: RequestInit): Request<any>;
  static put(path: string, init?: RequestInit): Request<any>;
  static patch(path: string, init?: RequestInit): Request<any>;
  static delete(path: string, init?: RequestInit): Request<any>;

  request(path: string, init?: RequestInit, reducer?: Reducer<any>): Request<any>;
  save(init?: RequestInit): Request<void>;
  remove(init?: RequestInit): Request<void>;

  // HTTP
  get(path: string, init?: RequestInit): Request<any>;
  post(path: string, init?: RequestInit): Request<any>;
  put(path: string, init?: RequestInit): Request<any>;
  patch(path: string, init?: RequestInit): Request<any>;
  delete(path: string, init?: RequestInit): Request<any>;
}

export type ChangeType = 'ADDED' | 'MODIFIED' | 'DELETED';

export interface Change<T> {
  type: ChangeType;
  object: T;
}

export interface ChangeStream<T> extends JsonStream<Change<T>> {}

export interface JsonStream<T> {
  readonly closed: boolean;
  read(): Promise<T>;
  on(event: 'data', fn: (data: T) => void): this;
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

  where(conditions: any | string): this;
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

  exec(): Request<R>;
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

/**
 * Request 请求类
 */
export interface Request<R> extends Promise<R> {
  _steps: number;
  _endAt?: number;

  /**
   * 请求所属Client
   */
  client: Client;
  /**
   * 请求的完整URL地址
   */
  url: string;
  /**
   * 请求的fetch init参数
   */
  init: RequestInit;
  /**
   * 返回的 Response 对象
   */
  res?: Response;
  /**
   * 返回的原始字符串结果
   */
  raw?: string;
  /**
   * 返回的解析过的JS对象结果
   * 在调用 .data() 方法时可由 onDecode 钩子通过raw解析得来
   */
  value?: any;

  response(): Promise<Response>;
  stream(): Promise<Readable | ReadableStream>;
  jsonStream<T = any>(): Promise<JsonStream<T>>;
  ok(): Promise<boolean>;
  status(): Promise<number>;
  statusText(): Promise<string>;
  size(): Promise<number>;
  headers(): Promise<Headers>;
  buffer(): Promise<Buffer>;
  blob(): Promise<Blob>;
  text(): Promise<string>;
  data(): Promise<any>;
}

export interface RequestHook {
  (request: Request<any>): void | Promise<void>;
}

export interface ProgressHook {
  (progress: number): void;
}

export interface ClientOptions {
  apiRoot?: string;
  init?: RequestInit;
  fetch?: Function;
  FormData?: typeof FormData;
  qsOptions?: IStringifyOptions;
  onEncode?: RequestHook | RequestHook[];
  onRequest?: RequestHook | RequestHook[];
  onResponse?: RequestHook | RequestHook[];
  onDecode?: RequestHook | RequestHook[];
  onProgress?: ProgressHook | ProgressHook[];
}

export interface Client {
  _options: ClientOptions;
  _count: number;
  _progress: number;
  _tasks: Request<any>[];
  _updateProgress: () => void;
  _updateProgressTimer?: any;
  progress?: number;

  (path: string): typeof Model;
  setOptions(options: ClientOptions): void;
  create(options: ClientOptions): Client;
  resolve(key: string): Client;
  request(path: string, init?: RequestInit, query?: Query<any>, reducer?: Reducer<any>): Request<any>;
  getFormDataClass(): any;
  createBody(body: any): any | FormData;

  // HTTTP
  get(path: string, init?: RequestInit): Request<any>;
  post(path: string, init?: RequestInit): Request<any>;
  put(path: string, init?: RequestInit): Request<any>;
  patch(path: string, init?: RequestInit): Request<any>;
  delete(path: string, init?: RequestInit): Request<any>;

  on(event: 'encode' | 'request' | 'response' | 'decode', hook: RequestHook): Client;
  on(event: 'progress', hook: ProgressHook): Client;

  off(event: 'encode' | 'request' | 'response' | 'decode', hook: RequestHook): Client;
  off(event: 'progress', hook: ProgressHook): Client;
}

declare const akita: Client;

export default akita;
