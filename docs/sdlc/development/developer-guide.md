# Developer Guide

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start status -->
_Up to date._
<!-- sdlc:auto:end status -->

<!-- sdlc:auto:start source -->
Generated from commit `1c8b347` · model `auto`
<!-- sdlc:auto:end source -->

<!-- sdlc:auto:start overview -->
ExpenseTrack is an employee expense-claims app for a small company, with Employee, Manager and Finance roles. Finance creates accounts, employees build claims with receipt-backed lines and submit them, managers and then Finance approve or reject, and Finance marks approved claims paid and exports CSV. The repository holds two applications. `backend/` is a FastAPI service using SQLAlchemy 2 models, Alembic migrations (applied automatically on startup), Pydantic schemas, argon2 password hashing, bearer-token sessions and boto3 for receipt storage, against PostgreSQL 16. `frontend/` is a Vite + React 19 SPA using React Router 7, TanStack Query and Tailwind CSS 4. It talks to the API through `src/lib/api.ts`. The root README says the backend has only a health check, and the frontend README says the screens run on seeded sample data. The code shows more than that: there are ten routers, and `App.tsx` already uses `apiFetch` for sign-out and the auth guard. Treat those READMEs as partly out of date. A GitHub Actions workflow builds the API image to ECR and deploys the frontend to AWS Amplify.
<!-- sdlc:auto:end overview -->

<!-- sdlc:auto:start prerequisites -->
- Python 3.12 (the version in backend/Dockerfile)
- pip
- Node.js with npm (for Vite 6 / React 19)
- Docker with Docker Compose (for the local PostgreSQL 16 service in docker-compose.yml)
- Chromium for Playwright, installed via `npm run test:e2e:install`
<!-- sdlc:auto:end prerequisites -->

<!-- sdlc:auto:start setup -->
1. docker compose up -d db
2. cd backend
3. python -m venv .venv
4. source .venv/bin/activate
5. pip install -r requirements.txt
6. export DATABASE_URL="postgresql+psycopg://<database-user>:<database-password>@localhost:5432/<database-name>"  # take the values from docker-compose.yml
7. export BOOTSTRAP_ADMIN_EMAIL="<admin-email>" BOOTSTRAP_ADMIN_PASSWORD="<set-at-first-login>"  # optional: creates the first Finance user once, on startup
8. uvicorn app.main:app --reload  # runs Alembic migrations to head, seeds users and categories, serves on http://localhost:8000
9. In a second terminal: cd frontend
10. npm install
11. npm run dev  # Vite dev server on http://localhost:5173; calls the API at VITE_API_BASE_URL, which defaults to http://localhost:8000
<!-- sdlc:auto:end setup -->

<!-- sdlc:auto:start run -->
| Name | Command | Description |
|---|---|---|
| db | `docker compose up -d db` | Starts the local PostgreSQL 16 container defined in docker-compose.yml on port 5432. |
| api | `cd backend && uvicorn app.main:app --reload` | Runs the FastAPI service with auto-reload. Requires DATABASE_URL. Migrates and seeds on startup. |
| api (docker) | `docker build -t expensetrack-api ./backend && docker run -p 8000:8000 -e DATABASE_URL="<database-url>" expensetrack-api` | Builds and runs the backend image from backend/Dockerfile, which runs uvicorn on port 8000 as a non-root user. |
| dev | `cd frontend && npm run dev` | Starts the Vite dev server. |
| build | `cd frontend && npm run build` | Bundles the SPA into frontend/dist. This does not typecheck. |
| preview | `cd frontend && npm run preview` | Serves the production build locally. |
| typecheck | `cd frontend && npm run typecheck` | Runs `tsc --noEmit` over src/. |
| lint | `cd frontend && npm run lint` | Runs ESLint over the frontend. `npm run lint:fix` applies the fixes it can. |
| format | `cd frontend && npm run format` | Runs Prettier --write. `npm run format:check` only checks. |
| backend lint | `cd backend && ruff check .` | Lints the backend with Ruff. |
| backend format | `cd backend && ruff format .` | Formats the backend with Ruff. |
<!-- sdlc:auto:end run -->

<!-- sdlc:auto:start structure -->
| Path | Purpose |
|---|---|
| `.devcontainer` | Dev container configuration (devcontainer.json). |
| `.github/workflows` | deploy.yml: on push to main, builds and pushes the API image to ECR and builds and deploys the frontend to AWS Amplify, using OIDC for AWS credentials. |
| `.quorq` | Platform handoff metadata (handoff.json). |
| `docs` | Project documentation, including behaviour-rules.md. |
| `backend` | FastAPI service: Dockerfile, requirements.txt, alembic.ini, pytest.ini, ruff.toml. |
| `backend/app` | Application code: main.py (app, CORS, startup migrate and seed), database.py, models.py, schemas.py, deps.py (auth dependencies), security.py, storage.py (receipts), email.py, routers/ (one per component) and services/ (business logic). |
| `backend/alembic` | Alembic environment and versioned migrations (identity, categories, claims, claim status changes). |
| `backend/scripts` | Utility scripts (check_connections.py). |
| `backend/tests` | Pytest unit tests, plus integration/ acceptance tests for approval, submit, resubmit, receipts, mark-paid, CSV export, notifications and privacy. |
| `frontend` | Vite + React SPA: package.json, vite.config.ts, playwright.config.ts, eslint.config.js, tsconfig.json. |
| `frontend/src` | App.tsx (navigation shell and routes), main.tsx, screens/ (one module per screen), components/, lib/ (api client, auth, UI and icon vocabulary, brand tokens), and component tests beside their sources. |
| `frontend/e2e` | Playwright acceptance specs and support helpers. |
| `frontend/playwright-report` | Generated Playwright HTML report output. |
<!-- sdlc:auto:end structure -->

<!-- sdlc:auto:start conventions -->
- Backend: one APIRouter module per component in app/routers, each included in main.py. All endpoints live under /api, except the /health liveness probe.
- Business rules sit in app/services (users, categories, claims, decisions, notifications). Request and response models sit in app/schemas.py.
- Auth is enforced with FastAPI dependencies: `require_auth` for signed-in users and `require_finance` for Finance-only routers (users, reports) and category writes.
- Sessions are opaque bearer tokens. Only their hash is stored (UserSession.token_hash). The frontend keeps the token in localStorage and `apiFetch` sends it as `Authorization: Bearer`.
- Money is stored as Numeric(10,2) and Decimal, and serialized to the client as 2-decimal strings (amount_gbp, total_gbp, limit_gbp).
- Datetimes are timezone-aware UTC via the UTCDateTime type and `utcnow()`. Only portable column types are used, so tests can run on SQLite.
- Claim status flow: draft → pending_manager (or pending_finance if the owner has no active manager) → pending_finance → approved → paid. A rejection, which needs a comment, returns the claim to draft. Nobody can decide on their own claim.
- Every status change is written with `record_status_change` into ClaimStatusChange. That table is append-only: SQLAlchemy event listeners refuse updates and deletes.
- Concurrent edits and decisions are serialized by re-reading the claim status under a row lock (`locked_status`, using SELECT ... FOR UPDATE).
- Schema changes go through Alembic migrations in backend/alembic/versions. The app upgrades to head on startup.
- Frontend: the `@/` alias maps to src/. Screens live in src/screens and shared pieces in src/components and src/lib. Vitest tests (*.test.tsx) sit beside the code they cover, and Playwright specs live in e2e/.
- Styling uses Tailwind 4 utility classes plus brand CSS variables (for example var(--brand-surface)) defined in src/index.css and src/lib/brand.ts.
- Formatting and linting: Prettier and ESLint for the frontend, Ruff for the backend.
<!-- sdlc:auto:end conventions -->

<!-- sdlc:auto:start testing -->
| Name | Command | Description |
|---|---|---|
| backend tests | `cd backend && pytest` | Runs the unit tests in backend/tests and the integration/ acceptance tests. pytest.ini sets pythonpath and testpaths. |
| frontend unit | `cd frontend && npm test` | Runs Vitest component tests under src/ in jsdom. |
| e2e browser install | `cd frontend && npm run test:e2e:install` | Installs Chromium for Playwright. |
| e2e | `cd frontend && npm run test:e2e` | Runs the Playwright specs in e2e/. Without E2E_BASE_URL it boots the backend from backend/.venv on port 8000, then builds and previews the frontend on port 4173. With E2E_BASE_URL set it targets that URL instead. |
<!-- sdlc:auto:end testing -->

<!-- sdlc:auto:start troubleshooting -->
| Problem | Solution |
|---|---|
| Backend crashes at import with `KeyError: 'DATABASE_URL'`. | database.py reads DATABASE_URL with no default. Export it before starting uvicorn, pytest or the Playwright web server, for example a postgresql+psycopg URL for the docker-compose database. database.py also handles sqlite URLs. |
| Playwright's webServer fails to start the backend. | It runs `../backend/.venv/bin/python`, so create backend/.venv and install requirements.txt into it. Its comment claims the backend defaults to SQLite, but database.py actually requires DATABASE_URL, so make sure that variable is set in the environment. |
| No account to sign in with (there is no self sign-up). | Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD before the first startup. main.py creates that Finance user once if the email does not exist. The Finance user can then create other users via /api/users. |
| Browser shows CORS errors when calling the API. | By default only http://localhost:5173 and http://127.0.0.1:5173 are allowed. For any other origin, set ALLOWED_ORIGINS to a comma-separated list of origins. |
| Frontend calls the wrong API host. | API_BASE_URL comes from VITE_API_BASE_URL at build or dev time and falls back to http://localhost:8000. Set it before `npm run dev` or `npm run build`. |
| `npm run build` succeeds but the code has type errors. | The build does not typecheck. Run `npm run typecheck` and fix the reported errors. |
| The deploy workflow embeds a literal VITE_API_SECRET_KEY (and NEXT_PUBLIC_API_SECRET_KEY) value. Anything inlined by Vite ends up in the public JavaScript bundle. | Treat that value as exposed. Rotate it, move it to a GitHub Actions secret (for example `${{ secrets.<secret-name> }}`), and avoid baking shared secrets into client bundles at all. |
| Receipt uploads are rejected with 413 or 415. | Uploads must be JPEG, PNG or PDF, no more than 5 MB, with a content type that matches the file's magic bytes. Check app/storage.py for how the receipt bucket or the local fallback is configured. |
<!-- sdlc:auto:end troubleshooting -->
