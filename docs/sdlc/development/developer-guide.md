# Developer Guide

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start status -->
_Up to date._
<!-- sdlc:auto:end status -->

<!-- sdlc:auto:start source -->
Generated from commit `0f1d65e` · model `auto`
<!-- sdlc:auto:end source -->

<!-- sdlc:auto:start overview -->
ExpenseTrack is an expense-claims app for small companies, with three roles: Employee, Manager and Finance. Employees create draft claims with GBP line items and attach a JPEG, PNG or PDF receipt (up to 5 MB) to each line, then submit. A submitted claim goes to the owner's active manager (status pending_manager), or straight to Finance (pending_finance) if there is none. Finance creates user accounts and manages categories. The repo holds two apps. backend/ is a FastAPI 0.115 service using SQLAlchemy 2, Alembic, argon2 password hashing, bearer-token sessions and boto3 for receipt storage. It defaults to a local SQLite file (app.db) unless DATABASE_URL points at PostgreSQL, and it runs migrations and seeding on startup. frontend/ is a Vite + React 19 SPA using react-router-dom 7, TanStack Query and Tailwind 4. It talks to the API through src/lib/api.ts. Pushes to main run a GitHub Actions workflow that pushes the API image to ECR and deploys the built SPA to AWS Amplify. Note: both READMEs describe the backend as health-check-only and the screens as running only on sample data. The code goes further: the backend has auth, user, category, claim, receipt and approval routers, and App.tsx calls the API for sign-out and session handling.
<!-- sdlc:auto:end overview -->

<!-- sdlc:auto:start prerequisites -->
- Node.js with npm (for frontend/)
- Python 3.12 (the version the backend Dockerfile uses) with pip and venv
- Docker with Docker Compose (optional: local PostgreSQL 16 via docker-compose.yml, or building the API image)
- Playwright's Chromium (installed via npm run test:e2e:install) for end-to-end tests
<!-- sdlc:auto:end prerequisites -->

<!-- sdlc:auto:start setup -->
1. cd backend && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
2. (Optional, to use PostgreSQL instead of the default SQLite file) From the repo root: docker compose up -d db && export DATABASE_URL=postgresql+psycopg://app:app@localhost:5432/app
3. Seed the first Finance user (there is no self sign-up): export BOOTSTRAP_ADMIN_EMAIL=admin@example.com BOOTSTRAP_ADMIN_PASSWORD=change-me-please
4. cd backend && .venv/bin/uvicorn app.main:app --reload   # on startup: Alembic upgrade to head, admin seed, default categories seed
5. cd frontend && npm install
6. cd frontend && npm run dev   # Vite on http://localhost:5173; calls the API at VITE_API_BASE_URL, defaulting to http://localhost:8000
<!-- sdlc:auto:end setup -->

<!-- sdlc:auto:start run -->
| Name | Command | Description |
|---|---|---|
| backend dev | `cd backend && uvicorn app.main:app --reload` | Runs the FastAPI API on port 8000 with auto-reload. Applies migrations and seeds on startup. Liveness probes are at /health and /api/healthz. |
| database | `docker compose up -d db` | Starts PostgreSQL 16 on localhost:5432 (user, password and database are all 'app') with a persistent db-data volume. |
| backend image | `docker build -t expensetrack-api backend && docker run -p 8000:8000 expensetrack-api` | Builds and runs the production API container (uvicorn on 0.0.0.0:8000, non-root user, HTTP healthcheck on /health). |
| frontend dev | `cd frontend && npm run dev` | Starts the Vite dev server. |
| frontend build | `cd frontend && npm run build` | Production bundle into frontend/dist. Does not typecheck. |
| frontend preview | `cd frontend && npm run preview` | Serves the built bundle locally. |
| typecheck | `cd frontend && npm run typecheck` | Runs tsc --noEmit over src/. |
| lint (frontend) | `cd frontend && npm run lint` | ESLint over the app. Use npm run lint:fix to auto-fix. The platform gates on this. |
| format (frontend) | `cd frontend && npm run format` | Prettier write. Use npm run format:check to verify only. |
| lint (backend) | `cd backend && ruff check .` | Ruff lint using backend/ruff.toml. |
| format (backend) | `cd backend && ruff format .` | Ruff formatter. |
<!-- sdlc:auto:end run -->

<!-- sdlc:auto:start structure -->
| Path | Purpose |
|---|---|
| `.devcontainer/` | Dev container definition (devcontainer.json). |
| `.github/workflows/` | deploy.yml: on push to main, builds and pushes the backend image to ECR, builds the frontend and deploys it to an Amplify branch using OIDC auth. |
| `.quorq/` | Platform handoff metadata (handoff.json). |
| `backend/` | FastAPI service: Dockerfile, requirements.txt, alembic.ini, pytest.ini, ruff.toml. |
| `backend/app/` | Application code: main.py (app, CORS, lifespan migrate and seed), database.py, models.py, schemas.py, deps.py (auth dependencies), security.py, storage.py (receipt storage), email.py, routers/ (one per component) and services/ (business logic). |
| `backend/alembic/` | Alembic environment and numbered migrations (0001_identity, 0002_categories, 0003_claims). |
| `backend/tests/` | Pytest suite (conftest.py, per-feature tests, *_qa variants) plus integration/ acceptance tests. |
| `backend/scripts/` | Utility scripts (check_connections.py). |
| `frontend/` | Vite + React SPA: package.json, vite.config.ts (also the Vitest config), playwright.config.ts, eslint and prettier config, tsconfig.json. |
| `frontend/src/` | App.tsx (route table and nav shell), main.tsx, screens/ (one module per screen, with co-located tests), components/ (LineEditor, ReceiptControl, SubmitClaim), lib/ (api client, auth, ui, icons, brand tokens). |
| `frontend/e2e/` | Playwright acceptance specs per feature, plus support/admin.ts helpers. |
<!-- sdlc:auto:end structure -->

<!-- sdlc:auto:start conventions -->
- Backend: one APIRouter per component in app/routers/, all under the /api prefix, registered in main.py. Business logic lives in app/services/.
- Auth uses the dependencies require_auth and require_finance from app/deps.py. Sessions are opaque bearer tokens, stored only as hashes in the sessions table.
- Request and response models live in app/schemas.py. Inputs that allow no extra fields use ConfigDict(extra='forbid'). Money is Decimal in the DB and returned as 2-decimal strings (amount_gbp, total_gbp, limit_gbp).
- Models use portable SQLAlchemy types so the SQLite test and dev databases work. Schema changes go in a new numbered Alembic migration under backend/alembic/versions/.
- Claim lifecycle: status starts as 'draft' and becomes 'pending_manager' or 'pending_finance' on submit. Only the owner's own draft can be edited, deleted or submitted (409 otherwise). Claim references are formatted EXP-0001.
- Errors are HTTPException with a string detail. Validation failures mirror FastAPI's 422 list shape.
- Frontend: import with the '@/' alias for src/. All API calls go through apiFetch in src/lib/api.ts, which adds the bearer token, raises ApiError and redirects to /sign-in on a 401.
- Styling uses Tailwind 4 plus brand CSS variables (var(--brand-*)) defined in src/index.css and src/lib/brand.ts.
- Unit tests sit beside the component they cover (*.test.tsx). E2E specs live in frontend/e2e. Formatting is Prettier (frontend) and Ruff (backend).
<!-- sdlc:auto:end conventions -->

<!-- sdlc:auto:start testing -->
| Name | Command | Description |
|---|---|---|
| backend tests | `cd backend && pytest` | Runs backend/tests (pytest.ini sets pythonpath=. and testpaths=tests). |
| backend coverage | `cd backend && pytest --cov=app` | Same suite with pytest-cov coverage for the app package. |
| frontend unit | `cd frontend && npm test` | Vitest component tests under src/ in jsdom, using src/test-setup.ts. |
| e2e browser install | `cd frontend && npm run test:e2e:install` | Downloads Playwright's Chromium. |
| e2e | `cd frontend && npm run test:e2e` | Playwright specs in e2e/. Without E2E_BASE_URL, it boots the backend from backend/.venv on port 8000 and a built and previewed frontend on port 4173. With E2E_BASE_URL set, it runs against that deployment instead. |
<!-- sdlc:auto:end testing -->

<!-- sdlc:auto:start troubleshooting -->
| Problem | Solution |
|---|---|
| pytest fails with 'No module named app'. | Run pytest from inside backend/. pytest.ini there adds the directory to the Python path. |
| npm run test:e2e cannot start the API. | Playwright runs ../backend/.venv/bin/python. Create backend/.venv and install requirements.txt into it first, or set E2E_BASE_URL to target a running app. |
| You can't sign in on a fresh database because no users exist. | Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD before starting the backend. It creates that Finance user once, on startup. |
| The browser blocks API calls with CORS errors. | By default only http://localhost:5173 and http://127.0.0.1:5173 are allowed. Set ALLOWED_ORIGINS (comma-separated) on the backend to add other frontend origins. |
| Data disappears between environments, or the database behaves differently from production. | Without DATABASE_URL the backend uses sqlite:///./app.db. For PostgreSQL, run docker compose up -d db and export DATABASE_URL=postgresql+psycopg://app:app@localhost:5432/app. |
| The deployed frontend calls localhost. | VITE_API_BASE_URL is inlined at build time. Set it in the environment of npm run build. |
| npm run build succeeds but the code has type errors. | vite build does not typecheck. Run npm run typecheck and fix the errors it reports. |
| Security risk: deploy.yml hard-codes VITE_API_SECRET_KEY and NEXT_PUBLIC_API_SECRET_KEY values in plain text, and they end up in the public JS bundle. | Treat that value as public and rotate it. Move it to GitHub Actions secrets, and don't rely on a frontend-embedded key for authorization. |
| Chromium crashes while running E2E tests in a container. | playwright.config.ts already passes --disable-dev-shm-usage. Make sure you use the bundled config and that workers stays at 1. |
<!-- sdlc:auto:end troubleshooting -->
