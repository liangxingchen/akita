# test/ - 测试目录

## 概述
基于 tape 和 TypeScript 的集成测试框架，运行在端口 28000 的 Koa 服务器上。

## 文件定位
| 文件 | 用途 |
|------|------|
| `ts.js` | 测试入口：注册 ts-node、启动服务器、清理资源 |
| `client.ts` | 主测试套件：19 个测试用例覆盖 HTTP 方法、流、上传 |
| `server.ts` | Koa 测试服务器（端口 28000），提供 mock API 端点 |
| `upload.ts` | Multipart 表单解析中间件（基于 busboy） |

## 测试约定
- 自定义测试运行器：`ts.js` 注册 ts-node → 启动服务器 → 导入测试文件 → onFinish 关闭服务器
- Tape TAP 格式断言，嵌套测试结构 `troot.test('group', (t) => {...})`
- 错误处理：`.then(success, t.end)` 简化模式
- 调试输出：`DEBUG=akita*` 环境变量启用
- 覆盖率：nyc 生成报告

## 自定义测试运行器模式

```javascript
// test/ts.js (17 lines)
require('ts-node').register({});
let server = require('./server').default;
server.listen(28000);
require('./client.ts');
require('tape').onFinish(() => {
  server.close();
  process.exit();
});
require('tape').onFailure(() => {
  process.exit(1);
});
```

**关键特性**：
- ts-node 注册支持直接运行 TypeScript
- 服务器生命周期管理（启动/清理）
- 自动退出码（成功=0，失败=1）
- onFinish hook 确保资源清理

## 测试模式
- **API 端点**：/get（查询参数）、/goods/watch（JSON 流）、/upload（multipart）
- **添加测试**：在 `client.ts` 新增 `troot.test('description', (t) => {...})`
- **流测试**：使用 `/goods/watch` 端点，支持 `jsonStream().read()` 和事件监听
- **上传测试**：支持 Buffer、Stream（fs.createReadStream）、FormData

## 覆盖率配置

**内嵌在 package.json**（无 .nycrc 文件）：
```json
"nyc": {
  "extension": [".ts", ".tsx"],
  "exclude": [".history", "coverage", "test", "lib", "**/*.d.ts", "*.js"],
  "reporter": ["html"],
  "all": true
}
```

**生成报告**：
```bash
yarn cover  # 输出到 coverage/index.html
```

## 测试分类

| 类别 | 端点 | 测试内容 |
|------|------|---------|
| HTTP 方法 | / | GET, POST, DELETE |
| 查询参数 | /get | 嵌套对象、URL 合并 |
| Headers | / | 自定义 headers、User-Agent |
| Body 处理 | / | JSON、Buffer、FormData |
| 文件上传 | /upload | Stream 上传、Buffer 上传 |
| 响应类型 | / | text()、buffer() |
| HTTP Agent | / | keepAlive 配置 |
| JSON Stream | /goods/watch | NDJSON 流、事件、清理 |

## 断言方法使用

- `t.equal()` - 严格相等（最常用）
- `t.deepEqual()` - 深度对象相等
- `t.ok()` - 真值检查
- `t.end()` - 手动结束测试
- `t.plan()` - 显式测试计划（罕见）
