# API Reference

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start endpoints -->
| Method | Path | Handler | Source | Summary |
|---|---|---|---|---|
| POST | /api/auth/login | login | `backend/app/routers/auth.py:41` | — |
| POST | /api/auth/logout | logout | `backend/app/routers/auth.py:53` | — |
| GET | /api/auth/me | me | `backend/app/routers/auth.py:60` | — |
| POST | /api/auth/password-reset/confirm | reset_confirm | `backend/app/routers/auth.py:91` | — |
| POST | /api/auth/password-reset/request | reset_request | `backend/app/routers/auth.py:65` | — |
| GET | /api/healthz | healthz | `backend/app/routers/auth.py:36` | — |
| GET | /api/users | list_users | `backend/app/routers/users.py:17` | — |
| POST | /api/users | create_user | `backend/app/routers/users.py:22` | — |
| PATCH | /api/users/{user_id} | patch_user | `backend/app/routers/users.py:44` | — |
| POST | /api/users/{user_id}/deactivate | deactivate_user | `backend/app/routers/users.py:60` | — |
| GET | /health | health | `backend/app/main.py:89` | Liveness probe, and the only route here that is not a stub. |
<!-- sdlc:auto:end endpoints -->

<!-- sdlc:auto:start drift -->
**Designed but missing:**

- DELETE /api/claims/{id}
- DELETE /api/claims/{id}/lines/{line_id}
- GET /api/approvals/queue
- GET /api/categories
- GET /api/claims
- GET /api/claims/{id}
- GET /api/claims/{id}/history
- GET /api/claims/{id}/lines/{line_id}/receipt-url
- GET /api/dashboard/me
- GET /api/reports/export.csv
- GET /api/reports/totals
- PATCH /api/categories/{id}
- PATCH /api/claims/{id}/lines/{line_id}
- PATCH /api/users/{id}
- POST /api/categories
- POST /api/claims
- POST /api/claims/{id}/decision
- POST /api/claims/{id}/lines
- POST /api/claims/{id}/mark-paid
- POST /api/claims/{id}/submit
- POST /api/users/{id}/deactivate
- PUT /api/claims/{id}/lines/{line_id}/receipt

**Code only:**

- PATCH /api/users/{user_id}
- POST /api/users/{user_id}/deactivate
<!-- sdlc:auto:end drift -->

<!-- sdlc:auto:start source -->
Generated from commit `879786e`
<!-- sdlc:auto:end source -->
