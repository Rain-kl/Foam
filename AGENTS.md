# AGENTS.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

## Git 提交规范

遵循 Conventional Commits：`<type>(<scope>): <subject>`（例：`feat(auth): support email login`）。

更细的长文按需阅读：`docs/architecture.md`、`docs/backend-development.md`、`docs/frontend-development.md`、`docs/directory-map.md`。

## 务必阅读匹配的 Skill

技能目录：`.agents/skills/<name>/SKILL.md`。

| Skill | 何时使用 |
| :--- | :--- |
| `new-api` | 添加或修改业务 API、垂直切片、Handler、application service、repository、路由注册（**优先读**） |
| `shadcn` | 添加、修改或组合 shadcn/ui 组件 |
| `code-review-skill` | 代码评审、PR 检查清单 |
| `release-guide` | 版本发布、Version Bump、Release 说明 |
| `database-migration` | 新增/修改表结构、索引、goose SQL（`migrator/goose/{postgres,sqlite}`）；**禁止生产 AutoMigrate** |

## 严格遵循事项 (Guardrails)

- 切勿删除 `frontend/node_modules`。
- **分层依赖**：`transport → application → domain`；`infra` / `repository` 实现通过接口注入；`domain` 禁止依赖 HTTP / DB / Gin / GORM。
- **扩展靠复制**：新业务资源优先完整复制 `example` 切片（domain / application / repository 接口 / relational 实现 / HTTP handler），再改名并接线到 `internal/app` 与 `transport/http/server.go`。
- **禁止**套用 Wavelet 的 `internal/apps/*`、`logics.go`、`internal/router/v1/*` 结构；Foam 的 HTTP 入口是 `backend/internal/transport/http/server.go`。
- 测试禁止硬编码相对路径创建临时目录，统一使用 `t.TempDir()`。
- API JSON 字段使用 **snake_case**；统一响应信封 `{ "error_msg": "", "data": ... }`（`internal/shared/response`）。
- 成功用 `response.Success` / `response.OK`；失败用 `response.Error` 或 `response.Abort*`（HTTP 状态码表达错误，body 不写独立 `error.code` 对象）。
- 管理端业务路由默认挂在 `/api/v1/admin/...`，使用 `middleware.AdminAuth`（`Authorization: Bearer`）；用户鉴权在 `/api/v1/user/*`。
- 组合根只在 `internal/app` wiring；禁止在 handler 里 new 全局单例或直接拼 SQL。
- 中性文案：UI、注释、提交说明使用 Foam / demo 用语。
- **证据再收工**：声称完成 / 通过 / 修好前，必须实际跑验证命令并贴出关键输出（`go test` / build / 路由 smoke）。
- 修改 API Handler 后视需要运行 `make swagger`；完成开发后应运行 `make format` 与 `make code-check`（或等价命令）。

## 技术栈与项目目录结构

### 技术栈

- **后端**：Go 1.26、Gin、GORM、SQLite / PostgreSQL、JWT + refresh cookie、Swaggo（可选）。
- **前端**：React 19、Vite、TypeScript、Tailwind CSS、pnpm、shadcn/ui、React Router、TanStack Query、i18next。

## 后端开发规范

### API 路径与响应

- **前缀**：`/api` + `/api/v1/...`；管理端 `/api/v1/admin/...`；用户鉴权 `/api/v1/user/...`。
- **探活**：`GET /api/health`（信封）；`/healthz`、`/readyz` 为探针别名。
- **信封**：

```json
{ "error_msg": "", "data": {} }
{ "error_msg": "未登录", "data": null }
```

- **成功**：`response.Success(c, status, data)` 或 `c.JSON(status, response.OK(data))`。
- **失败**：`response.Error(c, status, code, message)` 或 `Abort*`；禁止用 HTTP 200 携带业务失败。
- **列表**：`data` 内建议 `{ "items", "total", "page", "page_size" }`。
- **鉴权**：`Authorization: Bearer <access_token>`；refresh cookie `foam_admin_refresh` Path=`/api/v1/user`。

### 分层与新增资源

1. 复制 `example` 垂直切片并改名（见 skill `new-api`）。
2. `relational`：`models.go` / `schema.go` / mapping / repository 实现。
3. `app.New` 注入 service → `httpserver.Dependencies`。
4. `server.go` 将 handler 挂到 `admin`（或明确公开的）组。
5. 补 application / handler 测试；`cd backend && go test ./...`。

### 数据库

- 驱动：`sqlite`（本地默认）或 `postgres`（`config.yaml` → `database.driver`）。
- **Schema 迁移**：`pressly/goose` + 嵌入 SQL（`internal/infra/persistence/migrator/goose/{postgres,sqlite}`），启动时 `InitializeSchema` → `migrator.Up`。
- GORM model 仅做读写映射；**生产路径禁止 AutoMigrate**。双方言同版本号、同文件名；无物理外键。
- 禁止在 Handler 写复杂 SQL；映射错误经 repository 边界处理，勿把底层错误细节直接返回客户端。

## 前端开发规范

- 开发：`pnpm dev`（`:8010` HMR + API 反代）；出包：`pnpm build` → 后端 `frontend.staticPath` 托管 `dist`（嵌入模式）。
- 画廊页优先 **mock/static**；真 API 仅登录会话、设置、可选 example CRUD。
- 路由与导航：`src/app/router.tsx`、`app-shell.tsx`；设置入口在侧栏底部「更多」右侧。
- API 调用走 `shared/api/client.ts`（解析 `error_msg` + `data`）；路径与后端 Wavelet 风格一致。
- 原子 UI 放 `components/ui`；跨页模式放 `shared/components`；域内逻辑放 `features/<area>`。
- 优先 shadcn `variant` 与 CSS 变量，避免业务里硬编码颜色。
- 文案走 i18n（`zh-CN` + `en`）；产品名 **Foam**。