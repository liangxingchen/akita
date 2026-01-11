/// <reference types="node"/>
/// <reference lib="dom"/>

import { IStringifyOptions } from 'qs';
import { Readable } from 'stream';
import { RequestOptions } from 'http';

/**
 * Akita HTTP Client
 *
 * 多平台 HTTP 客户端，支持 Node.js、浏览器和微信小程序
 *
 * ## 架构特点（供 AI Agent 参考）
 *
 * ### 1. Promise 风格 API
 * Request 类继承自 Promise，可直接 await 或链式调用 then/catch/finally
 * - 支持 Promise.all、Promise.race 等标准 Promise 操作
 * - 请求对象既可当 Promise 使用，也可访问元数据属性
 *
 * ### 2. 自动 JSON 解析
 * - 默认使用 JSON.parse() 解析响应体
 * - 自动检测服务器返回的 `error` 字段（值为 '0'/'null'/'none' 时忽略）
 * - 支持 Reducer 函数在解析后转换数据
 *
 * ### 3. Promise 缓存机制
 * 为避免重复解析，Request 对象内部缓存多个 Promise：
 * - `_responsePromise`: 原始 Response Promise
 * - `_textPromise`: 文本解析 Promise
 * - `_bufferPromise`: Buffer 解析 Promise
 * - `_blobPromise`: Blob 解析 Promise
 * - `_dataPromise`: JSON 解析 Promise
 * - `_jsPromise`: JsonStream 解析 Promise
 *
 * ### 4. 钩子执行顺序
 * 钩子按以下顺序执行：
 * 1. onEncode → Body 编码前（可修改 body）
 * 2. onRequest → 请求发送前（可修改 init）
 * 3. fetch() → 实际发送请求
 * 4. onResponse → 接收到响应后（可访问 res）
 * 5. onDecode → 响应体解析后（可修改 value）
 *
 * ### 5. 进度跟踪模型
 * - 每个请求：3 步（编码、发送、接收）
 * - 进度范围：0-1
 * - 完成后的请求保留 1 秒历史
 * - 支持防抖更新（5ms 间隔）
 *
 * ### 6. 平台适配策略
 * 通过依赖注入（inject）解耦平台差异：
 * - Node.js: 使用 node-fetch 和 form-data
 * - 浏览器: 使用 window.fetch 和 window.FormData
 * - 微信小程序: 使用 wx.request 和自定义 fetch polyfill
 *
 * ### 7. 错误处理层次
 * - Network Error: DNS 失败、超时、连接拒绝等（type='network'）
 * - HTTP Error: 4xx/5xx 状态码（type='http'）
 * - Parse Error: JSON/text 解析失败（type='parse'）
 * - Server Error: 服务器返回 {error:'msg'}（type='server'）
 *
 * ## 特点：
 * - Promise 风格 API
 * - 自动 JSON 解析
 * - 多种响应格式支持（JSON、文本、Buffer、流）
 * - 自动查询参数序列化
 * - 自动表单数据转换
 * - 文件上传支持
 * - 钩子系统
 * - 多客户端实例
 * - 客户端配置共享
 * - 自动 URL 拼装
 *
 * @example
 * ```typescript
 * import akita from 'akita';
 *
 * // 简单的 GET 请求
 * const users = await akita.get('/api/users');
 *
 * // 带查询参数的 GET 请求
 * const users = await akita.get('/api/users', { query: { page: 1, limit: 10 } });
 *
 * // POST 请求
 * const user = await akita.post('/api/users', { body: { name: 'John', age: 30 } });
 * ```
 *
 * @packageDocumentation
 */

/**
 * 数据处理器，对返回的数据进行预处理，用于自定义增减数据字段
 *
 * ## 执行时机
 * Reducer 在以下时机执行：
 * 1. 响应体被 JSON.parse() 解析后
 * 2. 在 onDecode 钩子之前执行
 * 3. 仅当使用 `request(path, init, reducer)` 方法时生效
 *
 * ## AI Agent 使用建议
 * - Reducer 可以用于统一数据格式转换（如 snake_case → camelCase）
 * - 可用于数据验证，抛出错误阻止请求成功
 * - 常用于提取嵌套的 data 字段
 * - 在 jsonStream 中仅作用于 `json.object`
 *
 * ## Reducer 函数在服务器响应解析为 JSON 后执行，可用于：
 * - 转换数据格式（如日期字符串转 Date 对象）
 * - 过滤或重命名字段
 * - 提取嵌套数据
 * - 数据验证
 *
 * @example
 * ```typescript
 * // 提取嵌套的 data 字段
 * const response = await client.get('/api/users', {}, (json) => json.data);
 *
 * // 转换日期格式
 * const user = await client.get('/api/user/1', {}, (json) => ({
 *   ...json,
 *   createdAt: new Date(json.createdAt)
 * }));
 *
 * // 提取并重命名字段
 * const data = await client.get('/api/data', {}, (json) => ({
 *   id: json.user_id,
 *   name: json.user_name
 * }));
 * ```
 */
export interface Reducer<T> {
  (json: any): T;
}

/**
 * JSON 数据流（NDJSON - Newline Delimited JSON）
 *
 * 用于处理服务器返回的流式 JSON 数据，每行一个 JSON 对象
 *
 * @example
 * ```typescript
 * // 使用 read() 逐行读取
 * const stream = await client.get('/api/events').jsonStream();
 * let event = await stream.read();
 * while (event) {
 *   console.log(event);
 *   event = await stream.read();
 * }
 *
 * // 使用事件监听
 * const stream = await client.get('/api/events').jsonStream();
 * stream.on('data', (event) => {
 *   console.log('Received event:', event);
 * });
 * stream.on('error', (err) => {
 *   console.error('Stream error:', err);
 * });
 * stream.on('close', () => {
 *   console.log('Stream closed');
 * });
 * ```
 *
 * @see {@link ClientOptions.onDecode} 可结合 Reducer 使用
 */
export interface JsonStream<T> {
  /**
   * 流是否已关闭
   *
   * 当流被服务器端关闭、客户端主动关闭或发生错误时，closed 为 true
   */
  readonly closed: boolean;

  /**
   * 从数据流中读取一条数据
   *
   * 如果流已关闭且无数据可用，返回 undefined
   * 如果有缓存数据，立即返回，否则等待下一条数据
   *
   * @returns Promise<T> 单条 JSON 数据，如果流已关闭则返回 undefined
   */
  read(): Promise<T>;

  /**
   * 监听数据事件
   *
   * 每当从流中解析出一条 JSON 对象时触发
   *
   * @param event - 事件名称，固定为 'data'
   * @param fn - 事件处理函数，接收解析出的 JSON 数据
   * @returns this 返回自身以支持链式调用
   *
   * @example
   * ```typescript
   * stream.on('data', (event) => {
   *   console.log('Event received:', event.type, event.object);
   * });
   * ```
   */
  on(event: 'data', fn: (data: T) => void): this;

  /**
   * 监听错误事件
   *
   * 当流解析 JSON 失败或底层流发生错误时触发
   *
   * @param event - 事件名称，固定为 'error'
   * @param fn - 错误处理函数，接收 Error 对象
   * @returns this 返回自身以支持链式调用
   *
   * @example
   * ```typescript
   * stream.on('error', (error) => {
   *   console.error('Stream error:', error.message);
   * });
   * ```
   */
  on(event: 'error', fn: (error: Error) => void): this;

  /**
   * 监听关闭事件
   *
   * 当流被关闭时触发（正常结束、错误关闭或手动关闭）
   *
   * @param event - 事件名称，固定为 'close'
   * @param fn - 关闭处理函数，无参数
   * @returns this 返回自身以支持链式调用
   *
   * @example
   * ```typescript
   * stream.on('close', () => {
   *   console.log('Stream closed');
   * });
   * ```
   */
  on(event: 'close', fn: () => void): this;

  /**
   * 移除事件的单个监听器
   *
   * @param name - 事件名称：'data' | 'error' | 'close'
   * @param fn - 要移除的监听器函数引用
   * @returns this 返回自身以支持链式调用
   *
   * @example
   * ```typescript
   * const handler = (event) => console.log(event);
   * stream.on('data', handler);
   * // ...
   * stream.removeListener('data', handler);
   * ```
   */
  removeListener(name: string, fn: Function): this;

  /**
   * 移除事件的所有监听器
   *
   * @param name - 事件名称：'data' | 'error' | 'close'
   * @returns this 返回自身以支持链式调用
   *
   * @example
   * ```typescript
   * stream.removeAllListeners('data');
   * ```
   */
  removeAllListeners(name: string): this;

  /**
   * 关闭流
   *
   * 主动关闭流，停止接收新数据
   * 关闭后不能再读取数据，也不能再添加监听器
   *
   * @example
   * ```typescript
   * // 5 秒后自动关闭流
   * setTimeout(() => stream.close(), 5000);
   * ```
   */
  close(): void;
}

/**
 * 请求参数（RequestInit）
 *
 * 这是每个请求可以配置的参数，与浏览器 Fetch API 的 RequestInit 基本兼容
 *
 * @example
 * ```typescript
 * // 基本用法
 * const response = await client.get('/api/users', {
 *   query: { page: 1, limit: 10 },
 *   headers: { 'Authorization': 'Bearer token' }
 * });
 *
 * // 完整配置
 * const response = await client.request('/api/data', {
 *   method: 'POST',
 *   query: { debug: true },
 *   body: { name: 'test' },
 *   headers: { 'Content-Type': 'application/json' },
 *   signal: abortController.signal,
 *   timeout: 5000
 * });
 * ```
 */
export interface RequestInit {
  /**
   * 请求路径
   *
   * 相对于 client.options.apiRoot 的路径
   * 如果 apiRoot 不存在，则为完整 URL
   *
   * @example
   * ```typescript
   * // 假设 apiRoot = 'https://api.example.com'
   * client.get('/users')        // https://api.example.com/users
   * client.get('users')         // https://api.example.com/users
   * client.get('users/')        // https://api.example.com/users/
   * ```
   */
  path?: string;

  /**
   * HTTP query 参数对象
   *
   * 自动使用 qs 库进行序列化，支持嵌套对象和数组
   * 可通过 client.options.qsOptions 配置序列化行为
   *
   * @example
   * ```typescript
   * // 简单查询参数
   * client.get('/users', { query: { page: 1, limit: 10 } })
   * // -> /users?page=1&limit=10
   *
   * // 嵌套对象
   * client.get('/users', { query: { filter: { name: 'John', age: 30 } } })
   * // -> /users?filter[name]=John&filter[age]=30
   *
   * // 数组
   * client.get('/users', { query: { ids: [1, 2, 3] } })
   * // -> /users?ids[0]=1&ids[1]=2&ids[2]=3
   *
   * // URL 中已有参数
   * client.get('/users?active=true', { query: { page: 1 } })
   * // -> /users?active=true&page=1
   * ```
   */
  query?: any;

  /**
   * 请求方法，默认 GET
   *
   * HTTP 方法：GET, POST, PUT, PATCH, DELETE 等
   *
   * @example
   * ```typescript
   * client.get('/users')              // GET
   * client.post('/users', { method: 'POST' })  // POST
   * client.request('/users', { method: 'PUT' }) // PUT
   * ```
   */
  method?: string;

  /**
   * 请求 Body 数据
   *
   * 根据数据类型自动转换为合适格式：
   * - File/Blob/Uint8Array/ReadableStream -> 保持原样（用于文件上传）
   * - 普通对象 + Content-Type=application/json -> JSON 字符串
   * - 普通对象 + Content-Type=application/x-www-form-urlencoded -> URL 编码字符串
   * - 包含 File 的对象 -> FormData
   *
   * @example
   * ```typescript
   * // JSON 请求（默认）
   * client.post('/users', { body: { name: 'John', age: 30 } })
   * // Content-Type: application/json
   * // Body: {"name":"John","age":30}
   *
   * // 表单提交
   * client.post('/login', {
   *   body: { username: 'admin', password: '123456' },
   *   headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
   * })
   * // Content-Type: application/x-www-form-urlencoded
   * // Body: username=admin&password=123456
   *
   * // 文件上传（自动转换为 FormData）
   * client.post('/upload', { body: { file: fileInput.files[0] } })
   *
   * // Buffer 上传
   * client.post('/upload', { body: Buffer.from('hello') })
   *
   * // 字符串上传
   * client.post('/echo', { body: 'hello world' })
   * ```
   */
  body?: any;

  /**
   * HTTP 请求 Headers
   *
   * 普通对象，键值对形式
   * 与 client.options.init.headers 合并，请求 headers 优先级更高
   *
   * @example
   * ```typescript
   * client.get('/api/data', {
   *   headers: {
   *     'Authorization': 'Bearer token123',
   *     'Accept': 'application/json',
   *     'X-Custom-Header': 'custom-value'
   *   }
   * })
   * ```
   */
  headers?: any;

  /**
   * 请求模式（浏览器 Fetch API）
   *
   * - cors: 允许跨域请求（默认）
   * - navigate: 导航请求
   * - no-cors: 不允许跨域，响应类型不透明
   * - same-origin: 同源请求
   */
  mode?: 'cors' | 'navigate' | 'no-cors' | 'same-origin';

  /**
   * 凭证模式（浏览器 Fetch API）
   *
   * - omit: 不发送 cookie（默认）
   * - include: 包含跨域 cookie
   * - same-origin: 仅同源请求包含 cookie
   */
  credentials?: 'omit' | 'include' | 'same-origin';

  /**
   * 重定向处理模式
   *
   * Node.js 专用
   * - follow: 跟随重定向（默认）
   * - manual: 手动处理重定向，可从响应头获取重定向信息
   * - error: 遇到重定向时 reject
   *
   * @default 'follow'
   * @example
   * ```typescript
   * // 手动处理重定向
   * const res = await client.get('/redirect', { redirect: 'manual' })
   *   .response();
   * const location = res.headers.get('Location');
   * ```
   */
  redirect?: 'follow' | 'manual' | 'error';

  /**
   * 请求中止信号
   *
   * Node.js 专用，用于取消正在进行的请求
   *
   * @example
   * ```typescript
   * const controller = new AbortController();
   * const timeoutId = setTimeout(() => controller.abort(), 5000);
   *
   * try {
   *   const data = await client.get('/api/slow', {
   *     signal: controller.signal
   *   });
   * } catch (error) {
   *   if (error.name === 'AbortError') {
   *     console.log('Request was aborted');
   *   }
   * } finally {
   *   clearTimeout(timeoutId);
   * }
   * ```
   */
  signal?: AbortSignal;

  /**
   * 最大重定向次数
   *
   * Node.js 专用
   * 0 表示不跟随重定向
   *
   * @default 20
   */
  follow?: number;

  /**
   * 请求超时时间（毫秒）
   *
   * Node.js 专用
   * 遇到重定向时会重置超时
   * 0 表示禁用超时（使用系统限制）
   * 推荐使用 signal 代替
   *
   * @default 0
   * @example
   * ```typescript
   * // 5 秒超时
   * await client.get('/api/data', { timeout: 5000 });
   * ```
   */
  timeout?: number;

  /**
   * 是否启用压缩
   *
   * Node.js 专用
   * 支持 gzip/deflate 内容编码
   * false 表示禁用压缩
   *
   * @default true
   */
  compress?: boolean;

  /**
   * 最大响应体大小（字节）
   *
   * Node.js 专用
   * 0 表示不限制
   *
   * @default 0
   */
  size?: number;

  /**
   * HTTP Agent
   *
   * Node.js 专用
   * 用于连接池管理、Keep-Alive 等
   *
   * @example
   * ```typescript
   * import http from 'http';
   *
   * const agent = new http.Agent({ keepAlive: true });
   * await client.get('/api/data', { agent });
   *
   * // 动态返回 agent
   * await client.get('/api/data', {
   *   agent: (url) => {
   *     if (url.protocol === 'https:') {
   *       return new https.Agent({ keepAlive: true });
   *     }
   *     return new http.Agent({ keepAlive: true });
   *   }
   * });
   * ```
   */
  agent?: RequestOptions['agent'] | ((parsedUrl: URL) => RequestOptions['agent']);
}

/**
 * Request 请求类
 *
 * Request 类继承自 Promise，既可以像 Promise 一样使用，
 * 也可以访问丰富的元数据和方法获取不同格式的响应
 *
 * @example
 * ```typescript
 * // 作为 Promise 使用（自动 JSON 解析）
 * const users = await client.get('/api/users');
 *
 * // 访问元数据
 * const request = client.get('/api/users');
 * console.log(request.url);       // 完整 URL
 * console.log(request.init);      // 请求配置
 *
 * // 等待完成后访问响应
 * await request;
 * console.log(request.res);       // Response 对象
 * console.log(request.raw);       // 原始响应文本
 * console.log(request.value);     // 解析后的数据
 *
 * // 获取不同格式的响应
 * const text = await client.get('/api/text').text();
 * const buffer = await client.get('/api/image').buffer();
 * const blob = await client.get('/api/file').blob();
 * const stream = await client.get('/api/stream').stream();
 * const jsonStream = await client.get('/api/events').jsonStream();
 * ```
 */
export interface Request<R> extends Promise<R> {
  /**
   * 内部使用：请求步骤计数（用于进度计算）
   * @internal
   */
  _steps: number;

  /**
   * 内部使用：请求结束时间戳
   * @internal
   */
  _endAt?: number;

  /**
   * 请求所属的 Client 实例
   */
  client: Client;

  /**
   * 请求的完整 URL 地址
   *
   * 包含 apiRoot 和查询参数的完整 URL
   *
   * @example
   * ```typescript
   * const request = client.get('/users', { query: { page: 1 } });
   * console.log(request.url);
   * // 假设 apiRoot = 'https://api.example.com'
   * // 输出: https://api.example.com/users?page=1
   * ```
   */
  url: string;

  /**
   * 请求的 fetch init 参数
   *
   * 包含合并后的请求配置（client.options.init + 请求级配置）
   *
   * @example
   * ```typescript
   * const request = client.get('/users', { query: { page: 1 } });
   * console.log(request.init);
   * // { method: 'GET', query: { page: 1 }, ... }
   * ```
   */
  init: RequestInit;

  /**
   * 返回的 Response 对象
   *
   * 在请求完成后可用，包含标准 Fetch API Response 对象
   *
   * @example
   * ```typescript
   * const request = client.get('/users');
   * await request;
   * console.log(request.res?.status);        // 200
   * console.log(request.res?.headers);       // Headers 对象
   * console.log(request.res?.ok);           // true
   * ```
   */
  res?: Response;

  /**
   * 返回的原始字符串结果
   *
   * 在调用 text() 或 data() 方法后可用
   *
   * @example
   * ```typescript
   * const request = client.get('/users');
   * await request.text();
   * console.log(request.raw);
   * // [{"id":1,"name":"John"},...]
   * ```
   */
  raw?: string;

  /**
   * 返回的解析过的 JS 对象结果
   *
   * 在调用 data() 方法后可用，经过 onDecode 钩子处理
   *
   * @example
   * ```typescript
   * const request = client.get('/users');
   * await request;
   * console.log(request.value);
   * // [{id: 1, name: "John"}, ...]
   * ```
   */
  value?: R;

  /**
   * 获取请求的返回数据，自动调用 JSON 解码
   *
   * .data() 调用可省略，直接 await request 即可
   * 返回值会经过 onDecode 钩子和 Reducer 处理
   *
   * @returns Promise<R> 解析后的 JSON 数据
   *
   * @example
   * ```typescript
   * // 方式 1：直接 await（推荐）
   * const users = await client.get('/api/users');
   *
   * // 方式 2：显式调用 data()
   * const users = await client.get('/api/users').data();
   *
   * // 使用 Reducer
   * const users = await client.get('/api/users', {}, (json) => json.data);
   * ```
   */
  data(): Promise<R>;

  /**
   * 获取返回的原始字符串
   *
   * 不进行 JSON 解析，直接返回响应文本
   *
   * @returns Promise<string> 响应文本
   *
   * @example
   * ```typescript
   * const html = await client.get('/page').text();
   * console.log(html);  // <!DOCTYPE html>...
   * ```
   */
  text(): Promise<string>;

  /**
   * 获取返回的原始 Buffer 数据
   *
   * 适用于下载二进制文件（图片、PDF 等）
   *
   * @returns Promise<Buffer> Buffer 对象
   *
   * @example
   * ```typescript
   * const buffer = await client.get('/image.png').buffer();
   * fs.writeFileSync('image.png', buffer);
   * ```
   */
  buffer(): Promise<Buffer>;

  /**
   * 获取返回的原始 Blob 数据
   *
   * 浏览器端可用，类似于 buffer()
   *
   * @returns Promise<Blob> Blob 对象
   *
   * @example
   * ```typescript
   * const blob = await client.get('/image.png').blob();
   * const imageUrl = URL.createObjectURL(blob);
   * document.getElementById('img').src = imageUrl;
   * ```
   */
  blob(): Promise<Blob>;

  /**
   * 获取返回的数据流
   *
   * Node.js 返回 Readable，浏览器返回 ReadableStream
   * 微信小程序不支持（会抛出错误）
   *
   * @returns Promise<Readable | ReadableStream> 流对象
   *
   * @example
   * ```typescript
   * const stream = await client.get('/large-file.zip').stream();
   * stream.pipe(fs.createWriteStream('file.zip'));
   * ```
   */
  stream(): Promise<Readable | ReadableStream>;

  /**
   * 获取返回的 JSON 数据流
   *
   * 服务端应返回每行一个 JSON 对象（NDJSON 格式）
   * 返回 JsonStream 对象，支持逐行读取或事件监听
   *
   * @template T JSON 数据类型
   * @returns Promise<JsonStream<T>> JsonStream 对象
   *
   * @example
   * ```typescript
   * // 使用 read() 逐行读取
   * const stream = await client.get('/api/events').jsonStream();
   let event = await stream.read();
   while (event) {
   *   console.log(event);
   *   event = await stream.read();
   * }
   *
   * // 使用事件监听
   * const stream = await client.get('/api/events').jsonStream();
   * stream.on('data', (event) => {
   *   console.log('Received:', event);
   * });
   * stream.on('close', () => console.log('Done'));
   *
   * // 使用 Reducer 转换数据
   * const stream = await client.get('/api/events').jsonStream<User>();
   * // Reducer 可以在 onDecode 中配置
   * ```
   */
  jsonStream<T = R>(): Promise<JsonStream<T>>;

  /**
   * 获取返回的原始 Response 对象
   *
   * 标准 Fetch API Response 对象
   *
   * @returns Promise<Response> Response 对象
   *
   * @example
   * ```typescript
   * const response = await client.get('/api/users').response();
   * console.log(response.status);         // 200
   * console.log(response.statusText);      // 'OK'
   * console.log(response.headers.get('Content-Type'));
   * console.log(response.ok);            // true
   * ```
   */
  response(): Promise<Response>;

  /**
   * 判断请求是否成功
   *
   * 基于 HTTP 状态码：200-299 为成功
   *
   * @returns Promise<boolean> 是否成功
   *
   * @example
   * ```typescript
   * const ok = await client.get('/api/users').ok();
   * if (ok) {
   *   console.log('Request succeeded');
   * }
   * ```
   */
  ok(): Promise<boolean>;

  /**
   * 获取请求的状态码
   *
   * HTTP 状态码：200, 404, 500 等
   *
   * @returns Promise<number> 状态码
   *
   * @example
   * ```typescript
   * const status = await client.get('/api/users').status();
   * if (status === 200) {
   *   console.log('OK');
   * } else if (status === 404) {
   *   console.log('Not Found');
   * }
   * ```
   */
  status(): Promise<number>;

  /**
   * 获取请求的状态文本
   *
   * HTTP 状态文本：'OK', 'Not Found', 'Internal Server Error' 等
   *
   * @returns Promise<string> 状态文本
   *
   * @example
   * ```typescript
   * const statusText = await client.get('/api/users').statusText();
   * console.log(statusText);  // 'OK'
   * ```
   */
  statusText(): Promise<string>;

  /**
   * 获取返回的数据大小（字节）
   *
   * 通过解析 Content-Length 头获取
   * 如果响应头没有 Content-Length，返回 0
   *
   * @returns Promise<number> 数据大小（字节）
   *
   * @example
   * ```typescript
   * const size = await client.get('/file.pdf').size();
   * console.log(`File size: ${size} bytes`);
   * ```
   */
  size(): Promise<number>;

  /**
   * 获取返回的响应 Headers
   *
   * 标准 Fetch API Headers 对象
   *
   * @returns Promise<Headers> Headers 对象
   *
   * @example
   * ```typescript
   * const headers = await client.get('/api/users').headers();
   * console.log(headers.get('Content-Type'));
   * console.log(headers.get('Content-Length'));
   * console.log(headers.get('Cache-Control'));
   * ```
   */
  headers(): Promise<Headers>;
}

/**
 * 请求钩子函数
 *
 * 用于在请求生命周期的特定节点执行自定义逻辑
 * 支持同步和异步钩子
 *
 * @param request - Request 对象，可以修改其属性
 *
 * @example
 * ```typescript
 * // 同步钩子
 * const syncHook: RequestHook = (request) => {
 *   console.log('Request to:', request.url);
 *   request.init.headers['X-Timestamp'] = Date.now();
 * };
 *
 * // 异步钩子
 * const asyncHook: RequestHook = async (request) => {
 *   const token = await getToken();
 *   request.init.headers['Authorization'] = `Bearer ${token}`;
 * };
 *
 * client.on('request', asyncHook);
 * ```
 */
export interface RequestHook {
  (request: Request<any>): void | Promise<void>;
}

/**
 * 进度钩子函数
 *
 * 用于监听客户端整体请求进度
 *
 * @param progress - 进度值，范围 0-1
 *
 * @example
 * ```typescript
 * const progressHook: ProgressHook = (progress) => {
 *   console.log(`Progress: ${(progress * 100).toFixed(1)}%`);
 * };
 *
 * client.on('progress', progressHook);
 * // Progress: 33.3%
 * // Progress: 66.7%
 * // Progress: 100.0%
 * ```
 */
export interface ProgressHook {
  (progress: number): void;
}

/**
 * 客户端配置（ClientOptions）
 *
 * 创建 Client 实例时可配置的选项
 * 这些选项会被所有请求继承
 *
 * @example
 * ```typescript
 * import akita from 'akita';
 *
 * const client = akita.create({
 *   apiRoot: 'https://api.example.com',
 *   init: {
 *     headers: {
 *       'Authorization': 'Bearer token',
 *       'Accept': 'application/json'
 *     }
 *   },
 *   onProgress: (progress) => {
 *     console.log(`Progress: ${(progress * 100).toFixed(1)}%`);
 *   }
 * });
 * ```
 */
export interface ClientOptions {
  /**
   * 请求的基础 URL
   *
   * 所有请求路径会自动拼接到 apiRoot 后面
   * 自动处理路径分隔符，确保不会出现双斜杠或缺少斜杠
   *
   * @example
   * ```typescript
   * const client = akita.create({
   *   apiRoot: 'https://api.example.com/v1'
   * });
   *
   * client.get('/users')  // https://api.example.com/v1/users
   * client.get('users')   // https://api.example.com/v1/users
   * ```
   */
  apiRoot?: string;

  /**
   * fetch() 函数默认参数
   *
   * 这些参数会与每个请求的参数合并
   * 请求级参数优先级更高
   *
   * @example
   * ```typescript
   * const client = akita.create({
   *   init: {
   *     headers: {
   *       'Authorization': 'Bearer token',
   *       'Accept': 'application/json'
   *     },
   *     timeout: 10000,
   *     compress: true
   *   }
   * });
   *
   * // 所有请求都会带上这些配置
   * // 但可以在单个请求中覆盖
   * client.get('/users', { timeout: 5000 });  // 覆盖 timeout
   * ```
   */
  init?: RequestInit;

  /**
   * fetch 函数引用
   *
   * 默认自动识别环境：
   * - 浏览器：window.fetch
   * - Node.js：需要手动注入或使用 node.ts 入口
   * - 微信小程序：使用自定义 fetch.ts
   *
   * @example
   * ```typescript
   * import fetch from 'node-fetch';
   *
   * const client = akita.create({
   *   fetch
   * });
   * ```
   */
  fetch?: Function;

  /**
   * FormData 类引用
   *
   * 用于文件上传和表单数据
   * 默认自动识别环境
   *
   * @example
   * ```typescript
   * import FormData from 'form-data';
   *
   * const client = akita.create({
   *   FormData
   * });
   * ```
   */
  FormData?: typeof FormData;

  /**
   * qs 配置
   *
   * 用于序列化 query 参数
   * 详见 qs 库文档：https://github.com/ljharb/qs
   *
   * @example
   * ```typescript
   * const client = akita.create({
   *   qsOptions: {
   *     arrayFormat: 'indices',  // 添加数组索引
   *     encode: false,          // 不编码
   *     skipNulls: true         // 跳过 null 值
   *   }
   * });
   *
   * client.get('/api', { query: { ids: [1, 2, 3], name: null } });
   * // -> /api?ids[0]=1&ids[1]=2&ids[2]=3
   * ```
   */
  qsOptions?: IStringifyOptions<boolean>;

  /**
   * 请求前对 Body 进行编码的前置钩子
   *
   * 在 Body 被编码为 JSON/FormData 之前执行
   * 可用于修改或验证 Body 数据
   *
   * @example
   * ```typescript
   * const client = akita.create({
   *   onEncode: async (request) => {
   *     // 添加时间戳
   *     if (request.init.body) {
   *       request.init.body.timestamp = Date.now();
   *     }
   *   }
   * });
   * ```
   */
  onEncode?: RequestHook | RequestHook[];

  /**
   * 请求前钩子
   *
   * 在请求发送前执行，可以修改请求配置
   * 支持多个钩子，按顺序执行
   *
   * @example
   * ```typescript
   * const client = akita.create({
   *   onRequest: [
   *     async (request) => {
   *       // 自动添加认证 token
   *       const token = await getToken();
   *       request.init.headers['Authorization'] = `Bearer ${token}`;
   *     },
   *     (request) => {
   *       // 添加请求 ID
   *       request.init.headers['X-Request-ID'] = generateId();
   *     }
   *   ]
   * });
   * ```
   */
  onRequest?: RequestHook | RequestHook[];

  /**
   * 请求响应后钩子
   *
   * 在接收到响应后、解析响应体之前执行
   * 可用于处理错误响应、日志记录等
   *
   * @example
   * ```typescript
   * const client = akita.create({
   *   onResponse: async (request) => {
   *     console.log(`${request.init.method} ${request.url} -> ${request.res?.status}`);
   *
   *     // 处理特定状态码
   *     if (request.res?.status === 401) {
   *       console.log('Token expired, redirecting to login');
   *       window.location.href = '/login';
   *     }
   *   }
   * });
   * ```
   */
  onResponse?: RequestHook | RequestHook[];

  /**
   * 请求响应后对 Body 进行解码的前置钩子
   *
   * 在响应文本解析为 JSON 之后、返回数据之前执行
   * 可用于数据转换、字段重命名等
   *
   * @example
   * ```typescript
   * const client = akita.create({
   *   onDecode: async (request) => {
   *     // 转换日期字段
   *     if (request.value?.createdAt) {
   *       request.value.createdAt = new Date(request.value.createdAt);
   *     }
   *
   *     // 提取嵌套数据
   *     if (request.value?.data) {
   *       request.value = request.value.data;
   *     }
   *   }
   * });
   * ```
   */
  onDecode?: RequestHook | RequestHook[];

  /**
   * 请求进度通知钩子
   *
   * 监听客户端所有请求的总体进度
   * 进度值范围 0-1，基于请求步骤计算（编码、发送、接收）
   *
   * @example
   * ```typescript
   * const client = akita.create({
   *   onProgress: (progress) => {
   *     console.log(`Overall progress: ${(progress * 100).toFixed(1)}%`);
   *   }
   * });
   *
   * // 并发多个请求
   * Promise.all([
   *   client.get('/api/1'),
   *   client.get('/api/2'),
   *   client.get('/api/3')
   * ]);
   * // Progress: 33.3%
   * // Progress: 66.7%
   * // Progress: 100.0%
   * ```
   */
  onProgress?: ProgressHook | ProgressHook[];
}

/**
 * Client 客户端接口
 *
 * HTTP 客户端实例，提供请求方法和配置管理
 *
 * @example
 * ```typescript
 * import akita from 'akita';
 *
 * // 使用默认客户端
 * const users = await akita.get('/api/users');
 *
 * // 创建新客户端
 * const client = akita.create({
 *   apiRoot: 'https://api.example.com',
 *   init: { headers: { 'Authorization': 'Bearer token' } }
 * });
 *
 * // 解析共享客户端
 * const sharedClient = akita.resolve('api');
 * sharedClient.get('/users');
 * sharedClient.get('/users');  // 使用同一个实例
 * ```
 */
export interface Client {
  /**
   * 内部使用：已发送请求数量
   * @internal
   */
  _count: number;

  /**
   * 内部使用：请求进度
   * @internal
   */
  _progress: number;

  /**
   * 内部使用：活跃请求列表
   * @internal
   */
  _tasks: Request<any>[];

  /**
   * 内部使用：进度更新函数
   * @internal
   */
  _updateProgress: () => void;

  /**
   * 内部使用：进度更新定时器
   * @internal
   */
  _updateProgressTimer?: any;

  /**
   * 客户端配置（只读）
   *
   * 通过 setOptions() 方法修改
   *
   * @example
   * ```typescript
   * const client = akita.create({ apiRoot: 'https://api.example.com' });
   * console.log(client.options.apiRoot);  // 'https://api.example.com'
   * ```
   */
  readonly options: ClientOptions;

  /**
   * 请求进度（只读）
   *
   * 范围 0-1，表示所有活跃请求的总体进度
   * 仅在配置了 onProgress 时可用
   *
   * @example
   * ```typescript
   * const client = akita.create({ onProgress: console.log });
   * console.log(client.progress);  // 0.5
   * ```
   */
  readonly progress?: number;

  /**
   * 创建新的客户端实例
   *
   * 新实例继承当前客户端的配置，但配置是独立的
   *
   * @param options - 客户端配置选项
   * @returns 新的 Client 实例
   *
   * @example
   * ```typescript
   * // 基础客户端
   * const baseClient = akita.create({
   *   apiRoot: 'https://api.example.com',
   *   init: { headers: { 'Accept': 'application/json' } }
   * });
   *
   * // 创建带认证的客户端
   * const authClient = baseClient.create({
   *   init: { headers: { 'Authorization': 'Bearer token' } }
   * });
   *
   * // 两个客户端配置独立
   * console.log(baseClient.options.init.headers);  // { Accept: 'application/json' }
   * console.log(authClient.options.init.headers);  // { Accept: 'application/json', Authorization: 'Bearer token' }
   * ```
   */
  create(options: ClientOptions): Client;

  /**
   * 找回一个已经被初始化的客户端实例
   *
   * 如果不存在指定 key 的实例，将创建一个新的
   * 方便多个模块共享同一个客户端实例
   *
   * @param key - 实例的唯一标识符
   * @returns Client 实例
   *
   * @example
   * ```typescript
   * // 在 user.js 中
   * import akita from 'akita';
   * const client = akita.resolve('api');
   * client.setOptions({ apiRoot: 'https://api.example.com' });
   *
   * // 在 product.js 中，获取同一个实例
   * import akita from 'akita';
   * const client = akita.resolve('api');
   * // 共享配置，已经设置了 apiRoot
   *
   * // 在 order.js 中，再次获取
   * import akita from 'akita';
   * const client = akita.resolve('api');
   * // 还是同一个实例
   * ```
   */
  resolve(key: string): Client;

  /**
   * 设置客户端配置
   *
   * 新配置会被合并到现有配置中
   * 不会覆盖整个 options 对象
   *
   * @param options - 要添加或更新的配置
   *
   * @example
   * ```typescript
   * const client = akita.create({
   *   apiRoot: 'https://api.example.com',
   *   init: { headers: { 'Accept': 'application/json' } }
   * });
   *
   * // 添加新配置（合并）
   * client.setOptions({
   *   init: { headers: { 'Authorization': 'Bearer token' } }
   * });
   *
   * // headers 会合并
   * console.log(client.options.init.headers);
   * // { Accept: 'application/json', Authorization: 'Bearer token' }
   * ```
   */
  setOptions(options: ClientOptions): void;

  /**
   * 获取 FormData 类引用
   *
   * 按优先级返回：
   * 1. client.options.FormData
   * 2. window.FormData（浏览器）
   * 3. global.FormData（Node.js）
   *
   * @returns FormData 类构造函数
   *
   * @example
   * ```typescript
   * const FormData = client.getFormDataClass();
   * const form = new FormData();
   * form.append('file', fileInput.files[0]);
   * ```
   */
  getFormDataClass(): any;

  /**
   * 对 body 数据进行编码
   *
   * 根据数据类型自动转换：
   * - File/Blob/Uint8Array/ReadableStream -> 保持原样
   * - 包含 File 的对象 -> FormData
   * - 普通对象 -> 保持原样（后续会根据 Content-Type 编码）
   *
   * @param body - 要编码的 body 数据
   * @returns 编码后的数据（FormData 或原对象）
   *
   * @example
   * ```typescript
   * // 自动检测文件并创建 FormData
   * const body = { name: 'test', file: fileInput.files[0] };
   * const encoded = client.createBody(body);
   * // encoded 是 FormData 实例
   *
   * // 普通对象保持不变
   * const body = { name: 'test', age: 30 };
   * const encoded = client.createBody(body);
   * // encoded 是 { name: 'test', age: 30 }
   * ```
   */
  createBody(body: any): any | FormData;

  /**
   * 发起一个请求
   *
   * 通用请求方法，支持所有 HTTP 方法和自定义配置
   *
   * @template T 响应数据类型
   * @param path - 请求路径（相对于 apiRoot）
   * @param init - 请求配置
   * @param reducer - 数据处理器
   * @returns Request<T> Request 对象
   *
   * @example
   * ```typescript
   * // 基本 GET
   * const users = await client.request('/users');
   *
   * // 自定义方法
   * const data = await client.request('/data', { method: 'HEAD' });
   *
   * // 使用 Reducer
   * const users = await client.request('/users', {}, (json) => json.data);
   *
   * // 完整配置
   * const data = await client.request('/api/search', {
   *   method: 'POST',
   *   query: { q: 'javascript' },
   *   body: { filters: { type: 'post' } },
   *   headers: { 'X-Custom': 'value' }
   * });
   * ```
   */
  request<T = any>(path: string, init?: RequestInit, reducer?: Reducer<T>): Request<T>;

  /**
   * 发起一个 GET 请求
   *
   * @template T 响应数据类型
   * @param path - 请求路径
   * @param init - 请求配置
   * @returns Request<T> Request 对象
   *
   * @example
   * ```typescript
   * // 简单 GET
   * const users = await client.get('/users');
   *
   * // 带查询参数
   * const users = await client.get('/users', {
   *   query: { page: 1, limit: 10 }
   * });
   *
   * // 带类型
   * interface User { id: number; name: string; }
   * const users = await client.get<User[]>('/users');
   * ```
   */
  get<T = any>(path: string, init?: RequestInit): Request<T>;

  /**
   * 发起一个 POST 请求
   *
   * @template T 响应数据类型
   * @param path - 请求路径
   * @param init - 请求配置，通常包含 body
   * @returns Request<T> Request 对象
   *
   * @example
   * ```typescript
   * // 创建用户
   * const user = await client.post('/users', {
   *   body: { name: 'John', email: 'john@example.com' }
   * });
   *
   * // 上传文件
   * const result = await client.post('/upload', {
   *   body: { file: fileInput.files[0] }
   * });
   * ```
   */
  post<T = any>(path: string, init?: RequestInit): Request<T>;

  /**
   * 发起一个 PUT 请求
   *
   * @template T 响应数据类型
   * @param path - 请求路径
   * @param init - 请求配置，通常包含 body
   * @returns Request<T> Request 对象
   *
   * @example
   * ```typescript
   * // 更新用户
   * const user = await client.put('/users/1', {
   *   body: { name: 'John Doe', email: 'john.doe@example.com' }
   * });
   * ```
   */
  put<T = any>(path: string, init?: RequestInit): Request<T>;

  /**
   * 发起一个 PATCH 请求
   *
   * @template T 响应数据类型
   * @param path - 请求路径
   * @param init - 请求配置，通常包含 body
   * @returns Request<T> Request 对象
   *
   * @example
   * ```typescript
   * // 部分更新用户
   * const user = await client.patch('/users/1', {
   *   body: { name: 'John Doe' }
   * });
   * ```
   */
  patch<T = any>(path: string, init?: RequestInit): Request<T>;

  /**
   * 发起一个 DELETE 请求
   *
   * @param path - 请求路径
   * @param init - 请求配置
   * @returns Request<null> 返回 null
   *
   * @example
   * ```typescript
   * // 删除用户
   * await client.delete('/users/1');
   *
   * // 带查询参数
   * await client.delete('/users', { query: { ids: '1,2,3' } });
   * ```
   */
  delete(path: string, init?: RequestInit): Request<null>;

  /**
   * 监听事件
   *
   * 支持的事件：
   * - encode: Body 编码前
   * - request: 请求发送前
   * - response: 接收到响应后
   * - decode: 响应体解析后
   * - progress: 请求进度更新
   *
   * @param event - 事件名称
   * @param hook - 钩子函数
   * @returns this 返回自身以支持链式调用
   *
   * @example
   * ```typescript
   * // 监听请求事件
   * client.on('request', (req) => {
   *   console.log('Sending request to:', req.url);
   * });
   *
   * // 监听响应事件
   * client.on('response', (req) => {
   *   console.log('Response status:', req.res?.status);
   * });
   *
   * // 监听进度事件
   * client.on('progress', (progress) => {
   *   console.log(`Progress: ${(progress * 100).toFixed(1)}%`);
   * });
   *
   * // 链式调用
   * client
   *   .on('request', logRequest)
   *   .on('response', logResponse);
   * ```
   */
  on(event: 'encode' | 'request' | 'response' | 'decode', hook: RequestHook): Client;
  on(event: 'progress', hook: ProgressHook): Client;

  /**
   * 取消监听事件
   *
   * 移除之前通过 on() 添加的钩子
   *
   * @param event - 事件名称
   * @param hook - 要移除的钩子函数引用
   * @returns this 返回自身以支持链式调用
   *
   * @example
   * ```typescript
   * const hook = (req) => console.log(req.url);
   * client.on('request', hook);
   *
   * // ...
   *
   * client.off('request', hook);
   * ```
   */
  off(event: 'encode' | 'request' | 'response' | 'decode', hook: RequestHook): Client;
  off(event: 'progress', hook: ProgressHook): Client;
}

/**
 * 默认 Client 实例
 *
 * 直接使用这个实例进行请求
 *
 * @example
 * ```typescript
 * import akita from 'akita';
 *
 * // 使用默认实例
 * const users = await akita.get('/api/users');
 *
 * // 配置默认实例
 * akita.setOptions({
 *   apiRoot: 'https://api.example.com',
 *   init: { headers: { 'Authorization': 'Bearer token' } }
 * });
 * ```
 */
declare const akita: Client;

/**
 * 错误类型
 */
export type ErrorType = 'network' | 'http' | 'parse' | 'server';

/**
 * 网络错误子类型
 */
export type NetworkErrorType =
  | 'dns_failed'
  | 'timeout'
  | 'cors'
  | 'offline'
  | 'connection_refused'
  | 'connection_reset'
  | 'network_unreachable'
  | 'unknown';

/**
 * Akita 统一错误类
 *
 * 封装所有 HTTP 请求错误，提供结构化的错误信息和类型守卫
 *
 * ## 错误类型（type 字段）
 * - 'network': 网络层错误（DNS 失败、超时、连接拒绝等）
 * - 'http': HTTP 状态码错误（4xx/5xx）
 * - 'parse': JSON/text 解析失败
 * - 'server': 应用层错误（响应体包含 error 字段）
 *
 * ## 使用示例
 * ```typescript
 * try {
 *   await client.get('/api/data');
 * } catch (error) {
 *   if (isNetworkError(error)) {
 *     console.log('Network failed:', error.networkType); // 'timeout', 'dns_failed', etc.
 *   } else if (isHTTPError(error)) {
 *     console.log('HTTP error:', error.status, error.statusText);
 *   } else if (isServerError(error)) {
 *     console.log('Server error:', error.code, error.message);
 *   } else if (isParseError(error)) {
 *     console.log('Parse error:', error.cause);
 *   }
 * }
 * ```
 */
export class AkitaError extends Error {
  /**
   * 固定值 AkitaError
   */
  name: 'AkitaError';

  /**
   * 错误类型
   *
   * - 'network': 网络层错误（DNS 失败、超时、连接拒绝等）
   * - 'http': HTTP 状态码错误（4xx/5xx）
   * - 'parse': JSON/text 解析失败
   * - 'server': 应用层错误（响应体包含 error 字段）
   *
   * @example
   * ```typescript
   * try {
   *   await client.get('/api/data');
   * } catch (error) {
   *   console.log(error.type); // 'network', 'http', 'parse', or 'server'
   * }
   * ```
   */
  type: ErrorType;

  /**
   * 错误代码
   *
   * 具体的错误标识符，用于错误识别和处理
   *
   * 常见错误代码：
   * - Network Error: 'NETWORK_TIMEOUT', 'DNS_FAILED', 'CONNECTION_REFUSED', 'NETWORK_UNREACHABLE'
   * - HTTP Error: 'HTTP_400', 'HTTP_401', 'HTTP_403', 'HTTP_404', 'HTTP_500', etc.
   * - Parse Error: 'PARSE_JSON_ERROR', 'PARSE_TEXT_ERROR'
   * - Server Error: 服务器返回的 code 字段值
   *
   * @example
   * ```typescript
   * try {
   *   await client.get('/api/data');
   * } catch (error) {
   *   console.log(error.code); // 'HTTP_404', 'NETWORK_TIMEOUT', etc.
   * }
   * ```
   */
  code: string;

  /**
   * 网络错误子类型
   *
   * 仅当 type='network' 时可用
   *
   * 可能的值：
   * - 'dns_failed': DNS 解析失败
   * - 'timeout': 请求超时
   * - 'cors': CORS 跨域错误
   * - 'offline': 离线
   * - 'connection_refused': 连接被拒绝
   * - 'connection_reset': 连接重置
   * - 'network_unreachable': 网络不可达
   * - 'unknown': 未知网络错误
   *
   * @example
   * ```typescript
   * try {
   *   await client.get('/api/data');
   * } catch (error) {
   *   if (error.type === 'network') {
   *     console.log('Network issue:', error.networkType);
   *   }
   * }
   * ```
   */
  networkType?: NetworkErrorType;

  /**
   * HTTP 状态码
   *
   * 仅当 type='http' 时可用
   *
   * 常见状态码：
   * - 400: Bad Request
   * - 401: Unauthorized
   * - 403: Forbidden
   * - 404: Not Found
   * - 500: Internal Server Error
   *
   * @example
   * ```typescript
   * try {
   *   await client.get('/api/data');
   * } catch (error) {
   *   if (error.type === 'http') {
   *     console.log(`Status: ${error.status}`);
   *   }
   * }
   * ```
   */
  status?: number;

  /**
   * HTTP 状态文本
   *
   * 仅当 type='http' 时可用
   *
   * 常见状态文本：
   * - 'Bad Request', 'Unauthorized', 'Forbidden', 'Not Found'
   * - 'Internal Server Error', 'Service Unavailable'
   *
   * @example
   * ```typescript
   * try {
   *   await client.get('/api/data');
   * } catch (error) {
   *   if (error.type === 'http') {
   *     console.log(`${error.status} ${error.statusText}`);
   *   }
   * }
   * ```
   */
  statusText?: string;

  /**
   * HTTP 请求方法
   *
   * 发生错误时使用的 HTTP 方法
   *
   * 可能的值：'GET', 'POST', 'PUT', 'PATCH', 'DELETE', 等
   *
   * @example
   * ```typescript
   * try {
   *   await client.post('/api/data', { body: { name: 'test' } });
   * } catch (error) {
   *   console.log(`Failed to ${error.method} ${error.url}`);
   * }
   * ```
   */
  method?: string;

  /**
   * 请求 URL
   *
   * 发生错误时请求的完整 URL（包含 apiRoot 和查询参数）
   *
   * @example
   * ```typescript
   * try {
   *   await client.get('/api/users');
   * } catch (error) {
   *   console.log(`Failed to fetch: ${error.url}`);
   * }
   * ```
   */
  url?: string;

  /**
   * 原始错误对象
   *
   * 仅当 type='parse' 时可用，包含底层的解析错误
   *
   * @example
   * ```typescript
   * try {
   *   await client.get('/api/data');
   * } catch (error) {
   *   if (error.type === 'parse') {
   *     console.log('Parse failed:', error.cause);
   *   }
   * }
   * ```
   */
  cause?: Error;

  /**
   * 错误发生的时间戳
   *
   * Unix 时间戳（毫秒）
   *
   * @example
   * ```typescript
   * try {
   *   await client.get('/api/data');
   * } catch (error) {
   *   console.log(`Error at ${new Date(error.timestamp).toISOString()}`);
   * }
   * ```
   */
  timestamp?: number;

  constructor(
    message: string,
    type: ErrorType,
    code: string,
    options?: {
      networkType?: NetworkErrorType;
      status?: number;
      statusText?: string;
      url?: string;
      method?: string;
      cause?: Error;
      timestamp?: number;
    }
  );
}

/**
 * 类型守卫：判断错误是否为 AkitaError 实例
 *
 * 使用 TypeScript 类型守卫功能，在运行时检查错误是否为 AkitaError
 * 如果返回 true，TypeScript 会将 error 类型收窄为 AkitaError
 *
 * @param error - 待检查的错误对象
 * @returns 是否为 AkitaError 实例
 *
 * @example
 * ```typescript
 * try {
 *   await client.get('/api/data');
 * } catch (error) {
 *   if (isAkitaError(error)) {
 *     // error 现在的类型是 AkitaError
 *     console.log(error.type, error.code);
 *   } else {
 *     // 普通 Error 或其他类型
 *     console.log('Unknown error:', error);
 *   }
 * }
 * ```
 */
export function isAkitaError(error: any): error is AkitaError;

/**
 * 类型守卫：判断错误是否为网络错误（type='network'）
 *
 * 检查错误是否为 AkitaError 且 type='network'
 * 包括 DNS 失败、超时、连接拒绝等网络层问题
 *
 * @param error - 待检查的错误对象
 * @returns 是否为网络错误
 *
 * @example
 * ```typescript
 * try {
 *   await client.get('/api/data');
 * } catch (error) {
 *   if (isNetworkError(error)) {
 *     // 处理网络错误
 *     console.log('Network issue:', error.networkType);
 *     switch (error.networkType) {
 *       case 'timeout':
 *         showToast('请求超时，请重试');
 *         break;
 *       case 'offline':
 *         showToast('网络未连接');
 *         break;
 *       case 'dns_failed':
 *         showToast('DNS 解析失败');
 *         break;
 *       default:
 *         showToast('网络错误');
 *     }
 *   }
 * }
 * ```
 */
export function isNetworkError(error: any): error is AkitaError;

/**
 * 类型守卫：判断错误是否为 HTTP 错误（type='http'）
 *
 * 检查错误是否为 AkitaError 且 type='http'
 * 服务器返回了 4xx 或 5xx 状态码
 *
 * @param error - 待检查的错误对象
 * @returns 是否为 HTTP 错误
 *
 * @example
 * ```typescript
 * try {
 *   await client.get('/api/data');
 * } catch (error) {
 *   if (isHTTPError(error)) {
 *     // 处理 HTTP 错误
 *     if (error.status === 401) {
 *       // 未授权，跳转登录
 *       window.location.href = '/login';
 *     } else if (error.status === 404) {
 *       showToast('资源不存在');
 *     } else if (error.status >= 500) {
 *       showToast('服务器错误');
 *     }
 *   }
 * }
 * ```
 */
export function isHTTPError(error: any): error is AkitaError;

/**
 * 类型守卫：判断错误是否为解析错误（type='parse'）
 *
 * 检查错误是否为 AkitaError 且 type='parse'
 * JSON 或文本解析失败
 *
 * @param error - 待检查的错误对象
 * @returns 是否为解析错误
 *
 * @example
 * ```typescript
 * try {
 *   await client.get('/api/data');
 * } catch (error) {
 *   if (isParseError(error)) {
 *     // 处理解析错误
 *     console.error('Failed to parse response:', error.cause);
 *     showToast('数据格式错误');
 *   }
 * }
 * ```
 */
export function isParseError(error: any): error is AkitaError;

/**
 * 类型守卫：判断错误是否为服务器错误（type='server'）
 *
 * 检查错误是否为 AkitaError 且 type='server'
 * 服务器返回的响应体包含 error 字段（值非 '0'/'null'/'none'）
 *
 * @param error - 待检查的错误对象
 * @returns 是否为服务器错误
 *
 * @example
 * ```typescript
 * try {
 *   await client.get('/api/data');
 * } catch (error) {
 *   if (isServerError(error)) {
 *     // 处理服务器业务逻辑错误
 *     console.log('Server error code:', error.code);
 *     console.log('Server error message:', error.message);
 *     showToast(error.message || '操作失败');
 *   }
 * }
 * ```
 */
export function isServerError(error: any): error is AkitaError;

export default akita;
