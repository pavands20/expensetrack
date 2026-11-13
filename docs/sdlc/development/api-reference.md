# API Reference

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start endpoints -->
| Method | Path | Handler | Source | Summary |
|---|---|---|---|---|
| GET | /api/approvals/queue | queue | `backend/app/routers/approvals.py:106` | — |
| POST | /api/auth/login | login | `backend/app/routers/auth.py:31` | — |
| POST | /api/auth/logout | logout | `backend/app/routers/auth.py:43` | — |
| GET | /api/auth/me | me | `backend/app/routers/auth.py:50` | — |
| POST | /api/auth/password-reset/confirm | reset_confirm | `backend/app/routers/auth.py:65` | — |
| POST | /api/auth/password-reset/request | reset_request | `backend/app/routers/auth.py:55` | — |
| GET | /api/categories | list_categories | `backend/app/routers/categories.py:41` | — |
| POST | /api/categories | create_category | `backend/app/routers/categories.py:53` | — |
| PATCH | /api/categories/{category_id} | patch_category | `backend/app/routers/categories.py:64` | — |
| GET | /api/claims | list_claims | `backend/app/routers/claims.py:125` | — |
| POST | /api/claims | create_claim | `backend/app/routers/claims.py:132` | — |
| GET | /api/claims/receipt-files/{key:path} | receipt_file | `backend/app/routers/receipts.py:74` | — |
| DELETE | /api/claims/{claim_id} | delete_claim | `backend/app/routers/claims.py:243` | — |
| GET | /api/claims/{claim_id} | get_claim | `backend/app/routers/claims.py:236` | — |
| POST | /api/claims/{claim_id}/decision | decide_claim | `backend/app/routers/approvals.py:58` | — |
| GET | /api/claims/{claim_id}/history | claim_history | `backend/app/routers/history.py:27` | — |
| POST | /api/claims/{claim_id}/lines | add_line | `backend/app/routers/claims.py:142` | — |
| DELETE | /api/claims/{claim_id}/lines/{line_id} | delete_line | `backend/app/routers/claims.py:213` | — |
| PATCH | /api/claims/{claim_id}/lines/{line_id} | patch_line | `backend/app/routers/claims.py:190` | — |
| PUT | /api/claims/{claim_id}/lines/{line_id}/receipt | put_receipt | `backend/app/routers/receipts.py:27` | — |
| GET | /api/claims/{claim_id}/lines/{line_id}/receipt-url | receipt_url | `backend/app/routers/receipts.py:59` | — |
| POST | /api/claims/{claim_id}/mark-paid | mark_paid | `backend/app/routers/payments.py:17` | — |
| POST | /api/claims/{claim_id}/submit | submit_claim | `backend/app/routers/approvals.py:18` | — |
| GET | /api/dashboard/me | my_dashboard | `backend/app/routers/dashboard.py:47` | — |
| GET | /api/healthz | healthz | `backend/app/routers/auth.py:26` | — |
| GET | /api/reports/export.csv | export_csv | `backend/app/routers/reports.py:72` | — |
| GET | /api/reports/totals | totals | `backend/app/routers/reports.py:46` | GBP totals of approved/paid claim lines per UTC approval month and category. |
| GET | /api/users | list_users | `backend/app/routers/users.py:18` | — |
| POST | /api/users | create_user | `backend/app/routers/users.py:23` | — |
| PATCH | /api/users/{user_id} | patch_user | `backend/app/routers/users.py:53` | — |
| POST | /api/users/{user_id}/deactivate | deactivate_user | `backend/app/routers/users.py:80` | — |
| GET | /health | health | `backend/app/main.py:118` | Liveness probe. |
<!-- sdlc:auto:end endpoints -->

<!-- sdlc:auto:start drift -->
**Designed but missing:**

- DELETE /api/claims/{id}
- DELETE /api/claims/{id}/lines/{line_id}
- GET /api/claims/{id}
- GET /api/claims/{id}/history
- GET /api/claims/{id}/lines/{line_id}/receipt-url
- PATCH /api/categories/{id}
- PATCH /api/claims/{id}/lines/{line_id}
- PATCH /api/users/{id}
- POST /api/claims/{id}/decision
- POST /api/claims/{id}/lines
- POST /api/claims/{id}/mark-paid
- POST /api/claims/{id}/submit
- POST /api/users/{id}/deactivate
- PUT /api/claims/{id}/lines/{line_id}/receipt

**Code only:**

- DELETE /api/claims/{claim_id}
- DELETE /api/claims/{claim_id}/lines/{line_id}
- GET /api/claims/receipt-files/{key:path}
- GET /api/claims/{claim_id}
- GET /api/claims/{claim_id}/history
- GET /api/claims/{claim_id}/lines/{line_id}/receipt-url
- PATCH /api/categories/{category_id}
- PATCH /api/claims/{claim_id}/lines/{line_id}
- PATCH /api/users/{user_id}
- POST /api/claims/{claim_id}/decision
- POST /api/claims/{claim_id}/lines
- POST /api/claims/{claim_id}/mark-paid
- POST /api/claims/{claim_id}/submit
- POST /api/users/{user_id}/deactivate
- PUT /api/claims/{claim_id}/lines/{line_id}/receipt
<!-- sdlc:auto:end drift -->

<!-- sdlc:auto:start source -->
Generated from commit `038787a`
<!-- sdlc:auto:end source -->
