# src/ - TypeScript 源代码目录

## 概述
多平台 HTTP 客户端核心实现，通过依赖注入实现平台解耦，提供 Promise 风格 API 和钩子系统。

## 文件定位
| 文件 | 用途 | 行数 |
|------|------|------|
| `client.ts` | 客户端工厂，HTTP 方法生成器 | 229 |
| `request.ts` | Request 类，Promise 风格请求处理 | 430 |
| `inject.ts` | 依赖注入机制，平台依赖解耦 | 89 |
| `fetch.ts` | 微信小程序 fetch 兼容层 | 118 |
| `json-stream.ts` | 流式 JSON 解析器（支持 NDJSON） | 200 |
| `utils.ts` | 类型判断工具（isUint8Array, isReadableStream, isFile） | 231 |
| `headers.ts` | 微信小程序 Headers 兼容类 | 37 |
| `form-data.ts` | 微信小程序 FormData 兼容类 | 9 |
| `methods.ts` | HTTP 方法列表常量 | 2 |
| `index.ts` | 微信小程序入口（默认） | 9 |
| `node.ts` | Node.js 入口 | 9 |
| `node.d.ts` | Node.js 类型声明 | 2 |

## 约定

### 架构模式
- **依赖注入**：`inject(fetch, FormData, ua)` 解耦平台依赖
- **钩子命名**：`on` + 事件名首字母大写（onRequest, onResponse, onEncode, onDecode）
- **私有属性**：下划线前缀（`_fetch`, `_steps`, `_endAt`, `_jsPromise`）
- **Promise 缓存**：`_xxxPromise` 避免重复请求（`_bufferPromise`, `_textPromise`, `_dataPromise`）
- **调试日志**：`debug('akita:request')` 和 `debug('akita:json-stream')`

### 平台检测
```typescript
typeof window !== 'undefined'      // 浏览器
typeof global !== 'undefined'     // Node.js
// @ts-ignore wx
wx.request                        // 微信小程序
```

### 中文注释
- 所有注释使用中文
- 错误消息使用英文

### @ts-ignore 使用
- 广泛使用（63 处）用于绕过平台兼容性类型检查
- 主要在微信小程序适配代码中

## 反模式

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

### Hook 执行模式
```typescript
// 支持单个函数或数组
function execHooks(request: RequestType, hooks: RequestHook | RequestHook[]): void | Promise<void> {
  let promise: void | Promise<void>;
  if (Array.isArray(hooks)) {
    hooks.forEach((h) => {
      if (promise) {
        promise = promise.then(() => h(request) || Promise.resolve());
      } else {
        promise = h(request);
      }
    });
  } else {
    promise = hooks(request);
  }
  return promise;
}
```

### 钩子系统
```typescript
client.on('request', (req) => { ... })  // 请求前
client.on('response', (req) => { ... }) // 响应后
client.on('encode', (req) => { ... })   // 编码前
client.on('decode', (req) => { ... })   // 解码后
client.on('progress', (p) => { ... })   // 进度更新
```

### 平台依赖注入
```typescript
// Node.js (src/node.ts)
export default inject(
  fetch,                          // node-fetch
  FormData,                       // form-data
  'Akita/1.2.0 (+https://github.com/liangxingchen/akita)'
);

// 微信小程序 (src/index.ts)
export default inject(
  fetch,                          // ./fetch (polyfill)
  FormData                        // ./form-data (polyfill)
);
```

### 进度跟踪实现
```typescript
// 3 步模型：0=init, 1=sent, 2=receiving, 3=done
client._steps: number        // 总步数
client._progress: number     // 当前进度（0-1）

// 任务保留 1 秒历史
client._tasks = client._tasks.filter(t => !t._endAt || now - t._endAt < 1000);
```
