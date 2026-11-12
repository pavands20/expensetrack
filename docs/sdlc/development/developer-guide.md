# Developer Guide

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start status -->
_Up to date._
<!-- sdlc:auto:end status -->

<!-- sdlc:auto:start source -->
Generated from commit `36f5849` · model `auto`
<!-- sdlc:auto:end source -->

<!-- sdlc:auto:start overview -->
ExpenseTrack is an expense-claims app for small companies with three roles: Employee, Manager and Finance. Finance creates the accounts; there is no self sign-up. Employees create draft claims with lines (date, category, GBP amount, description), attach a JPEG, PNG or PDF receipt of 5 MB or less to each line, and submit. A submitted claim goes to the submitter's assigned active manager, or straight to Finance if there is none. The repository contains two apps. `frontend/` is a Vite + React 19 + TypeScript SPA styled with Tailwind 4, routed with react-router 7, with @tanstack/react-query available. `backend/` is a FastAPI 0.115 service using SQLAlchemy 2, Alembic migrations, argon2 password hashing, bearer-token sessions and boto3 for receipt storage. The backend uses PostgreSQL when `DATABASE_URL` is set; without it, it falls back to a local SQLite file (`app.db`). On startup the backend migrates to head, optionally seeds a first Finance user, and seeds categories. Deployment is a GitHub Actions workflow: it pushes the API image to ECR and publishes the frontend to AWS Amplify. Note that both READMEs are partly out of date. They say the backend is health-check only and the screens run on seeded data, but the code now has full auth, users, categories, claims, receipts and approvals routers, and `App.tsx` calls the API through `src/lib/api.ts`.
<!-- sdlc:auto:end overview -->

<!-- sdlc:auto:start prerequisites -->
- Python 3.12 (the version used by backend/Dockerfile)
- Node.js with npm (a version supported by Vite 6)
- Docker with Docker Compose (optional; only needed for the local PostgreSQL 16 in docker-compose.yml)
<!-- sdlc:auto:end prerequisites -->

<!-- sdlc:auto:start setup -->
1. Optional: start PostgreSQL from the repo root with `docker compose up -d db`. If you skip this, the backend uses SQLite at backend/app.db.
2. Create the backend virtualenv. Playwright's web server expects it at backend/.venv: `cd backend && python -m venv .venv && .venv/bin/pip install -r requirements.txt`
3. If you are using the compose database, point the backend at it. These credentials come from docker-compose.yml, with the psycopg 3 driver from requirements.txt: `export DATABASE_URL=postgresql+psycopg://app:app@localhost:5432/app`
4. Create the first Finance account, which is seeded once on startup: `export BOOTSTRAP_ADMIN_EMAIL=you@example.com BOOTSTRAP_ADMIN_PASSWORD='choose-a-password'`
5. Start the API from backend/. Alembic migrations and category seeding run automatically on startup: `.venv/bin/uvicorn app.main:app --reload`
6. In a second terminal, install and start the frontend. The API base defaults to http://localhost:8000, and the backend's default CORS allows http://localhost:5173: `cd frontend && npm install && npm run dev`
7. Sign in at the Vite dev server URL with the bootstrap admin credentials.
<!-- sdlc:auto:end setup -->

<!-- sdlc:auto:start run -->
| Name | Command | Description |
|---|---|---|
| api (dev) | `cd backend && uvicorn app.main:app --reload` | Runs the FastAPI service on port 8000 with auto-reload. It migrates the database and seeds data on startup. |
| api (container) | `docker build -t expensetrack-api backend && docker run -p 8000:8000 expensetrack-api` | Builds and runs the backend image. The image runs uvicorn on 0.0.0.0:8000 as a non-root user and health-checks /health. |
| db | `docker compose up -d db` | Starts PostgreSQL 16 on localhost:5432 (user, password and database are all `app`) with a persistent volume. |
| dev | `cd frontend && npm run dev` | Starts the Vite dev server for the React SPA. |
| build | `cd frontend && npm run build` | Produces a production bundle in frontend/dist. It does not typecheck. |
| preview | `cd frontend && npm run preview` | Serves the built bundle locally. |
| lint (frontend) | `cd frontend && npm run lint` | Runs ESLint over the app. The platform uses this as a gate. `npm run lint:fix` applies the fixes it can. |
| format (frontend) | `cd frontend && npm run format` | Formats the frontend with Prettier. `npm run format:check` only checks. |
| lint (backend) | `cd backend && ruff check .` | Lints the backend with Ruff, using backend/ruff.toml. |
| format (backend) | `cd backend && ruff format .` | Formats the backend with Ruff. |
<!-- sdlc:auto:end run -->

<!-- sdlc:auto:start structure -->
| Path | Purpose |
|---|---|
| `.devcontainer` | Dev container definition (devcontainer.json). |
| `.github/workflows` | deploy.yml. On push to main it builds and pushes the backend image to ECR, then builds the frontend and publishes it to AWS Amplify. |
| `.quorq` | Platform handoff metadata (handoff.json) from the Quorq generator. |
| `backend` | The FastAPI service: Dockerfile, requirements.txt, alembic.ini, pytest.ini, ruff.toml. |
| `backend/app` | Application code. main.py has the app, lifespan, CORS and /health. Also database.py (engine and sessions), models.py (SQLAlchemy), schemas.py (Pydantic), deps.py (auth dependencies), security.py, email.py, storage.py (receipt storage), routers/ (auth, users, categories, claims, receipts, approvals) and services/ (business logic). |
| `backend/alembic` | Alembic environment and numbered migrations in versions/: 0001_identity, 0002_categories, 0003_claims. |
| `backend/scripts` | Utility scripts (check_connections.py). |
| `backend/tests` | Pytest suite: conftest.py plus tests for auth, categories, claims, claim lines, receipts, submit, visibility and health. |
| `frontend` | The Vite + React SPA: package.json, vite.config.ts (with the Vitest config), playwright.config.ts, eslint.config.js, .prettierrc, tsconfig.json. |
| `frontend/src` | SPA source. main.tsx and App.tsx (route table and nav shell). screens/ has one module per screen: SignIn, ResetPassword, Dashboard, Claim, Help, Users, Categories. components/ has LineEditor, ReceiptControl and SubmitClaim. lib/ has api.ts (fetch client), auth.tsx, ui.tsx, icons.tsx, brand.ts and navigate.ts. |
| `frontend/e2e` | Playwright acceptance specs (*.spec.ts) for claims, claim lines, receipts, submit, categories and password reset. |
<!-- sdlc:auto:end structure -->

<!-- sdlc:auto:start conventions -->
- Backend: one router module per component in app/routers. Each is registered in main.py, and every API path is under /api.
- Backend: request and response shapes live in app/schemas.py as Pydantic v2 models. Write models use `extra="forbid"`, and PATCH handlers use `model_fields_set` to distinguish an explicit null from an omitted field.
- Backend: SQLAlchemy 2 typed `Mapped[...]` models use only portable column types, so tests can run on SQLite. Every schema change is a new numbered Alembic migration in alembic/versions.
- Backend: role checks go through the `require_auth` and `require_finance` dependencies in app/deps.py, and claim visibility goes through `services.claims.visible_claims`. An unseen claim returns 404; a claim you can see but don't own returns 403.
- Money is stored as Numeric(10,2) and returned as 2-decimal strings (`amount_gbp`, `total_gbp`, `limit_gbp`). Claims are referenced as `EXP-0001` style strings.
- Claim status strings in use: `draft`, `pending_manager`, `pending_finance`. Only the owner's draft claims can be edited, deleted or submitted. Submitting requires at least one line and a receipt on every line.
- Emails are stored lowercased. Session and reset tokens are stored only as hashes.
- Frontend: import from src via the `@/` alias. All API calls go through `apiFetch` in src/lib/api.ts. It sends the session token from localStorage (key `session_token`) as a Bearer token and redirects to /sign-in on a 401.
- Frontend: Vitest component tests sit beside their component as *.test.tsx. Playwright specs live in e2e/ as *.spec.ts. Styling is Tailwind plus CSS variables (`--brand-*`) from index.css and brand.ts.
- TypeScript runs in strict mode with `noImplicitAny` and `strictNullChecks` turned off.
<!-- sdlc:auto:end conventions -->

<!-- sdlc:auto:start testing -->
| Name | Command | Description |
|---|---|---|
| backend tests | `cd backend && pytest` | Runs the pytest suite in backend/tests. pytest.ini sets pythonpath to `.` so `app` is importable. |
| backend coverage | `cd backend && pytest --cov=app` | Runs the backend suite with pytest-cov coverage. |
| frontend unit | `cd frontend && npm test` | Runs Vitest component tests under src/ (jsdom environment). |
| typecheck | `cd frontend && npm run typecheck` | Runs `tsc --noEmit`. The build step does not do this. |
| e2e browser install | `cd frontend && npm run test:e2e:install` | Downloads Chromium for Playwright. |
| e2e | `cd frontend && npm run test:e2e` | Runs the Playwright specs in e2e/. Without E2E_BASE_URL it boots the backend from backend/.venv on port 8000 and a built preview of the frontend on port 4173. With E2E_BASE_URL set, it runs against that deployed URL instead. |
<!-- sdlc:auto:end testing -->

<!-- sdlc:auto:start troubleshooting -->
| Problem | Solution |
|---|---|
| Browser calls to the API fail with CORS errors. | By default the backend allows only http://localhost:5173 and http://127.0.0.1:5173. If the frontend is served from another origin, set ALLOWED_ORIGINS (comma-separated) before starting uvicorn. |
| Nobody can sign in on a fresh database. | There is no self sign-up. Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD before starting the API, which seeds a Finance user, then create the other users from the Users screen. |
| Data is going to SQLite instead of PostgreSQL. | DATABASE_URL defaults to sqlite:///./app.db. Export a PostgreSQL URL before starting the backend; the SQLite default is meant for local use only. |
| `npm run test:e2e` fails to start the API. | The Playwright web server runs `../backend/.venv/bin/python`. Create the backend virtualenv at backend/.venv and install requirements.txt into it first. |
| Pytest reports `ModuleNotFoundError: app`. | Run pytest from the backend/ directory so pytest.ini (`pythonpath = .`) is picked up. |
| `npm run build` succeeds but `npm run typecheck` fails. | This is expected. Vite does not typecheck. Fix the reported tsc errors, which are typically untyped `useState({})` values. |
| Password-reset links point to the wrong host. | The link base is FRONTEND_BASE_URL. If that is unset, the backend uses the first ALLOWED_ORIGINS entry, and falls back to http://localhost:5173. Token lifetime is RESET_TOKEN_MINUTES (default 60). |
| The frontend calls the wrong API in a build. | VITE_API_BASE_URL is inlined at build time; it falls back to http://localhost:8000. Set it in the environment before running `npm run build`. |
| The deploy workflow contains a plaintext shared API key. | .github/workflows/deploy.yml hardcodes VITE_API_SECRET_KEY and NEXT_PUBLIC_API_SECRET_KEY, and both get baked into the public bundle. Treat that value as exposed. Consider moving it to a GitHub secret and rotating it. |
<!-- sdlc:auto:end troubleshooting -->
