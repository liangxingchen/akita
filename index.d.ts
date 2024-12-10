/// <reference types="node"/>
/// <reference lib="dom"/>

import { IStringifyOptions } from 'qs';
import { Readable } from 'stream';
import { RequestOptions } from 'http';

/**
 * 数据处理器，对返回的数据进行预处理，用于自定义增减数据字段
 */
export interface Reducer<T> {
  (json: any): T;
}

/**
 * JSON数据流
 */
export interface JsonStream<T> {
  /**
   * 流是否已关闭
   */
  readonly closed: boolean;
  /**
   * 从数据流中读取一条数据
   */
  read(): Promise<T>;
  /**
   * 监听数据事件
   */
  on(event: 'data', fn: (data: T) => void): this;
  /**
   * 监听错误事件
   */
  on(event: 'error', fn: (error: Error) => void): this;
  /**
   * 监听关闭事件
   */
  on(event: 'close', fn: () => void): this;
  /**
   * 移除时间的单个监听器
   */
  removeListener(name: string, fn: Function): this;
  /**
   * 移除事件的所有监听器
   */
  removeAllListeners(name: string): this;
  /**
   * 关闭流
   */
  close(): void;
}

/**
 * 请求参数
 */
export interface RequestInit {
  /**
   * 请求路径
   */
  path?: string;
  /**
   * HTTP query参数对象
   */
  query?: any;
  /**
   * 请求方法，默认 GET
   */
  method?: string;
  /**
   * 请求Body数据
   */
  body?: any;
  /**
   * HTTP 请求 Headers
   */
  headers?: any;
  mode?: 'cors' | 'navigate' | 'no-cors' | 'same-origin';
  credentials?: 'omit' | 'include' | 'same-origin';
  /**
   * NodeJs only. set to `manual` to extract redirect headers, `error` to reject redirect
   * @default follow
   */
  redirect?: 'follow' | 'manual' | 'error';
  /**
   * NodeJs only. pass an instance of AbortSignal to optionally abort requests
   */
  signal?: AbortSignal;
  /**
   * NodeJs only. maximum redirect count. 0 to not follow redirect
   * @default 20
   */
  follow?: number;
  /**
   * NodeJs only. req/res timeout in ms, it resets on redirect. 0 to disable (OS limit applies). Signal is recommended instead.
   * @default 0
   */
  timeout?: number;
  /**
   * NodeJs only. support gzip/deflate content encoding. false to disable
   * @default true
   */
  compress?: boolean;
  /**
   * NodeJs only. maximum response body size in bytes. 0 to disable
   * @default 0
   */
  size?: number;
  /**
   * NodeJs only. http(s).Agent instance or function that returns an instance
   */
  agent?: RequestOptions['agent'] | ((parsedUrl: URL) => RequestOptions['agent']);
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
  value?: R;
  /**
   * 获取请求的返回数据，自动调用JSON解码
   * .data() 调用可省略，比如 let res = await client.get('/api');
   */
  data(): Promise<R>;
  /**
   * 获取返回的原始字符串
   */
  text(): Promise<string>;
  /**
   * 获取返回的原始Buffer数据
   */
  buffer(): Promise<Buffer>;
  /**
   * 获取返回的原始Blob数据，浏览器端可用，类似于 buffer()
   */
  blob(): Promise<Blob>;
  /**
   * 获取返回的数据流
   */
  stream(): Promise<Readable | ReadableStream>;
  /**
   * 获取返回的JSON数据流，服务端返回数据应为每行一个JSON对象
   */
  jsonStream<T = R>(): Promise<JsonStream<T>>;
  /**
   * 获取返回的原始Response对象
   */
  response(): Promise<Response>;
  /**
   * 判断请求是否成功
   */
  ok(): Promise<boolean>;
  /**
   * 获取请求的状态码
   */
  status(): Promise<number>;
  /**
   * 获取请求的状态文本
   */
  statusText(): Promise<string>;
  /**
   * 获取返回的数据大小，通过解析 Content-Length
   */
  size(): Promise<number>;
  /**
   * 获取返回的响应Headers
   */
  headers(): Promise<Headers>;
}

export interface RequestHook {
  (request: Request<any>): void | Promise<void>;
}

export interface ProgressHook {
  (progress: number): void;
}

/**
 * 客户端配置
 */
export interface ClientOptions {
  /**
   * 请求的基础URL
   */
  apiRoot?: string;
  /**
   * fetch() 函数默认参数
   */
  init?: RequestInit;
  /**
   * fetch 函数引用，默认自动识别
   */
  fetch?: Function;
  /**
   * FormData类引用，默认自动识别
   */
  FormData?: typeof FormData;
  /**
   * qs 配置，用于序列化 query 参数
   */
  qsOptions?: IStringifyOptions<boolean>;
  /**
   * 请求前对Body进行编码的前置钩子
   */
  onEncode?: RequestHook | RequestHook[];
  /**
   * 请求前钩子
   */
  onRequest?: RequestHook | RequestHook[];
  /**
   * 请求响应后钩子
   */
  onResponse?: RequestHook | RequestHook[];
  /**
   * 请求响应后对Body进行解码的前置钩子
   */
  onDecode?: RequestHook | RequestHook[];
  /**
   * 请求进度通知钩子
   */
  onProgress?: ProgressHook | ProgressHook[];
}

export interface Client {
  _count: number;
  _progress: number;
  _tasks: Request<any>[];
  _updateProgress: () => void;
  _updateProgressTimer?: any;

  /**
   * 客户端配置
   */
  readonly options: ClientOptions;
  /**
   * 请求进度，0-1
   */
  readonly progress?: number;

  /**
   * 创建新的客户端实例
   */
  create(options: ClientOptions): Client;
  /**
   * 找回一个已经被初始化的客户端实例，如果不存在将会创建一个新的
   * 方便多个模块共享一个客户端实例
   */
  resolve(key: string): Client;
  /**
   * 设置客户端配置，新配置会被合并到 client.options 中
   */
  setOptions(options: ClientOptions): void;
  /**
   * 获取FormData类引用
   */
  getFormDataClass(): any;
  /**
   * 对body数据进行编码
   */
  createBody(body: any): any | FormData;

  /**
   * 发起一个请求
   */
  request<T = any>(path: string, init?: RequestInit, reducer?: Reducer<T>): Request<T>;
  /**
   * 发起一个GET请求
   */
  get<T = any>(path: string, init?: RequestInit): Request<T>;
  /**
   * 发起一个POST请求
   */
  post<T = any>(path: string, init?: RequestInit): Request<T>;
  /**
   * 发起一个PUT请求
   */
  put<T = any>(path: string, init?: RequestInit): Request<T>;
  /**
   * 发起一个PATCH请求
   */
  patch<T = any>(path: string, init?: RequestInit): Request<T>;
  /**
   * 发起一个DELETE请求
   */
  delete(path: string, init?: RequestInit): Request<null>;

  /**
   * 监听事件
   */
  on(event: 'encode' | 'request' | 'response' | 'decode', hook: RequestHook): Client;
  on(event: 'progress', hook: ProgressHook): Client;

  /**
   * 取消监听事件
   */
  off(event: 'encode' | 'request' | 'response' | 'decode', hook: RequestHook): Client;
  off(event: 'progress', hook: ProgressHook): Client;
}

declare const akita: Client;

export default akita;
