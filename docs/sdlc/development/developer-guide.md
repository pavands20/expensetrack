# Developer Guide

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start status -->
_Up to date._
<!-- sdlc:auto:end status -->

<!-- sdlc:auto:start source -->
Generated from commit `038787a` · model `auto`
<!-- sdlc:auto:end source -->

<!-- sdlc:auto:start overview -->
ExpenseTrack is an expense-claims app for a small company. It has three roles: Employee, Manager and Finance. Employees create draft claims with GBP lines and a receipt per line, then submit them. The employee's active manager approves or rejects first, then Finance. A rejected claim goes back to draft, and Finance marks approved claims paid. Finance also manages users and categories (with optional per-line limits), views monthly totals and exports approved lines as CSV. The repository holds two apps. backend/ is a FastAPI 0.115 service using SQLAlchemy 2, Alembic migrations (run automatically at startup), PostgreSQL via psycopg 3, Argon2 password hashing, bearer-token sessions and receipt storage (boto3/S3, or a local media directory). frontend/ is a Vite + React 19 + TypeScript SPA styled with Tailwind 4, using react-router and a small fetch client (src/lib/api.ts). Per frontend/README.md, the screens were generated from an approved design and run on seeded sample data, with wiring to real endpoints done screen by screen. Deployment is a GitHub Actions workflow: the API image is pushed to ECR and the frontend to AWS Amplify.
<!-- sdlc:auto:end overview -->

<!-- sdlc:auto:start prerequisites -->
- Python 3.12 (the backend Dockerfile uses python:3.12-slim)
- Node.js with npm (Vite 6 / React 19 toolchain)
- Docker with Docker Compose (for the local PostgreSQL 16 service in docker-compose.yml, and to build the API image)
- A PostgreSQL connection string for DATABASE_URL (required; the backend fails at import without it)
<!-- sdlc:auto:end prerequisites -->

<!-- sdlc:auto:start setup -->
1. Start the local database from the repo root: docker compose up -d db
2. Create the backend virtualenv where the Playwright config expects it, and install dependencies: cd backend && python -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt
3. Point the backend at the database. Use the user, password and database name defined in docker-compose.yml, on port 5432, and the psycopg driver from requirements.txt: export DATABASE_URL=<postgres-connection-string>
4. Optional, to have a Finance account to sign in with on first start: export BOOTSTRAP_ADMIN_EMAIL=<admin-email> BOOTSTRAP_ADMIN_PASSWORD=<admin-password>. SMOKE_TEST_EMAIL / SMOKE_TEST_PASSWORD likewise seed one Employee. See .env.example and ENVIRONMENT.md for the full list.
5. Run the API from backend/. On startup it migrates to the Alembic head, seeds the users above if they don't exist yet, and seeds categories: uvicorn app.main:app --reload
6. In a second terminal, start the frontend (http://localhost:5173, an origin the API allows by default): cd frontend && npm install && npm run dev
<!-- sdlc:auto:end setup -->

<!-- sdlc:auto:start run -->
| Name | Command | Description |
|---|---|---|
| db | `docker compose up -d db` | Starts PostgreSQL 16 (postgres:16-alpine) on port 5432 with a persistent db-data volume. |
| api dev | `cd backend && uvicorn app.main:app --reload` | Runs the FastAPI app with auto-reload on port 8000. Requires DATABASE_URL. Liveness is at /health and /api/healthz. |
| frontend dev | `cd frontend && npm run dev` | Vite dev server for the React SPA. |
| build | `cd frontend && npm run build` | Production bundle into frontend/dist. Does not typecheck. |
| preview | `cd frontend && npm run preview` | Serves the built bundle locally. |
| typecheck | `cd frontend && npm run typecheck` | Runs tsc --noEmit over src/. |
| lint (frontend) | `cd frontend && npm run lint` | ESLint over the app. The platform uses it as a gate, so keep it green. npm run lint:fix applies the fixes it can. |
| format (frontend) | `cd frontend && npm run format` | Prettier write. npm run format:check only verifies formatting. |
| lint (backend) | `cd backend && ruff check .` | Ruff lint using backend/ruff.toml. |
| format (backend) | `cd backend && ruff format .` | Ruff formatter. |
| api image | `docker build -t expensetrack-api ./backend` | Builds the API container. It runs uvicorn on port 8000 as a non-root user, with MEDIA_ROOT=/data/media and a /health healthcheck. |
<!-- sdlc:auto:end run -->

<!-- sdlc:auto:start structure -->
| Path | Purpose |
|---|---|
| `.devcontainer` | Dev container definition (devcontainer.json). |
| `.github/workflows` | deploy.yml: on push to main, builds and pushes the backend image to ECR and publishes the frontend build to AWS Amplify via OIDC. |
| `.quorq` | Platform handoff metadata (handoff.json). |
| `docs` | Product documentation: behaviour-rules.md and setup-guide.md. |
| `backend` | FastAPI service. Contains requirements.txt, Dockerfile, alembic.ini, pytest.ini and ruff.toml. |
| `backend/app` | Application code. main.py (app, CORS, startup migrate/seed), database.py, models.py, schemas.py, deps.py (auth dependencies), security.py, storage.py, email.py, routers/ (one module per feature: auth, users, categories, claims, receipts, approvals, history, payments, dashboard, reports) and services/ (business logic). |
| `backend/alembic` | Migration environment and versions 0001–0004 (identity, categories, claims, claim status changes). |
| `backend/scripts` | Operational helper check_connections.py. |
| `backend/tests` | Pytest suite: unit/API tests at the top level and acceptance-style tests in integration/, with shared fixtures in conftest.py. |
| `frontend` | Vite + React SPA. Contains package.json, vite.config.ts, tsconfig.json, eslint.config.js, .prettierrc and playwright.config.ts. |
| `frontend/src` | App.tsx (route table and nav shell), main.tsx, screens/ (one module per approved screen), components/, lib/ (api client, auth, ui/icon vocabulary, brand tokens), plus co-located *.test.tsx files. |
| `frontend/e2e` | Playwright acceptance specs, with helpers in support/. |
| `frontend/playwright-report` | Generated Playwright HTML report output. |
<!-- sdlc:auto:end structure -->

<!-- sdlc:auto:start conventions -->
- Backend: one APIRouter per feature module under app/routers. Every API path is prefixed /api/... except the /health liveness probe.
- Auth uses FastAPI dependencies from app.deps: require_auth for any signed-in user, require_finance for Finance-only routers (users, reports, category writes). Clients send the session as an Authorization: Bearer token, and only a hash of each token is stored.
- Pydantic schemas live in app/schemas.py with *In / *Out / *PatchIn suffixes. Patch and create bodies often use extra='forbid', and PATCH handlers use model_fields_set to tell 'omitted' apart from 'null'.
- Money is stored as Numeric(10,2) and returned as 2-decimal strings (amount_gbp, total_gbp, limit_gbp). Datetimes are timezone-aware UTC via the UTCDateTime type and serialized as ISO strings.
- Models use only portable column types so SQLite test databases work alongside PostgreSQL.
- Claim status flow is draft → pending_manager (or pending_finance if there is no active manager) → pending_finance → approved → paid. Rejection returns a claim to draft and requires a comment.
- Every status transition writes a ClaimStatusChange audit row via record_status_change. These rows are append-only: update and delete are refused by an event listener.
- State-changing claim actions read status under a row lock (locked_status / with_for_update) to serialize concurrent edits.
- Nobody can decide on or mark paid their own claim (assert_not_submitter). Managers can only decide on claims from their direct reports.
- Receipts must be JPEG, PNG or PDF, at most 5 MB, and are validated by content type plus magic bytes. They are stored under receipts/{claim}/{line}/{uuid}.{ext} and served through short-lived presigned or signed URLs.
- Schema changes go through Alembic migrations, which are applied automatically on app startup (lifespan → upgrade head).
- Frontend: the '@/...' import alias maps to src/. All HTTP goes through apiFetch in src/lib/api.ts, which keeps the session token in sessionStorage and redirects to /sign-in on 401.
- Frontend styling uses Tailwind utilities plus brand CSS variables (var(--brand-*)) defined in src/index.css and src/lib/brand.ts.
- Component tests (Vitest + Testing Library, jsdom) sit beside the code they cover in src/. Playwright specs live only in e2e/.
- Linting and formatting use ESLint + Prettier on the frontend and Ruff on the backend.
<!-- sdlc:auto:end conventions -->

<!-- sdlc:auto:start testing -->
| Name | Command | Description |
|---|---|---|
| backend tests | `cd backend && pytest` | Runs backend/tests, including integration/. pytest.ini sets pythonpath so `import app` works. Coverage support (pytest-cov) is installed. |
| frontend unit | `cd frontend && npm test` | Vitest component tests matching src/**/*.{test,spec}.{ts,tsx} in jsdom. |
| e2e browser install | `cd frontend && npm run test:e2e:install` | Downloads Chromium for Playwright. |
| e2e | `cd frontend && npm run test:e2e` | Playwright specs in e2e/. If E2E_BASE_URL is set, runs against that URL. Otherwise boots the backend with backend/.venv/bin/python on port 8000 and a built preview of the frontend on port 4173, then runs serially (workers: 1). |
<!-- sdlc:auto:end testing -->

<!-- sdlc:auto:start troubleshooting -->
| Problem | Solution |
|---|---|
| Backend crashes on import with KeyError: 'DATABASE_URL'. | app/database.py reads DATABASE_URL with no default. Export it before running uvicorn, pytest or the Playwright web server. |
| Playwright's backend web server fails to start. | The config runs ../backend/.venv/bin/python, so create the virtualenv at backend/.venv and install requirements.txt into it. Its comment says the backend defaults to SQLite, but database.py requires DATABASE_URL, so make sure that variable is set in the environment Playwright inherits. |
| Browser shows CORS errors calling the API. | Without ALLOWED_ORIGINS only http://localhost:5173 and http://127.0.0.1:5173 are allowed. Use the Vite dev server on that port, or set ALLOWED_ORIGINS to a comma-separated list of your origins. |
| Frontend calls the wrong API host. | API_BASE_URL comes from VITE_API_BASE_URL at build time and falls back to http://localhost:8000. Set it before `npm run build` / `npm run dev` when the API is elsewhere. |
| No account to sign in with on a fresh database. | There is no self sign-up. Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD before starting the API, and it creates a Finance user once. That user can then create other users through /api/users. |
| `npm run build` succeeds but deployment or type errors surface later. | The build does not typecheck. Run `npm run typecheck` and fix the reported errors. |
| Playwright fails with a missing browser executable. | Run `npm run test:e2e:install` first. |
| Chromium crashes during e2e runs in a container. | The config already passes --disable-dev-shm-usage. If it still crashes, increase the container's shared memory or run with fewer resources competing. |
| A shared API key appears as a literal value in .github/workflows/deploy.yml (VITE_API_SECRET_KEY / NEXT_PUBLIC_API_SECRET_KEY). | Treat the committed value as exposed. Rotate it and move it to a GitHub Actions secret referenced as ${{ secrets.<name> }} rather than a literal. Values with the VITE_ prefix are inlined into the public bundle anyway. |
<!-- sdlc:auto:end troubleshooting -->
