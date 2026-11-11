# Developer Guide

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start status -->
_Up to date._
<!-- sdlc:auto:end status -->

<!-- sdlc:auto:start source -->
Generated from commit `39f1613` · model `auto`
<!-- sdlc:auto:end source -->

<!-- sdlc:auto:start overview -->
ExpenseTrack is an expense-claims app for a 5–50 person company with Employee, Manager and Finance roles. The repository holds two applications. `frontend/` is a Vite + React 19 single-page app using React Router 7, TanStack Query and Tailwind CSS 4. `backend/` is a FastAPI 0.115 service using SQLAlchemy 2, Alembic and Pydantic 2. Users sign in with a bearer token returned by `/api/auth/login`, and the frontend keeps that token in localStorage. On startup the backend migrates the database to head and seeds a bootstrap Finance user and the default categories. It then serves auth, user-admin, category and draft-claim endpoints under `/api`, plus a `/health` probe. PostgreSQL 16 is the intended database (a `db` service is in docker-compose.yml). If `DATABASE_URL` is unset, the backend uses a local SQLite file. Note that the top-level README is out of date: it says the backend has only a health check, but the routers above already exist. The frontend README says screens run on seeded sample data, yet `App.tsx` already calls the API for sign-out and wraps routes in `RequireAuth`. Pushes to `main` deploy through GitHub Actions: the API image goes to ECR and the frontend goes to AWS Amplify.
<!-- sdlc:auto:end overview -->

<!-- sdlc:auto:start prerequisites -->
- Python 3.12 (the backend Dockerfile uses python:3.12-slim)
- Node.js with npm (no version is pinned; Vite 6 and React 19 need a current LTS)
- Docker with Docker Compose (optional: for the local PostgreSQL 16 `db` service and the backend image)
- Chromium via Playwright (only for e2e tests; installed with `npm run test:e2e:install`)
<!-- sdlc:auto:end prerequisites -->

<!-- sdlc:auto:start setup -->
1. Optional, to use PostgreSQL instead of the SQLite default: `docker compose up -d db`
2. `cd backend`
3. `python -m venv .venv` (the Playwright config expects the backend's packages in backend/.venv)
4. `.venv/bin/pip install -r requirements.txt`
5. If using the compose database: `export DATABASE_URL=postgresql+psycopg://app:app@localhost:5432/app` (credentials from docker-compose.yml, driver from psycopg in requirements.txt). If unset, the backend uses `sqlite:///./app.db`.
6. Create the first Finance account, since there is no self sign-up: `export BOOTSTRAP_ADMIN_EMAIL=you@example.com BOOTSTRAP_ADMIN_PASSWORD=change-me-please`
7. `.venv/bin/uvicorn app.main:app --reload` (runs Alembic migrations to head and seeds the admin and categories on startup; the API listens on http://localhost:8000)
8. In a second terminal: `cd frontend`
9. `npm install`
10. `npm run dev` (Vite dev server on http://localhost:5173, which the backend allows through CORS by default; the API base URL defaults to http://localhost:8000)
<!-- sdlc:auto:end setup -->

<!-- sdlc:auto:start run -->
| Name | Command | Description |
|---|---|---|
| backend dev | `cd backend && uvicorn app.main:app --reload` | Runs the FastAPI service with auto-reload. It migrates the database and seeds data on startup. |
| frontend dev | `cd frontend && npm run dev` | Starts the Vite dev server. |
| build | `cd frontend && npm run build` | Bundles the SPA into dist/. This does not typecheck. |
| preview | `cd frontend && npm run preview` | Serves the built bundle locally. |
| typecheck | `cd frontend && npm run typecheck` | Runs `tsc --noEmit` over src/. |
| lint (frontend) | `cd frontend && npm run lint` | Runs ESLint over the app. The platform uses this as a gate. |
| lint:fix | `cd frontend && npm run lint:fix` | Runs ESLint and applies the fixes it can. |
| format (frontend) | `cd frontend && npm run format` | Formats the frontend with Prettier. |
| format:check | `cd frontend && npm run format:check` | Checks Prettier formatting without writing changes. |
| lint (backend) | `cd backend && ruff check .` | Lints the backend with Ruff. |
| format (backend) | `cd backend && ruff format .` | Formats the backend with Ruff. |
| local database | `docker compose up -d db` | Starts PostgreSQL 16 on port 5432 with user, password and database all set to `app`. |
| backend image | `docker build -t expensetrack-api backend && docker run -p 8000:8000 expensetrack-api` | Builds and runs the API container. It runs uvicorn on port 8000 as a non-root user, with a /health healthcheck. |
<!-- sdlc:auto:end run -->

<!-- sdlc:auto:start structure -->
| Path | Purpose |
|---|---|
| `.devcontainer` | Dev container configuration (devcontainer.json). |
| `.github` | GitHub configuration. |
| `.github/workflows` | deploy.yml: on push to main, builds and pushes the API image to ECR and builds and publishes the frontend to AWS Amplify, using OIDC credentials. |
| `.quorq` | Platform handoff metadata (handoff.json). |
| `backend` | FastAPI service: requirements.txt, Dockerfile, alembic.ini, pytest.ini, ruff.toml. |
| `backend/app` | Application code. main.py is the entry point (lifespan migrations and seeding, CORS, /health). Also contains database.py, models.py, schemas.py, deps.py (auth dependencies), security.py, email.py, storage.py (receipt objects), routers/ (auth, users, categories, claims) and services/. |
| `backend/alembic` | Alembic environment and numbered migrations in versions/ (0001_identity, 0002_categories, 0003_claims). |
| `backend/scripts` | Helper scripts (check_connections.py). |
| `backend/tests` | Pytest suite (auth, categories, claims, health) with shared fixtures in conftest.py. |
| `frontend` | Vite + React SPA: package.json, vite.config.ts, tsconfig.json, eslint.config.js, .prettierrc, playwright.config.ts. |
| `frontend/src` | App code. main.tsx and App.tsx hold the route table and nav shell. screens/ has one module per screen, with Vitest tests beside them. lib/ holds the API client, auth, UI and icon components, and brand tokens. |
| `frontend/e2e` | Playwright acceptance specs (categories, claims, password reset). |
<!-- sdlc:auto:end structure -->

<!-- sdlc:auto:start conventions -->
- Backend routing: there is one router module per component in app/routers, each mounted under an `/api/...` prefix. Business helpers live in app/services.
- Access control: roles are enforced with FastAPI dependencies from app/deps.py. `require_auth` covers any signed-in user; `require_finance` covers Finance-only routes such as all of /api/users and category writes.
- Validation: request and response shapes live in app/schemas.py as Pydantic models. Input models for users use `extra="forbid"`, and string fields are length-constrained.
- Money: amounts are stored as Numeric(10,2) and returned as 2-decimal strings (e.g. `amount_gbp`, `total_gbp`, `limit_gbp`).
- Data handling: emails are stored lowercased. Session and reset tokens are stored only as hashes. Passwords use argon2.
- Claim visibility and editing: claims the caller cannot see return 404. Only the owner may change a claim, and only while it is a draft; otherwise the API returns 403 or 409.
- Schema changes go through numbered Alembic migrations. Models use portable SQLAlchemy types so SQLite works for tests and local runs.
- Frontend imports use the `@/` alias for `src/`. Routes are declared centrally in App.tsx. Finance-only navigation items are shown based on `currentUser.role`.
- All HTTP calls go through `apiFetch` in src/lib/api.ts. It prefixes `VITE_API_BASE_URL`, sends the session token as a Bearer header, and redirects to /sign-in on a 401.
- Styling uses Tailwind CSS 4 with brand CSS variables (e.g. `var(--brand-surface)`) defined in index.css and brand.ts.
- TypeScript runs in strict mode but with `noImplicitAny` and `strictNullChecks` turned off. Formatting is handled by Prettier and Ruff, linting by ESLint and Ruff.
<!-- sdlc:auto:end conventions -->

<!-- sdlc:auto:start testing -->
| Name | Command | Description |
|---|---|---|
| backend tests | `cd backend && pytest` | Runs the pytest suite in backend/tests. pytest.ini sets `pythonpath = .` so `app` can be imported. |
| backend coverage | `cd backend && pytest --cov=app` | Runs pytest with coverage via pytest-cov. |
| frontend unit | `cd frontend && npm test` | Runs Vitest component tests matching src/**/*.{test,spec}.{ts,tsx} in jsdom. |
| e2e browser install | `cd frontend && npm run test:e2e:install` | Installs Chromium for Playwright. |
| e2e | `cd frontend && npm run test:e2e` | Runs the Playwright specs in e2e/. Without E2E_BASE_URL, it boots the backend from backend/.venv on port 8000 and serves a production build on port 4173. With E2E_BASE_URL set, it tests that deployed URL instead. |
<!-- sdlc:auto:end testing -->

<!-- sdlc:auto:start troubleshooting -->
| Problem | Solution |
|---|---|
| Nobody can sign in on a fresh database. | There is no self sign-up. Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD before starting the backend; startup then creates a Finance user, and that user can create the other accounts. |
| Browser calls to the API fail with CORS errors. | Without ALLOWED_ORIGINS, only http://localhost:5173 and http://127.0.0.1:5173 are allowed. Use the Vite dev server on that port, or set ALLOWED_ORIGINS to a comma-separated list of origins. |
| Data disappears or differs from PostgreSQL. | The backend falls back to SQLite (./app.db) when DATABASE_URL is unset. Export DATABASE_URL to point at the compose database before starting uvicorn. |
| Password reset links point to localhost:5173. | Set FRONTEND_BASE_URL. Otherwise the link uses the first ALLOWED_ORIGINS entry, or http://localhost:5173. Link lifetime is controlled by RESET_TOKEN_MINUTES (default 60). |
| `npm run test:e2e` times out starting the backend. | Playwright runs `.venv/bin/python -m uvicorn` from backend/. Create backend/.venv and install requirements.txt into it first. |
| `npm run build` passes but deployment or `npm run typecheck` fails. | Vite does not typecheck. Run `npm run typecheck` and fix the reported errors (often untyped `useState({})`). |
| `pytest` cannot import `app`. | Run pytest from the backend/ directory so pytest.ini's `pythonpath = .` applies. |
| The deploy workflow contains a plaintext API secret value in its env block. | Any value inlined into a frontend bundle is public. Treat this key as exposed: rotate it, and move any sensitive value to GitHub Actions secrets rather than committing it in deploy.yml. |
<!-- sdlc:auto:end troubleshooting -->
