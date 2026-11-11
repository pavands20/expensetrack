# Traceability Matrix

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start legend -->
Built from recorded links, not written by a model: requirement key → plan item (`source_stable_key`) → development ticket (`stable_key`) → the ticket's test steps → the last live deployment that started after the work finished. **AC tests** counts the story's acceptance criteria that have a test case, and those whose test cases all passed in the latest finished E2E run.
<!-- sdlc:auto:end legend -->

<!-- sdlc:auto:start matrix -->
| Requirement | Epic | Title | Plan items | Sprint | Design | Code | Commits | Ticket | Tests | AC tests | Deployed |
|---|---|---|---|---|---|---|---|---|---|---|---|
| US-001 | EPIC-001 | Finance creates user accounts | US-001 | 1 | GET /api/users, POST /api/users, admin_module, database, users, web_spa | backend/Dockerfile, backend/alembic/env.py, backend/alembic/versions/0001_users_sessions.py, backend/app/auth.py, backend/app/main.py +16 more | d52e08e, 19aae9f, 7874418 | delivered | not run | 0/4 tested · 0/4 passing | — |
| US-002 | EPIC-001 | Finance assigns and changes a user's manager | US-002 | 1 | PATCH /api/users/{id}, admin_module, users, web_spa | — | d52e08e, 19aae9f, 7874418 | delivered | not run | 0/4 tested · 0/4 passing | — |
| US-003 | EPIC-001 | Finance deactivates a user while keeping history | US-003 | 1 | POST /api/users/{id}/deactivate, admin_module, auth_module, sessions, users, web_spa | — | d52e08e, 19aae9f, 7874418 | delivered | not run | 0/4 tested · 0/4 passing | — |
| US-004 | EPIC-001 | Role-based visibility of claims | US-004 | 3 | GET /api/claims, GET /api/claims/{id}, api_gateway, claims, claims_module, users | — | — | not started | not run | 0/4 tested · 0/4 passing | — |
| US-005 | EPIC-002 | Sign in with email and password | US-005 | 1 | GET /api/auth/me, POST /api/auth/login, api_gateway, auth_module, database, sessions, users, web_spa | backend/Dockerfile, backend/alembic.ini, backend/alembic/env.py, backend/alembic/versions/0001_identity.py, backend/app/auth.py +28 more | d52e08e, 19aae9f, 7874418 | delivered | succeeded | 4/4 tested · 4/4 passing | — |
| US-006 | EPIC-002 | Sessions expire and sign-out ends the session | US-006 | 1 | POST /api/auth/logout, auth_module, sessions, web_spa | — | d52e08e, 19aae9f, 7874418 | delivered | not run | 3/3 tested · 3/3 passing | — |
| US-007 | EPIC-002 | Reset a forgotten password by email | US-007 | 2 | POST /api/auth/password-reset/confirm, POST /api/auth/password-reset/request, auth_module, email_service, notification_module, password_reset_tokens, sessions, users, web_spa | — | — | not started | not run | 0/4 tested · 0/4 passing | — |
| US-008 | EPIC-003 | Create a draft claim with lines | US-008, US-008-T1, US-008-T2, US-008-T3 | 2 | GET /api/claims/{id}, POST /api/claims, POST /api/claims/{id}/lines, categories, claim_lines, claims, claims_module, database, web_spa | — | — | not started | not run | 0/4 tested · 0/4 passing | — |
| US-009 | EPIC-003 | Edit a draft claim | US-009 | 3 | DELETE /api/claims/{id}/lines/{line_id}, PATCH /api/claims/{id}/lines/{line_id}, claim_lines, claims, claims_module, web_spa | — | — | not started | not run | 0/4 tested · 0/4 passing | — |
| US-010 | EPIC-003 | Delete a draft claim | US-010 | 2 | DELETE /api/claims/{id}, claim_lines, claims, claims_module, web_spa | — | — | not started | not run | 0/3 tested · 0/3 passing | — |
| US-011 | EPIC-004 | Upload a receipt to a claim line | US-011 | 3 | PUT /api/claims/{id}/lines/{line_id}/receipt, claim_lines, claims_module, receipt_store, web_spa | — | — | not started | not run | 0/5 tested · 0/5 passing | — |
| US-012 | EPIC-004 | View receipts through short-lived private links | US-012 | 4 | GET /api/claims/{id}/lines/{line_id}/receipt-url, claim_lines, claims_module, receipt_store, web_spa | — | — | not started | not run | 0/4 tested · 0/4 passing | — |
| US-013 | EPIC-005 | Submit a claim and lock it | US-013 | 3 | POST /api/claims/{id}/submit, approval_module, claim_events, claim_lines, claims, claims_module, web_spa | — | — | not started | not run | 0/4 tested · 0/4 passing | — |
| US-014 | EPIC-005 | Manager approves or rejects direct reports' claims | US-014 | 4 | GET /api/approvals/queue, POST /api/claims/{id}/decision, approval_module, claim_events, claims, web_spa | — | — | not started | not run | 0/5 tested · 0/5 passing | — |
| US-015 | EPIC-005 | Finance approves or rejects manager-approved claims | US-015 | 4 | GET /api/approvals/queue, POST /api/claims/{id}/decision, approval_module, claim_events, claims, users, web_spa | — | — | not started | not run | 0/5 tested · 0/5 passing | — |
| US-016 | EPIC-005 | Mark an approved claim as paid | US-016 | 5 | POST /api/claims/{id}/mark-paid, approval_module, claim_events, claims, web_spa | — | — | not started | not run | 0/4 tested · 0/4 passing | — |
| US-017 | EPIC-005 | Nobody approves their own claim | US-017 | 4 | POST /api/claims/{id}/decision, approval_module, claims | — | — | not started | not run | 0/3 tested · 0/3 passing | — |
| US-018 | EPIC-005 | Rejected claim returns to the employee to fix and resubmit | US-018 | 5 | GET /api/claims/{id}, POST /api/claims/{id}/submit, approval_module, claim_events, claims, claims_module, web_spa | — | — | not started | not run | 0/3 tested · 0/3 passing | — |
| US-019 | EPIC-006 | Finance manages categories and limits | US-019 | 2 | GET /api/categories, PATCH /api/categories/{id}, POST /api/categories, admin_module, categories, database, web_spa | — | — | not started | not run | 0/5 tested · 0/5 passing | — |
| US-020 | EPIC-006 | Flag over-limit lines for approvers | US-020 | 5 | GET /api/approvals/queue, GET /api/claims/{id}, approval_module, categories, claim_lines, claims_module, web_spa | — | — | not started | not run | 0/3 tested · 0/3 passing | — |
| US-021 | EPIC-007 | Employee dashboard of own claims by status | US-021 | 5 | GET /api/dashboard/me, claims, claims_module, web_spa | — | — | not started | not run | 0/4 tested · 0/4 passing | — |
| US-022 | EPIC-007 | Finance totals by category and month | US-022 | 6 | GET /api/reports/totals, categories, claim_lines, claims, reporting_module, web_spa | — | — | not started | not run | 0/3 tested · 0/3 passing | — |
| US-023 | EPIC-007 | Export approved claims as CSV with a date range | US-023 | 5 | GET /api/reports/export.csv, categories, claim_events, claim_lines, claims, reporting_module, users, web_spa | — | — | not started | not run | 0/5 tested · 0/5 passing | — |
| US-024 | EPIC-008 | Email notifications on submission and decisions | US-024 | 5 | approval_module, claims, email_service, notification_module, users | — | — | not started | not run | 0/3 tested · 0/3 passing | — |
| US-025 | EPIC-008 | Audit trail of claim status changes | US-025 | 4 | GET /api/claims/{id}/history, approval_module, claim_events, database, web_spa | — | — | not started | not run | 0/3 tested · 0/3 passing | — |
| US-026 | EPIC-009 | Setup and configuration guide | US-026 | 6 | — | — | — | not started | not run | 0/3 tested · 0/3 passing | — |
| US-027 | EPIC-009 | User guide for each role | US-027 | 6 | — | — | — | not started | not run | 0/2 tested · 0/2 passing | — |
<!-- sdlc:auto:end matrix -->
