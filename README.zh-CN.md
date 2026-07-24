# Foam

全栈开发脚手架：Go 后端 + React 管理端 SPA。

## 技术栈

- **后端：** Go、Gin、GORM、SQLite / PostgreSQL
- **前端：** React、TypeScript、Vite、Tailwind CSS、shadcn/ui
- **运维：** 多阶段 Docker 镜像、docker compose、GHCR 发布工作流

## 快速开始

```bash
cp config.example.yaml config.yaml
# 填写 secrets.jwtSecret、secrets.credentialEncryptionKey、bootstrapAdmin.password

# 或仓库根并行启动
make dev              # 前端 :8010 + 后端 :8000

# 分终端
cd backend && go run ./cmd/foam --config ../config.yaml
cd frontend && pnpm install && pnpm dev
```

开发 UI：`http://127.0.0.1:8010` → 反代 API → `http://127.0.0.1:8000`。  
出包嵌入：`make build-embedded` → `bin/foam` + `frontend/dist`（`frontend.staticPath` 托管）。

常用目标：`make format`、`make code-check`、`make build-backend`、`make build-frontend`、`make build-test`、`make cross-build`。

Docker：

```bash
cp config.example.yaml config.yaml
# 修改密钥后：
docker compose up -d
docker compose logs -f foam
```

后端默认监听：`http://127.0.0.1:8000`。

## 目录结构

```text
backend/          Go 模块（github.com/Rain-kl/Foam/backend）
  cmd/foam/       进程入口
  internal/       应用、领域、基础设施、传输层
frontend/         React 管理端 SPA
config.example.yaml
docker-compose.yml
Dockerfile
```

## 文档

- [后端](./backend/README.md)
- [前端](./frontend/README.md)
- [English overview](./README.md)

## 许可证

MIT — 见 [LICENSE](./LICENSE)。
