# AI Coding Agent Guide

- Stack: Fastify + Prisma (SQLite path from env) in `api/`; SvelteKit client in `client/`; Meilisearch for search; Docker Compose wiring via `docker-compose.yml`.
- Dev workflow: `docker compose up -d` to run API (3000), client (5173), Meilisearch (7700). API alone: `cd api && npm install && npx prisma generate && npm run dev`. Client alone: `cd client && npm install && npm run dev -- --host`.
- Tests: only Playwright e2e in `client/tests`; run with `npm run test:e2e` (uses dev server from config). No backend test suite.
- API entrypoint `api/src/server.ts`: registers CORS, rate-limit (per route), multipart (5 MB cap), static `/uploads`, health at `/health` and `/api/health`, initializes Meilisearch index on boot.
- Auth: JWT with `Authorization: Bearer` header. Roles are `ADMIN` or `WRITER` (`api/src/types.ts`). Middlewares: `verifyToken` attaches `request.user`; `requireRole` guards routes.
- Routes (prefixes already applied in `server.ts`):
  - `authRoutes` `/api/auth`: register/login, `me`, `admin` demo endpoints.
  - `qaRoutes` `/api/qa`: CRUD for Q&A pages. Create/update/delete require auth (writer+). Publish/reject require admin. Public GET by id/slug respects status (throws 401/403 for drafts when not owner/admin).
  - `metadataRoutes` `/api`: tags & categories. Admin-only POST, public GET. Tag names normalized (lowercase, no spaces) in `MetadataService`.
  - `searchRoutes` `/api/search`: Meilisearch query; filters combine status/type/category/tags; status forced to `PUBLISHED`.
  - `diagnosisRoutes` `/api/diagnosis-flows`: CRUD + traversal of decision trees; create/update admin-only; graph validated for cycles and start node.
  - `analyticsRoutes` `/api/analytics`: POST `/view/:id` increments `viewCount`; GET `/popular` returns published pages ordered by `viewCount`.
  - `uploadRoutes` `/api/upload`: multipart image upload (PNG/JPEG only); saves under `uploads/` and returns public URL.
- Data layer: Prisma client in `api/src/utils/db.ts`; schema in `api/prisma/schema.prisma` (check for models). Analytics service instantiates its own Prisma client in `analytics.service.ts`.
- QA domain rules (`QAService` + `WorkflowService`):
  - Slugs generated from titles and kept unique; Markdown converted to `contentText` (for search) via `remove-markdown`.
  - Status transitions: writers can move `DRAFT -> REVIEW`; admins can move any -> any (publish/reject). `transitionStatus` enforces ownership unless admin.
  - Meilisearch indexing only keeps `PUBLISHED` documents (`SearchService.indexDocument` drops others). Always call `SearchService.indexDocument` after CRUD/status changes so search stays in sync; deletion calls `removeDocument`.
- Search specifics (`SearchService`): index `qa_pages` with primary key `id`; searchable fields `title/contentText/tags`; filterable `type/status/categoryId/tags`; sorts allow `createdAt/viewCount`. Filters built as Meilisearch filter strings.
- Diagnosis flows: nodes/edges stored as JSON strings; `validateFlow` enforces existing nodes, start node, at least one solution, no cycles. Traversal endpoint returns current node, options, and linked QA solution metadata if present.
- File uploads: 5 MB enforced by multipart plugin; uploads directory ensured at server start and per route.
- Client: SvelteKit app with routes under `client/src/routes`; uses `VITE_API_BASE_URL` (set to `/api` in Playwright config). Styling via Tailwind; editor uses TipTap. Keep prerender flag in `+page.ts` where set.
- Misc: Make targets `build|up|down|logs` wrap docker compose. Default envs in `docker-compose.yml` (MEILI_HOST/KEY, JWT_SECRET placeholder) — adjust for production.

If anything above is unclear or missing, tell me what to refine and I’ll update this guide.