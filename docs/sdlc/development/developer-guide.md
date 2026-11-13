# Developer Guide

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start status -->
_Up to date._
<!-- sdlc:auto:end status -->

<!-- sdlc:auto:start source -->
Generated from commit `cc0162c` · model `auto`
<!-- sdlc:auto:end source -->

<!-- sdlc:auto:start overview -->
ExpenseTrack is an expense-claims app for a small company, with Employee, Manager and Finance roles. Employees create draft claims with lines and receipts and submit them. The assigned manager approves them, then Finance approves them, and nobody can decide their own claim. It is one repository holding two apps. `backend/` is a FastAPI 0.115 service using SQLAlchemy 2, Alembic migrations, argon2 password hashing, bearer-token sessions stored hashed, and boto3 for receipt storage. It uses PostgreSQL via `DATABASE_URL` and falls back to a local SQLite file. `frontend/` is a Vite + React 19 SPA using React Router 7, TanStack Query and Tailwind 4. It talks to the API through `src/lib/api.ts`. On startup the API migrates to head, seeds a bootstrap Finance user (if configured) and seeds default categories. A GitHub Actions workflow builds the API image to ECR and deploys the frontend to AWS Amplify.
<!-- sdlc:auto:end overview -->

<!-- sdlc:auto:start prerequisites -->
- Python 3.12 (the backend Dockerfile uses python:3.12-slim)
- Node.js with npm (no version is pinned in package.json)
- Docker with Compose (optional, for the local PostgreSQL 16 in docker-compose.yml)
- Chromium for Playwright, installed via `npm run test:e2e:install`
<!-- sdlc:auto:end prerequisites -->

<!-- sdlc:auto:start setup -->
1. (Optional) Start PostgreSQL: `docker compose up -d db`. Without it the backend uses `sqlite:///./app.db`.
2. `cd backend`
3. `python -m venv .venv && . .venv/bin/activate` (the Playwright config expects the backend packages in `backend/.venv`)
4. `pip install -r requirements.txt`
5. (Optional, for PostgreSQL) `export DATABASE_URL=postgresql+psycopg://app:<database-password>@localhost:5432/app`. Use the user, password and database set in docker-compose.yml.
6. Create the first Finance user on startup: `export BOOTSTRAP_ADMIN_EMAIL=<admin-email>` and `export BOOTSTRAP_ADMIN_PASSWORD=<set-at-first-login>`
7. `uvicorn app.main:app --reload`. Migrations run automatically on startup, and the API listens on http://localhost:8000.
8. In a second terminal: `cd frontend`
9. `npm install`
10. `npm run dev`. The SPA runs on http://localhost:5173 and points to http://localhost:8000 unless `VITE_API_BASE_URL` is set.
<!-- sdlc:auto:end setup -->

<!-- sdlc:auto:start run -->
| Name | Command | Description |
|---|---|---|
| api-dev | `cd backend && uvicorn app.main:app --reload` | Run the FastAPI backend with auto-reload. It runs Alembic migrations and seeding on startup. |
| api-container | `cd backend && docker build -t expensetrack-api . && docker run -p 8000:8000 expensetrack-api` | Build and run the backend image from backend/Dockerfile (uvicorn on port 8000, as a non-root user). |
| db | `docker compose up -d db` | Start the local PostgreSQL 16 container on port 5432. |
| dev | `cd frontend && npm run dev` | Start the Vite dev server. |
| build | `cd frontend && npm run build` | Bundle the SPA into frontend/dist. This does not typecheck. |
| preview | `cd frontend && npm run preview` | Serve the production build locally. |
| typecheck | `cd frontend && npm run typecheck` | Run `tsc --noEmit` over src. |
| lint (frontend) | `cd frontend && npm run lint` | Run ESLint over the app. `npm run lint:fix` applies the fixes it can. |
| format (frontend) | `cd frontend && npm run format` | Format the code with Prettier. `npm run format:check` only checks. |
| lint (backend) | `cd backend && ruff check .` | Lint the backend with Ruff (configured in ruff.toml). |
| format (backend) | `cd backend && ruff format .` | Format the backend with Ruff. |
<!-- sdlc:auto:end run -->

<!-- sdlc:auto:start structure -->
| Path | Purpose |
|---|---|
| `.devcontainer/` | Dev container definition (devcontainer.json). |
| `.github/workflows/` | deploy.yml: on push to main it builds and pushes the API image to ECR and builds and deploys the frontend to AWS Amplify, using OIDC. |
| `.quorq/` | Platform handoff metadata (handoff.json). |
| `docs/` | Product behaviour rules (behaviour-rules.md). |
| `backend/` | The FastAPI service: requirements.txt, Dockerfile, alembic.ini, pytest.ini, ruff.toml. |
| `backend/app/` | Application code: - main.py: app, lifespan migrate/seed, CORS, router wiring - database.py: engine and sessions - models.py and schemas.py - deps.py: auth dependencies - security.py, email.py, storage.py - routers/: auth, users, categories, claims, receipts, approvals, history - services/: business logic |
| `backend/alembic/` | Alembic env and numbered migrations (0001_identity through 0004_claim_status_changes). |
| `backend/scripts/` | check_connections.py, a connectivity check script. |
| `backend/tests/` | Pytest suite: unit tests per feature, plus integration/ acceptance tests for approval flow, privacy, receipts and submit. |
| `frontend/` | The Vite + React SPA: package.json, vite.config.ts, tsconfig.json, playwright.config.ts, eslint/prettier config. |
| `frontend/src/` | SPA source: - main.tsx and App.tsx: the route table and nav shell - screens/: one module per screen - components/: claim and approval widgets - lib/: API client, auth, UI kit, icons, brand tokens - Vitest tests sit beside their components |
| `frontend/e2e/` | Playwright acceptance specs, with shared helpers in support/. |
| `frontend/playwright-report/` | Generated Playwright HTML report output. |
<!-- sdlc:auto:end structure -->

<!-- sdlc:auto:start conventions -->
- Backend layering: routers in app/routers/ (one per component) handle HTTP, app/services/ holds business rules, models.py holds SQLAlchemy models, and schemas.py holds Pydantic request/response models.
- All API routes are under `/api/...`. `/health` (liveness, used by the Docker HEALTHCHECK) and `/api/healthz` both return `{"status": "ok"}`.
- Auth uses opaque bearer tokens. Login returns a token, and the server stores only its hash in `sessions`. Role checks go through the `require_auth` / `require_finance` dependencies.
- Claim status flow: - `draft` → `pending_manager` → `pending_finance` → `approved`. - Submit goes straight to `pending_finance` if the owner has no active manager. - Rejection returns the claim to `draft` and requires a comment.
- Only the owner can change a draft claim. Edits and decisions lock the claim row (`with_for_update`) and re-read its status.
- Every status change writes an append-only `ClaimStatusChange` row. Updates and deletes are refused by SQLAlchemy event listeners.
- Money is stored as `Numeric(10,2)` and returned as 2-decimal strings (e.g. `amount_gbp`, `total_gbp`). Datetimes are timezone-aware UTC via `UTCDateTime`.
- Models use portable column types so SQLite and PostgreSQL both work.
- PATCH schemas use `extra="forbid"`. Category names are unique case-insensitively.
- Receipts must be JPEG, PNG or PDF of at most 5 MB. They are checked by content type and magic bytes and stored under `receipts/{claim}/{line}/{uuid}.{ext}`.
- Schema changes go in a new numbered Alembic migration under backend/alembic/versions/.
- Frontend imports use the `@/` alias for `src/`. API calls go through `apiFetch` in `src/lib/api.ts`, which adds the bearer token and redirects to /sign-in on a 401.
- Frontend styling uses Tailwind plus brand CSS variables (`var(--brand-*)`).
- TypeScript is `strict` with `noImplicitAny` and `strictNullChecks` disabled.
- Code style is enforced by Ruff (backend) and ESLint + Prettier (frontend).
<!-- sdlc:auto:end conventions -->

<!-- sdlc:auto:start testing -->
| Name | Command | Description |
|---|---|---|
| backend tests | `cd backend && pytest` | Run the pytest suite in backend/tests. pytest.ini sets `pythonpath = .` and `testpaths = tests`. |
| frontend unit tests | `cd frontend && npm test` | Run Vitest component tests matching `src/**/*.{test,spec}.{ts,tsx}` in jsdom. |
| e2e browser install | `cd frontend && npm run test:e2e:install` | Install Chromium for Playwright. |
| e2e | `cd frontend && npm run test:e2e` | Run the Playwright specs in e2e/. Without `E2E_BASE_URL` it starts the backend from backend/.venv on port 8000 and serves a production build on port 4173. With `E2E_BASE_URL` set it runs against that URL instead. |
<!-- sdlc:auto:end testing -->

<!-- sdlc:auto:start troubleshooting -->
| Problem | Solution |
|---|---|
| You can't sign in on a fresh database because no users exist. | There is no self sign-up. Set `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` before starting the API. It creates that Finance user once, and you can create the other users from Users. |
| The browser blocks API calls with a CORS error. | By default only http://localhost:5173 and http://127.0.0.1:5173 are allowed. Set `ALLOWED_ORIGINS` (comma separated) to your frontend origin. |
| The frontend calls the wrong API host. | `VITE_API_BASE_URL` is inlined at build time and falls back to http://localhost:8000. Set it before `npm run dev` or `npm run build`. |
| Data is stored in app.db instead of PostgreSQL. | `DATABASE_URL` is unset, so the SQLite default is used. Export a PostgreSQL `DATABASE_URL` (psycopg driver) before starting the API. Don't rely on SQLite in a deployment. |
| `npm run build` succeeds but `npm run typecheck` fails. | This is expected: `vite build` doesn't typecheck. Fix the reported types, often untyped `useState({})`. |
| Playwright can't start the backend web server. | The e2e config runs `../backend/.venv/bin/python -m uvicorn`. Create backend/.venv and run `pip install -r requirements.txt` in it first. |
| Pytest fails with `ModuleNotFoundError: app`. | Run `pytest` from inside backend/ so pytest.ini's `pythonpath = .` applies. |
| A shared API key value is hard-coded in .github/workflows/deploy.yml (`VITE_API_SECRET_KEY` / `NEXT_PUBLIC_API_SECRET_KEY`). | Treat that value as exposed: rotate it, and move it to GitHub Actions secrets as `<your-api-key>`. Anything baked into a Vite bundle is visible to every browser that loads it. |
<!-- sdlc:auto:end troubleshooting -->
