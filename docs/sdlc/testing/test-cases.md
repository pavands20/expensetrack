# Tests

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start summary -->
303 tests · Passed 302 · Failed 1 · Skipped 0 · Not run 0

Acceptance criteria covered: 86/102 · passing: 85/102
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
| AC-021 | App > [AC-021] sign out clears the token even if logout fails | Unit | Failed | `frontend/src/App.test.tsx` |
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
| AC-024 | [AC-024] reset request shows identical text for existing and unknown accounts | E2E | Passed | `frontend/e2e/password-reset.spec.ts` |
| AC-025, AC-027 | [AC-025][AC-027] emailed link only logged by API; covered by backend pytest (US-007-1) | E2E | Passed | `frontend/e2e/password-reset.spec.ts` |
| AC-026 | [AC-026] bogus token shows request-a-new-link guidance and link to the request form | E2E | Passed | `frontend/e2e/password-reset.spec.ts` |
| NFR-003 | [NFR-003] failed sign-in shows same message for unknown email and wrong password | E2E | Passed | `frontend/e2e/password-reset.spec.ts` |

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
| NFR-004 | test_nfr004_visibility | Integration | Passed | `backend/tests/test_claims.py` |
| AC-028 | [AC-028] Employee creates a claim with a line, listed as Draft owned by them | E2E | Passed | `frontend/e2e/claims.spec.ts` |
| AC-029 | [AC-029] invalid lines are blocked and nothing is added | E2E | Passed | `frontend/e2e/claims.spec.ts` |
| AC-030 | [AC-030] three lines are listed and total is the GBP sum | E2E | Passed | `frontend/e2e/claims.spec.ts` |
| AC-031 | [AC-031] category dropdown offers seeded categories and drops retired ones | E2E | Passed | `frontend/e2e/claims.spec.ts` |
| AC-036 | [AC-036] confirming Delete draft removes the claim | E2E | Passed | `frontend/e2e/claims.spec.ts` |
| AC-037 | [AC-037] non-draft delete 409 is not testable here (no submit endpoint); covered by pytest | E2E | Passed | `frontend/e2e/claims.spec.ts` |
| AC-038 | [AC-038] Delete draft then Cancel keeps the claim | E2E | Passed | `frontend/e2e/claims.spec.ts` |
| NFR-004 | [NFR-004] another Employee gets 404 for a claim | E2E | Passed | `frontend/e2e/claims.spec.ts` |
| NFR-013 | [NFR-013] amounts are shown in GBP with two decimals, English UI | E2E | Passed | `frontend/e2e/claims.spec.ts` |

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
| AC-072 | [AC-072] first admin sees the seed categories with No limit | E2E | Passed | `frontend/e2e/categories.spec.ts` |
| AC-073 | [AC-073] limit persists after reload and clearing shows No limit | E2E | Passed | `frontend/e2e/categories.spec.ts` |
| AC-074, NFR-011 | [AC-074][NFR-011] retired category hidden from Employee list but kept for Finance | E2E | Passed | `frontend/e2e/categories.spec.ts` |
| AC-075, NFR-004 | [AC-075][NFR-004] Employee gets 403 on POST/PATCH and has no Categories nav link | E2E | Passed | `frontend/e2e/categories.spec.ts` |
| AC-076 | [AC-076] duplicate names, including different case, are refused | E2E | Passed | `frontend/e2e/categories.spec.ts` |

## Sprint 3

### US-004: Role-based visibility of claims

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| AC-013 | test_ac013_employee_sees_only_own | Integration | Passed | `backend/tests/test_visibility.py` |
| AC-014 | test_ac014_manager_sees_own_and_reports | Integration | Passed | `backend/tests/test_visibility.py` |
| AC-015 | test_ac015_finance_sees_all_including_inactive | Integration | Passed | `backend/tests/test_visibility.py` |
| AC-016 | test_ac016_manager_by_id_non_report_404 | Integration | Passed | `backend/tests/test_visibility.py` |
| NFR-004 | test_nfr004_list_requires_auth | Integration | Passed | `backend/tests/test_visibility.py` |
| AC-013 | test_ac013_employee_own_only_and_404_other | Integration | Passed | `backend/tests/test_visibility_qa.py` |
| AC-013 | test_ac013_unauthenticated_401 | Integration | Passed | `backend/tests/test_visibility_qa.py` |
| AC-014 | test_ac014_manager_own_and_report_only | Integration | Passed | `backend/tests/test_visibility_qa.py` |
| AC-015 | test_ac015_finance_all_including_deactivated | Integration | Passed | `backend/tests/test_visibility_qa.py` |
| AC-016 | test_ac016_manager_non_report_404_reveals_nothing | Integration | Passed | `backend/tests/test_visibility_qa.py` |
| NFR-004 | test_nfr004_employee_cannot_use_finance_endpoints | Integration | Passed | `backend/tests/test_visibility_qa.py` |
| AC-013 | [AC-013] Employee sees only own claims; other's claim by ID is 404 | E2E | Passed | `frontend/e2e/visibility.spec.ts` |
| AC-014 | [AC-014] Manager sees own and direct reports' claims only | E2E | Passed | `frontend/e2e/visibility.spec.ts` |
| AC-015 | [AC-015] Finance sees all claims including a deactivated user's | E2E | Passed | `frontend/e2e/visibility.spec.ts` |
| AC-016 | [AC-016] Manager requesting a non-report's claim by ID gets 404 | E2E | Passed | `frontend/e2e/visibility.spec.ts` |
| NFR-004 | [NFR-004] unauthenticated list is 401; Employee gets 403 on GET /api/users | E2E | Passed | `frontend/e2e/visibility.spec.ts` |
| NFR-008 | [NFR-008] personal data (names, emails, claims) is limited by role | E2E | Passed | `frontend/e2e/visibility.spec.ts` |

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
| AC-032 | [AC-032] edit a draft line and see new values and total after reload | E2E | Passed | `frontend/e2e/claim-lines.spec.ts` |
| AC-033 | [AC-033] remove one of two lines drops it and its receipt; only line refused | E2E | Passed | `frontend/e2e/claim-lines.spec.ts` |
| AC-034 | [AC-034] non-draft claim: PATCH/DELETE 409 and no edit controls | E2E | Passed | `frontend/e2e/claim-lines.spec.ts` |
| AC-035, NFR-004 | [AC-035][NFR-004] another user's claim: PATCH/DELETE refused, nothing changes | E2E | Passed | `frontend/e2e/claim-lines.spec.ts` |

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
| NFR-004 | test_nfr004_put_owner_only | Integration | Passed | `backend/tests/test_receipts.py` |
| NFR-006 | test_nfr006_local_signed_link | Integration | Passed | `backend/tests/test_receipts.py` |
| NFR-006 | test_nfr006_s3_branch | Integration | Passed | `backend/tests/test_receipts.py` |
| AC-040 | test_ac040_txt_and_oversize_rejected_no_receipt | Integration | Passed | `backend/tests/test_receipts_qa.py` |
| AC-041 | test_ac041_replacement_url_points_to_new_file | Integration | Passed | `backend/tests/test_receipts_qa.py` |
| AC-042 | test_ac042_locked_claim_409_upload_and_replace | Integration | Passed | `backend/tests/test_receipts_qa.py` |
| NFR-006 | test_nfr006_invisible_claim_url_404_and_unauth_401 | Integration | Passed | `backend/tests/test_receipts_qa.py` |
| NFR-007 | test_nfr007_exact_5mb_passes_and_plus_one_fails | Integration | Passed | `backend/tests/test_receipts_qa.py` |
| AC-039 | [AC-039] a PNG of 5 MB or less is stored and shown as attached | E2E | Passed | `frontend/e2e/receipts-replace.spec.ts` |
| AC-040 | [AC-040] a file of another type is rejected with the message and nothing is attached | E2E | Passed | `frontend/e2e/receipts-replace.spec.ts` |
| AC-041 | [AC-041] replacing a receipt keeps it attached and serves the new file | E2E | Passed | `frontend/e2e/receipts-replace.spec.ts` |
| AC-042 | [AC-042] upload and replace are refused once the claim is submitted | E2E | Passed | `frontend/e2e/receipts-replace.spec.ts` |
| AC-043 | [AC-043] submit is refused and the line missing a receipt is identified | E2E | Passed | `frontend/e2e/receipts-replace.spec.ts` |
| NFR-006 | [NFR-006] receipt link is short-lived and denied to other users | E2E | Passed | `frontend/e2e/receipts-replace.spec.ts` |
| NFR-007 | [NFR-007] exactly 5 MB is accepted, one byte more is rejected | E2E | Passed | `frontend/e2e/receipts-replace.spec.ts` |
| NFR-008 | [NFR-008] receipt access is limited by role: anonymous and other users are refused | E2E | Passed | `frontend/e2e/receipts-replace.spec.ts` |
| AC-039 | [AC-039] upload a PNG and see Receipt attached | E2E | Passed | `frontend/e2e/receipts.spec.ts` |
| AC-040 | [AC-040] 6 MB file and .txt are rejected with the message, no receipt | E2E | Passed | `frontend/e2e/receipts.spec.ts` |

### US-013: Submit a claim and lock it

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| AC-043 | SubmitClaim > [AC-043] a 422 marks the lines missing a receipt | Unit | Passed | `frontend/src/components/SubmitClaim.test.tsx` |
| AC-048 | SubmitClaim > [AC-048] a 409 shows the already submitted message | Unit | Passed | `frontend/src/components/SubmitClaim.test.tsx` |
| AC-048 | SubmitClaim > [AC-048] other failures show the generic message | Unit | Passed | `frontend/src/components/SubmitClaim.test.tsx` |
| AC-048 | SubmitClaim > [AC-048] submits and shows the new status and locked state | Unit | Passed | `frontend/src/components/SubmitClaim.test.tsx` |
| AC-049 | SubmitClaim > [AC-049] an empty claim shows the message and submits nothing | Unit | Passed | `frontend/src/components/SubmitClaim.test.tsx` |
| AC-048 | test_ac048_submit_changes_status_and_locks | Integration | Passed | `backend/tests/integration/test_submit_acceptance_qa.py` |
| AC-049 | test_ac049_no_lines_refused_with_message | Integration | Passed | `backend/tests/integration/test_submit_acceptance_qa.py` |
| AC-050 | test_ac050_manager_queue | Integration | Passed | `backend/tests/integration/test_submit_acceptance_qa.py` |
| AC-051 | test_ac051_no_manager_finance_queue_excluding_owner | Integration | Passed | `backend/tests/integration/test_submit_acceptance_qa.py` |
| NFR-008 | test_nfr008_access_limited_by_role | Integration | Passed | `backend/tests/integration/test_submit_acceptance_qa.py` |
| AC-043 | test_ac043_missing_receipts_listed | Integration | Passed | `backend/tests/test_submit.py` |
| AC-048 | test_ac048_submit_locks_claim | Integration | Passed | `backend/tests/test_submit.py` |
| AC-049 | test_ac049_no_lines_422 | Integration | Passed | `backend/tests/test_submit.py` |
| AC-050 | test_ac050_manager_queue | Integration | Passed | `backend/tests/test_submit.py` |
| AC-051 | test_ac051_finance_own_claim_not_in_own_queue | Integration | Passed | `backend/tests/test_submit.py` |
| AC-051 | test_ac051_inactive_manager_goes_to_finance | Integration | Passed | `backend/tests/test_submit.py` |
| AC-051 | test_ac051_no_manager_goes_to_finance | Integration | Passed | `backend/tests/test_submit.py` |
| NFR-004 | test_nfr004_submit_access | Integration | Passed | `backend/tests/test_submit.py` |
| — | test_queue_rules_employee_403_newest_first | Integration | Passed | `backend/tests/test_submit.py` |
| AC-048 | [AC-048] submit locks the claim in the UI and the API returns 409 on edits | E2E | Passed | `frontend/e2e/submit.spec.ts` |
| AC-049 | [AC-049] submitting a claim with no lines is refused and stays a draft | E2E | Passed | `frontend/e2e/submit.spec.ts` |
| AC-050 | [AC-050] Employee with a manager: claim is in manager queue, not Finance's | E2E | Passed | `frontend/e2e/submit.spec.ts` |
| AC-051 | [AC-051] no manager: Finance other than owner sees it; owner does not | E2E | Passed | `frontend/e2e/submit.spec.ts` |

## Sprint 4

### US-012: View receipts through short-lived private links

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| AC-044 | test_ac044_owner_manager_finance_get_working_link | Integration | Passed | `backend/tests/integration/test_receipt_links_acceptance_qa.py` |
| AC-045, AC-047 | test_ac045_ac047_s3_presigned_short_and_bucket_private | Integration | Passed | `backend/tests/integration/test_receipt_links_acceptance_qa.py` |
| AC-045 | test_ac045_expired_local_link_not_served | Integration | Passed | `backend/tests/integration/test_receipt_links_acceptance_qa.py` |
| AC-046 | test_ac046_unauthorised_users_get_404_and_unauth_401 | Integration | Passed | `backend/tests/integration/test_receipt_links_acceptance_qa.py` |
| AC-047 | test_ac047_direct_object_access_needs_valid_signature | Integration | Passed | `backend/tests/integration/test_receipt_links_acceptance_qa.py` |
| AC-047 | test_ac047_storage_module_sets_no_public_acl | Integration | Passed | `backend/tests/integration/test_receipt_links_acceptance_qa.py` |
| NFR-006, NFR-008 | test_nfr006_nfr008_no_permanent_url_in_response_or_logs | Integration | Passed | `backend/tests/integration/test_receipt_links_acceptance_qa.py` |
| AC-044 | [AC-044] View receipt opens the receipt for the owner | E2E | Passed | `frontend/e2e/receipt-view.spec.ts` |

### US-014: Manager approves or rejects direct reports' claims

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| AC-050 | approvals UI > [AC-050] a 403 shows a friendly message | Unit | Passed | `frontend/src/components/ApprovalPanel.test.tsx` |
| AC-050 | approvals UI > [AC-050] an empty queue shows the empty state | Unit | Passed | `frontend/src/components/ApprovalPanel.test.tsx` |
| AC-050 | approvals UI > [AC-050] the queue lists rows linking to the claim | Unit | Passed | `frontend/src/components/ApprovalPanel.test.tsx` |
| AC-052 | approvals UI > [AC-052] approve posts the decision and passes the claim on | Unit | Passed | `frontend/src/components/ApprovalPanel.test.tsx` |
| AC-053, AC-056 | approvals UI > [AC-053] [AC-056] a returned draft shows the rejection banner and over-limit flag | Unit | Passed | `frontend/src/components/ApprovalPanel.test.tsx` |
| AC-054 | approvals UI > [AC-054] a 422 shows the comment message | Unit | Passed | `frontend/src/components/ApprovalPanel.test.tsx` |
| AC-054 | approvals UI > [AC-054] reject with a blank comment is blocked client-side | Unit | Passed | `frontend/src/components/ApprovalPanel.test.tsx` |
| AC-055 | approvals UI > [AC-055] the panel is not rendered for the submitter | Unit | Passed | `frontend/src/components/ApprovalPanel.test.tsx` |
| AC-059 | approvals UI > [AC-059] a 409 shows a refusal and does not change the claim | Unit | Passed | `frontend/src/components/ApprovalPanel.test.tsx` |
| AC-096 | approvals UI > [AC-096] history lists entries in order with no edit controls | Unit | Passed | `frontend/src/components/ApprovalPanel.test.tsx` |
| AC-052 | test_ac052_manager_approve_moves_to_finance_with_decider | Integration | Passed | `backend/tests/integration/test_approval_flow_qa.py` |
| AC-053 | test_ac053_manager_reject_with_comment_returns_editable_draft | Integration | Passed | `backend/tests/integration/test_approval_flow_qa.py` |
| AC-054 | test_ac054_reject_without_comment_422[   ] | Integration | Passed | `backend/tests/integration/test_approval_flow_qa.py` |
| AC-054 | test_ac054_reject_without_comment_422[None] | Integration | Passed | `backend/tests/integration/test_approval_flow_qa.py` |
| AC-054 | test_ac054_reject_without_comment_422[] | Integration | Passed | `backend/tests/integration/test_approval_flow_qa.py` |
| AC-055 | test_ac055_manager_own_and_non_report_claims_refused | Integration | Passed | `backend/tests/integration/test_approval_flow_qa.py` |
| AC-056, AC-061 | test_ac056_ac061_over_limit_flag_for_manager_and_finance | Integration | Passed | `backend/tests/integration/test_approval_flow_qa.py` |
| AC-057 | test_ac057_finance_approve_records_name_time_comment | Integration | Passed | `backend/tests/integration/test_approval_flow_qa.py` |
| AC-058 | test_ac058_finance_reject_returns_draft_with_comment | Integration | Passed | `backend/tests/integration/test_approval_flow_qa.py` |
| AC-059 | test_ac059_submitter_refused_by_finance_stage | Integration | Passed | `backend/tests/integration/test_approval_flow_qa.py` |
| AC-060 | test_ac060_sole_finance_own_claim_waits_for_second_finance | Integration | Passed | `backend/tests/integration/test_approval_flow_qa.py` |
| AC-066, NFR-005 | test_ac066_nfr005_every_role_refused_own_claim_unchanged | Integration | Passed | `backend/tests/integration/test_approval_flow_qa.py` |
| AC-067 | test_ac067_manager_claim_routes_to_manager_then_finance | Integration | Passed | `backend/tests/integration/test_approval_flow_qa.py` |
| AC-068 | test_ac068_finance_claim_decided_only_by_other_finance | Integration | Passed | `backend/tests/integration/test_approval_flow_qa.py` |
| AC-095 | test_ac095_submit_approve_reject_write_entries | Integration | Passed | `backend/tests/integration/test_approval_flow_qa.py` |
| AC-096 | test_ac096_history_time_ordered_and_404_when_invisible | Integration | Passed | `backend/tests/integration/test_approval_flow_qa.py` |
| AC-097, NFR-009 | test_ac097_nfr009_entries_keep_actor_name_after_deactivation | Integration | Passed | `backend/tests/integration/test_approval_flow_qa.py` |
| AC-097 | test_ac097_no_edit_or_delete_route_for_history | Integration | Passed | `backend/tests/integration/test_approval_flow_qa.py` |
| NFR-008 | test_nfr008_employee_forbidden_from_users_and_queue | Integration | Passed | `backend/tests/integration/test_privacy_access.py` |
| NFR-008 | test_nfr008_invisible_claim_is_404 | Integration | Passed | `backend/tests/integration/test_privacy_access.py` |
| NFR-008 | test_nfr008_unauthenticated_gets_401 | Integration | Passed | `backend/tests/integration/test_privacy_access.py` |
| AC-095 | test_ac095_helper_does_not_commit | Integration | Passed | `backend/tests/test_audit.py` |
| AC-095 | test_ac095_submit_writes_entry | Integration | Passed | `backend/tests/test_audit.py` |
| AC-096 | test_ac096_visibility_and_order | Integration | Passed | `backend/tests/test_audit.py` |
| AC-097 | test_ac097_no_mutation | Integration | Passed | `backend/tests/test_audit.py` |
| NFR-009 | test_nfr009_name_kept_after_deactivation | Integration | Passed | `backend/tests/test_audit.py` |
| AC-052, AC-057 | test_ac052_ac057_approve_chain | Integration | Passed | `backend/tests/test_decisions.py` |
| AC-053, AC-054, AC-058 | test_ac053_ac054_ac058_reject | Integration | Passed | `backend/tests/test_decisions.py` |
| AC-055, AC-059 | test_ac055_ac059_self_and_non_report | Integration | Passed | `backend/tests/test_decisions.py` |
| AC-056 | test_ac056_over_limit | Integration | Passed | `backend/tests/test_decisions.py` |
| AC-059 | test_ac059_helper_and_invalid_decision | Integration | Passed | `backend/tests/test_decisions.py` |
| AC-060, AC-068 | test_ac060_ac068_finance_own_claim | Integration | Passed | `backend/tests/test_decisions.py` |

## Sprint 5

### US-016: Mark an approved claim as paid

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| AC-062 | test_ac062_finance_marks_paid_and_history_records_actor | Unit | Passed | `backend/tests/test_mark_paid.py` |
| AC-063 | test_ac063_not_approved_is_409[draft] | Unit | Passed | `backend/tests/test_mark_paid.py` |
| AC-063 | test_ac063_not_approved_is_409[paid] | Unit | Passed | `backend/tests/test_mark_paid.py` |
| AC-063 | test_ac063_not_approved_is_409[pending_finance] | Unit | Passed | `backend/tests/test_mark_paid.py` |
| AC-064 | test_ac064_non_finance_forbidden_invisible_404_unauth_401 | Unit | Passed | `backend/tests/test_mark_paid.py` |
| AC-065 | test_ac065_submitter_cannot_mark_own_paid | Unit | Passed | `backend/tests/test_mark_paid.py` |
| AC-062 | test_ac062_finance_marks_approved_claim_paid_with_history | Integration | Passed | `backend/tests/integration/test_mark_paid_acceptance_qa.py` |
| AC-063 | test_ac063_non_approved_claims_refused_409_and_unchanged | Integration | Passed | `backend/tests/integration/test_mark_paid_acceptance_qa.py` |
| AC-064, NFR-004 | test_ac064_nfr004_employee_and_manager_get_403_claim_stays_approved | Integration | Passed | `backend/tests/integration/test_mark_paid_acceptance_qa.py` |
| AC-065, NFR-005 | test_ac065_nfr005_finance_submitter_refused_claim_stays_approved | Integration | Passed | `backend/tests/integration/test_mark_paid_acceptance_qa.py` |
| NFR-008 | test_nfr008_mark_paid_unknown_claim_404 | Integration | Passed | `backend/tests/integration/test_mark_paid_acceptance_qa.py` |

### US-018: Rejected claim returns to the employee to fix and resubmit

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| AC-069 | test_ac069_finance_reject_returns_editable_draft | Unit | Passed | `backend/tests/test_resubmit.py` |
| AC-069 | test_ac069_manager_reject_returns_editable_draft | Unit | Passed | `backend/tests/test_resubmit.py` |
| AC-070 | test_ac070_resubmit_after_finance_reject_restarts_at_manager | Unit | Passed | `backend/tests/test_resubmit.py` |
| AC-070 | test_ac070_resubmit_after_manager_reject_goes_to_manager | Unit | Passed | `backend/tests/test_resubmit.py` |
| AC-070 | test_ac070_resubmit_without_manager_goes_to_finance | Unit | Passed | `backend/tests/test_resubmit.py` |
| AC-071 | test_ac071_history_keeps_rejection_after_resubmit | Unit | Passed | `backend/tests/test_resubmit.py` |
| AC-069 | test_ac069_finance_rejected_is_editable_draft_with_name_and_comment | Integration | Passed | `backend/tests/integration/test_resubmit_acceptance_qa.py` |
| AC-069 | test_ac069_manager_rejected_is_editable_draft_with_name_and_comment | Integration | Passed | `backend/tests/integration/test_resubmit_acceptance_qa.py` |
| AC-070 | test_ac070_no_manager_resubmit_goes_to_finance | Integration | Passed | `backend/tests/integration/test_resubmit_acceptance_qa.py` |
| AC-070 | test_ac070_resubmit_after_finance_rejection_restarts_from_manager_stage | Integration | Passed | `backend/tests/integration/test_resubmit_acceptance_qa.py` |
| AC-070 | test_ac070_resubmit_after_manager_rejection_restarts_at_manager | Integration | Passed | `backend/tests/integration/test_resubmit_acceptance_qa.py` |
| AC-070 | test_ac070_resubmit_uses_current_manager_after_change | Integration | Passed | `backend/tests/integration/test_resubmit_acceptance_qa.py` |
| AC-071 | test_ac071_rejection_and_comment_stay_in_history_after_resubmit | Integration | Passed | `backend/tests/integration/test_resubmit_acceptance_qa.py` |
| NFR-008, AC-069, AC-071 | test_nfr008_ac069_ac071_rejected_claim_and_history_hidden_from_others | Integration | Passed | `backend/tests/integration/test_resubmit_acceptance_qa.py` |
| AC-069 | [AC-069] rejected claim opens as an editable draft showing approver name and comment | E2E | Passed | `frontend/e2e/resubmit.spec.ts` |
| AC-070, AC-071 | [AC-070][AC-071] resubmitting restarts approval and history keeps the rejection comment | E2E | Passed | `frontend/e2e/resubmit.spec.ts` |

### US-020: Flag over-limit lines for approvers

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| AC-077 | test_ac077_limit_field_on_mutation_get_list_and_queue | Unit | Passed | `backend/tests/test_over_limit_limit_field.py` |
| AC-077 | test_ac077_null_when_no_limit | Unit | Passed | `backend/tests/test_over_limit_limit_field.py` |
| AC-078 | test_ac078_equal_to_limit_is_not_over | Unit | Passed | `backend/tests/test_over_limit_limit_field.py` |
| AC-079 | test_ac079_submit_with_over_limit_line_succeeds | Unit | Passed | `backend/tests/test_over_limit_limit_field.py` |
| AC-077 | over-limit flag > [AC-077] Finance sees the flag too | Unit | Passed | `frontend/src/screens/Approvals.test.tsx` |
| AC-077 | over-limit flag > [AC-077] a manager sees the flag with the limit on an over-limit line | Unit | Passed | `frontend/src/screens/Approvals.test.tsx` |
| AC-077 | over-limit flag > [AC-077] queue rows flag claims with an over-limit line only | Unit | Passed | `frontend/src/screens/Approvals.test.tsx` |
| AC-077 | over-limit flag > [AC-077] the owner does not see the flag | Unit | Passed | `frontend/src/screens/Approvals.test.tsx` |
| AC-078 | over-limit flag > [AC-078] a line that is not over limit shows no flag | Unit | Passed | `frontend/src/screens/Approvals.test.tsx` |
| AC-079 | over-limit flag > [AC-079] the employee's submit is not blocked by an over-limit line | Unit | Passed | `frontend/src/screens/Approvals.test.tsx` |
| AC-077 | [AC-077] manager and Finance see the over-limit flag with the limit; queue marks the claim | E2E | Passed | `frontend/e2e/over-limit.spec.ts` |
| AC-078 | [AC-078] exactly £50.00 and a no-limit category show no flag | E2E | Passed | `frontend/e2e/over-limit.spec.ts` |
| AC-079 | [AC-079] employee submits a claim with an over-limit line successfully | E2E | Passed | `frontend/e2e/over-limit.spec.ts` |
| NFR-008 | [NFR-008] over-limit claim data is limited by role | E2E | Passed | `frontend/e2e/over-limit.spec.ts` |

### US-021: Employee dashboard of own claims by status

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| AC-080, AC-082 | Dashboard > [AC-080] [AC-082] tabs show counts and the API's claims only | Unit | Passed | `frontend/src/screens/Dashboard.test.tsx` |
| AC-080 | Dashboard > [AC-080] deleting a draft calls DELETE and refetches | Unit | Passed | `frontend/src/screens/Dashboard.test.tsx` |
| AC-081 | Dashboard > [AC-081] a returned claim shows who returned it and opens the claim | Unit | Passed | `frontend/src/screens/Dashboard.test.tsx` |
| AC-083 | Dashboard > [AC-083] with no claims it shows the empty state and a New claim button | Unit | Passed | `frontend/src/screens/Dashboard.test.tsx` |
| AC-080 | test_ac080_groups_and_counts | Integration | Passed | `backend/tests/test_dashboard.py` |
| AC-081 | test_ac081_rejected_in_draft_with_last_rejection | Integration | Passed | `backend/tests/test_dashboard.py` |
| AC-082 | test_ac082_only_own_claims[Employee] | Integration | Passed | `backend/tests/test_dashboard.py` |
| AC-082 | test_ac082_only_own_claims[Finance] | Integration | Passed | `backend/tests/test_dashboard.py` |
| AC-082 | test_ac082_only_own_claims[Manager] | Integration | Passed | `backend/tests/test_dashboard.py` |
| AC-083 | test_ac083_empty_and_unauthenticated | Integration | Passed | `backend/tests/test_dashboard.py` |
| — | test_smoke_seed_idempotent_and_unset | Integration | Passed | `backend/tests/test_dashboard.py` |
| AC-080 | [AC-080] claims in several statuses show a count and the right claims per tab | E2E | Passed | `frontend/e2e/dashboard.spec.ts` |
| AC-081 | [AC-081] rejected claim opens as an editable draft showing the approver's comment | E2E | Passed | `frontend/e2e/dashboard.spec.ts` |
| AC-083 | [AC-083] a user with no claims sees the empty state with a way to create a claim | E2E | Passed | `frontend/e2e/dashboard.spec.ts` |

### US-023: Export approved claims as CSV with a date range

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| AC-087 | test_ac087_one_row_per_line_with_required_columns | Integration | Passed | `backend/tests/integration/test_csv_export_acceptance_qa.py` |
| AC-087 | test_ac087_paid_claims_included_with_status | Integration | Passed | `backend/tests/integration/test_csv_export_acceptance_qa.py` |
| AC-088 | test_ac088_claims_approved_outside_range_excluded | Integration | Passed | `backend/tests/integration/test_csv_export_acceptance_qa.py` |
| AC-089 | test_ac089_end_before_start_refused_with_message | Integration | Passed | `backend/tests/integration/test_csv_export_acceptance_qa.py` |
| AC-090 | test_ac090_no_matches_returns_headers_only | Integration | Passed | `backend/tests/integration/test_csv_export_acceptance_qa.py` |
| AC-091, NFR-004 | test_ac091_nfr004_employee_and_manager_get_403 | Integration | Passed | `backend/tests/integration/test_csv_export_acceptance_qa.py` |
| NFR-008 | test_nfr008_export_personal_data_role_limited | Integration | Passed | `backend/tests/integration/test_csv_export_acceptance_qa.py` |
| AC-087, AC-088 | test_ac087_ac088_rows_and_range | Integration | Passed | `backend/tests/test_export.py` |
| AC-089 | test_ac089_bad_dates_422 | Integration | Passed | `backend/tests/test_export.py` |
| AC-090 | test_ac090_empty_header_only | Integration | Passed | `backend/tests/test_export.py` |
| AC-091 | test_ac091_roles | Integration | Passed | `backend/tests/test_export.py` |

### US-024: Email notifications on submission and decisions

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| AC-092 | test_ac092_manager_approval_emails_finance_and_submitter | Unit | Passed | `backend/tests/test_notifications.py` |
| AC-092 | test_ac092_no_manager_emails_other_finance_only | Unit | Passed | `backend/tests/test_notifications.py` |
| AC-092 | test_ac092_submit_emails_manager | Unit | Passed | `backend/tests/test_notifications.py` |
| AC-093 | test_ac093_failed_action_sends_nothing | Unit | Passed | `backend/tests/test_notifications.py` |
| AC-093 | test_ac093_outcomes_emailed_with_reference_and_comment | Unit | Passed | `backend/tests/test_notifications.py` |
| AC-094 | test_ac094_send_failure_does_not_block_and_is_logged | Unit | Passed | `backend/tests/test_notifications.py` |
| AC-092 | test_ac092_finance_submitter_not_emailed_as_approver | Integration | Passed | `backend/tests/integration/test_notifications_acceptance_qa.py` |
| AC-092 | test_ac092_no_manager_emails_finance_who_can_act_not_submitter | Integration | Passed | `backend/tests/integration/test_notifications_acceptance_qa.py` |
| AC-092 | test_ac092_submit_emails_manager_not_submitter | Integration | Passed | `backend/tests/integration/test_notifications_acceptance_qa.py` |
| AC-093 | test_ac093_finance_approve_emails_submitter_with_comment | Integration | Passed | `backend/tests/integration/test_notifications_acceptance_qa.py` |
| AC-093 | test_ac093_finance_reject_emails_submitter_with_comment | Integration | Passed | `backend/tests/integration/test_notifications_acceptance_qa.py` |
| AC-093 | test_ac093_manager_approve_emails_submitter | Integration | Passed | `backend/tests/integration/test_notifications_acceptance_qa.py` |
| AC-093 | test_ac093_manager_reject_emails_submitter_with_comment | Integration | Passed | `backend/tests/integration/test_notifications_acceptance_qa.py` |
| AC-093 | test_ac093_mark_paid_emails_submitter | Integration | Passed | `backend/tests/integration/test_notifications_acceptance_qa.py` |
| AC-094, NFR-010 | test_ac094_nfr010_decisions_succeed_when_email_fails | Integration | Passed | `backend/tests/integration/test_notifications_acceptance_qa.py` |
| AC-094, NFR-010 | test_ac094_nfr010_mark_paid_succeeds_when_email_fails | Integration | Passed | `backend/tests/integration/test_notifications_acceptance_qa.py` |
| AC-094, NFR-010 | test_ac094_nfr010_submit_succeeds_when_email_fails | Integration | Passed | `backend/tests/integration/test_notifications_acceptance_qa.py` |
| NFR-008 | test_nfr008_notification_emails_only_to_relevant_users | Integration | Passed | `backend/tests/integration/test_notifications_acceptance_qa.py` |

## Project setup

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| AC-096 | test_ac096_timestamps_load_timezone_aware | Unit | Passed | `backend/tests/test_utc_datetime.py` |
| — | test_health_reports_ok | Integration | Passed | `backend/tests/test_health.py` |
| — | test_the_openapi_document_builds | Integration | Passed | `backend/tests/test_health.py` |
| — | the app loads | E2E | Passed | `frontend/e2e/example.spec.ts` |
<!-- sdlc:auto:end tests -->
