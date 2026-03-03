# 在 JsonStream 中添加自定义 parser 支持

## TL;DR

> **Quick Summary**: 为 JsonStream 添加自定义 parser 参数，使其也能使用客户端配置的 parser 选项解析 NDJSON 流
> **Deliverables**:
> - `src/client.ts` 中修改 JsonStream 实现
> - `src/client.ts` 中修改 JsonStream 构造函数
> - 测试用例验证功能正确性
> 
> **Estimated Effort**: Short
> **Parallel Execution**: NO - Sequential implementation
> **Critical Path**: 修改 JsonStream 解析逻辑 → 修改调用处传递 parser → 添加测试

---

## Context

### Original Request
在 JsonStream 中也应该支持自定义 parser，实现与 Request 类一致的设计。

### Design Decision
- **配置级别**: 仅客户端级别，不支持请求级别覆盖
- **错误处理**: 解析器错误通过现有 `_onError` 机制抛出
- **向后兼容**: 默认使用 JSON.parse

### 需要修改的位置
1. `src/json-stream.ts:79` - `_parse()` 方法使用自定义 parser
2. `src/json-stream.ts:19-38` - 构造函数添加 parser 参数
3. `src/request.ts:195-201` - `jsonStream()` 方法传递 parser

---

## Work Objectives

### Core Objective
为 JsonStream 添加自定义 parser 支持，保持与 Request 类一致的设计模式。

### Concrete Deliverables
1. `src/json-stream.ts` - 修改构造函数和 _parse() 方法
2. `src/request.ts` - 修改 jsonStream() 方法传递 parser
3. `test/stream.test.ts` - 添加测试用例验证功能

### Definition of Done
- [ ] TypeScript 编译通过：`yarn build`
- [ ] 所有测试通过：`yarn test`
- [ ] 自定义解析器功能正常
- [ ] 默认行为（JSON.parse）保持不变

### Must Have
- ✅ JsonStream 构造函数添加 parser 参数
- ✅ _parse() 方法使用自定义 parser 或 JSON.parse
- ✅ Request.jsonStream() 传递 parser 参数
- ✅ 解析器错误通过 _onError 抛出
- ✅ 向后兼容性（无 parser 时使用 JSON.parse）
- ✅ 完整的测试用例

### Must NOT Have (Guardrails)
- 🚫 修改 JsonStream 的核心流处理逻辑
- 🚫 支持异步解析器（仅同步）
- 🚫 请求级别 parser 覆盖（仅客户端级别）

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES (tape + ts-node)
- **Automated tests**: YES (TDD)
- **Framework**: tape
- **TDD**: 每个功能实现前先写测试

---

## Execution Strategy

### Sequential Implementation (顺序依赖)

```
Task 1: 修改 JsonStream [deep]
└── 修改构造函数和 _parse() 方法

Task 2: 修改 Request.jsonStream() [quick]
└── 传递 parser 参数

Task 3: 添加测试用例 [quick]
└── 创建 stream-parser.test.ts

Task 4: 最终验证和清理 [quick]
└── 运行测试和编译

Critical Path: Task 1 → Task 2 → Task 3 → Task 4
```

---

## TODOs

- [ ] 1. 在 JsonStream 中添加 parser 支持

  **What to do**:
  - 修改 `src/json-stream.ts` 构造函数，添加 `parser?: (text: string) => any` 参数
  - 修改 `_parse()` 方法使用 `this.parser || JSON.parse`
  - 错误处理保持现有 try-catch 机制

  **Must NOT do**:
  - 不修改核心流处理逻辑
  - 不支持异步解析器

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: 需要理解现有的流处理逻辑和错误处理机制
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (后续任务依赖此任务)
  - **Blocks**: Task 2
  - **Blocked By**: None

  **References**:
  - `src/json-stream.ts:32-60` - 构造函数
  - `src/json-stream.ts:70-102` - `_parse()` 方法

  **Acceptance Criteria**:
  - [ ] 构造函数添加 parser 参数，默认值为 JSON.parse
  - [ ] `_parse()` 方法使用 `this.parser || JSON.parse`
  - [ ] 解析器错误通过 try-catch 包装
  - [ ] TypeScript 编译通过

  **QA Scenarios**:
  ```
  Scenario: JsonStream 使用自定义 parser
    Tool: Bash
    Steps:
      1. 创建带自定义 parser 的 JsonStream
      2. 发送 NDJSON 流数据
      3. 验证使用自定义 parser 解析
    Expected: 自定义 parser 被调用，返回正确数据
    Evidence: .sisyphus/evidence/task-1-stream-parser.txt
  ```

- [ ] 2. 修改 Request.jsonStream() 方法

  **What to do**:
  - 修改 `src/request.ts:195-201` 的 `jsonStream()` 方法
  - 传递 `this.client.options.parser` 到 JsonStream 构造函数

  **Must NOT do**:
  - 不修改其他方法
  - 不支持请求级别覆盖

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **References**:
  - `src/request.ts:195-201` - jsonStream() 方法

  **Acceptance Criteria**:
  - [ ] jsonStream() 方法正确传递 parser 参数
  - [ ] TypeScript 编译通过

- [ ] 3. 添加测试用例

  **What to do**:
  - 创建 `test/stream-parser.test.ts` 文件
  - 测试 1: 默认行为（JSON.parse）
  - 测试 2: 自定义解析器工作
  - 测试 3: 解析器错误处理

  **Must NOT do**:
  - 不修改现有测试

  **References**:
  - `test/client.ts` - 测试结构参考

  **Acceptance Criteria**:
  - [ ] 创建测试文件
  - [ ] 所有测试通过
  - [ ] 证据文件已保存

- [ ] 4. 最终验证和清理

  **What to do**:
  - 运行完整测试套件：`yarn test`
  - 运行编译检查：`yarn build`
  - 运行代码检查：`yarn eslint`

  **Acceptance Criteria**:
  - [ ] 所有测试通过
  - [ ] TypeScript 编译成功
  - [ ] ESLint 检查通过
  - [ ] 证据文件已保存

---

## Success Criteria

### Verification Commands
```bash
yarn test
yarn build
yarn eslint
```

### Final Checklist
- [ ] 所有 "Must Have" 实现
- [ ] 所有 "Must NOT Have" 不存在
- [ ] 所有测试通过
- [ ] TypeScript 编译成功
