# Developer Guide

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start status -->
_Up to date._
<!-- sdlc:auto:end status -->

<!-- sdlc:auto:start source -->
Generated from commit `33b0517` · model `auto`
<!-- sdlc:auto:end source -->

<!-- sdlc:auto:start overview -->
ExpenseTrack is a generated two-application repository for handling employee expense claims, with Employee, Manager and Finance roles, multi-line claims and a two-step approval flow. `frontend/` is a Vite + React 19 single-page app using TypeScript, Tailwind CSS v4 and React Router 7. Its approved screens currently render seeded sample data. `src/lib/api.ts` provides an `apiFetch` helper as the seam for wiring screens to real endpoints. `backend/` is a FastAPI 0.115 service using SQLAlchemy 2. It defaults to a local SQLite database (`sqlite:///./app.db`) and switches to another database, such as the PostgreSQL 16 in `docker-compose.yml`, when `DATABASE_URL` is set. The backend has no models or routers yet: its only route is `GET /health`. Tables are created from the models at startup, and there are no migrations.
<!-- sdlc:auto:end overview -->

<!-- sdlc:auto:start prerequisites -->
- Node.js with npm (for `frontend/`)
- Python 3.12 with pip (the backend Dockerfile uses `python:3.12-slim`)
- Docker with Compose (optional: for the PostgreSQL 16 service in `docker-compose.yml` and for building the backend image)
<!-- sdlc:auto:end prerequisites -->

<!-- sdlc:auto:start setup -->
1. cd frontend && npm install
2. cd backend && python -m venv .venv && .venv/bin/pip install -r requirements.txt
3. (Optional, to use PostgreSQL instead of the default SQLite) docker compose up -d db
4. (Optional, with the db service running) export DATABASE_URL=postgresql+psycopg://app:app@localhost:5432/app
5. cd backend && .venv/bin/python -m uvicorn app.main:app --reload
6. cd frontend && npm run dev
<!-- sdlc:auto:end setup -->

<!-- sdlc:auto:start run -->
| Name | Command | Description |
|---|---|---|
| frontend dev | `cd frontend && npm run dev` | Starts the Vite dev server (the backend's default CORS origins allow http://localhost:5173 and http://127.0.0.1:5173). |
| frontend build | `cd frontend && npm run build` | Bundles the app with `vite build`. This does not typecheck. |
| frontend preview | `cd frontend && npm run preview` | Serves the production build locally. |
| typecheck | `cd frontend && npm run typecheck` | Runs `tsc --noEmit` over `src/`. |
| lint | `cd frontend && npm run lint` | Runs ESLint over the frontend. The platform uses this as a gate, so keep it passing. |
| lint:fix | `cd frontend && npm run lint:fix` | Runs ESLint and applies the automatic fixes it can. |
| format | `cd frontend && npm run format` | Formats the frontend with Prettier (writes files). |
| format:check | `cd frontend && npm run format:check` | Checks Prettier formatting without writing files. |
| backend dev | `cd backend && uvicorn app.main:app --reload` | Runs the FastAPI service with auto-reload on port 8000. The health check is at /health. |
| backend lint | `cd backend && ruff check .` | Lints the backend with Ruff. |
| backend format | `cd backend && ruff format .` | Formats the backend with Ruff. |
| database | `docker compose up -d db` | Starts PostgreSQL 16 on port 5432 with user, password and database all set to `app`. Data persists in the `db-data` volume. |
| backend image | `docker build -t expensetrack-backend backend` | Builds the backend container from `backend/Dockerfile`. The image runs uvicorn on port 8000 as a non-root user and has a /health HEALTHCHECK. The image tag is an example name. |
<!-- sdlc:auto:end run -->

<!-- sdlc:auto:start structure -->
| Path | Purpose |
|---|---|
| `.devcontainer/` | Dev container configuration (`devcontainer.json`). |
| `.quorq/` | Platform handoff metadata (`handoff.json`) from the Quorq AI SDLC platform. |
| `backend/` | FastAPI service: Dockerfile, `requirements.txt`, `pytest.ini`, `ruff.toml`. |
| `backend/app/` | Application package. `main.py` holds the app, CORS setup and /health. `database.py` holds the engine, `SessionLocal` and the `get_db` dependency. `models.py` holds SQLAlchemy models (none yet). `schemas.py` holds Pydantic models, including `StubResponse`. `routers/` will hold the generated routers (empty). |
| `backend/tests/` | Pytest suite (`conftest.py`, `test_health.py`). |
| `frontend/` | Vite + React SPA: `package.json`, Vite, TypeScript, ESLint, Prettier and Playwright configs, and `index.html`. |
| `frontend/src/` | App source. `main.tsx` is the entry point and mounts `App` inside `BrowserRouter`. Also contains `index.css` and `test-setup.ts` for Vitest. `lib/` holds `api.ts` (API client), `ui.tsx` and `icons.tsx` (component and icon vocabulary), and `navigate.ts`. |
| `frontend/e2e/` | Playwright acceptance specs (`example.spec.ts`). |
<!-- sdlc:auto:end structure -->

<!-- sdlc:auto:start conventions -->
- Frontend imports use the `@/` alias for `frontend/src` (configured in `vite.config.ts` and `tsconfig.json`).
- Vitest component tests live beside the components they cover and match `src/**/*.{test,spec}.{ts,tsx}`. Playwright specs live in `e2e/`.
- TypeScript runs in `strict` mode, but `noImplicitAny` and `strictNullChecks` are turned off.
- Styling uses Tailwind CSS v4 via `@tailwindcss/vite`. Formatting uses Prettier, and `eslint-config-prettier` stops ESLint rules from conflicting with it.
- Screens render seeded sample data. Calls to the real API should go through `apiFetch` in `src/lib/api.ts`, which reads `VITE_API_BASE_URL` (default `http://localhost:8000`). For the bearer token it uses the session token from localStorage, falling back to `VITE_API_SECRET_KEY`.
- Backend models inherit `Base` (a SQLAlchemy `DeclarativeBase`) in `app/models.py`. `main.py` imports `app.models` so that `create_all` registers the tables at startup.
- Request handlers get a database session through the `get_db` dependency (one session per request).
- The backend plans one router per architecture component under `app/routers/`. Unimplemented routes return the typed `StubResponse` placeholder rather than raising.
- Backend configuration comes from environment variables: `DATABASE_URL` and `ALLOWED_ORIGINS` (comma-separated). Backend code is linted and formatted with Ruff.
<!-- sdlc:auto:end conventions -->

<!-- sdlc:auto:start testing -->
| Name | Command | Description |
|---|---|---|
| frontend unit | `cd frontend && npm test` | Runs Vitest component tests (jsdom) once. `--passWithNoTests` means an empty suite still passes. |
| e2e browser install | `cd frontend && npm run test:e2e:install` | Installs the Chromium browser for Playwright. |
| e2e | `cd frontend && npm run test:e2e` | Runs Playwright specs from `e2e/`. Without `E2E_BASE_URL`, it first boots the backend from `backend/.venv` on port 8000, then builds and previews the frontend on port 4173. With `E2E_BASE_URL` set, it runs against that URL instead. |
| backend tests | `cd backend && pytest` | Runs the pytest suite in `tests/`. `pytest.ini` sets `pythonpath = .`, so `import app` works. |
| backend coverage | `cd backend && pytest --cov=app` | Runs the pytest suite with coverage for the `app` package, using pytest-cov from `requirements.txt`. |
<!-- sdlc:auto:end testing -->

<!-- sdlc:auto:start troubleshooting -->
| Problem | Solution |
|---|---|
| The frontend fails to build or start because `@/App` cannot be resolved. | `src/main.tsx` imports `@/App`, and `frontend/README.md` describes `src/App.tsx` and `src/screens/`. Neither appears in this file tree. Make sure `src/App.tsx` exists, or restore it, before running the app. |
| Browser requests from the SPA to the API are blocked by CORS. | Without `ALLOWED_ORIGINS`, the API only allows http://localhost:5173 and http://127.0.0.1:5173. If you serve the frontend from another origin, such as `npm run preview`, set `ALLOWED_ORIGINS` to that origin (comma-separated for several). |
| `npm run test:e2e` fails to start the backend web server. | Playwright runs `../backend/.venv/bin/python -m uvicorn ...`. Create the virtualenv at `backend/.venv` and install `requirements.txt` into it first. Also run `npm run test:e2e:install` so Chromium is available. |
| `npm run build` succeeds, but `npm run typecheck` reports errors. | `vite build` does not typecheck. Fix the reported `tsc` errors. The frontend README notes these usually come from an untyped `useState({})` that is later read for named fields. |
| The backend fails at startup when `DATABASE_URL` points at PostgreSQL. | Tables are created on startup, so the database must be reachable. Start it with `docker compose up -d db` and wait for its healthcheck to pass. Then check that the URL matches the compose credentials (user, password and database are all `app`, on port 5432). Unset `DATABASE_URL` to fall back to SQLite. |
| Schema changes to models are not applied to an existing database. | There are no migrations, and `create_all` only creates missing tables. For local SQLite, delete `backend/app.db` and restart. Alembic is recommended before the database holds real data. |
| Running `pytest` fails with `ModuleNotFoundError: app`. | Run `pytest` from inside `backend/`, so that `pytest.ini` (with `pythonpath = .`) is picked up. |
<!-- sdlc:auto:end troubleshooting -->
