# Test Report

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start e2e -->
**Status:** passed
**Target:** the app booted from the repository in the sandbox
**Date:** 2026-11-13

Passed: 60 · Failed: 0 · Skipped: 0 · Flaky: 0 · Total: 60

| Spec | Status |
|---|---|
| [AC-072] first admin sees the seed categories with No limit | passed |
| [AC-073] limit persists after reload and clearing shows No limit | passed |
| [AC-074][NFR-011] retired category hidden from Employee list but kept for Finance | passed |
| [AC-075][NFR-004] Employee gets 403 on POST/PATCH and has no Categories nav link | passed |
| [AC-076] duplicate names, including different case, are refused | passed |
| [AC-032] edit a draft line and see new values and total after reload | passed |
| [AC-033] remove one of two lines drops it and its receipt; only line refused | passed |
| [AC-034] non-draft claim: PATCH/DELETE 409 and no edit controls | passed |
| [AC-035][NFR-004] another user's claim: PATCH/DELETE refused, nothing changes | passed |
| [AC-028] Employee creates a claim with a line, listed as Draft owned by them | passed |
| [AC-029] invalid lines are blocked and nothing is added | passed |
| [AC-030] three lines are listed and total is the GBP sum | passed |
| [AC-031] category dropdown offers seeded categories and drops retired ones | passed |
| [AC-036] confirming Delete draft removes the claim | passed |
| [AC-037] non-draft delete 409 is not testable here (no submit endpoint); covered by pytest | passed |
| [AC-038] Delete draft then Cancel keeps the claim | passed |
| [NFR-004] another Employee gets 404 for a claim | passed |
| [NFR-013] amounts are shown in GBP with two decimals, English UI | passed |
| [AC-080] claims in several statuses show a count and the right claims per tab | passed |
| [AC-081] rejected claim opens as an editable draft showing the approver's comment | passed |
| [AC-082][NFR-008] another user's claims never appear on a Employee dashboard | passed |
| [AC-082][NFR-008] another user's claims never appear on a Finance dashboard | passed |
| [AC-083] a user with no claims sees the empty state with a way to create a claim | passed |
| the app loads | passed |
| [AC-077] manager and Finance see the over-limit flag with the limit; queue marks the claim | passed |
| [AC-078] exactly £50.00 and a no-limit category show no flag | passed |
| [AC-079] employee submits a claim with an over-limit line successfully | passed |
| [NFR-008] over-limit claim data is limited by role | passed |
| [AC-024] reset request shows identical text for existing and unknown accounts | passed |
| [AC-026] bogus token shows request-a-new-link guidance and link to the request form | passed |
| [AC-025][AC-027] emailed link only logged by API; covered by backend pytest (US-007-1) | passed |
| [NFR-003] failed sign-in shows same message for unknown email and wrong password | passed |
| [AC-044] View receipt opens the receipt for the owner | passed |
| [AC-041] replacing a receipt keeps it attached and serves the new file | passed |
| [AC-039] a PNG of 5 MB or less is stored and shown as attached | passed |
| [AC-040] a file of another type is rejected with the message and nothing is attached | passed |
| [NFR-008] receipt access is limited by role: anonymous and other users are refused | passed |
| [AC-042] upload and replace are refused once the claim is submitted | passed |
| [AC-043] submit is refused and the line missing a receipt is identified | passed |
| [NFR-006] receipt link is short-lived and denied to other users | passed |
| [NFR-007] exactly 5 MB is accepted, one byte more is rejected | passed |
| [AC-039] upload a PNG and see Receipt attached | passed |
| [AC-040] 6 MB file and .txt are rejected with the message, no receipt | passed |
| [AC-069] rejected claim opens as an editable draft showing approver name and comment | passed |
| [AC-070][AC-071] resubmitting restarts approval and history keeps the rejection comment | passed |
| [AC-048] submit locks the claim in the UI and the API returns 409 on edits | passed |
| [AC-049] submitting a claim with no lines is refused and stays a draft | passed |
| [AC-050] Employee with a manager: claim is in manager queue, not Finance's | passed |
| [AC-051] no manager: Finance other than owner sees it; owner does not | passed |
| [AC-084] Finance opens Totals from the nav and sees per-category per-month GBP totals | passed |
| [AC-086][NFR-004] Employee has no Totals link and sees access denied on /admin/totals | passed |
| [AC-101][NFR-014] guide covers claims, receipts, approvals and Finance tasks for each role | passed |
| [AC-102] guide explains routing: no self approval, no assigned manager, Finance own claim | passed |
| [NFR-008] personal data is reachable only with a token and limited by role | passed |
| [AC-013] Employee sees only own claims; other's claim by ID is 404 | passed |
| [AC-014] Manager sees own and direct reports' claims only | passed |
| [AC-015] Finance sees all claims including a deactivated user's | passed |
| [AC-016] Manager requesting a non-report's claim by ID gets 404 | passed |
| [NFR-004] unauthenticated list is 401; Employee gets 403 on GET /api/users | passed |
| [NFR-008] personal data (names, emails, claims) is limited by role | passed |
<!-- sdlc:auto:end e2e -->

<!-- sdlc:auto:start unit -->
**Coverage:** backend 94.9% · frontend 88.4%

**Test cases:** 0 / 266 written

**Lines written:** 0

**Files deferred:** 0
<!-- sdlc:auto:end unit -->

<!-- sdlc:auto:start dev-checks -->
### Sprint 6

| Step | Status | Ticket | Finished |
|---|---|---|---|
| run_checks | succeeded | — | 2026-11-13 |
| write_tests | succeeded | US-022 | 2026-11-13 |
| write_tests | succeeded | US-026 | 2026-11-13 |
| write_tests | succeeded | US-027 | 2026-11-13 |

### Sprint 5

| Step | Status | Ticket | Finished |
|---|---|---|---|
| run_checks | failed | — | 2026-11-13 |
| write_tests | succeeded | US-016 | 2026-11-13 |
| write_tests | succeeded | US-018 | 2026-11-13 |
| write_tests | succeeded | US-020 | 2026-11-13 |
| write_tests | succeeded | US-021 | 2026-11-13 |
| write_tests | succeeded | US-023 | 2026-11-13 |
| write_tests | succeeded | US-024 | 2026-11-13 |

### Sprint 4

| Step | Status | Ticket | Finished |
|---|---|---|---|
| run_checks | succeeded | — | 2026-11-13 |
| write_tests | succeeded | US-014 | 2026-11-13 |

### Sprint 3

| Step | Status | Ticket | Finished |
|---|---|---|---|
| run_checks | succeeded | — | 2026-11-12 |

### Sprint 3

| Step | Status | Ticket | Finished |
|---|---|---|---|
| run_checks | succeeded | — | 2026-11-11 |
| write_tests | succeeded | US-011 | 2026-11-11 |
| write_tests | succeeded | US-013 | 2026-11-11 |
| write_tests | succeeded | US-004 | 2026-11-11 |
| write_tests | succeeded | US-009 | 2026-11-11 |

### Sprint 2

| Step | Status | Ticket | Finished |
|---|---|---|---|
| run_checks | succeeded | — | 2026-11-11 |
| write_tests | succeeded | US-019 | 2026-11-11 |
| write_tests | succeeded | US-008 | 2026-11-11 |
| write_tests | succeeded | US-007 | 2026-11-11 |

### Sprint 1

| Step | Status | Ticket | Finished |
|---|---|---|---|
| run_checks | succeeded | — | 2026-11-11 |
| write_tests | succeeded | US-005 | 2026-11-11 |

### Sprint 1

| Step | Status | Ticket | Finished |
|---|---|---|---|
| run_checks | failed | — | 2026-11-10 |
| write_tests | succeeded | US-005 | 2026-11-10 |

### Sprint 1

| Step | Status | Ticket | Finished |
|---|---|---|---|
| run_checks | failed | — | 2026-11-10 |
| write_tests | succeeded | US-001 | 2026-11-10 |

### Sprint 1

| Step | Status | Ticket | Finished |
|---|---|---|---|
| run_checks | failed | — | 2026-11-10 |
| write_tests | succeeded | US-005 | 2026-11-10 |
<!-- sdlc:auto:end dev-checks -->
