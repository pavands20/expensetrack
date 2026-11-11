# Tests

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start summary -->
149 tests · Passed 121 · Failed 0 · Skipped 0 · Not run 28

Acceptance criteria covered: 44/102 · passing: 18/102
<!-- sdlc:auto:end summary -->

<!-- sdlc:auto:start tests -->
## Sprint 1

### US-001: Finance creates user accounts

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| AC-001 | Users admin > [AC-001] Finance sees the list with inactive badge and the nav link | Unit | Passed | `frontend/src/screens/Users.test.tsx` |
| AC-002 | Users admin > [AC-002] 409 shows the message by the email field | Unit | Passed | `frontend/src/screens/Users.test.tsx` |
| AC-003 | Users admin > [AC-003] non-Finance is redirected to the dashboard | Unit | Passed | `frontend/src/screens/Users.test.tsx` |

### US-005: Sign in with email and password

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| AC-004 | App > [AC-004] has no sign-up controls | Unit | Passed | `frontend/src/App.test.tsx` |
| AC-017 | App > [AC-017] logs in and stores the token | Unit | Passed | `frontend/src/App.test.tsx` |
| AC-018 | App > [AC-018] shows a generic error on 401 and stores no token | Unit | Passed | `frontend/src/App.test.tsx` |
| AC-019 | App > [AC-019] redirects to sign-in with no token | Unit | Passed | `frontend/src/App.test.tsx` |
| AC-019 | App > [AC-019] renders the shell when signed in | Unit | Passed | `frontend/src/App.test.tsx` |
| AC-020 | App > [AC-020] reset confirm shows the invalid-link message on 400 | Unit | Passed | `frontend/src/App.test.tsx` |
| AC-021 | App > [AC-021] sign out clears the token even if logout fails | Unit | Passed | `frontend/src/App.test.tsx` |
| AC-022 | App > [AC-022] shows the notice when me returns 401 | Unit | Passed | `frontend/src/App.test.tsx` |
| AC-017 | test_ac017_login_returns_token_usable_as_bearer | Integration | Passed | `backend/tests/test_auth.py` |
| AC-018 | test_ac018_identical_401 | Integration | Passed | `backend/tests/test_auth.py` |
| AC-019 | test_ac019_requires_token | Integration | Passed | `backend/tests/test_auth.py` |
| AC-020 | test_ac020_hashes_only | Integration | Passed | `backend/tests/test_auth.py` |
| AC-021 | test_ac021_logout_revokes | Integration | Passed | `backend/tests/test_auth.py` |
| AC-022 | test_ac022_idle_expiry | Integration | Passed | `backend/tests/test_auth.py` |
| AC-022 | test_ac022_last_seen_slides | Integration | Passed | `backend/tests/test_auth.py` |
| AC-023 | test_ac023_inactive_user_session | Integration | Passed | `backend/tests/test_auth.py` |
| — | test_password_reset_flow | Integration | Passed | `backend/tests/test_auth.py` |
| — | test_require_finance_403 | Integration | Passed | `backend/tests/test_auth.py` |

## Sprint 2

### US-007: Reset a forgotten password by email

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| AC-024 | ResetPassword > [AC-024] shows the confirmation after a successful request | Unit | Passed | `frontend/src/screens/ResetPassword.test.tsx` |
| AC-024 | ResetPassword > [AC-024] shows the same confirmation when the API call fails | Unit | Passed | `frontend/src/screens/ResetPassword.test.tsx` |
| AC-025, AC-027 | ResetPassword > [AC-025] [AC-027] confirms, shows success with Sign in link and clears the session | Unit | Passed | `frontend/src/screens/ResetPassword.test.tsx` |
| AC-026 | ResetPassword > [AC-026] a 400 shows the used/expired message and a link to the request form | Unit | Passed | `frontend/src/screens/ResetPassword.test.tsx` |
| AC-024 | [AC-024] reset request shows identical text for existing and unknown accounts | E2E | Not run yet | `frontend/e2e/password-reset.spec.ts` |
| AC-025, AC-027 | [AC-025][AC-027] emailed link only logged by API; covered by backend pytest (US-007-1) | E2E | Not run yet | `frontend/e2e/password-reset.spec.ts` |
| AC-026 | [AC-026] bogus token shows request-a-new-link guidance and link to the request form | E2E | Not run yet | `frontend/e2e/password-reset.spec.ts` |
| — | [NFR-003] failed sign-in shows same message for unknown email and wrong password | E2E | Not run yet | `frontend/e2e/password-reset.spec.ts` |

### US-008: Create a draft claim with lines

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| AC-028, AC-030 | Claim screen > [AC-028] [AC-030] creates the claim, adds a line and shows the server total | Unit | Passed | `frontend/src/screens/Claim.test.tsx` |
| AC-028 | Claim screen > [AC-028] shows Claim not found on 404 | Unit | Passed | `frontend/src/screens/Claim.test.tsx` |
| AC-029 | Claim screen > [AC-029] shows field errors for an empty and a bad amount, and makes no save call | Unit | Passed | `frontend/src/screens/Claim.test.tsx` |
| AC-031 | Claim screen > [AC-031] offers only active categories and shows retired category names | Unit | Passed | `frontend/src/screens/Claim.test.tsx` |
| AC-036 | Claim screen > [AC-036] confirming delete calls DELETE then goes to the dashboard | Unit | Passed | `frontend/src/screens/Claim.test.tsx` |
| AC-037 | Claim screen > [AC-037] a 409 on delete shows the message and keeps the claim | Unit | Passed | `frontend/src/screens/Claim.test.tsx` |
| AC-037 | Claim screen > [AC-037] a non-draft claim is locked with no Delete button | Unit | Passed | `frontend/src/screens/Claim.test.tsx` |
| AC-038 | Claim screen > [AC-038] cancelling the dialog makes no delete call | Unit | Passed | `frontend/src/screens/Claim.test.tsx` |
| AC-028 | test_ac028_create_and_add_line | Integration | Passed | `backend/tests/test_claims.py` |
| AC-029 | test_ac029_invalid_lines | Integration | Passed | `backend/tests/test_claims.py` |
| AC-030 | test_ac030_total_is_exact_sum | Integration | Passed | `backend/tests/test_claims.py` |
| AC-031 | test_ac031_retired_category | Integration | Passed | `backend/tests/test_claims.py` |
| AC-036 | test_ac036_delete_draft_removes_receipts | Integration | Passed | `backend/tests/test_claims.py` |
| AC-036 | test_ac036_local_storage_delete | Integration | Passed | `backend/tests/test_claims.py` |
| AC-037 | test_ac037_non_draft_conflicts | Integration | Passed | `backend/tests/test_claims.py` |
| AC-038 | test_ac038_not_deleting_keeps_claim | Integration | Passed | `backend/tests/test_claims.py` |
| — | test_nfr004_visibility | Integration | Passed | `backend/tests/test_claims.py` |
| AC-028 | [AC-028] Employee creates a claim with a line, listed as Draft owned by them | E2E | Not run yet | `frontend/e2e/claims.spec.ts` |
| AC-029 | [AC-029] invalid lines are blocked and nothing is added | E2E | Not run yet | `frontend/e2e/claims.spec.ts` |
| AC-030 | [AC-030] three lines are listed and total is the GBP sum | E2E | Not run yet | `frontend/e2e/claims.spec.ts` |
| AC-031 | [AC-031] category dropdown offers seeded categories and drops retired ones | E2E | Not run yet | `frontend/e2e/claims.spec.ts` |
| AC-036 | [AC-036] confirming Delete draft removes the claim | E2E | Not run yet | `frontend/e2e/claims.spec.ts` |
| AC-037 | [AC-037] non-draft delete 409 is not testable here (no submit endpoint); covered by pytest | E2E | Not run yet | `frontend/e2e/claims.spec.ts` |
| AC-038 | [AC-038] Delete draft then Cancel keeps the claim | E2E | Not run yet | `frontend/e2e/claims.spec.ts` |
| — | [NFR-004] another Employee gets 404 for a claim | E2E | Not run yet | `frontend/e2e/claims.spec.ts` |
| — | [NFR-013] amounts are shown in GBP with two decimals, English UI | E2E | Not run yet | `frontend/e2e/claims.spec.ts` |

### US-019: Finance manages categories and limits

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| AC-072 | Categories admin > [AC-072] add posts the new category | Unit | Passed | `frontend/src/screens/Categories.test.tsx` |
| AC-072 | Categories admin > [AC-072] lists categories with limit and status, and the nav link | Unit | Passed | `frontend/src/screens/Categories.test.tsx` |
| AC-073 | Categories admin > [AC-073] sets a limit, rejects invalid input, and clears it | Unit | Passed | `frontend/src/screens/Categories.test.tsx` |
| AC-074 | Categories admin > [AC-074] retires and reactivates a category | Unit | Passed | `frontend/src/screens/Categories.test.tsx` |
| AC-075 | Categories admin > [AC-075] non-Finance is redirected and sees no nav link | Unit | Passed | `frontend/src/screens/Categories.test.tsx` |
| AC-076 | Categories admin > [AC-076] 409 shows the duplicate message and keeps the text | Unit | Passed | `frontend/src/screens/Categories.test.tsx` |
| AC-072 | test_ac072_lifespan_calls_seed | Integration | Passed | `backend/tests/test_categories.py` |
| AC-072 | test_ac072_seed_and_idempotent | Integration | Passed | `backend/tests/test_categories.py` |
| AC-073 | test_ac073_limit_set_clear_and_invalid | Integration | Passed | `backend/tests/test_categories.py` |
| AC-074 | test_ac074_retire_and_listing | Integration | Passed | `backend/tests/test_categories.py` |
| AC-075 | test_ac075_roles | Integration | Passed | `backend/tests/test_categories.py` |
| AC-076 | test_ac076_duplicate_names | Integration | Passed | `backend/tests/test_categories.py` |
| AC-076 | test_ac076_unique_index_enforced | Integration | Passed | `backend/tests/test_categories.py` |
| AC-072 | [AC-072] first admin sees the seed categories with No limit | E2E | Not run yet | `frontend/e2e/categories.spec.ts` |
| AC-073 | [AC-073] limit persists after reload and clearing shows No limit | E2E | Not run yet | `frontend/e2e/categories.spec.ts` |
| AC-074 | [AC-074][NFR-011] retired category hidden from Employee list but kept for Finance | E2E | Not run yet | `frontend/e2e/categories.spec.ts` |
| AC-075 | [AC-075][NFR-004] Employee gets 403 on POST/PATCH and has no Categories nav link | E2E | Not run yet | `frontend/e2e/categories.spec.ts` |
| AC-076 | [AC-076] duplicate names, including different case, are refused | E2E | Not run yet | `frontend/e2e/categories.spec.ts` |

## Sprint 3

### US-004: Role-based visibility of claims

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| AC-013 | test_ac013_employee_sees_only_own | Integration | Passed | `backend/tests/test_visibility.py` |
| AC-014 | test_ac014_manager_sees_own_and_reports | Integration | Passed | `backend/tests/test_visibility.py` |
| AC-015 | test_ac015_finance_sees_all_including_inactive | Integration | Passed | `backend/tests/test_visibility.py` |
| AC-016 | test_ac016_manager_by_id_non_report_404 | Integration | Passed | `backend/tests/test_visibility.py` |
| — | test_nfr004_list_requires_auth | Integration | Passed | `backend/tests/test_visibility.py` |
| AC-013 | test_ac013_employee_own_only_and_404_other | Integration | Passed | `backend/tests/test_visibility_qa.py` |
| AC-013 | test_ac013_unauthenticated_401 | Integration | Passed | `backend/tests/test_visibility_qa.py` |
| AC-014 | test_ac014_manager_own_and_report_only | Integration | Passed | `backend/tests/test_visibility_qa.py` |
| AC-015 | test_ac015_finance_all_including_deactivated | Integration | Passed | `backend/tests/test_visibility_qa.py` |
| AC-016 | test_ac016_manager_non_report_404_reveals_nothing | Integration | Passed | `backend/tests/test_visibility_qa.py` |
| — | test_nfr004_employee_cannot_use_finance_endpoints | Integration | Passed | `backend/tests/test_visibility_qa.py` |

### US-009: Edit a draft claim

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| AC-032 | LineEditor > [AC-032] a 422 maps onto the field | Unit | Passed | `frontend/src/components/LineEditor.test.tsx` |
| AC-032 | LineEditor > [AC-032] a retired current category stays selectable | Unit | Passed | `frontend/src/components/LineEditor.test.tsx` |
| AC-032 | LineEditor > [AC-032] edit saves via PATCH and shows stored values and total | Unit | Passed | `frontend/src/components/LineEditor.test.tsx` |
| AC-032 | LineEditor > [AC-032] validation errors show next to the field and no PATCH is sent | Unit | Passed | `frontend/src/components/LineEditor.test.tsx` |
| AC-033 | LineEditor > [AC-033] remove with confirm deletes the line and updates the total | Unit | Passed | `frontend/src/components/LineEditor.test.tsx` |
| AC-033 | LineEditor > [AC-033] the only line cannot be removed and shows the hint | Unit | Passed | `frontend/src/components/LineEditor.test.tsx` |
| AC-034 | LineEditor > [AC-034] a 409 shows the locked message | Unit | Passed | `frontend/src/components/LineEditor.test.tsx` |
| AC-034 | LineEditor > [AC-034] a non-draft claim renders no edit or remove controls | Unit | Passed | `frontend/src/components/LineEditor.test.tsx` |
| AC-035 | LineEditor > [AC-035] a 403 shows the own-claims message | Unit | Passed | `frontend/src/components/LineEditor.test.tsx` |
| AC-032 | test_ac032_patch_changes_fields_and_total | Integration | Passed | `backend/tests/test_claim_lines.py` |
| AC-032 | test_ac032_retired_category_rules | Integration | Passed | `backend/tests/test_claim_lines.py` |
| AC-032 | test_ac032_validation_and_category | Integration | Passed | `backend/tests/test_claim_lines.py` |
| AC-033 | test_ac033_delete_failure_logged_and_only_line_409 | Integration | Passed | `backend/tests/test_claim_lines.py` |
| AC-033 | test_ac033_delete_line_removes_receipt | Integration | Passed | `backend/tests/test_claim_lines.py` |
| AC-034 | test_ac034_non_draft_409_changes_nothing | Integration | Passed | `backend/tests/test_claim_lines.py` |
| AC-035 | test_ac035_ownership_403_404 | Integration | Passed | `backend/tests/test_claim_lines.py` |
| — | test_line_of_other_claim_404_and_updated_at | Integration | Passed | `backend/tests/test_claim_lines.py` |
| AC-032 | [AC-032] edit a draft line and see new values and total after reload | E2E | Not run yet | `frontend/e2e/claim-lines.spec.ts` |
| AC-033 | [AC-033] remove one of two lines drops it and its receipt; only line refused | E2E | Not run yet | `frontend/e2e/claim-lines.spec.ts` |
| AC-034 | [AC-034] non-draft claim: PATCH/DELETE 409 and no edit controls | E2E | Not run yet | `frontend/e2e/claim-lines.spec.ts` |
| AC-035 | [AC-035][NFR-004] another user's claim: PATCH/DELETE refused, nothing changes | E2E | Not run yet | `frontend/e2e/claim-lines.spec.ts` |

### US-011: Upload a receipt to a claim line

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| AC-039 | ReceiptControl > [AC-039] View receipt opens the short-lived url in a new tab with noopener | Unit | Passed | `frontend/src/components/ReceiptControl.test.tsx` |
| AC-039 | ReceiptControl > [AC-039] a highlighted line is marked as missing a receipt | Unit | Passed | `frontend/src/components/ReceiptControl.test.tsx` |
| AC-039 | ReceiptControl > [AC-039] attaches a receipt via multipart PUT and shows Receipt attached | Unit | Passed | `frontend/src/components/ReceiptControl.test.tsx` |
| AC-040 | ReceiptControl > [AC-040] rejects a bad type client-side | Unit | Passed | `frontend/src/components/ReceiptControl.test.tsx` |
| AC-040 | ReceiptControl > [AC-040] rejects an oversize file client-side | Unit | Passed | `frontend/src/components/ReceiptControl.test.tsx` |
| AC-040 | ReceiptControl > [AC-040] shows the message for a 413 response | Unit | Passed | `frontend/src/components/ReceiptControl.test.tsx` |
| AC-041 | ReceiptControl > [AC-041] replaces an existing receipt | Unit | Passed | `frontend/src/components/ReceiptControl.test.tsx` |
| AC-042 | ReceiptControl > [AC-042] a 409 shows the locked message | Unit | Passed | `frontend/src/components/ReceiptControl.test.tsx` |
| AC-042 | ReceiptControl > [AC-042] locked claims render no upload or replace controls but can view | Unit | Passed | `frontend/src/components/ReceiptControl.test.tsx` |
| AC-039 | test_ac039_upload_sets_has_receipt | Integration | Passed | `backend/tests/test_receipts.py` |
| AC-040 | test_ac040_rejects_bad_files | Integration | Passed | `backend/tests/test_receipts.py` |
| AC-041 | test_ac041_replace_deletes_old | Integration | Passed | `backend/tests/test_receipts.py` |
| AC-042 | test_ac042_non_draft_conflict | Integration | Passed | `backend/tests/test_receipts.py` |
| — | test_nfr004_put_owner_only | Integration | Passed | `backend/tests/test_receipts.py` |
| — | test_nfr006_local_signed_link | Integration | Passed | `backend/tests/test_receipts.py` |
| — | test_nfr006_s3_branch | Integration | Passed | `backend/tests/test_receipts.py` |
| AC-040 | test_ac040_txt_and_oversize_rejected_no_receipt | Integration | Passed | `backend/tests/test_receipts_qa.py` |
| AC-041 | test_ac041_replacement_url_points_to_new_file | Integration | Passed | `backend/tests/test_receipts_qa.py` |
| AC-042 | test_ac042_locked_claim_409_upload_and_replace | Integration | Passed | `backend/tests/test_receipts_qa.py` |
| — | test_nfr006_invisible_claim_url_404_and_unauth_401 | Integration | Passed | `backend/tests/test_receipts_qa.py` |
| — | test_nfr007_exact_5mb_passes_and_plus_one_fails | Integration | Passed | `backend/tests/test_receipts_qa.py` |
| AC-039 | [AC-039] upload a PNG and see Receipt attached | E2E | Not run yet | `frontend/e2e/receipts.spec.ts` |
| AC-040 | [AC-040] 6 MB file and .txt are rejected with the message, no receipt | E2E | Not run yet | `frontend/e2e/receipts.spec.ts` |

### US-013: Submit a claim and lock it

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| AC-043 | SubmitClaim > [AC-043] a 422 marks the lines missing a receipt | Unit | Passed | `frontend/src/components/SubmitClaim.test.tsx` |
| AC-048 | SubmitClaim > [AC-048] a 409 shows the already submitted message | Unit | Passed | `frontend/src/components/SubmitClaim.test.tsx` |
| AC-048 | SubmitClaim > [AC-048] other failures show the generic message | Unit | Passed | `frontend/src/components/SubmitClaim.test.tsx` |
| AC-048 | SubmitClaim > [AC-048] submits and shows the new status and locked state | Unit | Passed | `frontend/src/components/SubmitClaim.test.tsx` |
| AC-049 | SubmitClaim > [AC-049] an empty claim shows the message and submits nothing | Unit | Passed | `frontend/src/components/SubmitClaim.test.tsx` |
| AC-043 | test_ac043_missing_receipts_listed | Integration | Passed | `backend/tests/test_submit.py` |
| AC-048 | test_ac048_submit_locks_claim | Integration | Passed | `backend/tests/test_submit.py` |
| AC-049 | test_ac049_no_lines_422 | Integration | Passed | `backend/tests/test_submit.py` |
| AC-050 | test_ac050_manager_queue | Integration | Passed | `backend/tests/test_submit.py` |
| AC-051 | test_ac051_finance_own_claim_not_in_own_queue | Integration | Passed | `backend/tests/test_submit.py` |
| AC-051 | test_ac051_inactive_manager_goes_to_finance | Integration | Passed | `backend/tests/test_submit.py` |
| AC-051 | test_ac051_no_manager_goes_to_finance | Integration | Passed | `backend/tests/test_submit.py` |
| — | test_nfr004_submit_access | Integration | Passed | `backend/tests/test_submit.py` |
| — | test_queue_rules_employee_403_newest_first | Integration | Passed | `backend/tests/test_submit.py` |
| AC-048 | [AC-048] submit locks the claim in the UI and the API returns 409 on edits | E2E | Not run yet | `frontend/e2e/submit.spec.ts` |
| AC-049 | [AC-049] submitting a claim with no lines is refused and stays a draft | E2E | Not run yet | `frontend/e2e/submit.spec.ts` |
| AC-050 | [AC-050] Employee with a manager: claim is in manager queue, not Finance's | E2E | Not run yet | `frontend/e2e/submit.spec.ts` |
| AC-051 | [AC-051] no manager: Finance other than owner sees it; owner does not | E2E | Not run yet | `frontend/e2e/submit.spec.ts` |

## Project setup

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| — | test_health_reports_ok | Integration | Passed | `backend/tests/test_health.py` |
| — | test_the_openapi_document_builds | Integration | Passed | `backend/tests/test_health.py` |
| — | the app loads | E2E | Passed | `frontend/e2e/example.spec.ts` |
<!-- sdlc:auto:end tests -->
