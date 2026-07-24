# Foam

Full-stack development scaffold: a Go backend with a React admin SPA.

## Stack

- **Backend:** Go, Gin, GORM, SQLite / PostgreSQL
- **Frontend:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Ops:** Docker multi-stage image, docker compose, GHCR publish workflow

## Quick start

```bash
cp config.example.yaml config.yaml
# set secrets.jwtSecret, secrets.credentialEncryptionKey, bootstrapAdmin.password

# or from repo root (parallel)
make dev              # frontend :8010 + backend :8000

# manual terminals
cd backend && go run ./cmd/foam --config ../config.yaml
cd frontend && pnpm install && pnpm dev
```

Dev UI: `http://127.0.0.1:8010` → API proxy → `http://127.0.0.1:8000`.  
Production embed: `make build-embedded` → `bin/foam` + `frontend/dist` (served via `frontend.staticPath`).

Useful targets: `make format`, `make code-check`, `make build-backend`, `make build-frontend`, `make build-test`, `make cross-build`.

Docker:

```bash
cp config.example.yaml config.yaml
# edit secrets, then:
docker compose up -d
docker compose logs -f foam
```

Default backend listen address: `http://127.0.0.1:8000`.

## Layout

```text
backend/          Go module (github.com/Rain-kl/Foam/backend)
  cmd/foam/       process entry
  internal/       app, domain, infra, transport
frontend/         React admin SPA
config.example.yaml
docker-compose.yml
Dockerfile
```

## Docs

- [Backend](./backend/README.md)
- [Frontend](./frontend/README.md)
- [Chinese overview](./README.zh-CN.md)

## License

MIT — see [LICENSE](./LICENSE).
