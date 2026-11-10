# Tests

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start summary -->
23 tests · Passed 22 · Failed 0 · Skipped 0 · Not run 1

Acceptance criteria covered: 8/102 · passing: 8/102
<!-- sdlc:auto:end summary -->

<!-- sdlc:auto:start tests -->
## Sprint 1

### US-001: Finance creates user accounts

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| AC-010 | test_ac010_reset_generic | Integration | Passed | `backend/tests/integration/test_auth.py` |
| AC-017 | test_ac017_login_returns_token_no_cookie | Integration | Passed | `backend/tests/integration/test_auth.py` |
| AC-018 | test_ac018_generic_401 | Integration | Passed | `backend/tests/integration/test_auth.py` |
| AC-019 | test_ac019_me_requires_token | Integration | Passed | `backend/tests/integration/test_auth.py` |
| AC-020 | test_ac020_hashes_stored | Integration | Passed | `backend/tests/integration/test_auth.py` |
| AC-021 | test_ac021_logout_revokes | Integration | Passed | `backend/tests/integration/test_auth.py` |
| AC-022 | test_ac022_idle_expiry | Integration | Passed | `backend/tests/integration/test_auth.py` |
| AC-023 | test_ac023_deactivated_and_revoke_helper | Integration | Passed | `backend/tests/integration/test_auth.py` |
| — | test_require_role_403 | Integration | Passed | `backend/tests/integration/test_auth.py` |
| AC-010 | test_ac010_reset_identical | Integration | Passed | `backend/tests/integration/test_auth_qa.py` |
| AC-017 | test_ac017_login_then_me | Integration | Passed | `backend/tests/integration/test_auth_qa.py` |
| AC-017 | test_ac017_no_set_cookie_on_auth_responses | Integration | Passed | `backend/tests/integration/test_auth_qa.py` |
| AC-018 | test_ac018_identical_401_body | Integration | Passed | `backend/tests/integration/test_auth_qa.py` |
| AC-019 | test_ac019_protected_401 | Integration | Passed | `backend/tests/integration/test_auth_qa.py` |
| AC-020 | test_ac020_nfr001_nothing_plaintext | Integration | Passed | `backend/tests/integration/test_auth_qa.py` |
| AC-021 | test_ac021_logout | Integration | Passed | `backend/tests/integration/test_auth_qa.py` |
| AC-022 | test_ac022_idle_window | Integration | Passed | `backend/tests/integration/test_auth_qa.py` |
| AC-023 | test_ac023_deactivation | Integration | Passed | `backend/tests/integration/test_auth_qa.py` |
| AC-023 | test_ac023_revoke_user_sessions | Integration | Passed | `backend/tests/integration/test_auth_qa.py` |
| — | test_nfr004_admin_endpoints_finance_only | Integration | Passed | `backend/tests/integration/test_auth_qa.py` |

## Project setup

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| — | test_health_reports_ok | Unit | Passed | `backend/tests/test_health.py` |
| — | test_the_openapi_document_builds | Unit | Passed | `backend/tests/test_health.py` |
| — | the app loads | E2E | Not run yet | `frontend/e2e/example.spec.ts` |
<!-- sdlc:auto:end tests -->
