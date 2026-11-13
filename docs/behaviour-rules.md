# Behaviour rules

How this app behaves where the requirements and the API contract do not say. QA's
tests and the code both follow these rules. The platform keeps this file: the first
rules come from the contract and the code, and each later rule from a decision made
when a test and the code disagreed.

- A sign-in token is an opaque random string from secrets.token_urlsafe(32) sent as Authorization: Bearer; only its SHA-256 hash is stored in the sessions table, and the login response is {token, token_type: "bearer", user}.
- Every successful login creates a new session and does NOT end the user's other sessions, so several tokens for one user can be valid at once.
- Sessions have no absolute lifetime; a session expires after 30 idle minutes (SESSION_IDLE_MINUTES) since last_seen_at, and every authenticated request refreshes last_seen_at.
- POST /api/auth/logout revokes only the calling token's session and returns 204 with no body; that token then gets 401 on every endpoint.
- Missing, malformed, unknown, revoked, idle-expired or deactivated-user tokens all return 401 with body {"detail": "Not authenticated"}.
- Login failures (unknown email, wrong password, deactivated user) all return the same 401 {"detail": "Invalid email or password"}, and emails are lowercased before lookup so login is case-insensitive on email.
- Deactivating a user (POST /api/users/{id}/deactivate) revokes all their sessions and unused reset tokens immediately and returns the updated user; a Finance user cannot deactivate themselves (409).
- Password reset request always returns 202 with the same generic message whether or not the email exists or is active; reset tokens are single-use, expire after 60 minutes (RESET_TOKEN_MINUTES), and only their hash is stored.
- A successful password reset confirm returns 204 and revokes all of that user's existing sessions; an invalid, used or expired token returns 400 {"detail": "Reset link is invalid or has expired"}, and new_password must be at least 8 characters.
- Role failures return 403 {"detail": "Forbidden"}: /api/users* is Finance-only, category create/patch is Finance-only, and the approvals queue is closed to Employees.
- Claims the caller may not see return 404 {"detail": "Claim not found"}, checked before ownership, so a visible-but-not-owned claim (a manager's report's claim) returns 403 on edit, line, receipt-upload, delete and submit operations.
- Error bodies use FastAPI's {"detail": <string>} shape; request-validation failures return 422 with FastAPI's list-valued detail, and the submit-blocked 422 carries detail {"message", "missing_receipt_line_ids"}.
- Conflicts return 409 with a string detail: duplicate user email, duplicate category name (case-insensitive), editing/deleting/submitting a non-draft claim, deleting a claim's last line, demoting the only active Finance user, and demoting a Manager who still has reports.
- Receipt uploads over 5 MB return 413 and a wrong type or file whose content does not match the JPEG/PNG/PDF signature returns 415, both with the same message "Receipts must be JPEG, PNG or PDF files of 5 MB or less."
- Receipt-url returns {url, expires_in: 300}, a short-lived presigned link (S3 when S3_BUCKET is set, otherwise a signed API URL under MEDIA_ROOT that dies on process restart); replacing or deleting a receipt, line or draft claim deletes the old stored object.
- List endpoints return plain JSON arrays with no paging, limit or envelope.
- Claims lists and the approvals queue are ordered newest first (created_at descending, then id descending); users are ordered by name then id; categories by name then id.
- Claim lines are returned ordered by date then id, and a claim's total_gbp is the sum of its line amounts.
- Money is GBP with two decimals, sent and returned as strings such as "12.50", and amounts must be greater than zero.
- IDs are auto-incrementing integers; a claim's reference is "EXP-" plus the id zero-padded to at least 4 digits (e.g. EXP-0007), and a non-integer ID in a path returns 422.
- Line dates are plain calendar dates in ISO YYYY-MM-DD with no time zone, while created_at and other timestamps are stored in UTC and returned in ISO 8601.
- User emails are stored lowercased and are unique case-insensitively, category names are unique case-insensitively, and category names are trimmed of surrounding whitespace.
- GET /api/categories returns only active categories, and include_retired=true shows retired ones only to Finance (other roles silently get active only); new lines cannot use a retired category (422), while existing lines keep it.
- A submitted claim goes to pending_manager if its owner has an active manager, otherwise to pending_finance, and the manager is always resolved from the owner's current manager_id; nobody sees their own claim in the approvals queue.
- The first Finance user is seeded from BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD at startup, and the default categories Travel, Meals, Equipment and Other are seeded only when no categories exist.
- Each test creates its own users, categories and claims through the API (the first Finance user through the bootstrap seed or an authenticated Finance user), using unique emails and random passwords, never writes to the database directly, and never shares state with other tests.
