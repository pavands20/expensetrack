# Developer Guide

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start status -->
_Up to date._
<!-- sdlc:auto:end status -->

<!-- sdlc:auto:start source -->
Generated from commit `a4463f7` · model `auto`
<!-- sdlc:auto:end source -->

<!-- sdlc:auto:start overview -->
ExpenseTrack is an early-stage scaffold for an employee expense-claims app: employees submit claims, managers and Finance approve them, and Finance marks them paid. The repository holds two applications. `frontend/` is a Vite + React 19 + TypeScript single-page app styled with Tailwind CSS v4 and routed with react-router-dom v7. Its four screens (SignIn, Dashboard, Claim, Help) render seeded sample data and do not call the API yet. `frontend/src/lib/api.ts` provides `apiFetch` as the seam for wiring screens to the backend. `backend/` is a FastAPI 0.115 service using SQLAlchemy 2.0. It defines no models and no feature routes yet, and its only endpoint is `GET /health`. It uses SQLite (`sqlite:///./app.db`) by default and can be pointed at PostgreSQL 16 through `DATABASE_URL`. Tables are created from the models at startup with `create_all`, and there are no migrations. A GitHub Actions workflow deploys on every push to `main`: it pushes the backend Docker image to AWS ECR and publishes the frontend build to AWS Amplify.
<!-- sdlc:auto:end overview -->

<!-- sdlc:auto:start prerequisites -->
- Node.js with npm (for the frontend; the manifests do not pin a version)
- Python 3.12 (the version used by backend/Dockerfile)
- Docker with Docker Compose (optional; only needed to run the PostgreSQL 16 service in docker-compose.yml or to build the backend image)
<!-- sdlc:auto:end prerequisites -->

<!-- sdlc:auto:start setup -->
1. Create a backend virtualenv at backend/.venv, the location the Playwright config expects: cd backend && python3.12 -m venv .venv
2. Install the backend dependencies, including pytest, pytest-cov, httpx and ruff: .venv/bin/pip install -r requirements.txt
3. Start the API. It uses ./app.db (SQLite) unless DATABASE_URL is set, and creates its tables on startup: .venv/bin/uvicorn app.main:app --reload
4. (Optional, for PostgreSQL) From the repo root: docker compose up -d db. Then start the API with DATABASE_URL=postgresql+psycopg://app:app@localhost:5432/app (credentials from docker-compose.yml; driver from psycopg in requirements.txt)
5. In a second terminal, install the frontend dependencies: cd frontend && npm install
6. Start the frontend dev server: npm run dev. It runs on http://localhost:5173, which is the backend's default CORS origin. The API client defaults to http://localhost:8000 unless VITE_API_BASE_URL is set.
<!-- sdlc:auto:end setup -->

<!-- sdlc:auto:start run -->
| Name | Command | Description |
|---|---|---|
| frontend dev | `cd frontend && npm run dev` | Starts the Vite dev server for the React SPA. |
| frontend build | `cd frontend && npm run build` | Bundles the app into frontend/dist with vite build. This does not typecheck. |
| frontend preview | `cd frontend && npm run preview` | Serves the production build locally with vite preview. |
| frontend typecheck | `cd frontend && npm run typecheck` | Runs tsc --noEmit to catch type errors that vite build skips. |
| frontend lint | `cd frontend && npm run lint` | Runs ESLint over the app. Use npm run lint:fix to apply automatic fixes. The README asks that lint stays green. |
| frontend format | `cd frontend && npm run format` | Formats files with Prettier. npm run format:check verifies formatting without writing changes. |
| backend dev | `cd backend && uvicorn app.main:app --reload` | Runs the FastAPI app with auto-reload on http://localhost:8000. GET /health returns {"status": "ok"}. |
| backend lint | `cd backend && ruff check .` | Lints the backend with Ruff, configured in backend/ruff.toml. |
| backend format | `cd backend && ruff format .` | Formats the backend code with Ruff. |
| database | `docker compose up -d db` | Starts PostgreSQL 16 (user, password and database all 'app') on port 5432, with a persistent db-data volume. |
| backend container | `cd backend && docker build -t expensetrack-api . && docker run -p 8000:8000 expensetrack-api` | Builds and runs the backend image from backend/Dockerfile. It runs uvicorn on port 8000 as a non-root user, with a /health healthcheck. |
<!-- sdlc:auto:end run -->

<!-- sdlc:auto:start structure -->
| Path | Purpose |
|---|---|
| `.devcontainer` | Dev container definition (devcontainer.json). |
| `.github/workflows` | deploy.yml: on each push to main, uses AWS OIDC to build and push the backend image to ECR, then builds the frontend and publishes it to an AWS Amplify branch. |
| `.quorq` | Platform handoff metadata (handoff.json) from the Quorq AI SDLC platform that generated the repo. |
| `backend` | FastAPI service, with requirements.txt, Dockerfile, pytest.ini and ruff.toml. |
| `backend/app` | Application package: main.py (app, CORS, lifespan create_all, /health), database.py (engine, SessionLocal, Base, get_db), models.py (SQLAlchemy models; none yet), schemas.py (Pydantic models, currently StubResponse), and routers/ (per-component routers; currently empty). |
| `backend/tests` | Pytest suite: conftest.py and test_health.py. |
| `frontend` | Vite + React SPA, with package.json, vite.config.ts, tsconfig.json, eslint.config.js, .prettierrc and playwright.config.ts. |
| `frontend/src` | App source. main.tsx mounts BrowserRouter. App.tsx holds the nav shell and route table. screens/ has one module per approved screen. lib/ has api.ts (API client), ui.tsx, icons.tsx, brand.ts and navigate.ts. index.css holds the brand CSS variables, and test-setup.ts the Vitest setup. |
| `frontend/e2e` | Playwright end-to-end specs (example.spec.ts). |
<!-- sdlc:auto:end structure -->

<!-- sdlc:auto:start conventions -->
- Frontend imports use the `@/` alias for `src/` (configured in both vite.config.ts and tsconfig.json).
- Each screen is a default-exported component in src/screens/. Routes are declared in App.tsx: /dashboard, /claim and /help render inside the AppShellLayout nav, /sign-in renders outside it, and any unknown path redirects to /sign-in.
- Styling uses Tailwind v4 utility classes plus brand CSS variables such as var(--brand-surface), var(--brand-fg) and var(--brand-radius), defined in index.css and brand.ts.
- Screens currently render seeded sample data. API calls should go through `apiFetch` in src/lib/api.ts, which reads VITE_API_BASE_URL (default http://localhost:8000). It sends the session token from localStorage, or else VITE_API_SECRET_KEY, as a Bearer header.
- TypeScript runs in strict mode with noImplicitAny and strictNullChecks turned off.
- Component tests (*.test.tsx / *.spec.tsx) live beside the components they cover in src/. Playwright specs live only in e2e/.
- Backend models inherit `Base` from app.database and go in app/models.py, which main.py imports before create_all runs.
- Database sessions are request-scoped through the `get_db` dependency.
- Routers go in app/routers/, one per architecture component.
- Unimplemented routes return the typed `StubResponse` schema rather than raising.
- Backend configuration comes from environment variables. DATABASE_URL defaults to sqlite:///./app.db. ALLOWED_ORIGINS is a comma-separated CORS list that defaults to localhost:5173 and 127.0.0.1:5173.
- Backend linting and formatting use Ruff. Test dependencies are kept in the single requirements.txt.
<!-- sdlc:auto:end conventions -->

<!-- sdlc:auto:start testing -->
| Name | Command | Description |
|---|---|---|
| backend tests | `cd backend && pytest` | Runs the pytest suite in backend/tests. pytest.ini sets pythonpath=. so `import app` works. pytest-cov is installed for coverage. |
| frontend unit tests | `cd frontend && npm test` | Runs Vitest component tests in src/ with jsdom (vitest run --passWithNoTests). |
| e2e browser install | `cd frontend && npm run test:e2e:install` | Downloads the Chromium browser that Playwright needs. |
| e2e tests | `cd frontend && npm run test:e2e` | Runs Playwright specs in e2e/. If E2E_BASE_URL is unset, it boots the backend from backend/.venv on 127.0.0.1:8000, then builds and previews the frontend on port 4173. If E2E_BASE_URL is set, it runs against that URL instead. |
<!-- sdlc:auto:end testing -->

<!-- sdlc:auto:start troubleshooting -->
| Problem | Solution |
|---|---|
| npm run build succeeds but npm run typecheck fails. | This is expected: vite build does not typecheck. The frontend README notes that generated screens often use an untyped useState({}) and then read named fields from it. Add types, then re-run npm run typecheck. |
| Playwright's webServer fails to start the backend (.venv/bin/python not found). | The config runs the API from backend/.venv. Create that virtualenv and install backend/requirements.txt into it before running npm run test:e2e. |
| Playwright reports that the browser executable is missing. | Run npm run test:e2e:install in frontend/ to download Chromium. |
| Browser requests to the API are blocked by CORS. | By default the API allows only http://localhost:5173 and http://127.0.0.1:5173. If the frontend is served from another origin (for example the preview on port 4173), set ALLOWED_ORIGINS to a comma-separated list that includes it. |
| The API cannot connect to PostgreSQL, or startup fails. | Start the database with docker compose up -d db and wait for its healthcheck to pass. Set DATABASE_URL to a URL that uses the installed psycopg v3 driver, e.g. postgresql+psycopg://app:app@localhost:5432/app. Unset DATABASE_URL to fall back to SQLite. |
| Schema changes do not appear in an existing database. | There are no migrations: create_all only creates missing tables and never alters existing ones. For local SQLite, delete backend/app.db and restart. The code comments recommend adopting Alembic before any data is worth keeping. |
| Frontend screens show sample data, not data from the backend. | This is by design. Screens have not been wired to the API yet, and the backend exposes only GET /health. Implement endpoints in backend/app/routers and call them through apiFetch in src/lib/api.ts. |
| Security concern: .github/workflows/deploy.yml hardcodes VITE_API_SECRET_KEY / NEXT_PUBLIC_API_SECRET_KEY in plain text. | Any value baked into a Vite build is public in the shipped bundle, and this one is also committed to the repo. Treat it as exposed: rotate it, and move any needed value to GitHub secrets. Do not rely on a shared frontend secret for authentication. |
<!-- sdlc:auto:end troubleshooting -->
