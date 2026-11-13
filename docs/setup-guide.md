# ExpenseTrack setup and configuration guide

## Requirements

- PostgreSQL 16. Set `DATABASE_URL` (SQLAlchemy URL, `postgresql+psycopg://...`).
- An Amazon S3 bucket for receipts. Set `S3_BUCKET`. The bucket must be private: enable Block Public Access, no public ACLs. Receipts are served only through short-lived presigned links.
- Amazon SES for email (password reset and notifications). The sender domain or sender identity must be verified in SES before mail is sent.
- Hosting region: AWS London, `eu-west-2`. Set `AWS_REGION=eu-west-2`. Data is encrypted at rest and in transit, for GDPR.
- AWS credentials: use an IAM role (or the default AWS credentials chain); never put keys in the repository.

## Settings

| Setting | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection |
| `S3_BUCKET` | Private receipts bucket (unset: files stored under `MEDIA_ROOT`) |
| `AWS_REGION` | AWS region, `eu-west-2` |
| `SESSION_IDLE_MINUTES` | Idle sign-in timeout, default 30 minutes |
| `RESET_TOKEN_MINUTES` | Password reset link lifetime, default 60 |
| `BOOTSTRAP_ADMIN_EMAIL` | Email of the first Finance user |
| `BOOTSTRAP_ADMIN_PASSWORD` | Password of the first Finance user |

## Running

1. Install: `cd backend && pip install -r requirements.txt`.
2. Apply migrations: `alembic upgrade head`.
3. Start the API: `uvicorn app.main:app` (or `docker compose up`).
4. Build and serve the frontend from `frontend/` (`npm install`, `npm run build`).

## First Finance user and initial categories

There is no self sign-up. On startup the API seeds the first Finance user from `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` (only if no user with that email exists). Sign in with it, then create other accounts and assign managers.

The initial categories Travel, Meals, Equipment and Other are seeded only when no categories exist. Finance can then edit categories, set per-line limits or retire them.

## Out of scope

Currency conversion, mileage, card feeds and accounting integrations are not supported (out of scope). English only.
