# Akita HTTP Client

简洁易用的多平台 HTTP 客户端，支持 Node.js、浏览器和微信小程序，基于 Fetch API 实现。

## 特点

- **Promise 接口风格** - 现代 async/await 语法
- **自动 JSON 解析** - 直接获取解析后的数据 `users = await client.get('/api/users')`
- **多种响应格式** - 支持 JSON、文本、Buffer、Blob、Stream、JsonStream、SSEStream
- **流式数据处理** - 支持 NDJSON (JsonStream) 和 SSE (Server-Sent Events) 实时流
- **自动查询参数序列化** - 使用 qs 库处理复杂对象和数组
- **自动表单数据转换** - 智能识别并转换为 FormData
- **自动文件上传** - 检测到文件/Blob/Uint8Array 时自动处理
- **强大的钩子系统** - 4 个生命周期钩子 + 进度钩子
- **自动错误识别** - 检测服务器返回的 `{error:'错误信息',code:'错误码'}`
- **多客户端实例** - 支持创建独立的客户端实例
- **客户端配置共享** - 通过 `resolve()` 在多个模块间共享配置
- **自动 URL 拼装** - 智能处理 apiRoot 和路径的拼接

## 安装

```bash
npm install akita
# 或
yarn add akita
```

## 快速开始

### 基本用法

```typescript
import akita from 'akita';

// GET 请求
const users = await akita.get('/api/users');
console.log(users);

// POST 请求
const user = await akita.post('/api/users', {
  body: { name: 'John', age: 30 }
});

// PUT 请求
await akita.put('/api/users/1', {
  body: { name: 'John Doe', email: 'john.doe@example.com' }
});

// PATCH 请求
await akita.patch('/api/users/1', {
  body: { name: 'Updated Name' }
});

// DELETE 请求
await akita.delete('/api/users/1');
```

### 配置基础 URL

```typescript
const client = akita.create({
  apiRoot: 'https://api.example.com/v1'
});

// 所有请求自动使用 apiRoot
const users = await client.get('/users');
// 发送到: https://api.example.com/v1/users

const user = await client.get('users');
// 发送到: https://api.example.com/v1/users (自动处理斜杠)
```

### 带查询参数

```typescript
// 简单查询参数
const users = await akita.get('/users', {
  query: { page: 1, limit: 10 }
});
// -> /users?page=1&limit=10

// 嵌套对象
const users = await akita.get('/users', {
  query: { filter: { name: 'John', age: 30 } }
});
// -> /users?filter[name]=John&filter[age]=30

// 数组
const users = await akita.get('/users', {
  query: { ids: [1, 2, 3] }
});
// -> /users?ids[0]=1&ids[1]=2&ids[2]=3

// URL 中已有参数
const users = await akita.get('/users?active=true', {
  query: { page: 1 }
});
// -> /users?active=true&page=1
```

### 自定义 Headers

```typescript
const data = await akita.get('/api/data', {
  headers: {
    'Authorization': 'Bearer token123',
    'Accept': 'application/json',
    'X-Custom-Header': 'custom-value'
  }
});
```

### 全局 Headers 配置

```typescript
const client = akita.create({
  init: {
    headers: {
      'Authorization': 'Bearer token',
      'Accept': 'application/json'
    }
  }
});

// 所有请求自动带上这些 headers
const users = await client.get('/users');
```

### 设置请求超时

```typescript
// 使用 AbortSignal (推荐)
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000);

try {
  const data = await client.get('/api/slow', {
    signal: controller.signal
  });
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Request timeout');
  }
} finally {
  clearTimeout(timeoutId);
}

// 或使用 timeout 参数 (Node.js)
const data = await client.get('/api/data', {
  timeout: 5000
});
```

## 响应处理

### 获取不同格式的响应

```typescript
// JSON 数据 (默认)
const users = await akita.get('/api/users');
console.log(users); // [{ id: 1, name: 'John' }, ...]

// 原始文本
const html = await akita.get('/page').text();
console.log(html); // <!DOCTYPE html>...

// Buffer 数据 (适合二进制文件)
const buffer = await akita.get('/image.png').buffer();
import fs from 'fs';
fs.writeFileSync('image.png', buffer);

// Blob 数据 (浏览器端)
const blob = await akita.get('/file.pdf').blob();
const url = URL.createObjectURL(blob);
window.open(url);

// 流数据
const stream = await akita.get('/large-file.zip').stream();
stream.pipe(fs.createWriteStream('file.zip'));

// 响应对象
const response = await akita.get('/api/users').response();
console.log(response.status);          // 200
console.log(response.statusText);       // 'OK'
console.log(response.ok);             // true
console.log(response.headers.get('Content-Type'));

// 获取元数据
const status = await akita.get('/users').status();
const ok = await akita.get('/users').ok();
const headers = await akita.get('/users').headers();
const size = await akita.get('/users').size();
```

### 使用 Reducer 转换数据

```typescript
// 提取嵌套的 data 字段
const users = await akita.get('/api/users', {}, (json) => json.data);

// 转换日期格式
const user = await akita.get('/api/user/1', {}, (json) => ({
  ...json,
  createdAt: new Date(json.createdAt),
  updatedAt: new Date(json.updatedAt)
}));

// 提取并重命名字段
const data = await akita.get('/api/data', {}, (json) => ({
  userId: json.user_id,
  userName: json.user_name,
  userAge: json.user_age
}));

// 数组转换
const userIds = await akita.get('/api/users', {}, (json) =>
  json.map((user: any) => user.id)
);

// 数据验证
const validated = await akita.get('/api/user/1', {}, (json) => {
  if (!json.name) {
    throw new Error('Invalid user: missing name');
  }
  return json;
});
```

### 自定义 JSON 解析器

通过 `parser` 选项自定义 JSON 解析逻辑：

```typescript
// 使用更快的 JSON 解析器
const client = akita.create({
  parser: (text) => JSON.parse(text)
});

// 安全的 JSON 解析
const safeParser = (text: string) => {
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('JSON parse failed:', text);
    return null;
  }
};

const client = akita.create({
  parser: safeParser
});
```

### Reducer 与 Parser 的区别

| 特性 | Reducer | Parser |
|------|---------|--------|
| **作用时机** | JSON.parse 之后 | JSON.parse 本身 |
| **用途** | 转换/验证数据 | 替换 JSON.parse |
| **使用位置** | 单个请求 | 客户端全局配置 |
| **返回值** | 任意类型 | 必须是解析后的对象 |

```typescript
// Parser - 替换 JSON.parse
const client = akita.create({
  parser: (text) => JSON5.parse(text)  // 解析 JSON5 格式
});

// Reducer - 转换解析后的数据
const data = await client.get('/api/users', {}, 
  (json) => json.data  // 提取 data 字段
);
```

## 请求体处理

### JSON 请求（默认）

```typescript
const user = await akita.post('/users', {
  body: { name: 'John', age: 30, email: 'john@example.com' }
});
// Content-Type: application/json
// Body: {"name":"John","age":30,"email":"john@example.com"}
```

### 表单提交

```typescript
const result = await akita.post('/login', {
  body: { username: 'admin', password: '123456' },
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  }
});
// Content-Type: application/x-www-form-urlencoded
// Body: username=admin&password=123456
```

### 文件上传（自动转换为 FormData）

```typescript
// 浏览器端
const fileInput = document.getElementById('file');
const result = await akita.post('/upload', {
  body: {
    file: fileInput.files[0],
    name: 'test.txt'
  }
});

// Node.js 端
import fs from 'fs';
const result = await akita.post('/upload', {
  body: {
    file: fs.createReadStream('./file.txt'),
    description: 'Upload description'
  }
});

// Buffer 上传
const buffer = Buffer.from('hello world');
// @ts-ignore
buffer.name = 'test.txt';
const result = await akita.post('/upload', {
  body: {
    file: buffer,
    filename: 'test.txt'
  }
});

// 多文件上传
const result = await akita.post('/upload', {
  body: {
    file1: fs.createReadStream('./file1.txt'),
    file2: fs.createReadStream('./file2.txt'),
    metadata: { batchId: '123' }
  }
});
```

## JSON 数据流（JsonStream）

### 处理服务器推送的 NDJSON 数据

服务器返回格式（每行一个 JSON 对象）：
```
{"type":"ADDED","object":{"id":1,"name":"iPhone"}}
{"type":"MODIFIED","object":{"id":2,"name":"iMac"}}
```

### 逐行读取

```typescript
const stream = await akita.get('/api/events').jsonStream();
let event = await stream.read();
while (event) {
  console.log('Event:', event.type, event.object);
  event = await stream.read();
}
```

### 使用事件监听

```typescript
const stream = await akita.get('/api/events').jsonStream();

stream.on('data', (event) => {
  console.log('Received event:', event.type, event.object);
});

stream.on('error', (error) => {
  console.error('Stream error:', error.message);
});

stream.on('close', () => {
  console.log('Stream closed');
});
```

### 手动关闭流

```typescript
const stream = await akita.get('/api/events').jsonStream();

// 10 秒后关闭
setTimeout(() => {
  stream.close();
}, 10000);

let event = await stream.read();
while (event) {
  console.log(event);
  event = await stream.read();
}
// 10 秒后，event 会是 undefined
```

## SSE 事件流（SSEStream）

### 处理 Server-Sent Events (SSE) 实时事件流

SSE 格式（WHATWG 标准）：
```
event: message_start
data: {"type": "message_start", "message": {"id": "msg_123"}}

event: content_block_delta
data: {"type": "content_block_delta", "index": 0, "text": "Hello"}

event: message_stop
data: {"type": "message_stop"}
```

SSE 支持字段：
- `data:` - 事件数据（可多行拼接）
- `event:` - 事件类型（默认 `'message'`）
- `id:` - 事件 ID（用于重连）
- `retry:` - 重连间隔（毫秒）
- `:` - 注释行（自动忽略）
- 空行 - 事件分隔符

### 逐事件读取

```typescript
const stream = await client.get('/api/chat').sseStream();
let event = await stream.read();
while (event) {
  console.log(`[${event.type}]`, event.data);
  event = await stream.read();
}
```

### 使用事件监听

```typescript
const stream = await client.get('/api/chat').sseStream();

stream.on('data', (event) => {
  console.log('Event received:', event.type, event.data);
});

stream.on('error', (error) => {
  console.error('Stream error:', error.message);
});

stream.on('close', () => {
  console.log('Stream closed');
});
```

### 解析 SSE + JSON 数据

大多数 SSE 服务的 data 字段是 JSON 格式：

```typescript
const stream = await client.get('/api/chat').sseStream();

stream.on('data', (event) => {
  if (event.data) {
    const data = JSON.parse(event.data);
    console.log('Parsed data:', data);
  }
});
```

### OpenAI API 特殊处理（data: [DONE]）

OpenAI 使用 `data: [DONE]` 作为流结束标记，**不是有效 JSON**：

```typescript
const stream = await client.post('/v1/chat/completions', {
  body: { model: 'gpt-4', messages: [...], stream: true }
}).sseStream();

stream.on('data', (event) => {
  // 处理 [DONE] 结束标记
  if (event.data === '[DONE]') {
    console.log('Stream complete');
    stream.close();
    return;
  }
  
  // 正常 JSON 数据
  const data = JSON.parse(event.data);
  process.stdout.write(data.choices[0].delta.content);
});
```

### 辅助函数处理 OpenAI 流

```typescript
async function streamOpenAI(prompt: string) {
  const stream = await client.post('/v1/chat/completions', {
    body: { model: 'gpt-4', messages: [{ role: 'user', content: prompt }], stream: true }
  }).sseStream();

  for await (const event of stream) {
    // 检查结束标记
    if (event.data === '[DONE]') {
      break;
    }
    
    // 解析 JSON
    const data = JSON.parse(event.data);
    const content = data.choices[0].delta?.content;
    
    if (content) {
      process.stdout.write(content);
    }
  }
  
  console.log('\nComplete!');
}
```

### 获取 lastEventId 和 retry

```typescript
const stream = await client.get('/api/events').sseStream();

stream.on('data', (event) => {
  console.log('Event ID:', event.id);      // 事件 ID
  console.log('Retry:', event.retry);      // 重连间隔（毫秒）
});

// 获取最后的 Event ID（用于重连时发送 Last-Event-ID header）
console.log('Last Event ID:', stream.lastEventId);
console.log('Retry Interval:', stream.retryInterval);
```

### 实际案例：OpenAI ChatGPT API

```typescript
const stream = await client.post('/v1/chat/completions', {
  body: {
    model: 'gpt-4',
    messages: [{ role: 'user', content: 'Hello' }],
    stream: true
  }
}).sseStream();

stream.on('data', (event) => {
  if (event.type === 'message_start') {
    const data = JSON.parse(event.data);
    console.log('Started:', data.message.id);
  } else if (event.type === 'content_block_delta') {
    const data = JSON.parse(event.data);
    process.stdout.write(data.delta.text);
  } else if (event.type === 'message_stop') {
    stream.close();
  }
});
```

### 实际案例：GitHub Actions Logs

```typescript
const stream = await client.get('/repos/owner/repo/actions/runs/123/logs').sseStream();

stream.on('data', (event) => {
  // Log lines are plain text in data field
  console.log('Log:', event.data);
});
```

## 文本行流（LineStream）

### 按行读取文本数据流

适用于：
- 日志文件流式读取
- 大文本文件逐行处理
- NDJSON 手动解析

### 逐行读取

```typescript
const stream = await client.get('/api/logs').lineStream();
let line = await stream.read();
while (line !== undefined) {
  console.log('Line:', line);
  line = await stream.read();
}
```

### 使用事件监听

```typescript
const stream = await client.get('/api/logs').lineStream();

stream.on('data', (line) => {
  console.log('Received line:', line);
});

stream.on('error', (error) => {
  console.error('Stream error:', error.message);
});

stream.on('close', () => {
  console.log('Stream closed');
});
```

### 手动解析 NDJSON

```typescript
const stream = await client.get('/api/events').lineStream();
let line = await stream.read();
while (line) {
  const event = JSON.parse(line);
  console.log('Event:', event);
  line = await stream.read();
}
```

### LineStream vs JsonStream

| 特性 | LineStream | JsonStream |
|------|-----------|-----------|
| **解析格式** | 纯文本行 | NDJSON（每行 JSON） |
| **返回值** | `string` | JSON 对象 |
| **自定义解析器** | ❌ 不支持 | ✅ 支持 |
| **数据转换** | 手动解析 | 自动 JSON.parse + Reducer |
| **适用场景** | 日志、手动解析 | 服务器推送的 JSON 事件 |

```typescript
// LineStream - 返回字符串
const lineStream = await client.get('/api/logs').lineStream();
const line = await lineStream.read();
console.log(typeof line); // string

// JsonStream - 返回 JSON 对象
const jsonStream = await client.get('/api/events').jsonStream();
const event = await jsonStream.read();
console.log(typeof event); // object
```

## 钩子系统

Akita 提供了 5 个钩子来监听请求生命周期：

| 钩子 | 触发时机 | 用途 |
|------|---------|------|
| `onEncode` | Body 编码为 JSON/FormData 前 | 添加时间戳、验证数据 |
| `onRequest` | 请求发送前 | 添加认证 token、请求 ID |
| `onResponse` | 接收到响应后 | 日志记录、处理特定状态码 |
| `onDecode` | 响应体解析为 JSON 后 | 数据转换、字段重命名 |
| `onProgress` | 请求进度更新 | 显示进度条 |

### onRequest 钩子 - 自动添加认证

```typescript
const client = akita.create({
  onRequest: async (request) => {
    // 自动添加认证 token
    const token = await getAuthToken();
    request.init.headers['Authorization'] = `Bearer ${token}`;

    // 添加请求 ID
    request.init.headers['X-Request-ID'] = generateUUID();
  }
});

const data = await client.get('/api/data');
// 请求会自动带上 Authorization 和 X-Request-ID 头
```

### onResponse 钩子 - 日志和错误处理

```typescript
const client = akita.create({
  onResponse: async (request) => {
    // 记录请求日志
    console.log(`${request.init.method} ${request.url} -> ${request.res?.status}`);

    // 处理 401 错误（Token 过期）
    if (request.res?.status === 401) {
      console.log('Token expired, redirecting to login');
      window.location.href = '/login';
    }

    // 处理特定错误状态码
    if (request.res?.status >= 500) {
      console.error('Server error:', request.res?.statusText);
    }
  }
});
```

### onDecode 钩子 - 数据转换

```typescript
interface User {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const client = akita.create({
  onDecode: async (request) => {
    // 转换日期字段
    if (request.value?.createdAt) {
      request.value.createdAt = new Date(request.value.createdAt);
    }
    if (request.value?.updatedAt) {
      request.value.updatedAt = new Date(request.value.updatedAt);
    }

    // 提取嵌套的 data 字段
    if (request.value?.data) {
      request.value = request.value.data;
    }

    // 统一数据格式
    if (request.value?.user) {
      request.value.userId = request.value.user.id;
      request.value.userName = request.value.user.name;
      delete request.value.user;
    }
  }
});

const users = await client.get<User[]>('/api/users');
// users 中的 createdAt/updatedAt 已经是 Date 对象
```

### onEncode 钩子 - 请求数据预处理

```typescript
const client = akita.create({
  onEncode: async (request) => {
    // 添加时间戳
    if (request.init.body && typeof request.init.body === 'object') {
      request.init.body.timestamp = Date.now();
    }

    // 验证数据
    if (request.init.body?.email && !isValidEmail(request.init.body.email)) {
      throw new Error('Invalid email format');
    }

    // 添加设备信息
    if (request.init.body) {
      request.init.body.device = {
        userAgent: navigator.userAgent,
        platform: navigator.platform
      };
    }
  }
});
```

### onProgress 钩子 - 进度跟踪

```typescript
const client = akita.create({
  onProgress: (progress) => {
    const percentage = (progress * 100).toFixed(1);
    console.log(`Overall progress: ${percentage}%`);

    // 更新 UI 进度条
    if (typeof window !== 'undefined') {
      const progressBar = document.getElementById('progress-bar');
      if (progressBar) {
        progressBar.style.width = `${percentage}%`;
      }
    }
  }
});

// 并发多个请求
Promise.all([
  client.get('/api/users'),
  client.get('/api/products'),
  client.get('/api/orders')
]);
// 会触发多次进度更新: 33.3% -> 66.7% -> 100.0%
```

### 多个钩子

```typescript
const client = akita.create({
  onRequest: [
    async (request) => {
      // 第一个钩子：添加 token
      const token = await getToken();
      request.init.headers['Authorization'] = `Bearer ${token}`;
    },
    (request) => {
      // 第二个钩子：添加请求 ID
      request.init.headers['X-Request-ID'] = generateId();
    },
    (request) => {
      // 第三个钩子：记录日志
      console.log('Request:', request.init.method, request.url);
    }
  ]
});
```

### 使用 `on()` 和 `off()` 方法

```typescript
const client = akita.create();

// 添加钩子
const logHook = (request: any) => {
  console.log('Request to:', request.url);
};
client.on('request', logHook);

// 移除钩子
client.off('request', logHook);

// 链式调用
client
  .on('request', (req) => console.log('Sending:', req.url))
  .on('response', (req) => console.log('Received:', req.res?.status))
  .on('progress', (p) => console.log('Progress:', (p * 100).toFixed(0) + '%'));
```

## 多客户端实例

### 创建独立的客户端

```typescript
// 基础客户端
const baseClient = akita.create({
  apiRoot: 'https://api.example.com',
  init: {
    headers: { 'Accept': 'application/json' }
  }
});

// 创建带认证的客户端
const authClient = baseClient.create({
  init: {
    headers: { 'Authorization': 'Bearer token' }
  }
});

// 两个客户端配置独立
console.log(baseClient.options.init.headers);
// { Accept: 'application/json' }

console.log(authClient.options.init.headers);
// { Accept: 'application/json', Authorization: 'Bearer token' }
```

### 使用 `resolve()` 共享客户端实例

```typescript
// 在 user.js 中
import akita from 'akita';
const userClient = akita.resolve('api');
userClient.setOptions({
  apiRoot: 'https://api.example.com',
  init: { headers: { 'Authorization': 'Bearer token' } }
});
export { userClient };

// 在 product.js 中
import akita from 'akita';
const productClient = akita.resolve('api');
// 获取的是同一个实例，已经配置好了
export { productClient };

// 在 order.js 中
import akita from 'akita';
const orderClient = akita.resolve('api');
// 还是同一个实例，配置完全共享
export { orderClient };

// 所有文件使用相同的配置和 token
```

### 使用 `setOptions()` 动态更新配置

```typescript
const client = akita.create({
  apiRoot: 'https://api.example.com',
  init: { headers: { 'Accept': 'application/json' } }
});

// 动态添加 token（登录后）
client.setOptions({
  init: { headers: { 'Authorization': 'Bearer new-token' } }
});

// Headers 会合并
console.log(client.options.init.headers);
// { Accept: 'application/json', Authorization: 'Bearer new-token' }
```

## 错误处理

### 错误类型系统

Akita 提供了完整的错误类型系统，支持 4 种错误类型：

| 错误类型 | 说明 | 示例代码 |
|---------|------|---------|
| **Network** | 网络层错误（DNS 失败、超时、连接拒绝等） | `NETWORK_TIMEOUT`, `NETWORK_DNS_FAILED`, `NETWORK_CONNECTION_REFUSED` |
| **HTTP** | HTTP 状态码错误（4xx/5xx） | `HTTP_404`, `HTTP_500`, `HTTP_401` |
| **Parse** | JSON/text 解析失败 | `PARSE_JSON_ERROR`, `PARSE_TEXT_ERROR` |
| **Server** | 应用层错误（响应中包含 `error` 字段） | `SERVER_ERROR`, `USER_NOT_FOUND`（自定义代码） |

### AkitaError 结构

所有错误都是 `AkitaError` 实例，包含以下属性：

```typescript
class AkitaError extends Error {
  name: 'AkitaError';                    // 固定值 'AkitaError'
  type: 'network' | 'http' | 'parse' | 'server';  // 错误类型
  code: string;                           // 错误代码
  networkType?: NetworkErrorType;           // 网络错误子类型
  status?: number;                         // HTTP 状态码
  statusText?: string;                     // HTTP 状态文本
  url?: string;                            // 请求 URL
  method?: string;                          // HTTP 方法
  cause?: Error;                           // 原始错误（包裹）
  timestamp?: number;                        // 错误时间戳
}
```

### 使用类型守卫函数

Akita 导出了 5 个类型守卫函数，用于安全地判断错误类型：

```typescript
import akita from 'akita';
import {
  isAkitaError,
  isNetworkError,
  isHTTPError,
  isParseError,
  isServerError
} from 'akita';

try {
  const data = await akita.get('/api/data');
} catch (error) {
  // 1. 判断是否为 AkitaError
  if (isAkitaError(error)) {
    console.log('Akita error:', error.code);
  }

  // 2. 判断具体错误类型（TypeScript 会自动收窄类型）
  if (isNetworkError(error)) {
    console.log('Network failed:', error.networkType);
    // TypeScript 现在知道 error 是 NetworkError
    // 可以访问: networkType, code, cause 等
  } else if (isHTTPError(error)) {
    console.log('HTTP error:', error.status, error.statusText);
    // TypeScript 现在知道 error 是 HTTPError
    // 可以访问: status, statusText 等
  } else if (isServerError(error)) {
    console.log('Server error:', error.code, error.message);
    // TypeScript 现在知道 error 是 ServerError
    // 可以访问: code, message 等
  } else if (isParseError(error)) {
    console.log('Parse error:', error.cause);
    // TypeScript 现在知道 error 是 ParseError
    // 可以访问: cause, format 等
  }
}
```

### 网络错误处理

网络错误分为 8 种子类型：

| networkType | 说明 | 检测条件 |
|-------------|------|-----------|
| `timeout` | 请求超时 | "timeout", "timed out", "请求超时" |
| `dns_failed` | DNS 解析失败 | "enotfound", "getaddrinfo", "dns" |
| `cors` | CORS 错误 | "cors", "cross-origin" |
| `offline` | 离线状态 | "offline", "no internet" |
| `connection_refused` | 连接被拒绝 | "econnrefused", "connection refused" |
| `connection_reset` | 连接被重置 | "econnreset", "connection reset" |
| `network_unreachable` | 网络不可达 | "enetunreachable", "network unreachable" |
| `unknown` | 未知网络错误 | 其他网络错误 |

```typescript
try {
  const data = await akita.get('/api/data');
} catch (error) {
  if (isNetworkError(error)) {
    switch (error.networkType) {
      case 'timeout':
        showToast('请求超时，请重试');
        break;
      case 'offline':
        showToast('网络未连接');
        break;
      case 'dns_failed':
        showToast('DNS 解析失败');
        break;
      case 'connection_refused':
        showToast('连接被拒绝');
        break;
      default:
        showToast('网络错误: ' + error.code);
    }
  }
}
```

### HTTP 错误处理

HTTP 错误自动检测所有 4xx/5xx 状态码：

```typescript
try {
  const data = await akita.get('/api/data');
} catch (error) {
  if (isHTTPError(error)) {
    console.log('HTTP Status:', error.status);
    console.log('Status Text:', error.statusText);
    console.log('Error Code:', error.code);  // HTTP_{status}
    console.log('Request URL:', error.url);
    console.log('Request Method:', error.method);

    // 处理常见状态码
    switch (error.status) {
      case 401:
        // Token 过期，跳转登录
        window.location.href = '/login';
        break;
      case 403:
        showToast('没有访问权限');
        break;
      case 404:
        showToast('资源不存在');
        break;
      case 429:
        showToast('请求过于频繁');
        break;
      case 500:
      case 502:
      case 503:
        showToast('服务器错误，请稍后重试');
        break;
    }
  }
}
```

### 解析错误处理

当 JSON/text 解析失败时抛出解析错误：

```typescript
try {
  const data = await akita.get('/api/data');
} catch (error) {
  if (isParseError(error)) {
    console.log('Parse error:', error.message);
    console.log('Format:', error.code);  // PARSE_JSON_ERROR 或 PARSE_TEXT_ERROR
    console.log('Original error:', error.cause);

    // 解析错误通常意味着服务器返回了无效数据
    showToast('数据格式错误');
  }
}
```

### 服务器错误处理

服务器错误由响应中的 `error` 字段触发（值为 '0'、'null'、'none' 时不会抛出错误）：

```typescript
// 服务器返回: { error: 'User not found', code: 'USER_NOT_FOUND', userId: 123 }
try {
  const user = await akita.get('/api/users/999');
} catch (error) {
  if (isServerError(error)) {
    console.log('Server error:', error.message);  // 'User not found'
    console.log('Server code:', error.code);      // 'USER_NOT_FOUND' 或 'SERVER_ERROR'

    // 服务器可能返回自定义错误代码
    switch (error.code) {
      case 'USER_NOT_FOUND':
        showToast('用户不存在');
        break;
      case 'INVALID_TOKEN':
        showToast('Token 无效');
        break;
      case 'PERMISSION_DENIED':
        showToast('权限不足');
        break;
      default:
        showToast('服务器错误: ' + error.message);
    }
  }
}

// 安全值 - 不会抛出错误
const data = await akita.get('/api/users');
// 服务器返回: { error: '0', data: [...] }  ✅ 正常返回
// 服务器返回: { error: 'null', data: [...] }  ✅ 正常返回
// 服务器返回: { error: 'none', data: [...] }  ✅ 正常返回
```

### 综合错误处理示例

```typescript
import akita, {
  isAkitaError,
  isNetworkError,
  isHTTPError,
  isParseError,
  isServerError
} from 'akita';

async function makeRequest() {
  try {
    const data = await akita.get('/api/data');
    console.log('Success:', data);
  } catch (error) {
    // 判断是否为 AkitaError
    if (!isAkitaError(error)) {
      console.error('Unknown error:', error);
      return;
    }

    // 网络错误
    if (isNetworkError(error)) {
      console.error('Network error:', error.networkType);
      showToast('网络错误，请检查网络连接');
      return;
    }

    // HTTP 错误
    if (isHTTPError(error)) {
      console.error('HTTP error:', error.status);
      if (error.status === 401) {
        // 跳转登录
        window.location.href = '/login';
      } else if (error.status >= 500) {
        showToast('服务器错误');
      } else {
        showToast('请求失败: ' + error.statusText);
      }
      return;
    }

    // 解析错误
    if (isParseError(error)) {
      console.error('Parse error:', error.code);
      showToast('数据格式错误');
      return;
    }

    // 服务器错误
    if (isServerError(error)) {
      console.error('Server error:', error.code);
      showToast(error.message);
      return;
    }
  }
}
```

### 检查响应状态

除了使用 try/catch，也可以先检查响应状态：

```typescript
// 检查请求是否成功
const ok = await akita.get('/api/users').ok();
if (ok) {
  console.log('Request succeeded');
} else {
  console.log('Request failed');
}

// 获取状态码
const status = await akita.get('/api/users').status();
console.log('Status:', status);

// 获取状态文本
const statusText = await akita.get('/api/users').statusText();
console.log('Status Text:', statusText);

// 获取响应头
const headers = await akita.get('/api/users').headers();
console.log('Content-Type:', headers.get('Content-Type'));

// 获取响应大小
const size = await akita.get('/api/users').size();
console.log('Response size:', size);
```

### 错误重试机制

基于错误类型实现智能重试：

```typescript
async function retryRequest<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; retryNetwork?: boolean; retry500?: boolean } = {}
): Promise<T> {
  const { maxRetries = 3, retryNetwork = true, retry500 = true } = options;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;  // 最后一次重试也失败，抛出错误
      }

      // 判断是否应该重试
      if (isNetworkError(error) && retryNetwork) {
        console.log(`Network error, retrying (${i + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }

      if (isHTTPError(error) && error.status >= 500 && retry500) {
        console.log(`Server error, retrying (${i + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }

      // 其他错误不重试，直接抛出
      throw error;
    }
  }

  throw new Error('Max retries exceeded');
}

// 使用示例
const data = await retryRequest(
  () => akita.get('/api/data'),
  { maxRetries: 3, retryNetwork: true, retry500: true }
);
```

## 高级用法

### 自定义 qs 配置

```typescript
const client = akita.create({
  qsOptions: {
    arrayFormat: 'indices',    // ids[0]=1&ids[1]=2
    encode: false,             // 不编码参数
    skipNulls: true,          // 跳过 null 值
    addQueryPrefix: true       // 自动添加 ?
  }
});

await client.get('/api', { query: { ids: [1, 2, 3], name: null } });
// -> /api?ids[0]=1&ids[1]=2&ids[2]=3
```

### HTTP Agent 配置（Node.js）

```typescript
import http from 'http';
import https from 'https';

// Keep-Alive
const agent = new http.Agent({ keepAlive: true });
await client.get('/api/data', { agent });

// 禁用 Keep-Alive
const agent = new http.Agent({ keepAlive: false });
await client.get('/api/data', { agent });

// 动态返回 agent
await client.get('/api/data', {
  agent: (url) => {
    if (url.protocol === 'https:') {
      return new https.Agent({ keepAlive: true, rejectUnauthorized: false });
    }
    return new http.Agent({ keepAlive: true });
  }
});
```

### 重定向处理（Node.js）

```typescript
// 自动跟随重定向（默认）
const data = await client.get('/redirect');

// 手动处理重定向
const res = await client.get('/redirect', { redirect: 'manual' }).response();
const location = res.headers.get('Location');
console.log('Redirect to:', location);

// 遇到重定向时拒绝
try {
  const data = await client.get('/redirect', { redirect: 'error' });
} catch (error) {
  console.log('Redirect detected');
}
```

### 限制重定向次数

```typescript
const data = await client.get('/redirect', {
  follow: 5  // 最多跟随 5 次重定向
});
```

### 压缩控制（Node.js）

```typescript
// 启用压缩（默认）
const data = await client.get('/api/data', { compress: true });

// 禁用压缩
const data = await client.get('/api/data', { compress: false });
```

### 限制响应大小（Node.js）

```typescript
// 限制 1MB
const data = await client.get('/api/data', { size: 1024 * 1024 });

// 不限制（默认）
const data = await client.get('/api/data', { size: 0 });
```

## 平台支持

### Node.js

```typescript
import akita from 'akita/lib/node';
// 或直接 import akita from 'akita' （默认使用 node 入口）

const data = await akita.get('https://api.example.com/data');
```

Node.js 特有功能：
- HTTP Agent 配置
- 重定向控制
- 超时设置
- 响应大小限制
- 压缩控制

### 浏览器

```typescript
import akita from 'akita';

const data = await akita.get('/api/data');
```

浏览器特有功能：
- Blob 支持
- CORS 配置
- Cookie 配置

### 微信小程序

```typescript
import akita from 'akita/lib';

const data = await akita.get('https://api.example.com/data');
```

微信小程序限制：
- **不支持 streaming**（调用 `res.body` 或 `res.blob` 会抛出错误）
- **PATCH 方法**通过 header hack 实现（使用 `akita-method: PATCH` 头）

```javascript
// 微信小程序中的 PATCH 请求
// 会被自动转换为 PUT 请求，并添加 akita-method: PATCH 头
await client.patch('/api/resource', {
  body: { name: 'updated' }
});
```

## 完整示例

### 构建 RESTful API 客户端

```typescript
import akita from 'akita';

interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// 创建 API 客户端
const api = akita.create({
  apiRoot: 'https://api.example.com/v1',

  init: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  },

  // 自动添加认证 token
  onRequest: async (request) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      request.init.headers['Authorization'] = `Bearer ${token}`;
    }
  },

  // 处理 401 错误
  onResponse: async (request) => {
    if (request.res?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
  },

  // 转换日期字段
  onDecode: async (request) => {
    if (request.value?.createdAt) {
      request.value.createdAt = new Date(request.value.createdAt);
    }
    if (request.value?.updatedAt) {
      request.value.updatedAt = new Date(request.value.updatedAt);
    }
  },

  // 提取分页数据
  onDecode: async (request) => {
    if (request.value?.data) {
      request.value = request.value;
    }
  }
});

// User API
const UserAPI = {
  // 获取用户列表
  list: async (page = 1, limit = 10): Promise<PaginatedResponse<User>> => {
    return await api.get<User[]>('/users', {
      query: { page, limit }
    });
  },

  // 获取用户详情
  get: async (id: number): Promise<User> => {
    return await api.get<User>(`/users/${id}`);
  },

  // 创建用户
  create: async (data: Partial<User>): Promise<User> => {
    return await api.post<User>('/users', { body: data });
  },

  // 更新用户
  update: async (id: number, data: Partial<User>): Promise<User> => {
    return await api.put<User>(`/users/${id}`, { body: data });
  },

  // 部分更新
  patch: async (id: number, data: Partial<User>): Promise<User> => {
    return await api.patch<User>(`/users/${id}`, { body: data });
  },

  // 删除用户
  delete: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  }
};

// 使用 API
async function main() {
  // 获取用户列表
  const users = await UserAPI.list(1, 20);
  console.log('Users:', users.data);
  console.log('Total:', users.total);

  // 创建用户
  const newUser = await UserAPI.create({
    name: 'John Doe',
    email: 'john@example.com'
  });
  console.log('Created user:', newUser);

  // 更新用户
  const updatedUser = await UserAPI.update(newUser.id, {
    name: 'John Smith'
  });
  console.log('Updated user:', updatedUser);

  // 删除用户
  await UserAPI.delete(newUser.id);
  console.log('User deleted');
}

main().catch(console.error);
```

### 文件上传客户端

```typescript
import akita from 'akita';
import fs from 'fs';

const uploadClient = akita.create({
  apiRoot: 'https://upload.example.com/v1',
  onRequest: async (request) => {
    const token = await getUploadToken();
    request.init.headers['Authorization'] = `Bearer ${token}`;
  },
  onProgress: (progress) => {
    console.log(`Upload progress: ${(progress * 100).toFixed(1)}%`);
  }
});

interface UploadResult {
  id: string;
  url: string;
  filename: string;
  size: number;
}

// 上传单个文件
async function uploadFile(filePath: string): Promise<UploadResult> {
  const fileStream = fs.createReadStream(filePath);
  const filename = filePath.split('/').pop();

  const result = await uploadClient.post<UploadResult>('/upload', {
    body: {
      file: fileStream,
      filename,
      description: 'File upload via Akita'
    }
  });

  return result;
}

// 上传多个文件
async function uploadFiles(filePaths: string[]): Promise<UploadResult[]> {
  const uploads = filePaths.map(async (path) => {
    const fileStream = fs.createReadStream(path);
    const filename = path.split('/').pop();

    return await uploadClient.post<UploadResult>('/upload', {
      body: {
        file: fileStream,
        filename
      }
    });
  });

  return await Promise.all(uploads);
}

// 使用示例
uploadFile('./document.pdf')
  .then(result => {
    console.log('Upload successful:', result);
    console.log('File URL:', result.url);
  })
  .catch(console.error);
```

### 实时数据流处理

#### NDJSON 数据流（JsonStream）

```typescript
import akita from 'akita';

interface StockEvent {
  type: 'ADDED' | 'MODIFIED' | 'REMOVED';
  object: {
    id: string;
    symbol: string;
    price: number;
    change: number;
  };
}

const streamClient = akita.create({
  apiRoot: 'https://api.example.com',
  onDecode: async (request) => {
    // 转换价格字段
    if (request.value?.price) {
      request.value.price = parseFloat(request.value.price);
    }
  }
});

// 处理股票价格流
async function watchStock(symbol: string) {
  const stream = await streamClient.get<StockEvent>(`/stocks/${symbol}/watch`).jsonStream();

  stream.on('data', (event) => {
    const { type, object } = event;

    switch (type) {
      case 'ADDED':
        console.log(`🟢 New stock: ${object.symbol} @ $${object.price}`);
        break;
      case 'MODIFIED':
        const arrow = object.change >= 0 ? '📈' : '📉';
        console.log(`${arrow} ${object.symbol} @ $${object.price} (${object.change}%)`);
        break;
      case 'REMOVED':
        console.log(`🔴 Delisted: ${object.symbol}`);
        break;
    }
  });

  stream.on('error', (error) => {
    console.error('Stream error:', error.message);
  });

  stream.on('close', () => {
    console.log('Stream closed, reconnecting...');
    setTimeout(() => watchStock(symbol), 5000);
  });
}

// 启动监控
watchStock('AAPL');
```

#### SSE 事件流（SSEStream）

```typescript
import akita from 'akita';

interface ChatEvent {
  type: 'message_start' | 'content_block_delta' | 'message_stop';
  message?: {
    id: string;
    role: string;
  };
  delta?: {
    type: string;
    text: string;
  };
}

const chatClient = akita.create({
  apiRoot: 'https://api.example.com'
});

async function streamChat() {
  const stream = await chatClient.post<ChatEvent>('/v1/chat/completions', {
    body: {
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'Tell me a story' }],
      stream: true
    }
  }).sseStream();

  stream.on('data', (event) => {
    switch (event.type) {
      case 'message_start':
        const start = JSON.parse(event.data);
        console.log('Started message:', start.message.id);
        break;
      
      case 'content_block_delta':
        const delta = JSON.parse(event.data);
        process.stdout.write(delta.delta.text);
        break;
      
      case 'message_stop':
        console.log('\nChat complete');
        stream.close();
        break;
    }
  });

  stream.on('error', (error) => {
    console.error('SSE error:', error.message);
  });

  stream.on('close', () => {
    console.log('Stream closed');
  });
}

streamChat();
```

## TypeScript 支持

Akita 提供完整的 TypeScript 类型定义：

```typescript
import akita from 'akita';

// 类型推断
const users = await akita.get('/users');
// users 的类型自动推断为 any

// 显式指定泛型
interface User { id: number; name: string; }
const users = await akita.get<User[]>('/users');
// users 的类型是 User[]

// Request 类型
const request = akita.get<User[]>('/users');
console.log(request.url);    // string
console.log(request.init);   // RequestInit
console.log(request.res);    // Response | undefined
console.log(request.raw);    // string | undefined
console.log(request.value);  // User[] | undefined

// 使用 Reducer 时的类型推断
const userIds = await akita.get<number[]>('/users', {}, (json: User[]) =>
  json.map(u => u.id)
);
// userIds 的类型是 number[]
```

## API 参考

详细的 API 文档请参考 `index.d.ts` 文件，其中包含所有接口、类型和方法的详细说明。

### 主要接口

- `ClientOptions` - 客户端配置选项
- `RequestInit` - 请求配置参数
- `Request<R>` - 请求对象（继承自 Promise）
- `LineStream<T>` - 文本行流接口
- `JsonStream<T>` - JSON 数据流
- `SSEEvent` - SSE 事件对象
- `SSEStream` - SSE 事件流
- `Reducer<T>` - 数据处理器
- `RequestHook` - 请求钩子函数
- `ProgressHook` - 进度钩子函数

### Client 方法

- `create(options)` - 创建新客户端实例
- `resolve(key)` - 获取或创建共享客户端实例
- `setOptions(options)` - 更新客户端配置
- `request(path, init, reducer)` - 通用请求方法
- `get(path, init)` - GET 请求
- `post(path, init)` - POST 请求
- `put(path, init)` - PUT 请求
- `patch(path, init)` - PATCH 请求
- `delete(path, init)` - DELETE 请求
- `on(event, hook)` - 添加事件监听
- `off(event, hook)` - 移除事件监听

### Request 方法

- `data()` - 获取 JSON 数据（可省略）
- `text()` - 获取原始文本
- `buffer()` - 获取 Buffer 数据
- `blob()` - 获取 Blob 数据
- `stream()` - 获取流数据
- `lineStream()` - 获取文本行流（LineStream）
- `jsonStream<T>()` - 获取 JSON 数据流（JsonStream）
- `sseStream()` - 获取 SSE 事件流（SSEStream）
- `response()` - 获取 Response 对象
- `ok()` - 判断请求是否成功
- `status()` - 获取状态码
- `statusText()` - 获取状态文本
- `size()` - 获取数据大小
- `headers()` - 获取响应头

## 常见问题

### 如何取消请求？

使用 `AbortController`：

```typescript
const controller = new AbortController();
const promise = client.get('/api/data', { signal: controller.signal });

// 取消请求
controller.abort();
```

### 如何处理并发请求？

```typescript
const results = await Promise.all([
  client.get('/api/users'),
  client.get('/api/products'),
  client.get('/api/orders')
]);
```

### 如何处理请求重试？

```typescript
async function retryRequest<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.log(`Retry ${i + 1}/${maxRetries}`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}

const data = await retryRequest(() => client.get('/api/data'));
```

### 如何处理请求缓存？

```typescript
const cache = new Map<string, any>();

async function cachedGet<T>(url: string): Promise<T> {
  if (cache.has(url)) {
    return cache.get(url);
  }

  const data = await client.get<T>(url);
  cache.set(url, data);
  return data;
}
```

## License

MIT

## GitHub

https://github.com/liangxingchen/akita
