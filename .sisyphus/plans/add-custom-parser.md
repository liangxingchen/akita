# 添加自定义解析器选项到 ClientOptions

## TL;DR

> **Quick Summary**: 添加 `parser` 选项到 `ClientOptions` 接口，支持 XML 等非 JSON 格式的响应解析， 
> **Deliverables**:
> - `index.d.ts` 中新增 `parser` 类型定义
> - `src/request.ts` 中修改解析逻辑使用自定义解析器
> - 测试文件验证功能正确性
> 
> **Estimated Effort**: Short
> **Parallel Execution**: NO - Sequential implementation
> **Critical Path**: 类型定义 → 解析逻辑修改 → 测试

---

## Context

### Original Request
在 ClientOptions 中增加 parser 可选项，值为函数 `(text:string)=>any`。如果没有传此自定义解析函数，客户端在解析数据时用 JSON.parse。否则用此自定义函数解析，以实现 XML 等数据格式的解析。

### Interview Summary
**Key Discussions**:
- **解析范围**: JsonStream（NDJSON）继续使用 JSON.parse，不使用自定义解析器
- **配置级别**: 仅支持客户端级别，不支持请求级别覆盖
- **错误响应**: HTTP 错误响应也使用自定义解析器进行解析
- **错误处理**: 解析器抛出的错误包装为 ParseError

**Research Findings**:
- **JSON.parse 位置**: 
  1. `src/request.ts:318` - `_decode()` 方法，成功响应解析
  2. `src/request.ts:356` - `data()` 方法，错误响应解析
  3. `src/json-stream.ts:79` - NDJSON 流解析（**不修改**）
  4. `src/fetch.ts:37` - 微信小程序 polyfill（**不修改**）
- **选项访问**: Request 类可通过 `this.client.options` 访问配置

### Metis Review
**Identified Gaps** (addressed):
- **NDJSON 范围**: 明确 JsonStream 不使用自定义解析器
- **请求级别覆盖**: 明确不支持，保持简单
- **错误处理**: 明确包装解析器错误
- **边缘情况**: 204 No Content 跳过解析器

---

## Work Objectives

### Core Objective
在 ClientOptions 中添加 `parser` 选项，允许用户自定义响应解析逻辑，同时保持向后兼容性。

### Concrete Deliverables
1. `index.d.ts` - 在 ClientOptions 接口中添加 `parser?: (text: string) => any` 选项
2. `src/request.ts` - 修改 `_decode()` 和 `data()` 方法使用自定义解析器
3. `test/parser.test.ts` - 添加测试用例验证功能

### Definition of Done
- [ ] TypeScript 编译通过：`yarn build`
- [ ] 所有测试通过：`yarn test`
- [ ] 自定义解析器功能正常工作
- [ ] 默认行为（JSON.parse）保持不变
- [ ] 错误正确包装为 ParseError

### Must Have
- ✅ `parser` 选项添加到 ClientOptions 接口
- ✅ `_decode()` 方法使用自定义解析器
- ✅ `data()` 方法中的错误解析使用自定义解析器
- ✅ 解析器错误包装为 ParseError
- ✅ 向后兼容性（无 parser 时使用 JSON.parse）
- ✅ 完整的测试用例

### Must NOT Have (Guardrails)
- 🚫 修改 JsonStream 的解析逻辑（NDJSON 保持 JSON.parse）
- 🚫 修改 src/fetch.ts 微信小程序 polyfill
- 🚫 添加请求级别的 parser 覆盖
- 🚫 支持异步解析器
- 🚫 修改现有的错误检测逻辑（`{error: 'msg'}` 检查）

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES (tape + ts-node)
- **Automated tests**: YES (TDD)
- **Framework**: tape
- **TDD**: 每个功能实现前先写测试

### QA Policy
每个任务包含 Agent-Executed QA Scenarios：
- 使用 Bash 运行测试
- 验证编译成功
- 验证测试通过

---

## Execution Strategy

### Sequential Implementation (顺序依赖)

```
Task 1: 类型定义 [quick]
└── 修改 index.d.ts 添加 parser 选项

Task 2: 修改解析逻辑 [deep]
└── 修改 src/request.ts 的两个位置

Task 3: 添加测试用例 [quick]
└── 创建 test/parser.test.ts

Task 4: 验证与清理 [quick]
└── 运行测试和编译

Critical Path: Task 1 → Task 2 → Task 3 → Task 4
```

### Dependency Matrix
- **1**: — — 2
- **2**: 1 — 3
- **3**: 2 — 4
- **4**: 3 —

---

## TODOs

- [x] 1. 在 ClientOptions 接口中添加 parser 选项

  **What to do**:
  - 在 `index.d.ts` 的 ClientOptions 接口中添加 `parser?: (text: string) => any` 选项
  - 添加中文注释说明用法和用途
  - 提供示例代码

  **Must NOT do**:
  - 不修改其他现有选项
  - 不改变接口结构

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 简单的类型定义修改，不涉及复杂逻辑
  - **Skills**: []
    - 无需特殊技能

  **Parallelization**:
  - **Can Run In Parallel**: NO (后续任务依赖此任务)
  - **Parallel Group**: Sequential
  - **Blocks**: Task 2
  - **Blocked By**: None (可立即开始)

  **References**:
  
  **Pattern References** (existing code to follow):
  - `index.d.ts:973-1074` - ClientOptions 接口定义模式
  - `index.d.ts:1016` - init 选项的定义格式（参考注释风格）
  
  **Acceptance Criteria**:
  - [ ] parser 选项添加到 ClientOptions 接口
  - [ ] 包含完整的中文 JSDoc 注释
  - [ ] 包含使用示例
  - [ ] TypeScript 类型正确：`(text: string) => any`

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: 类型定义编译通过
    Tool: Bash
    Preconditions: index.d.ts 已修改
    Steps:
      1. 运行 `yarn build`
      2. 检查编译输出无错误
    Expected Result: 编译成功，无 TypeScript 错误
    Failure Indicators: TypeScript 编译错误
    Evidence: .sisyphus/evidence/task-1-typecheck.txt

  Scenario: 类型推断正确
    Tool: Bash
    Preconditions: 类型定义已添加
    Steps:
      1. 创建临时文件测试类型推断
      2. 验证 parser 选项是可选的
      3. 验证函数签名正确
    Expected Result: TypeScript 正确推断 parser 类型
    Failure Indicators: 类型推断失败
    Evidence: .sisyphus/evidence/task-1-type-inference.txt
  ```

  **Evidence to Capture**:
  - [ ] 编译输出日志
  - [ ] 类型推断验证

  **Commit**: NO (groups with Task 2)
  - Message: `feat(options): add parser option to ClientOptions`
  - Files: `index.d.ts`

---

- [x] 2. 修改 Request 类的解析逻辑使用自定义解析器

  **What to do**:
  - 修改 `src/request.ts:318` 的 `_decode()` 方法
  - 修改 `src/request.ts:356` 的错误解析逻辑
  - 实现逻辑：`const parse = this.client.options.parser || JSON.parse`
  - 错误处理：用 `createParseError` 包装解析器错误
  - 保持向后兼容性（无 parser 时使用 JSON.parse）

  **Must NOT do**:
  - 不修改 JsonStream 的解析逻辑
  - 不修改 src/fetch.ts
  - 不改变现有的错误检测逻辑（`{error: 'msg'}` 检查）

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: 需要理解现有的错误处理流程和 Promise 链
  - **Skills**: []
    - 无需特殊技能

  **Parallelization**:
  - **Can Run In Parallel**: NO (依赖 Task 1)
  - **Parallel Group**: Sequential
  - **Blocks**: Task 3
  - **Blocked By**: Task 1

  **References**:
  
  **Pattern References**:
  - `src/request.ts:313-329` - `_decode()` 方法现有实现
  - `src/request.ts:345-384` - `data()` 方法现有实现
  - `src/utils.ts` - `createParseError` 函数定义
  
  **API/Type References**:
  - `src/request.ts:40` - `client: Client` 属性（访问 options）
  
  **WHY Each Reference Matters**:
  - `_decode()` 方法是主要解析入口，需要替换 JSON.parse
  - `data()` 方法中的错误解析也需要使用自定义解析器
  - `createParseError` 用于包装解析器错误，保持一致性

  **Acceptance Criteria**:
  - [ ] `_decode()` 方法使用自定义解析器
  - [ ] `data()` 方法错误解析使用自定义解析器
  - [ ] 解析器错误正确包装为 ParseError
  - [ ] 无 parser 时使用 JSON.parse（向后兼容）
  - [ ] TypeScript 编译通过

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: 自定义解析器正常工作（成功响应）
    Tool: Bash
    Preconditions: Task 1 完成，src/request.ts 已修改
    Steps:
      1. 创建测试脚本：使用自定义解析器创建客户端
      2. 发送请求到测试服务器
      3. 验证响应使用自定义解析器解析
    Expected Result: 响应通过自定义解析器解析，返回预期数据
    Failure Indicators: 响应仍使用 JSON.parse 解析
    Evidence: .sisyphus/evidence/task-2-custom-parser-success.txt

  Scenario: 自定义解析器处理错误响应
    Tool: Bash
    Preconditions: 测试服务器返回错误响应
    Steps:
      1. 创建带自定义解析器的客户端
      2. 请求返回错误的端点
      3. 验证错误响应也使用自定义解析器
    Expected Result: 错误响应使用自定义解析器解析，正确识别服务器错误
    Failure Indicators: 错误响应未使用自定义解析器
    Evidence: .sisyphus/evidence/task-2-custom-parser-error.txt

  Scenario: 解析器错误正确包装
    Tool: Bash
    Preconditions: 自定义解析器抛出错误
    Steps:
      1. 创建会抛出错误的解析器
      2. 发送请求
      3. 捕获错误并验证类型
    Expected Result: 错误被包装为 ParseError，原始错误在 cause 字段中
    Failure Indicators: 错误未被包装或类型不正确
    Evidence: .sisyphus/evidence/task-2-parser-error-wrapping.txt

  Scenario: 默认行为保持不变（无 parser）
    Tool: Bash
    Preconditions: 客户端未配置 parser
    Steps:
      1. 创建无 parser 的客户端
      2. 发送请求到返回 JSON 的端点
      3. 验证响应使用 JSON.parse 解析
    Expected Result: 响应正常解析为 JSON，现有行为保持不变
    Failure Indicators: 默认 JSON 解析失败
    Evidence: .sisyphus/evidence/task-2-default-behavior.txt
  ```

  **Evidence to Capture**:
  - [ ] 自定义解析器工作日志
  - [ ] 错误包装验证
  - [ ] 默认行为验证

  **Commit**: NO (groups with Task 3)
  - Message: `feat(parser): implement custom parser in Request class`
  - Files: `src/request.ts`

---

- [x] 3. 添加完整的测试用例

  **What to do**:
  - 创建 `test/parser.test.ts` 文件
  - 测试 1: 默认行为（无 parser，使用 JSON.parse）
  - 测试 2: 自定义解析器正常工作
  - 测试 3: 解析器错误正确包装
  - 测试 4: 错误响应使用自定义解析器
  - 测试 5: 204 No Content 跳过解析器

  **Must NOT do**:
  - 不测试 JsonStream（不在范围内）
  - 不测试请求级别覆盖（不支持）

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 标准的单元测试编写
  - **Skills**: []
    - 无需特殊技能

  **Parallelization**:
  - **Can Run In Parallel**: NO (依赖 Task 2)
  - **Parallel Group**: Sequential
  - **Blocks**: Task 4
  - **Blocked By**: Task 2

  **References**:
  
  **Pattern References**:
  - `test/client.test.ts` - 现有测试文件结构和风格
  - `test/utils.ts` - 测试工具函数
  
  **API/Type References**:
  - `test/utils.ts:createMockFetch()` - 创建 mock fetch 的工具
  
  **Test References**:
  - `test/client.test.ts:1-50` - 测试文件结构示例

  **WHY Each Reference Matters**:
  - 需要遵循现有测试风格和结构
  - 使用 createMockFetch 创建测试环境

  **Acceptance Criteria**:
  - [ ] 测试文件创建：test/parser.test.ts
  - [ ] 测试 1: 默认行为（JSON.parse）
  - [ ] 测试 2: 自定义解析器工作
  - [ ] 测试 3: 解析器错误包装
  - [ ] 测试 4: 错误响应解析
  - [ ] 测试 5: 204 No Content
  - [ ] 所有测试通过：`yarn test`

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: 测试用例运行成功
    Tool: Bash
    Preconditions: test/parser.test.ts 已创建
    Steps:
      1. 运行 `yarn test test/parser.test.ts`
      2. 检查所有测试通过
    Expected Result: 所有 5 个测试用例通过，0 failures
    Failure Indicators: 任何测试失败
    Evidence: .sisyphus/evidence/task-3-tests-pass.txt

  Scenario: 测试覆盖率
    Tool: Bash
    Preconditions: 测试通过
    Steps:
      1. 运行 `yarn cover`
      2. 检查 parser 相关代码覆盖率
    Expected Result: 新增代码覆盖率 ≥ 80%
    Failure Indicators: 覆盖率过低
    Evidence: .sisyphus/evidence/task-3-coverage.txt
  ```

  **Evidence to Capture**:
  - [ ] 测试运行输出
  - [ ] 覆盖率报告

  **Commit**: NO (groups with Task 4)
  - Message: `test(parser): add tests for custom parser option`
  - Files: `test/parser.test.ts`

---

- [x] 4. 最终验证和清理

  **What to do**:
  - 运行完整测试套件：`yarn test`
  - 运行编译检查：`yarn build`
  - 运行代码检查：`yarn eslint`
  - 验证所有测试通过
  - 验证 TypeScript 编译无错误
  - 验证代码风格符合规范

  **Must NOT do**:
  - 不修改功能代码（仅验证）
  - 不跳过任何检查

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 简单的验证和清理任务
  - **Skills**: []
    - 无需特殊技能

  **Parallelization**:
  - **Can Run In Parallel**: NO (依赖 Task 3)
  - **Parallel Group**: Sequential
  - **Blocks**: None (最终任务)
  - **Blocked By**: Task 3

  **References**:
  
  **Pattern References**:
  - 无（验证任务）

  **Acceptance Criteria**:
  - [ ] 所有测试通过：`yarn test`
  - [ ] TypeScript 编译成功：`yarn build`
  - [ ] ESLint 检查通过：`yarn eslint`
  - [ ] 无遗留的调试代码或注释

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: 完整测试套件通过
    Tool: Bash
    Preconditions: 所有代码修改完成
    Steps:
      1. 运行 `yarn test`
      2. 检查输出显示所有测试通过
    Expected Result: 所有测试通过，包括新增的 parser 测试
    Failure Indicators: 任何测试失败
    Evidence: .sisyphus/evidence/task-4-all-tests-pass.txt

  Scenario: TypeScript 编译成功
    Tool: Bash
    Preconditions: 代码修改完成
    Steps:
      1. 运行 `yarn build`
      2. 检查编译输出无错误
      3. 验证 lib/ 目录生成正确
    Expected Result: 编译成功，lib/ 目录包含更新后的代码
    Failure Indicators: TypeScript 编译错误
    Evidence: .sisyphus/evidence/task-4-build-success.txt

  Scenario: 代码风格检查通过
    Tool: Bash
    Preconditions: 代码修改完成
    Steps:
      1. 运行 `yarn eslint`
      2. 检查无 linting 错误
    Expected Result: ESLint 检查通过，无错误
    Failure Indicators: ESLint 报告错误
    Evidence: .sisyphus/evidence/task-4-eslint-pass.txt
  ```

  **Evidence to Capture**:
  - [ ] 完整测试输出
  - [ ] 编译输出
  - [ ] ESLint 输出

  **Commit**: YES (final commit)
  - Message: `feat(parser): add custom parser option to ClientOptions

- Add parser?: (text: string) => any option to ClientOptions
- Modify Request class to use custom parser
- Add comprehensive tests
- Support XML and other non-JSON formats`
  - Files: All modified files
  - Pre-commit: `yarn test && yarn build`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `tsc --noEmit` + linter + `bun test`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (data/result/item/temp).
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill if UI)
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration (features working together, not isolation). Test edge cases: empty state, invalid input, rapid actions. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination: Task N touching Task M's files. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **Task 1-3**: NO (groups with next task)
- **Task 4**: YES (final commit)
  - Message: `feat(parser): add custom parser option to ClientOptions

- Add parser?: (text: string) => any option to ClientOptions
- Modify Request class to use custom parser
- Add comprehensive tests
- Support XML and other non-JSON formats`
  - Files: `index.d.ts`, `src/request.ts`, `test/parser.test.ts`
  - Pre-commit: `yarn test && yarn build`

---

## Success Criteria

### Verification Commands
```bash
# 运行所有测试
yarn test

# 编译检查
yarn build

# 代码风格检查
yarn eslint

# 测试覆盖率
yarn cover
```

### Final Checklist
- [ ] 所有 "Must Have" 实现
  - [ ] parser 选项添加到 ClientOptions
  - [ ] _decode() 使用自定义解析器
  - [ ] data() 错误解析使用自定义解析器
  - [ ] 解析器错误包装为 ParseError
  - [ ] 向后兼容性保持
  - [ ] 完整的测试用例
- [ ] 所有 "Must NOT Have" 不存在
  - [ ] JsonStream 未修改
  - [ ] src/fetch.ts 未修改
  - [ ] 无请求级别覆盖
  - [ ] 无异步解析器支持
  - [ ] 错误检测逻辑未改变
- [ ] 所有测试通过
- [ ] TypeScript 编译成功
- [ ] ESLint 检查通过
- [ ] 测试覆盖率 ≥ 80%
