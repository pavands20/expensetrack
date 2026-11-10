# Tests

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start summary -->
20 tests · Passed 6 · Failed 13 · Skipped 0 · Not run 1

Acceptance criteria covered: 7/102 · passing: 1/102
<!-- sdlc:auto:end summary -->

<!-- sdlc:auto:start tests -->
## Sprint 1

### US-005: Sign in with email and password

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| AC-017 | test_ac017_login_returns_token_and_user_and_me_works | Unit | Failed | `backend/tests/test_auth.py` |
| AC-018 | test_ac018_failures_return_identical_401 | Unit | Passed | `backend/tests/test_auth.py` |
| AC-019 | test_ac019_login_and_healthz_need_no_token | Unit | Passed | `backend/tests/test_auth.py` |
| AC-019 | test_ac019_protected_routes_require_token[get-/api/auth/me] | Unit | Failed | `backend/tests/test_auth.py` |
| AC-019 | test_ac019_protected_routes_require_token[get-/api/users] | Unit | Failed | `backend/tests/test_auth.py` |
| AC-019 | test_ac019_protected_routes_require_token[post-/api/auth/logout] | Unit | Failed | `backend/tests/test_auth.py` |
| AC-019 | test_ac019_protected_routes_require_token[post-/api/users/1/deactivate] | Unit | Failed | `backend/tests/test_auth.py` |
| AC-020 | test_ac020_nfr001_password_hashed_and_no_raw_token | Unit | Failed | `backend/tests/test_auth.py` |
| AC-021 | test_ac021_logout_invalidates_token | Unit | Failed | `backend/tests/test_auth.py` |
| AC-022 | test_ac022_activity_within_window_keeps_session_alive | Unit | Failed | `backend/tests/test_auth.py` |
| AC-022 | test_ac022_idle_minutes_setting_respected | Unit | Failed | `backend/tests/test_auth.py` |
| AC-022 | test_ac022_idle_session_expires | Unit | Failed | `backend/tests/test_auth.py` |
| AC-023 | test_ac023_deactivate_endpoint_revokes_sessions | Unit | Failed | `backend/tests/test_auth.py` |
| AC-023 | test_ac023_deactivated_user_token_rejected | Unit | Failed | `backend/tests/test_auth.py` |
| — | test_first_admin_not_seeded_when_unset | Unit | Passed | `backend/tests/test_auth.py` |
| — | test_first_admin_seed_creates_one_finance_user_no_duplicate | Unit | Failed | `backend/tests/test_auth.py` |
| — | test_nfr003_generic_message_same_for_known_and_unknown | Unit | Passed | `backend/tests/test_auth.py` |

## Project setup

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| — | test_health_reports_ok | Unit | Passed | `backend/tests/test_health.py` |
| — | test_the_openapi_document_builds | Unit | Passed | `backend/tests/test_health.py` |
| — | the app loads | E2E | Not run yet | `frontend/e2e/example.spec.ts` |
<!-- sdlc:auto:end tests -->
