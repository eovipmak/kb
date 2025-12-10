# Knowledge Base app

Fastify + Prisma API with Meilisearch search and a SvelteKit client. Docker Compose wires API (3000), client (5173), and Meilisearch (7700).

## Quick start

- Prereqs: Node 18+, npm; Docker (for full stack). Env defaults are in `docker-compose.yml`.
- Full stack: `docker compose up -d` (builds API/client, runs Meilisearch). Services: API `http://localhost:3000`, client `http://localhost:5173`, Meilisearch `http://localhost:7700`.
- API only: `cd api ; npm install ; npx prisma generate ; npm run dev` (uses SQLite at `DATABASE_URL`, default `file:/app/prisma/dev.db`).
- Client only: `cd client ; npm install ; npm run dev -- --host` (expects `VITE_API_BASE_URL` env; Playwright config uses `/api`).

## Tests

- E2E only: `cd client ; npm run test:e2e` (Playwright). Spins up dev server per `playwright.config.ts`.

## Project layout

- `api/` Fastify API, Prisma schema/migrations, services (QA, search, analytics, diagnosis flows), JWT auth middleware, uploads, Meilisearch integration.
- `client/` SvelteKit app, TipTap editor, Tailwind styles, routes in `src/routes`.
- `docker-compose.yml` compose file; `Makefile` shortcuts `build|up|down|logs`.

## API highlights

- Auth: JWT (`Authorization: Bearer`), roles `ADMIN`/`WRITER`. Middlewares in `api/src/middleware/auth.middleware.ts`.
- QA pages: CRUD + status workflow (`DRAFT -> REVIEW -> PUBLISHED/REJECT`), slugs auto-unique, markdown stripped to `contentText` for search. Meilisearch indexes published pages only (`SearchService`).
- Metadata: tags normalized (lowercase, no spaces) and categories (kebab-case slug).
- Search: `/api/search` builds Meilisearch filters (status forced to published; filterable type/status/category/tags; sortable created/viewCount).
- Diagnosis flows: admin CRUD, stored as JSON nodes/edges; validation ensures start node, no cycles, at least one solution; traversal endpoint can surface linked QA solution metadata.
- Analytics: `/api/analytics/view/:id` increments `viewCount`; `/popular` returns published pages ordered by view count.
- Uploads: `/api/upload` multipart PNG/JPEG only, 5 MB limit, serves under `/uploads/`.

## Environment

- Key vars: `DATABASE_URL` (SQLite file path), `JWT_SECRET`, `MEILI_HOST`, `MEILI_MASTER_KEY`, optional `VITE_API_BASE_URL` for client.

## Notes

- Prisma clients: main client in `api/src/utils/db.ts`; analytics service instantiates its own.
- Remember to `SearchService.indexDocument` or `removeDocument` after QA mutations to keep Meilisearch in sync (services already call it).
