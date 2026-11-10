# API Reference

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start endpoints -->
| Method | Path | Handler | Source | Summary |
|---|---|---|---|---|
| GET | /health | health | `backend/app/main.py:57` | Liveness probe, and the only route here that is not a stub. |
<!-- sdlc:auto:end endpoints -->

<!-- sdlc:auto:start drift -->
**Designed but missing:**

- DELETE /api/claims/{id}
- DELETE /api/claims/{id}/lines/{line_id}
- GET /api/approvals/queue
- GET /api/auth/me
- GET /api/categories
- GET /api/claims
- GET /api/claims/{id}
- GET /api/claims/{id}/history
- GET /api/claims/{id}/lines/{line_id}/receipt-url
- GET /api/dashboard/me
- GET /api/healthz
- GET /api/reports/export.csv
- GET /api/reports/totals
- GET /api/users
- PATCH /api/categories/{id}
- PATCH /api/claims/{id}/lines/{line_id}
- PATCH /api/users/{id}
- POST /api/auth/login
- POST /api/auth/logout
- POST /api/auth/password-reset/confirm
- POST /api/auth/password-reset/request
- POST /api/categories
- POST /api/claims
- POST /api/claims/{id}/decision
- POST /api/claims/{id}/lines
- POST /api/claims/{id}/mark-paid
- POST /api/claims/{id}/submit
- POST /api/users
- POST /api/users/{id}/deactivate
- PUT /api/claims/{id}/lines/{line_id}/receipt
<!-- sdlc:auto:end drift -->

<!-- sdlc:auto:start source -->
Generated from commit `a4463f7`
<!-- sdlc:auto:end source -->
