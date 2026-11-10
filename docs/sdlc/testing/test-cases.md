# Tests

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start summary -->
56 tests · Passed 26 · Failed 0 · Skipped 24 · Not run 6

Acceptance criteria covered: 8/102 · passing: 3/102
<!-- sdlc:auto:end summary -->

<!-- sdlc:auto:start tests -->
## Sprint 1

### US-005: Sign in with email and password

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| AC-017 | test_ac017_login_and_me | Unit | Passed | `backend/tests/test_auth.py` |
| AC-018 | test_ac018_generic_401 | Unit | Passed | `backend/tests/test_auth.py` |
| AC-019 | test_ac019_protected_requires_bearer | Unit | Passed | `backend/tests/test_auth.py` |
| AC-020 | test_ac020_hashes_only | Unit | Passed | `backend/tests/test_auth.py` |
| AC-021 | test_ac021_logout_revokes | Unit | Passed | `backend/tests/test_auth.py` |
| AC-022 | test_ac022_idle_expiry_and_refresh | Unit | Passed | `backend/tests/test_auth.py` |
| AC-023 | test_ac023_inactive_user_revokes | Unit | Passed | `backend/tests/test_auth.py` |
| — | test_bootstrap_finance_user | Unit | Passed | `backend/tests/test_auth.py` |
| — | test_password_reset_request_generic | Unit | Passed | `backend/tests/test_auth.py` |
| — | test_require_role_forbidden | Unit | Passed | `backend/tests/test_auth.py` |
| AC-017 | test_ac017_login_returns_token_and_me_works | Unit | Passed | `backend/tests/test_auth_qa.py` |
| AC-018 | test_ac018_wrong_password_and_unknown_email_identical | Unit | Passed | `backend/tests/test_auth_qa.py` |
| AC-019 | test_ac019_protected_endpoints_return_401_without_token[DELETE-/api/claims/1/lines/1] | Unit | Skipped | `backend/tests/test_auth_qa.py` |
| AC-019 | test_ac019_protected_endpoints_return_401_without_token[DELETE-/api/claims/1] | Unit | Skipped | `backend/tests/test_auth_qa.py` |
| AC-019 | test_ac019_protected_endpoints_return_401_without_token[GET-/api/approvals/queue] | Unit | Skipped | `backend/tests/test_auth_qa.py` |
| AC-019 | test_ac019_protected_endpoints_return_401_without_token[GET-/api/auth/me] | Unit | Passed | `backend/tests/test_auth_qa.py` |
| AC-019 | test_ac019_protected_endpoints_return_401_without_token[GET-/api/categories] | Unit | Skipped | `backend/tests/test_auth_qa.py` |
| AC-019 | test_ac019_protected_endpoints_return_401_without_token[GET-/api/claims/1/history] | Unit | Skipped | `backend/tests/test_auth_qa.py` |
| AC-019 | test_ac019_protected_endpoints_return_401_without_token[GET-/api/claims/1/lines/1/receipt-url] | Unit | Skipped | `backend/tests/test_auth_qa.py` |
| AC-019 | test_ac019_protected_endpoints_return_401_without_token[GET-/api/claims/1] | Unit | Skipped | `backend/tests/test_auth_qa.py` |
| AC-019 | test_ac019_protected_endpoints_return_401_without_token[GET-/api/claims] | Unit | Skipped | `backend/tests/test_auth_qa.py` |
| AC-019 | test_ac019_protected_endpoints_return_401_without_token[GET-/api/dashboard/me] | Unit | Skipped | `backend/tests/test_auth_qa.py` |
| AC-019 | test_ac019_protected_endpoints_return_401_without_token[GET-/api/reports/export.csv] | Unit | Skipped | `backend/tests/test_auth_qa.py` |
| AC-019 | test_ac019_protected_endpoints_return_401_without_token[GET-/api/reports/totals] | Unit | Skipped | `backend/tests/test_auth_qa.py` |
| AC-019 | test_ac019_protected_endpoints_return_401_without_token[GET-/api/users] | Unit | Skipped | `backend/tests/test_auth_qa.py` |
| AC-019 | test_ac019_protected_endpoints_return_401_without_token[PATCH-/api/categories/1] | Unit | Skipped | `backend/tests/test_auth_qa.py` |
| AC-019 | test_ac019_protected_endpoints_return_401_without_token[PATCH-/api/claims/1/lines/1] | Unit | Skipped | `backend/tests/test_auth_qa.py` |
| AC-019 | test_ac019_protected_endpoints_return_401_without_token[PATCH-/api/users/1] | Unit | Skipped | `backend/tests/test_auth_qa.py` |
| AC-019 | test_ac019_protected_endpoints_return_401_without_token[POST-/api/auth/logout] | Unit | Passed | `backend/tests/test_auth_qa.py` |
| AC-019 | test_ac019_protected_endpoints_return_401_without_token[POST-/api/categories] | Unit | Skipped | `backend/tests/test_auth_qa.py` |
| AC-019 | test_ac019_protected_endpoints_return_401_without_token[POST-/api/claims/1/decision] | Unit | Skipped | `backend/tests/test_auth_qa.py` |
| AC-019 | test_ac019_protected_endpoints_return_401_without_token[POST-/api/claims/1/lines] | Unit | Skipped | `backend/tests/test_auth_qa.py` |
| AC-019 | test_ac019_protected_endpoints_return_401_without_token[POST-/api/claims/1/mark-paid] | Unit | Skipped | `backend/tests/test_auth_qa.py` |
| AC-019 | test_ac019_protected_endpoints_return_401_without_token[POST-/api/claims/1/submit] | Unit | Skipped | `backend/tests/test_auth_qa.py` |
| AC-019 | test_ac019_protected_endpoints_return_401_without_token[POST-/api/claims] | Unit | Skipped | `backend/tests/test_auth_qa.py` |
| AC-019 | test_ac019_protected_endpoints_return_401_without_token[POST-/api/users/1/deactivate] | Unit | Skipped | `backend/tests/test_auth_qa.py` |
| AC-019 | test_ac019_protected_endpoints_return_401_without_token[POST-/api/users] | Unit | Skipped | `backend/tests/test_auth_qa.py` |
| AC-019 | test_ac019_protected_endpoints_return_401_without_token[PUT-/api/claims/1/lines/1/receipt] | Unit | Skipped | `backend/tests/test_auth_qa.py` |
| AC-019 | test_ac019_public_endpoints_open | Unit | Passed | `backend/tests/test_auth_qa.py` |
| AC-020 | test_ac020_hashes_only_stored | Unit | Passed | `backend/tests/test_auth_qa.py` |
| AC-021 | test_ac021_logout_then_reuse_is_401 | Unit | Passed | `backend/tests/test_auth_qa.py` |
| AC-022 | test_ac022_idle_session_expires | Unit | Passed | `backend/tests/test_auth_qa.py` |
| AC-023 | test_ac023_deactivated_user_session_refused | Unit | Passed | `backend/tests/test_auth_qa.py` |
| — | test_nfr001_no_plaintext_passwords_in_users | Unit | Passed | `backend/tests/test_auth_qa.py` |
| — | test_nfr003_reset_request_generic | Unit | Passed | `backend/tests/test_auth_qa.py` |
| AC-004 | [AC-004] sign-in page has no register, Google or Apple control | E2E | Not run yet | `frontend/e2e/sign-in.spec.ts` |
| AC-017 | [AC-017] Finance user signs in and lands on /dashboard | E2E | Not run yet | `frontend/e2e/sign-in.spec.ts` |
| AC-018 | [AC-018] wrong credentials show only the generic message | E2E | Not run yet | `frontend/e2e/sign-in.spec.ts` |
| AC-019 | [AC-019] signed-out visit to /dashboard redirects to /sign-in | E2E | Not run yet | `frontend/e2e/sign-in.spec.ts` |
| AC-021 | [AC-021] sign out returns to /sign-in and back does not reveal data | E2E | Not run yet | `frontend/e2e/sign-in.spec.ts` |

## Project setup

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| — | test_health_reports_ok | Unit | Passed | `backend/tests/test_health.py` |
| — | test_the_openapi_document_builds | Unit | Passed | `backend/tests/test_health.py` |
| — | test_get_storage_uses_media_root_without_a_bucket | Unit | Passed | `backend/tests/test_storage.py` |
| — | test_local_storage_refuses_path_traversal | Unit | Passed | `backend/tests/test_storage.py` |
| — | test_local_storage_round_trip | Unit | Passed | `backend/tests/test_storage.py` |
| — | the app loads | E2E | Not run yet | `frontend/e2e/example.spec.ts` |
<!-- sdlc:auto:end tests -->
