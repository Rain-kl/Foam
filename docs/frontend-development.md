# 前端开发

包名（目标）：`foam-frontend`  
栈：React 19、Vite、TypeScript、Tailwind、shadcn/ui、React Router、TanStack Query、i18next

## 产品形态

管理端是 **示例画廊**，不是空 CRUD 壳：

- 保留 layout shell、表格/对话框/图表等模式
- 文案中性（Foam / demo）
- 画廊页优先 **mock/static 数据**
- 真实后端：登录会话 + health/version；表格页可选接 `/api/examples`

## 路由

| 路径 | 内容 |
| --- | --- |
| `/login` | 登录（中性文案） |
| `/example/component` | 组件合集：按钮、卡片、表格原语、对话框/Sheet、Tabs、表单、图表等 |
| `/example/page/dashboard` | 运营概览页模板 |
| `/example/page/table` | 列表页模板（筛选 + 表格 + 分页 + 批量操作） |
| `/example/page/chat` | 对话/创意页模板 |
| `/settings` | 系统设置（真实 API） |

- 登录后默认：`/example/page/dashboard`
- 定义文件：`frontend/src/app/router.tsx`
- 旧业务路径应 redirect 到上述示例路由，不要复活产品页

### 导航

App shell（`app/app-shell.tsx`）：

- Example → Component
- Example → Page → Dashboard / Table / Chat
- 侧栏底部：用户名 · 更多（外观/语言/改密/退出）· **设置图标**（`/settings`，在「更多」右侧）

设置页：左右分栏多 Tabs（通用 / 前端 API / 状态），布局对齐原管理端设置页。

## 代码布局

```text
frontend/src/
  main.tsx
  app/
    providers.tsx          # Query / theme / auth 等
    auth-boundary.tsx      # 登录态门禁
    app-shell.tsx          # 侧栏 + 顶栏 + Outlet
    router.tsx
    deferred-pages.tsx     # 懒加载页面出口
  features/
    auth/login-page.tsx
    example/
      component-page.tsx
      mock-data.ts
      dashboard-*.tsx      # dashboard 子块
      pages/
        dashboard-page.tsx
        table-page.tsx
        chat-page.tsx
  components/ui/           # 原子 shadcn 组件（无业务文案）
  shared/
    api/                   # fetch client、decoder、ApiError
    auth/                  # AuthProvider / useAuth
    components/            # PageHeader, DataTableShell, Pagination, …
    hooks/ lib/ config/ i18n/
```

## 组件复用规则

1. **原子 UI** 放 `components/ui`（Button、Dialog、Table…）
2. **跨页模式** 放 `shared/components`（PageHeader、DataTableShell、Pagination、DataState…）
3. **仅示例域** 放 `features/example`
4. 新增可视化组件：先抽到 `ui` 或 `shared`，再在 `/example/component` 展示
5. 避免复制粘贴第二套 Table/Dialog；合并后再展示

## 数据与 API

- HTTP 客户端：`shared/api/client.ts`  
  - 统一解析 `{ data }` / `{ error }` envelope  
  - access token + refresh 锁（session）
- 运行时配置：`shared/config/runtime-config.ts`（API base 等）
- 鉴权：`shared/auth` + `features/auth`
- 示例列表页当前可用 mock（`mock-data.ts`）；若接真实 CRUD，调用 `/api/examples` 并复用 decoder 模式

### 何时用 mock vs 真 API

| 场景 | 策略 |
| --- | --- |
| 组件展示、dashboard/chat 模板 | mock / 本地 state |
| 登录、改密、session | 真 API |
| 演示端到端 CRUD | 可选接 `/api/examples` |

## 文案与 i18n

- 字符串走 `shared/i18n`（`zh-CN` + `en`）
- 产品名：**Foam**
- 禁止恢复已删除业务域的文案键与导航项

## 本地开发

**日常调试（推荐）**：不必先 `pnpm build`。后端与 Vite 并行启动：

```bash
# 终端 1 — API :8000（可不依赖 frontend/dist）
cd backend && go run ./cmd/foam --config ../config.yaml

# 终端 2 — SPA + HMR :8010，反代 API 到后端
cd frontend
pnpm install
pnpm dev          # http://127.0.0.1:8010
```

Vite 将 `/api`、`/v1`、`/healthz`、`/readyz`、`/swagger` 代理到 `http://127.0.0.1:8000`（可用 `VITE_DEV_API_TARGET` 覆盖）。

```bash
pnpm lint
pnpm format        # biome format --write .
pnpm format:check
pnpm build         # tsc + vite build → dist/
```

**出包 / 嵌入模式**：`pnpm build` 后由 `foam` 通过 `frontend.staticPath`（默认 `./frontend/dist`）托管 SPA；访问 `server.listen`（默认 `:8000`）。开发代理与嵌入托管互不影响。

## 新增页面 checklist

1. 在 `features/<area>/` 写页面组件
2. 需要懒加载则挂到 `deferred-pages.tsx`
3. 在 `router.tsx` 注册路径（鉴权树下用 `AuthBoundary`）
4. 在 `app-shell` 导航增加入口（若需要）
5. 文案进 i18n
6. 能复用的抽到 `components/ui` 或 `shared/components`，并考虑挂到 component gallery
7. `pnpm build` 通过后再说完成

## 反模式

- 在 `components/ui` 写业务 API 调用
- 为每个页面复制一套 Table 壳
- 画廊页强依赖已删除的后端业务 API
- 不更新 router/nav 只加文件
