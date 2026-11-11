# Tests

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start summary -->
13 tests · Passed 13 · Failed 0 · Skipped 0 · Not run 0

Acceptance criteria covered: 7/102 · passing: 7/102
<!-- sdlc:auto:end summary -->

<!-- sdlc:auto:start tests -->
## Sprint 1

### US-005: Sign in with email and password

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| AC-017 | test_ac017_login_returns_token_usable_as_bearer | Unit | Passed | `backend/tests/test_auth.py` |
| AC-018 | test_ac018_identical_401 | Unit | Passed | `backend/tests/test_auth.py` |
| AC-019 | test_ac019_requires_token | Unit | Passed | `backend/tests/test_auth.py` |
| AC-020 | test_ac020_hashes_only | Unit | Passed | `backend/tests/test_auth.py` |
| AC-021 | test_ac021_logout_revokes | Unit | Passed | `backend/tests/test_auth.py` |
| AC-022 | test_ac022_idle_expiry | Unit | Passed | `backend/tests/test_auth.py` |
| AC-022 | test_ac022_last_seen_slides | Unit | Passed | `backend/tests/test_auth.py` |
| AC-023 | test_ac023_inactive_user_session | Unit | Passed | `backend/tests/test_auth.py` |
| — | test_password_reset_flow | Unit | Passed | `backend/tests/test_auth.py` |
| — | test_require_finance_403 | Unit | Passed | `backend/tests/test_auth.py` |

## Project setup

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| — | test_health_reports_ok | Unit | Passed | `backend/tests/test_health.py` |
| — | test_the_openapi_document_builds | Unit | Passed | `backend/tests/test_health.py` |
| — | the app loads | E2E | Passed | `frontend/e2e/example.spec.ts` |
<!-- sdlc:auto:end tests -->
