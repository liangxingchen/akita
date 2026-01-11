# 项目知识库

**生成时间**: 2026-01-11
**Commit**: [HEAD]
**分支**: main

## 概述

多平台 HTTP 客户端，支持 Node.js、浏览器和微信小程序，基于 Fetch API 实现。采用 TypeScript 编写，提供 Promise 风格 API 和钩子系统。**源代码：15 文件（1992 行）**，**类型定义：1625 行**。

## 结构

```
akita/
├── src/           # TypeScript 源代码（12 文件，1365 行）
│   ├── client.ts      # 客户端工厂（229 行）
│   ├── request.ts     # Request 类（430 行）- 重复 Promise getter 模式
│   ├── utils.ts       # 工具函数（231 行）- 错误处理、类型判断
│   ├── json-stream.ts # NDJSON 流解析器（200 行）- Uint8Array 转换重复
│   ├── fetch.ts       # 微信小程序 fetch 兼容（118 行）- Uint8Array 转换重复
│   ├── inject.ts      # 依赖注入（89 行）
│   ├── index.ts       # 微信小程序入口
│   ├── node.ts        # Node.js 入口
│   └── ...
├── test/          # 测试文件（4 文件）
├── lib/           # 编译输出（JavaScript，11 文件）
├── index.d.ts     # 根目录类型定义（1625 行）
└── 配置文件
```

## 查找位置

| 任务 | 位置 | 说明 |
|------|------|------|
| 核心客户端实现 | `src/client.ts` | 客户端工厂、HTTP 方法 |
| 请求类 | `src/request.ts` | Promise 风格请求处理（5 个重复 getter 模式） |
| 平台适配 | `src/node.ts`, `src/index.ts` | Node.js/微信小程序入口 |
| 类型定义 | `index.d.ts` | 根目录类型声明 |
| 错误处理 | `src/utils.ts` | AkitaError 类、错误工厂、类型守卫 |
| 平台注入 | `src/inject.ts` | 依赖注入机制，平台解耦 |

## 代码地图

### 主要类/接口

| 符号 | 类型 | 位置 | 角色 |
|-------|------|------|------|
| `Client` | class | src/client.ts | 客户端工厂 |
| `Request<T>` | class | src/request.ts | Promise 子类，请求对象 |
| `AkitaError` | class | src/utils.ts | 统一错误类 |
| `JsonStream<T>` | class | src/json-stream.ts | NDJSON 流解析器 |
| `inject()` | function | src/inject.ts | 平台依赖注入 |
| `create()` | function | src/client.ts | 创建新客户端实例 |
| `resolve()` | function | src/client.ts | 获取共享单例 |

### 错误类型

| 类型 | 子类型 | 说明 |
|-------|--------|------|
| `network` | dns_failed, timeout, cors, offline, connection_refused, connection_reset, network_unreachable, unknown | 网络层错误 |
| `http` | - | HTTP 状态码错误（4xx/5xx） |
| `parse` | - | JSON/text 解析失败 |
| `server` | - | 应用层错误（response.error 字段） |

## 约定（与标准差异）

### 多平台入口
```json
"main": "lib/node.js",      // Node.js
"browser": "lib/client.js", // 浏览器
"miniprogram": "lib",       // 微信小程序
```

### 平台感知架构
- 核心逻辑与平台依赖通过 `inject()` 解耦
- 平台特定实现：`src/fetch.ts`（微信小程序）、`src/node.ts`（Node.js）
- PATCH 方法在微信小程序中通过 header hack 实现

### 类型定义位置
- `index.d.ts` 位于根目录（非标准，便于 npm 包引用）
- 非 `tsc --declaration` 自动生成

### 配置系统（运行时，无 .env 文件）
```typescript
// 创建独立客户端
const client = akita.create({ apiRoot: 'https://api.example.com' });

// 更新配置（合并模式）
client.setOptions({ init: { headers: { 'Authorization': token } } });

// 获取共享单例
const shared = akita.resolve('api');
```

## 反模式（禁止）

### 代码风格
- 禁止使用 `var`（使用 `let`/`const`）
- 禁止使用 `==` 或 `!=`（必须 `===`/`!==`）
- 禁止使用 `eval`、`new Function`

### TypeScript
- 类型断言必须使用 `as Type`（禁止 `<Type>`）
- 优先使用 `interface` 而非 `type`
- 导入类型必须使用 `import type`

### 微信小程序限制
- **禁止**调用 `res.body` 或 `res.blob`（抛出 streaming 不支持错误）
- **禁止**使用 PATCH 方法（必须通过 header `akita-method: PATCH` hack）

### Promise 管理
- **禁止**重复创建 Promise（使用 `_xxxPromise` 缓存）
- **禁止**在构造函数中执行异步操作（延迟到 `_send()`）

## 代码重复（待重构）

### Promise Response Getter 模式（src/request.ts, 5 处重复）
```typescript
// 重复模式：ok(), status(), statusText(), size(), headers()
ok(): Promise<boolean> {
  if (this.res) return Promise.resolve(this.res.ok);
  return this._responsePromise.then((res) => res.ok);
}
```
**重构建议**: 提取到 `_getResponseProperty(prop)` 通用方法。

### Uint8Array 转换重复（2 文件）
- `src/fetch.ts` (lines 8-15) - 基础实现
- `src/json-stream.ts` (lines 7-17) - 增强实现（Buffer/TextDecoder 检查）
**重构建议**: 移至 `utils.ts` 统一实现。

## 独特风格

### 注释风格
- 中文注释和文档
- `@ts-ignore` 广泛使用（**63 处**）- 用于绕过平台兼容性类型检查

### 钩子系统（5 个生命周期钩子）
```typescript
client.on('encode', (req) => { ... })   // 编码前
client.on('request', (req) => { ... })  // 请求发送前
client.on('response', (res) => { ... }) // 接收到响应后
client.on('decode', (req) => { ... })   // 解码后
client.on('progress', (p) => { ... })   // 进度更新（0-1）
```

### Promise 缓存模式
```typescript
class Request<T> {
  _bufferPromise: null | Promise<Buffer>
  _blobPromise: null | Promise<Blob>
  _textPromise: null | Promise<string>
  _dataPromise: null | Promise<any>
  _jsPromise: null | Promise<JsonStream>

  // 每个方法先检查缓存
  buffer(): Promise<Buffer> {
    if (!this._bufferPromise) {
      this._bufferPromise = this._responsePromise.then(/* ... */);
    }
    return this._bufferPromise;
  }
}
```

### 进度跟踪（3 步模型）
- 每个请求：0=init, 1=sent, 2=receiving, 3=done
- 请求完成后保留 1 秒历史
- 防抖更新（5ms 间隔）

### 实例管理
```typescript
const client = akita.create({ apiRoot: 'https://api.example.com' });
// 或使用单例
akita.get('/users');
```

## 错误处理架构

### AkitaError 结构
```typescript
class AkitaError extends Error {
  type: ErrorType;           // 'network' | 'http' | 'parse' | 'server'
  code: string;               // 错误码（如 'NETWORK_TIMEOUT', 'HTTP_404'）
  networkType?: NetworkErrorType;  // 网络错误子类型
  status?: number;            // HTTP 状态码
  statusText?: string;        // HTTP 状态文本
  url?: string;               // 请求 URL
  method?: string;            // HTTP 方法
  cause?: Error;              // 原始错误（包裹）
  timestamp?: number;         // 错误时间戳
}
```

### 类型守卫（导出）
```typescript
isAkitaError(error: any): error is AkitaError
isNetworkError(error: any): error is AkitaError
isHTTPError(error: any): error is AkitaError
isParseError(error: any): error is AkitaError
isServerError(error: any): error is AkitaError
```

### 使用示例
```typescript
try {
  await client.get('/api/users');
} catch (error) {
  if (isNetworkError(error)) {
    console.log('Network failed:', error.networkType); // timeout, dns_failed, etc.
  } else if (isHTTPError(error)) {
    console.log('HTTP error:', error.status, error.statusText);
  } else if (isServerError(error)) {
    console.log('Server error:', error.code, error.message);
  } else if (isParseError(error)) {
    console.log('Parse error:', error.cause);
  }
}
```

## 命令

```bash
yarn build        # TypeScript 编译到 lib/
yarn test         # 运行测试（tape + ts-node）
yarn cover        # 生成覆盖率报告（nyc, 输出到 coverage/）
yarn fix          # eslint:fix + prettier:fix
yarn eslint       # 代码检查
```

## 注意事项

1. **微信小程序限制**
   - 不支持 streaming（`body` 属性抛出错误）
   - PATCH 方法通过 header `akita-method: PATCH` 实现

2. **响应解析**
   - 默认将 JSON 响应的 `error` 字段视为错误（值非 `0`/`null`/`none` 时 reject）

3. **进度跟踪**
   - `client.options.onProgress(progress: 0-1)` 回调
   - 请求完成后保留 1 秒进度历史

4. **表单上传**
   - 检测到 File/Uint8Array/ReadableStream 时自动转为 FormData
   - 嵌套对象转为 `field[key]` 格式

5. **构建产物**
   - `lib/` 目录提交到版本控制
   - `.gitignore` 排除 `lib/*.js` 但实际存在

6. **无 CI/CD**
   - 项目无自动化测试/构建（无 GitHub Actions、.travis.yml 等）
   - 所有测试/构建需手动执行

7. **@ts-ignore 使用**
   - 广泛使用（63 处）用于平台兼容性代码
   - ESLint 规则 `@typescript-eslint/ban-ts-comment` 已禁用
