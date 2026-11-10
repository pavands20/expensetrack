# Product Requirements

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start narrative -->
## Summary

### REQ-SCOPE · approved · source: requirements:scope

Overall scope, the product-owner-approved technology stack and services, and the out-of-scope list for ExpenseTrack. Delivery scope is lightweight and this is requirements version 1.

- Delivery scope: lightweight. Requirements version: 1.
- Approved stack (product owner; do not substitute):
  - Backend: FastAPI 0.115. It keeps business rules in one place with request validation: two-stage approval, no self-approval, a different Finance user for Finance claims, manager-stage skip, and category limits. It also handles sign-in, presigned S3 uploads, email, CSV export and the audit trail. One small service suits the low volume (hundreds of claims a month).
  - Frontend: React 19. Suits multi-line claim forms, receipt uploads, the approval queue, the dashboard and Finance totals. English only, so no translation work.
  - Database: PostgreSQL 16. The data is relational (users/managers, claims, lines, categories, status history). Plain queries cover the reports and CSV export. A small instance is enough for about 50 users.
  - Cloud: AWS, London region (eu-west-2), for UK GDPR. One account, one set of access rules, one bill.
- Approved services:
  - File storage: Amazon S3 (saas). Env: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, S3_BUCKET. Private London bucket, short-lived links, receipts kept as long as the claim exists.
  - Email: SMTP server (saas), pointed at the Amazon SES SMTP endpoint in eu-west-2 with a verified sender domain. Env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD. Used for password resets and for notifications on submission and on each decision.
- API keys needed: AWS_ACCESS_KEY_ID, AWS_REGION, AWS_SECRET_ACCESS_KEY, S3_BUCKET, SMTP_HOST, SMTP_PASSWORD, SMTP_PORT, SMTP_USER.
- Out of scope: currency conversion; mileage claims; card feeds; accounting system integrations.
- Capabilities listed as in scope:
  - Sign-in and sign-out
  - Claim creation with lines
  - Line entry (date, category, GBP amount, description)
  - Fixed category list (Travel, Meals, Equipment, Other)
  - Editing and deleting drafts
  - Submission that locks the claim
  - Employee dashboard by status
  - Setup and usage documentation
- Conflict recorded (categories):
  - The in-scope capability list says 'Fixed category list (Travel, Meals, Equipment, Other)'.
  - The additional requirements, EPIC-006 and US-019 say Finance adds, renames and retires categories and sets optional per-line limits.
  - Both versions are recorded here; the stories follow the managed-category version.
- Gap recorded (capability list): the in-scope capability list does not mention the following, which do appear in the additional requirements and epics:
  - Roles and account administration
  - Password reset
  - Receipts
  - Two-step approval
  - Categories and limits management
  - Totals and CSV export
  - Notifications and audit trail

**Related:** EPIC-001, EPIC-002, EPIC-003, EPIC-004, EPIC-005, EPIC-006, EPIC-007, EPIC-008, EPIC-009

### REQ-CLAR-001 · draft · source: project-brief:clarification

Clarifies who approves claims submitted by Managers or Finance users. Answer: the assigned manager, then Finance.

- Question: Managers and Finance staff also incur expenses. Who should approve a claim submitted by a Manager or by a Finance user, given nobody can approve their own claim?
- Answer given: assigned manager, then Finance.
- Reflected in:
  - EPIC-005 routing: Manager and Finance submitters follow the same route.
  - US-017 AC-067 (a Manager's claim goes to their assigned manager, then Finance).
  - AC-068 (a Finance submitter's claim needs a different Finance user).

**Related:** US-017, EPIC-005, AC-067, AC-068

### EPIC-001 · draft · source: requirements:EPIC-001

Accounts, roles and access for an internal web app with no self sign-up. Finance administers accounts and managers, and claim visibility is limited by role.

- Roles: Employee, Manager, Finance.
- Finance creates accounts, assigns managers, and deactivates users (history kept).
- Visibility:
  - Employees see their own claims.
  - Managers see their direct reports' claims.
  - Finance sees all claims.
- Assumption: a Manager also has their own claims as an Employee, and these follow the same approval route.
- Assumption (open, from discovery): Finance can deactivate accounts and view all claims.
- Personal data is handled under UK GDPR with standard measures; access is limited by role.

**Related:** US-001, US-002, US-003, US-004, NFR-004, NFR-008

### US-001 · draft · source: requirements:US-001

[critical] Finance creates user accounts with name, email, role and assigned manager. There is no self sign-up.

- AC-001: Finance creates a user with a unique email, a name and a role (Employee/Manager/Finance). The account appears in the user list. The user can get a way to sign in via a password reset email or an initial password set by Finance.
  - Open point: the AC allows either method, and neither is chosen in the input.
- AC-002: A duplicate email is rejected with a clear message; no second account is created.
- AC-003: Employees and Managers are denied access to the user admin screen and its API.
- AC-004: The sign-in page has no self sign-up option.

**Related:** EPIC-001, NFR-004, AC-001, AC-002, AC-003, AC-004

### US-002 · draft · source: requirements:US-002

[critical] Finance assigns or changes each user's manager, or leaves them with none. This determines the first-stage approver.

- AC-005: Finance picks another active user as manager. That user becomes the assigned manager and can see the user's claims.
- AC-006: Setting a user as their own manager is rejected.
- AC-007: A user with no manager is accepted; their submitted claims skip the manager stage.
- AC-008: Pending manager-stage claims move to the new manager's queue when the manager changes (assumption: pending claims follow the current assigned manager).
- Conflict recorded (manager assignment):
  - The project brief says Finance 'assigns each employee a manager'.
  - US-002/AC-007 and the additional requirements allow a user to have no manager, which routes their claims straight to Finance.
  - Both versions are recorded.

**Related:** EPIC-001, EPIC-005, US-013, AC-005, AC-006, AC-007, AC-008

### US-003 · draft · source: requirements:US-003

[high] Finance deactivates leavers. Their access ends, but their claims and audit history remain.

- AC-009: Deactivation ends the user's existing sessions.
- AC-010: Deactivated users cannot sign in, and no usable password reset is granted.
- AC-011: Past claims and audit entries remain visible with the user's name.
- AC-012: The user is shown as inactive and cannot be selected as a manager or approver.

**Related:** EPIC-001, NFR-002, NFR-009, NFR-011, AC-009, AC-010, AC-011, AC-012

### US-004 · draft · source: requirements:US-004

[critical] Users see only the claims their role allows.

- AC-013: Employees see only their own claims; requests for others' claims are refused.
- AC-014: Managers see their own claims and their direct reports' claims only.
- AC-015: Finance sees all claims, including those of deactivated users.
- AC-016: A Manager requesting a non-report's claim by address or ID is denied.

**Related:** EPIC-001, NFR-004, AC-013, AC-014, AC-015, AC-016

### EPIC-002 · draft · source: requirements:EPIC-002

App-managed email and password authentication with session expiry, sign-out and password reset by email.

- Security outcomes:
  - Sessions expire.
  - Signing out or deactivation ends the session.
  - Passwords are stored hashed.
- Reset emails are sent via AWS SES, which needs a verified sender domain.

**Related:** US-005, US-006, US-007, NFR-001, NFR-002, NFR-003

### US-005 · draft · source: requirements:US-005

[critical] Active users sign in with email and password and land on their dashboard.

- AC-017: Correct credentials sign the user in and take them to the dashboard.
- AC-018: A wrong password or unknown email gives a generic refusal that does not say which part was wrong.
- AC-019: Unauthenticated access to any page or API other than sign-in and reset is redirected or refused.
- AC-020: Only hashed passwords exist in the database.

**Related:** EPIC-002, NFR-001, NFR-003, AC-017, AC-018, AC-019, AC-020

### US-006 · draft · source: requirements:US-006

[high] Users can sign out, and idle sessions expire.

- AC-021: Sign-out ends the session; reusing it is refused.
- AC-022: After an idle period longer than the configured session lifetime, the user must sign in again.
- AC-023: Deactivation while signed in causes the next request to be refused.

**Related:** EPIC-002, NFR-002, AC-021, AC-022, AC-023

### US-007 · draft · source: requirements:US-007

[high] Users reset a forgotten password through an emailed link.

- AC-024: The same confirmation is shown whether or not the email belongs to an account.
- AC-025: A valid, unexpired link lets an active user set a new password; the old password stops working.
- AC-026: Used or expired links are refused, and the user is told to request a new one.
- AC-027: A completed reset ends the user's other sessions.

**Related:** EPIC-002, NFR-002, NFR-003, AC-024, AC-025, AC-026, AC-027

### EPIC-003 · draft · source: requirements:EPIC-003

Creating and editing claims made of one or more GBP lines. Drafts are editable and deletable; submitted claims are locked.

- Each line has a date, category, GBP amount and description.
- GBP only. Currency conversion and mileage are out of scope.

**Related:** US-008, US-009, US-010, NFR-013

### US-008 · draft · source: requirements:US-008

[critical] Employees, Managers and Finance users create draft claims with itemised lines.

- AC-028: A line with a date, an active category, an amount > 0 and a description is saved to a draft owned by the user.
- AC-029: Missing fields, or an amount that is zero, negative, non-numeric or has more than 2 decimals, is not saved; the invalid fields are identified.
- AC-030: Multiple lines are held on the claim, and a GBP total is shown.
- AC-031: Only active categories are offered (initially Travel, Meals, Equipment, Other).

**Related:** EPIC-003, NFR-013, US-019, AC-028, AC-029, AC-030, AC-031

### US-009 · draft · source: requirements:US-009

[high] Owners edit, add or remove lines on their draft claims.

- AC-032: Changes to a line on a draft are stored and shown.
- AC-033: Removing a line removes its receipt too, and the total updates.
- AC-034: Editing a non-draft claim via the UI or API is refused.
- AC-035: Editing someone else's claim is denied.

**Related:** EPIC-003, NFR-004, AC-032, AC-033, AC-034, AC-035

### US-010 · draft · source: requirements:US-010

[medium] Owners delete draft claims they no longer need.

- AC-036: Confirmed deletion removes the claim, its lines and its receipts from the dashboard.
- AC-037: Deletion is refused for a claim that has been submitted and is not currently a draft.
- AC-038: Cancelling the confirmation deletes nothing.

**Related:** EPIC-003, AC-036, AC-037, AC-038

### EPIC-004 · draft · source: requirements:EPIC-004

Receipts per claim line, stored privately in S3 (eu-west-2) and viewed via short-lived links.

- Accepted receipts: JPEG, PNG or PDF, up to 5 MB each.
- Receipts are retained as long as the claim exists.
- Setup needs AWS credentials and a bucket name.
- Assumption: a receipt is required on every line before submission.

**Related:** US-011, US-012, NFR-006, NFR-007

### US-011 · draft · source: requirements:US-011

[critical] Owners attach a receipt (JPEG, PNG or PDF, up to 5 MB) to each line.

- AC-039: A valid file is stored and shown as attached to the line.
- AC-040: A file over 5 MB or of the wrong type is rejected with a message stating the allowed types and size.
- AC-041: Uploading again on a draft replaces the existing receipt.
- AC-042: Upload or replacement on a non-draft claim is refused.
- AC-043: Submission is refused if any line lacks a receipt; that line is identified.

**Related:** EPIC-004, NFR-007, US-013, AC-039, AC-040, AC-041, AC-042, AC-043

### US-012 · draft · source: requirements:US-012

[high] Owners, approving managers and Finance open receipts through short-lived private links.

- AC-044: Permitted users see the receipt via a link that expires after a short time.
- AC-045: An expired link serves nothing.
- AC-046: No link is issued to users who cannot see the claim.
- AC-047: Direct bucket access without a valid link is denied (private bucket).

**Related:** EPIC-004, NFR-006, AC-044, AC-045, AC-046, AC-047

### EPIC-005 · draft · source: requirements:EPIC-005

Submission locks a claim, which then goes through two-step approval: assigned manager, then Finance. Finance then marks approved claims paid.

- Nobody approves their own claim.
- Manager and Finance submitters follow the same route.
- A Finance submitter needs a different Finance user at the Finance stage.
- No assigned manager: the claim skips straight to Finance (to a different user if the submitter is Finance).
- If the only Finance user is the submitter, the claim waits until another Finance user is added.
- A rejected claim returns to the owner as an editable draft with the approver's comment, and can be resubmitted.
- Marking a claim paid is a status change only; no payment is processed.
- Statuses:
  - Draft
  - Submitted (awaiting manager)
  - Manager approved (awaiting Finance)
  - Approved
  - Paid
  - Rejected claims return to Draft, with the comment kept in history.
- Assumption: a comment is required to reject and optional to approve.

**Related:** US-013, US-014, US-015, US-016, US-017, US-018, REQ-CLAR-001, NFR-005

### US-013 · draft · source: requirements:US-013

[critical] Owners submit a draft claim, which locks it and routes it for approval.

- AC-048: A claim whose lines are all complete with receipts can be submitted. It then leaves Draft and can no longer be edited or deleted.
- AC-049: A claim with no lines is refused, with a message.
- AC-050: With an active assigned manager, the claim enters that manager's queue.
- AC-051: With no manager, the claim goes to the Finance queue, visible to Finance users other than the submitter.

**Related:** EPIC-005, US-011, US-002, AC-048, AC-049, AC-050, AC-051

### US-014 · draft · source: requirements:US-014

[critical] Managers approve or reject their direct reports' submitted claims with a comment.

- AC-052: Approval sets the claim to manager-approved and moves it to the Finance queue. The manager's name, the time and any comment are recorded.
- AC-053: Rejection with a comment returns the claim as an editable draft showing the comment.
- AC-054: A rejection without a comment is refused.
- AC-055: Deciding on one's own claim, or on a non-report's claim, is refused.
- AC-056: Over-limit lines are visibly flagged.

**Related:** EPIC-005, NFR-005, US-020, AC-052, AC-053, AC-054, AC-055, AC-056

### US-015 · draft · source: requirements:US-015

[critical] Finance approves or rejects claims that passed or skipped the manager stage.

- AC-057: A non-submitter's approval sets the claim to approved. Name, time and comment are recorded.
- AC-058: Rejection with a comment returns the claim as an editable draft showing the comment.
- AC-059: The submitter cannot decide their own claim.
- AC-060: If the submitter is the only Finance user, the claim waits until another active Finance user exists.
- AC-061: Over-limit lines are visibly flagged.

**Related:** EPIC-005, NFR-005, US-020, AC-057, AC-058, AC-059, AC-060, AC-061

### US-016 · draft · source: requirements:US-016

[high] Finance marks approved claims as paid. This is a status change only.

- AC-062: A non-submitter Finance user marks an approved claim paid. Name and time are recorded; no payment is processed.
- AC-063: Claims not in approved status cannot be marked paid.
- AC-064: Non-Finance users are denied.
- AC-065: The submitter cannot mark their own claim paid (assumption: the no-self-approval rule extends to the paid step).

**Related:** EPIC-005, NFR-004, NFR-005, AC-062, AC-063, AC-064, AC-065

### US-017 · draft · source: requirements:US-017

[critical] Nobody can approve or reject their own claim at any stage.

- AC-066: A submitter's manager or Finance decision, via the UI or API, is refused and the claim is unchanged.
- AC-067: A Manager's claim goes to their assigned manager, then Finance.
- AC-068: A Finance submitter's claim can only be decided by a different Finance user at the Finance stage.

**Related:** EPIC-005, NFR-005, REQ-CLAR-001, AC-066, AC-067, AC-068

### US-018 · draft · source: requirements:US-018

[high] Rejected claims return to the owner to fix and resubmit.

- AC-069: A claim rejected at either stage opens as an editable draft showing the approver's name and comment.
- AC-070: Resubmission restarts the route from the first applicable stage.
- AC-071: Earlier rejections and their comments stay in the history.

**Related:** EPIC-005, US-025, AC-069, AC-070, AC-071

### EPIC-006 · draft · source: requirements:EPIC-006

Finance manages expense categories and optional per-line GBP limits. Over-limit lines are flagged for information only.

- Initial categories: Travel, Meals, Equipment, Other.
- An over-limit flag does not block submission.
- Assumptions:
  - 'Manage' means add, rename, change the limit and retire.
  - Categories already used on claims are retired rather than deleted.
  - The flag uses the category's current limit.
- See REQ-SCOPE for the conflict with the 'Fixed category list' capability wording.

**Related:** US-019, US-020, NFR-011, REQ-SCOPE

### US-019 · draft · source: requirements:US-019

[high] Finance adds, renames and retires categories, and sets or clears per-line limits.

- AC-072: Initial setup has Travel, Meals, Equipment and Other, with no limits.
- AC-073: A limit can be set or cleared. A category without a limit has no limit enforced.
- AC-074: A retired category is not offered for new lines but still displays on existing claims.
- AC-075: Non-Finance users are denied.
- AC-076: Duplicate category names are refused.

**Related:** EPIC-006, NFR-004, NFR-011, AC-072, AC-073, AC-074, AC-075, AC-076

### US-020 · draft · source: requirements:US-020

[medium] Lines above their category limit are flagged for approvers.

- AC-077: For example, with a £50 limit, a line above £50 shows a flag with the limit. The claim list marks the claim as containing an over-limit line.
- AC-078: No flag when the amount equals the limit or the category has no limit.
- AC-079: Submission is still allowed with over-limit lines.

**Related:** EPIC-006, US-014, US-015, AC-077, AC-078, AC-079

### EPIC-007 · draft · source: requirements:EPIC-007

Covers the employee dashboard by status, Finance totals by category and month, and CSV export of approved claims.

- All amounts are in GBP.
- Assumptions:
  - The CSV includes claims that passed Finance approval, including those since marked paid, with a status column.
  - The CSV date range filters on the Finance approval date.

**Related:** US-021, US-022, US-023

### US-021 · draft · source: requirements:US-021

[high] Each user sees their own claims grouped by status.

- AC-080: Counts and claims are shown per status: Draft, Submitted, Manager approved, Approved, Paid.
- AC-081: Rejected claims show as drafts with the approver's comment.
- AC-082: Only the user's own claims are shown.
- AC-083: With no claims, an empty state with a create-claim option is shown.

**Related:** EPIC-007, US-018, AC-080, AC-081, AC-082, AC-083

### US-022 · draft · source: requirements:US-022

[medium] Finance sees GBP totals of approved and paid claims by category and month.

- AC-084: Totals are shown per category per month, for approved and paid claims only.
- AC-085: Draft, submitted, manager-approved and rejected claims are excluded.
- AC-086: Non-Finance users are denied.

**Related:** EPIC-007, NFR-004, AC-084, AC-085, AC-086

### US-023 · draft · source: requirements:US-023

[high] Finance exports approved claims to CSV for a chosen date range.

- AC-087: The CSV has one row per claim line with: claim ID, submitter, line date, category, GBP amount, description and claim status.
- AC-088: Claims approved outside the range are excluded.
- AC-089: An end date before the start date is refused with a message.
- AC-090: No matches gives a headers-only CSV or a clear 'no results' message.
- AC-091: Non-Finance users are denied.

**Related:** EPIC-007, NFR-004, AC-087, AC-088, AC-089, AC-090, AC-091

### EPIC-008 · draft · source: requirements:EPIC-008

Email notifications and an audit trail of status changes. Both are open assumptions from discovery.

- Emails are sent via AWS SES (verified sender domain) on submission and on each decision.
- The audit trail records who changed a claim's status and when.
- Email failures must not block the workflow.

**Related:** US-024, US-025, NFR-009, NFR-010

### US-024 · draft · source: requirements:US-024

[medium] Approvers and submitters are emailed when action is needed or a decision is made.

- AC-092: When a claim reaches a stage, that stage's approver is emailed (the manager, or the Finance users able to act).
- AC-093: On an approve, reject or mark-paid decision, the submitter is emailed with the outcome and any comment.
- AC-094: Email failure does not block the action; the failure is logged.

**Related:** EPIC-008, NFR-010, AC-092, AC-093, AC-094

### US-025 · draft · source: requirements:US-025

[medium] Every claim status change is recorded with who made it and when.

- AC-095: Each entry stores the claim, old and new status, the acting user and a timestamp (for submit, approve, reject and mark paid).
- AC-096: Permitted viewers see entries in time order, with decision comments.
- AC-097: No edit or delete action exists for audit entries.

**Related:** EPIC-008, NFR-009, US-018, AC-095, AC-096, AC-097

### EPIC-009 · draft · source: requirements:EPIC-009

Setup documentation and deployment assumptions for a lightweight MVP on AWS London.

- A single small deployment of React, FastAPI, PostgreSQL and S3 in eu-west-2.
- Sized for about 50 users and low hundreds of claims per month; no high-availability or performance engineering.
- English-only interface.
- UK GDPR with standard measures: encryption in transit and at rest, role-limited access.
- No PCI or HMRC integration.
- External services needed: AWS credentials, an S3 bucket name and a verified SES sender domain.

**Related:** US-026, US-027, NFR-008, NFR-012, NFR-014

### US-026 · draft · source: requirements:US-026

[high] A setup and configuration guide lets an administrator deploy ExpenseTrack unaided.

- AC-098: The guide covers running the app with PostgreSQL, a private S3 bucket and a verified SES sender. It lists the settings to supply: AWS credentials, bucket name, sender domain and session lifetime.
- AC-099: It explains how to create the first Finance user and the initial categories.
- AC-100: It states that currency conversion, mileage, card feeds and accounting integrations are not supported.

**Related:** EPIC-009, NFR-014, AC-098, AC-099, AC-100

### US-027 · draft · source: requirements:US-027

[medium] A short user guide per role covers each role's tasks and the approval routing.

- AC-101: The guide covers:
  - Creating and submitting claims.
  - Uploading receipts.
  - Approving and rejecting (Managers and Finance).
  - Categories, exports and account management (Finance).
- AC-102: It explains the routing rules: no self-approval, no assigned manager, and a Finance user's own claim.

**Related:** EPIC-009, NFR-014, AC-101, AC-102

### NFR-001 · draft · source: requirements:NFR-001

[security] Passwords are stored hashed, never in plain text.

- Only hashed password values exist in the database.
- Applies to: US-005.

**Related:** US-005

### NFR-002 · draft · source: requirements:NFR-002

[security] Sessions expire and end on sign-out, deactivation or password reset.

- Sessions expire after a configurable idle period.
- A session ends when the user signs out, when Finance deactivates the account, or when the user resets their password.
- Reuse of an ended session is refused.
- Applies to: US-003, US-006, US-007.

**Related:** US-003, US-006, US-007

### NFR-003 · draft · source: requirements:NFR-003

[security] Sign-in and password reset give safe, generic responses.

- The same generic message is shown whether or not the email exists.
- Reset links are single-use and expire.
- All pages and APIs except sign-in and reset require sign-in.
- Applies to: US-005, US-007.

**Related:** US-005, US-007

### NFR-004 · draft · source: requirements:NFR-004

[security] Role-based access is enforced by the server on every request.

- Employees: own claims only.
- Managers: own claims and direct reports' claims.
- Finance: all claims.
- Finance only: administration, categories, totals, export and mark-as-paid.
- Enforced server-side, not just hidden in the UI.
- Applies to: US-001, US-004, US-009, US-016, US-019, US-022, US-023.

**Related:** US-001, US-004, US-009, US-016, US-019, US-022, US-023

### NFR-005 · draft · source: requirements:NFR-005

[security] The server enforces no self-approval.

- The server refuses any approval, rejection or paid decision by the claim's own submitter, via the UI or API.
- The claim is left unchanged.
- Applies to: US-014, US-015, US-016, US-017.

**Related:** US-014, US-015, US-016, US-017

### NFR-006 · draft · source: requirements:NFR-006

[security] Receipts are kept in a private bucket and shown only via short-lived links.

- Links are issued only to users allowed to see the claim.
- Direct access to the bucket is denied.
- Applies to: US-011, US-012.

**Related:** US-011, US-012

### NFR-007 · draft · source: requirements:NFR-007

[security] Receipts must be JPEG, PNG or PDF, 5 MB maximum.

- Other files are rejected with a message stating the allowed types and size.
- Target: 5 MB per receipt; JPEG, PNG, PDF.
- Applies to: US-011.

**Related:** US-011

### NFR-008 · draft · source: requirements:NFR-008

[privacy] UK GDPR handling with all data hosted in AWS London.

- Personal data covered: names, emails, receipts.
- Measures: hosted in eu-west-2, encrypted in transit and at rest, role-limited access.
- No PCI or HMRC compliance required.
- Applies to: whole system.

**Related:** EPIC-001, EPIC-009

### NFR-009 · draft · source: requirements:NFR-009

[compliance] The audit trail is tamper-proof.

- Each status change records the claim, old and new status, the acting user and the time.
- Entries cannot be edited or deleted through the app.
- Entries stay visible, with the user's name, after the user is deactivated.
- Applies to: US-003, US-025.

**Related:** US-003, US-025

### NFR-010 · draft · source: requirements:NFR-010

[availability] Email failures never block claim actions.

- If an email fails, the claim action still succeeds and the failure is logged.
- Applies to: US-024.

**Related:** US-024

### NFR-011 · draft · source: requirements:NFR-011

[maintainability] History is kept when users are deactivated or categories retired.

- Past claims and history are never removed.
- Retired categories still display on existing claims.
- Receipts are kept as long as their claim exists.
- Applies to: US-003, US-019.

**Related:** US-003, US-019

### NFR-012 · draft · source: requirements:NFR-012

[scalability, accepted risk] Small scale with no high-availability work.

- Single small deployment.
- Target: about 50 users; low hundreds of claims per month.
- No special high-availability or performance engineering planned.
- Applies to: whole system.

**Related:** EPIC-009

### NFR-013 · draft · source: requirements:NFR-013

[compatibility] English only, GBP only.

- English-only interface.
- Amounts in pounds sterling, with at most two decimal places.
- Applies to: US-008.

**Related:** US-008

### NFR-014 · draft · source: requirements:NFR-014

[maintainability] Setup and user documentation.

- Setup guide: required settings, first Finance user, initial categories, and out-of-scope items.
- User guide: each role's tasks and the approval routing rules.
- Applies to: US-026, US-027.

**Related:** US-026, US-027
<!-- sdlc:auto:end narrative -->

<!-- sdlc:auto:start summary -->
**Requirements version:** v1  
**Delivery scope:** lightweight  
**Approved:** 2026-11-10

**Capabilities in scope:** Employee sign-in and sign-out with email and password, Expense claim creation with one or more lines, Claim line entry (date, category, GBP amount, description), Fixed category list (Travel, Meals, Equipment, Other), Editing and deleting draft claims, Claim submission that locks the claim, Employee dashboard of own claims by status, Setup and usage documentation

**Additional requirements:**

- Roles: Employee, Manager and Finance. Finance creates accounts, assigns each user a manager, and can deactivate users (history kept). Employees see their own claims, managers their direct reports' claims, Finance all claims.
- Two-step approval: the assigned manager approves or rejects a submitted claim with a comment, then Finance approves or rejects and marks it paid. Nobody approves their own claim; a Finance user's claim needs a different Finance user; a submitter with no manager goes straight to Finance. A rejected claim goes back to the employee as a draft with the approver's comment. Receipt upload per claim line: JPEG, PNG or PDF, up to 5 MB, stored in a private S3 bucket and viewed through short-lived links.
- Password reset by email. Finance manages categories with an optional per-line limit (over-limit lines are flagged for approvers), sees totals of approved and paid claims by category and month, and exports approved claims as CSV with a date-range filter.

**Approved technology stack:**

| Layer | Choice | Rationale |
|---|---|---|
| backend | FastAPI | You named FastAPI. The core of this product is business rules: two-stage approval, nobody approves their own claim, a different Finance user for Finance claims, skipping the manager stage when none is assigned, and category limits. FastAPI keeps these in one place with request validation. It also handles app-managed email and password sign-in, presigned receipt uploads to S3, email sending, CSV export and the audit trail. Volume is low (hundreds of claims a month), so one small service is enough. |
| cloud | AWS | You named AWS, and it matches the assumptions already made: receipts in a private S3 bucket with temporary download links, email through SES, and all data in the London region (eu-west-2) for UK GDPR. Keeping everything in one provider means one account, one set of access rules and one bill. |
| database | PostgreSQL | You named PostgreSQL. Your data is tightly related: users and their managers, claims, claim lines, categories with limits, and a history of status changes. Postgres enforces those links and handles the Finance reports (totals by category and month) and CSV export with plain queries. At 50 users and low hundreds of claims a month it will run comfortably on a small instance. |
| frontend | React | You named React. It suits the screens you describe: claim forms with several lines and receipt uploads, an approval queue with comments and over-limit flags, an employee status dashboard, and Finance totals by category and month. It is English only, so no translation work is needed. |
<!-- sdlc:auto:end summary -->

<!-- sdlc:auto:start epics -->
## EPIC-001: Accounts, roles and access

ExpenseTrack is an internal web app for a 5–50 person company. There is no self sign-up. Roles are Employee, Manager and Finance. Finance creates accounts, assigns each user a manager and can deactivate users while keeping their history. Visibility is by role: Employees see their own claims, Managers see their direct reports' claims, Finance sees all claims. Assumption: a Manager also has their own claims as an Employee, and that Manager's own claims follow the same approval route as everyone else's. Assumption: Finance can deactivate accounts and view all claims (open assumption from discovery). Personal data is handled under UK GDPR with standard measures; access is limited by role.

### US-001: Finance creates user accounts

**Priority:** critical

> As a Finance user, I want to create accounts for colleagues with a name, email, role and assigned manager, so that people can use the app without any self sign-up.

| ID | Given | When | Then |
|---|---|---|---|
| AC-001 | I am signed in as Finance | I create a user with a unique email, a name and a role of Employee, Manager or Finance | the account is created and appears in the user list, and the user can set or receive a way to sign in (via password reset by email or an initial password I provide) |
| AC-002 | a user already exists with a given email | I try to create another user with the same email | the system rejects it with a clear message and no second account is created |
| AC-003 | I am signed in as an Employee or Manager | I try to open the user administration screen or call its API | access is denied |
| AC-004 | I am on the sign-in page and not signed in | I look for a way to register | there is no self sign-up option |

### US-002: Finance assigns and changes a user's manager

**Priority:** critical

> As a Finance user, I want to assign each user a manager, or leave them with none, so that claims are routed to the right first-stage approver.

| ID | Given | When | Then |
|---|---|---|---|
| AC-005 | I am editing a user | I choose another active user as their manager and save | that user is recorded as the assigned manager and the claims of the user become visible to that manager |
| AC-006 | I am editing a user | I try to set the user as their own manager | the system rejects the change |
| AC-007 | a user has no assigned manager | I save the account | it is accepted, and the user's submitted claims skip the manager stage (see approval routing) |
| AC-008 | a claim is awaiting the manager stage | Finance changes the submitter's assigned manager (for example because the manager was deactivated) | the claim appears in the new manager's queue (assumption: pending claims follow the current assigned manager) |

### US-003: Finance deactivates a user while keeping history

**Priority:** high

> As a Finance user, I want to deactivate a user's account, so that leavers can no longer access the app but their claims and audit history remain.

| ID | Given | When | Then |
|---|---|---|---|
| AC-009 | a user is signed in | Finance deactivates that user | their existing sessions end and they can no longer use the app |
| AC-010 | a user is deactivated | they try to sign in or request a password reset | sign-in is refused and no usable reset is granted |
| AC-011 | a user has been deactivated | Finance views their past claims and audit entries | all remain visible and still show the user's name |
| AC-012 | a user is deactivated | Finance reviews the user list | the user is marked inactive and cannot be selected as a manager or approver |

### US-004: Role-based visibility of claims

**Priority:** critical

> As a user of the app, I want to see only the claims my role allows, so that expense data is only visible to people who need it.

| ID | Given | When | Then |
|---|---|---|---|
| AC-013 | I am signed in as an Employee | I list or open claims | I see only claims I submitted, and requests for others' claims are refused |
| AC-014 | I am signed in as a Manager | I list claims | I see my own claims and the claims of my direct reports, and no one else's |
| AC-015 | I am signed in as Finance | I list claims | I can see all claims from all users, including those of deactivated users |
| AC-016 | I am a Manager | I request a claim from someone who is not my direct report by its address or ID | access is denied |

## EPIC-002: Sign-in, sign-out and password reset

App-managed email and password authentication. Security is stated as outcomes: sessions expire, signing out or deactivating an account ends them, and passwords are stored hashed. Password reset emails are sent through AWS SES, which needs a verified sender domain.

### US-005: Sign in with email and password

**Priority:** critical

> As a user with an active account, I want to sign in with my email and password, so that I can access the features for my role.

| ID | Given | When | Then |
|---|---|---|---|
| AC-017 | I have an active account | I enter my correct email and password | I am signed in and taken to my dashboard |
| AC-018 | I enter a wrong password or an unknown email | I submit | sign-in is refused with a generic message that does not reveal which part was wrong |
| AC-019 | I am not signed in | I try to open any page or API other than sign-in and reset | I am sent to sign in or the request is refused |
| AC-020 | passwords are stored | the database is inspected | no password is stored in plain text; only hashed values exist |

### US-006: Sessions expire and sign-out ends the session

**Priority:** high

> As a signed-in user, I want to sign out and to have idle sessions expire, so that my account is safe on shared or lost devices.

| ID | Given | When | Then |
|---|---|---|---|
| AC-021 | I am signed in | I choose sign out | my session ends and reusing it is refused |
| AC-022 | I am signed in and have not used the app for longer than the configured session lifetime | I make my next request | I am asked to sign in again |
| AC-023 | my account is deactivated while I am signed in | I make my next request | it is refused and I cannot continue |

### US-007: Reset a forgotten password by email

**Priority:** high

> As a user who forgot my password, I want to request a reset link by email and set a new password, so that I can regain access without asking Finance.

| ID | Given | When | Then |
|---|---|---|---|
| AC-024 | I am on the sign-in page | I request a reset for any email address | the app shows the same confirmation whether or not the address belongs to an account |
| AC-025 | my account is active and I requested a reset | I open the emailed link before it expires and set a new valid password | my password is changed, I can sign in with it and the old password no longer works |
| AC-026 | a reset link has already been used or has expired | I open it | it is refused and I am told to request a new one |
| AC-027 | my password was reset | the reset completes | any other sessions I had are ended |

## EPIC-003: Creating and editing claims

An employee creates a claim with one or more lines. Each line has a date, a category, an amount in GBP and a description. Amounts are in GBP only; currency conversion and mileage claims are out of scope. Drafts are editable and deletable; submitted claims are locked.

### US-008: Create a draft claim with lines

**Priority:** critical

> As a Employee, Manager or Finance user, I want to create a claim made up of one or more lines, each with a date, category, GBP amount and description, so that I can itemise the expenses I want reimbursed.

| ID | Given | When | Then |
|---|---|---|---|
| AC-028 | I am signed in | I create a claim and add a line with a date, an active category, a GBP amount greater than zero and a description | the claim is saved as a draft owned by me and the line is shown with those values |
| AC-029 | I am entering a line | I leave out the date, category, amount or description, or enter an amount that is zero, negative or not a number with at most two decimal places | the line is not saved and the invalid fields are identified |
| AC-030 | I have a draft claim | I add further lines | the claim holds all lines and shows a total in GBP |
| AC-031 | I am entering a line | I choose a category | only the categories Finance currently has active are offered (initially Travel, Meals, Equipment and Other) |

### US-009: Edit a draft claim

**Priority:** high

> As a claim owner, I want to edit, add or remove lines on my draft claim, so that I can correct it before submitting.

| ID | Given | When | Then |
|---|---|---|---|
| AC-032 | my claim is a draft | I change a line's date, category, amount or description and save | the changes are stored and shown |
| AC-033 | my claim is a draft with more than one line | I remove a line | the line and its receipt are removed and the total updates |
| AC-034 | my claim is not a draft | I try to edit it through the UI or the API | the change is refused |
| AC-035 | a claim belongs to someone else | I try to edit it | access is denied |

### US-010: Delete a draft claim

**Priority:** medium

> As a claim owner, I want to delete a draft claim I no longer need, so that my claim list stays tidy.

| ID | Given | When | Then |
|---|---|---|---|
| AC-036 | my claim is a draft | I confirm deletion | the claim, its lines and its receipts are removed and it no longer appears on my dashboard |
| AC-037 | my claim has been submitted at least once and is not currently a draft | I try to delete it | deletion is refused |
| AC-038 | I choose delete on a draft | the confirmation appears and I cancel | nothing is deleted |

## EPIC-004: Receipts

Each claim line has a receipt. Accepted types are JPEG, PNG and PDF, up to 5 MB each. Receipts are kept in a private AWS S3 bucket (eu-west-2) and are viewed only through short-lived links. They are retained for as long as the claim exists. Setup needs AWS credentials and a bucket name. Assumption: a receipt is required before a claim can be submitted, since the brief gives each line a receipt.

### US-011: Upload a receipt to a claim line

**Priority:** critical

> As a claim owner, I want to attach a JPEG, PNG or PDF receipt of up to 5 MB to each line, so that approvers can verify the expense.

| ID | Given | When | Then |
|---|---|---|---|
| AC-039 | I have a draft claim line | I upload a JPEG, PNG or PDF of 5 MB or less | it is stored and shown as attached to that line |
| AC-040 | I upload a file larger than 5 MB, or of another type | I submit it | it is rejected with a message stating the allowed types and size and nothing is attached |
| AC-041 | a line already has a receipt and the claim is a draft | I upload a replacement | the new file replaces the old one |
| AC-042 | the claim is not a draft | I try to upload or replace a receipt | it is refused |
| AC-043 | a draft claim has a line with no receipt | I try to submit the claim | submission is refused and the line missing a receipt is identified |

### US-012: View receipts through short-lived private links

**Priority:** high

> As a claim owner, approving manager or Finance user, I want to open a line's receipt securely, so that receipts are not publicly accessible.

| ID | Given | When | Then |
|---|---|---|---|
| AC-044 | I am allowed to see a claim | I open a receipt | it is displayed using a link that expires after a short time |
| AC-045 | a receipt link has expired | it is used | the file is not served |
| AC-046 | I am not allowed to see a claim | I request one of its receipts | no link is issued |
| AC-047 | the storage bucket is accessed directly without a valid link | a receipt object is requested | access is denied because the bucket is private |

## EPIC-005: Submission and two-step approval

Submitting a claim locks it. The assigned manager approves or rejects with a comment, then Finance approves or rejects and marks approved claims paid. Nobody approves their own claim. Routing: Manager and Finance submitters follow the same route (assigned manager, then Finance). A Finance user's claim needs a different Finance user for the Finance stage. A submitter with no assigned manager skips the manager stage and goes straight to Finance (a different user if the submitter is Finance). If the only Finance user is the submitter, the claim waits until another Finance user is added. Rejected claims return to the employee as an editable draft carrying the approver's comment, and can be resubmitted. Marking paid is a status change only; no payment is processed. Statuses: Draft, Submitted (awaiting manager), Manager approved (awaiting Finance), Approved, Paid, and Rejected claims return to Draft with the comment kept in the history. Assumption: a comment is required when rejecting and optional when approving.

### US-013: Submit a claim and lock it

**Priority:** critical

> As a claim owner, I want to submit my draft claim, so that it goes for approval and cannot be altered afterwards.

| ID | Given | When | Then |
|---|---|---|---|
| AC-048 | my draft claim has at least one line, and every line is complete with a receipt | I submit it | its status changes from Draft and it can no longer be edited or deleted by me |
| AC-049 | my claim has no lines | I try to submit | submission is refused with a message |
| AC-050 | I submit a claim and my assigned manager exists and is active | submission completes | the claim appears in that manager's approval queue |
| AC-051 | I submit a claim and I have no assigned manager | submission completes | the claim skips the manager stage and appears in the Finance queue, visible to Finance users other than me |

### US-014: Manager approves or rejects direct reports' claims

**Priority:** critical

> As a Manager, I want to approve or reject a submitted claim from one of my direct reports with a comment, so that only legitimate claims reach Finance.

| ID | Given | When | Then |
|---|---|---|---|
| AC-052 | a claim from my direct report is awaiting the manager stage | I approve it | its status becomes manager-approved and it moves to the Finance queue, and my name, the time and any comment are recorded |
| AC-053 | a claim from my direct report is awaiting the manager stage | I reject it with a comment | the claim returns to the submitter as an editable draft showing my comment |
| AC-054 | I try to reject without a comment | I submit the decision | it is refused and a comment is requested |
| AC-055 | a claim is mine, or from someone who is not my direct report | I try to approve or reject it | the action is refused |
| AC-056 | a claim line is over its category limit | I review the claim | the over-limit line is visibly flagged |

### US-015: Finance approves or rejects manager-approved claims

**Priority:** critical

> As a Finance user, I want to approve or reject claims that have passed the manager stage, or that skip it, with a comment, so that only valid expenses are paid.

| ID | Given | When | Then |
|---|---|---|---|
| AC-057 | a claim is awaiting the Finance stage and I am not its submitter | I approve it | its status becomes approved and my name, the time and any comment are recorded |
| AC-058 | a claim is awaiting the Finance stage and I am not its submitter | I reject it with a comment | the claim returns to the submitter as an editable draft showing my comment |
| AC-059 | I am the submitter of a claim awaiting the Finance stage | I try to approve or reject it | the action is refused |
| AC-060 | the submitter is the only Finance user | the claim reaches the Finance stage | it waits with no approver until another active Finance user exists, and is then available to that user |
| AC-061 | a claim is over-limit on a line | I review it | the line is visibly flagged |

### US-016: Mark an approved claim as paid

**Priority:** high

> As a Finance user, I want to mark an approved claim as paid, so that employees can see their claim has been reimbursed.

| ID | Given | When | Then |
|---|---|---|---|
| AC-062 | a claim has status approved and I am not its submitter | I mark it paid | its status becomes paid with my name and the time recorded, and no payment is processed by the app |
| AC-063 | a claim is not in approved status | I try to mark it paid | the action is refused |
| AC-064 | I am not a Finance user | I try to mark a claim paid | access is denied |
| AC-065 | I am the submitter of an approved claim | I try to mark it paid | the action is refused (assumption: the no-self-approval rule extends to the paid step) |

### US-017: Nobody approves their own claim

**Priority:** critical

> As a company owner, I want the system to prevent anyone approving or rejecting their own claim at any stage, so that expenses are always independently reviewed.

| ID | Given | When | Then |
|---|---|---|---|
| AC-066 | I am the submitter of any claim | I attempt a manager or Finance decision on it through the UI or the API | the decision is refused and the claim is unchanged |
| AC-067 | a Manager submits a claim | it is routed | it goes to the Manager's assigned manager first, then to a Finance user |
| AC-068 | a Finance user submits a claim | it reaches the Finance stage | only a different Finance user can decide it |

### US-018: Rejected claim returns to the employee to fix and resubmit

**Priority:** high

> As a claim owner, I want to see why my claim was rejected and edit and resubmit it, so that I can fix the problem without starting again.

| ID | Given | When | Then |
|---|---|---|---|
| AC-069 | my claim was rejected at either stage | I open it | it is a draft I can edit, with the approver's name and comment displayed |
| AC-070 | I have edited a rejected claim | I resubmit it | it starts the approval route again from the first applicable stage |
| AC-071 | my claim has been resubmitted | anyone views its history | the earlier rejection and its comment remain in the history |

## EPIC-006: Categories and per-line limits

Finance manages the expense categories. The initial list is Travel, Meals, Equipment and Other. Each category may have an optional per-line limit in GBP. Lines over the limit are flagged for the approver; the flag is informational and does not stop submission. Assumption: 'manage' means adding, renaming, changing the limit and retiring categories; a category already used by claims is retired rather than deleted so history is kept. The flag is evaluated against the category's current limit.

### US-019: Finance manages categories and limits

**Priority:** high

> As a Finance user, I want to add, rename, retire and set an optional per-line limit on categories, so that the category list and limits match company policy.

| ID | Given | When | Then |
|---|---|---|---|
| AC-072 | the system is first set up | Finance opens the category list | Travel, Meals, Equipment and Other exist, with no limits set |
| AC-073 | I am signed in as Finance | I set a per-line limit in GBP on a category, or clear it | the limit is saved, and a category with no limit has none enforced |
| AC-074 | I retire a category | employees add new lines | the retired category is not offered, while existing claims that use it still display it |
| AC-075 | I am not a Finance user | I try to change categories | access is denied |
| AC-076 | I try to give two categories the same name | I save | it is refused |

### US-020: Flag over-limit lines for approvers

**Priority:** medium

> As a Manager or Finance approver, I want lines above their category limit to be clearly flagged, so that I can scrutinise them.

| ID | Given | When | Then |
|---|---|---|---|
| AC-077 | a category has a limit of £50 | a line in that category has an amount above £50 | the line shows an over-limit flag with the limit to the approver, and the claim list shows that the claim contains an over-limit line |
| AC-078 | a line amount equals the limit or the category has no limit | the approver views it | no flag is shown |
| AC-079 | a line is over the limit | the employee submits the claim | submission is still allowed |

## EPIC-007: Dashboard, reporting and CSV export

Employees see their own claims grouped by status. Finance sees totals of approved and paid claims by category and month and can export approved claims as CSV with a date-range filter. All amounts are in GBP. Assumptions: the CSV includes claims that passed Finance approval, including those since marked paid, with a status column; the date range filters on the Finance approval date.

### US-021: Employee dashboard of own claims by status

**Priority:** high

> As a Employee, Manager or Finance user, I want to see my own claims grouped by status, so that I know where each claim is.

| ID | Given | When | Then |
|---|---|---|---|
| AC-080 | I have claims in several statuses | I open my dashboard | I see a count and the claims for each status (Draft, Submitted, Manager approved, Approved, Paid) |
| AC-081 | I open a claim from the dashboard | it has been rejected and returned | I see it as a draft with the approver's comment |
| AC-082 | other users have claims | I view my dashboard | only my own claims are included |
| AC-083 | I have no claims | I open my dashboard | an empty state with a way to create a claim is shown |

### US-022: Finance totals by category and month

**Priority:** medium

> As a Finance user, I want to see totals of approved and paid claims by category and month, so that I can understand spending.

| ID | Given | When | Then |
|---|---|---|---|
| AC-084 | approved and paid claims exist | I open the Finance totals view | I see GBP totals per category per month, covering approved and paid claims only |
| AC-085 | claims are in draft, submitted, manager-approved or rejected status | I view the totals | they are not counted |
| AC-086 | I am not a Finance user | I try to open the totals | access is denied |

### US-023: Export approved claims as CSV with a date range

**Priority:** high

> As a Finance user, I want to export approved claims to a CSV file for a chosen date range, so that I can use the data outside the app.

| ID | Given | When | Then |
|---|---|---|---|
| AC-087 | approved claims exist in a date range | I choose a start and end date and export | I download a CSV with one row per claim line, including claim ID, submitter, line date, category, amount in GBP, description and claim status |
| AC-088 | claims were approved outside the chosen range | I export | they are excluded |
| AC-089 | I enter an end date before the start date | I export | it is refused with a message |
| AC-090 | no claims match | I export | I get a CSV with headers only or a clear 'no results' message |
| AC-091 | I am not a Finance user | I try to export | access is denied |

## EPIC-008: Notifications and audit trail

Both are open assumptions from discovery. Email notifications are sent through AWS SES (needs a verified sender domain) on submission and on each decision. An audit trail of status changes records who and when. Email failures must not block the claim workflow.

### US-024: Email notifications on submission and decisions

**Priority:** medium

> As a claim owner or approver, I want to be emailed when a claim needs my action or has been decided, so that claims do not stall.

| ID | Given | When | Then |
|---|---|---|---|
| AC-092 | a claim is submitted | it reaches an approval stage | the approver for that stage (the manager, or Finance users able to act) is emailed |
| AC-093 | a manager or Finance user approves, rejects or marks paid a claim | the decision is saved | the submitter is emailed with the outcome and any comment |
| AC-094 | the email service is unavailable | a notification fails | the claim action still succeeds and the failure is logged |

### US-025: Audit trail of claim status changes

**Priority:** medium

> As a Finance user, I want a record of every claim status change with who made it and when, so that I can trace what happened to a claim.

| ID | Given | When | Then |
|---|---|---|---|
| AC-095 | a claim changes status (submit, approve, reject, mark paid) | the change is saved | an entry is stored with the claim, old and new status, the acting user and the timestamp |
| AC-096 | I open a claim as a user allowed to see it | I view its history | I see the entries in time order, with decision comments |
| AC-097 | any user tries to edit or delete an audit entry | they use the app | no such action is available |

## EPIC-009: Setup documentation and deployment assumptions

Lightweight MVP: a single small deployment of React, FastAPI, PostgreSQL and S3 on AWS in eu-west-2 (London), for up to about 50 users and low hundreds of claims per month, with no special high-availability or performance engineering. The UI is English only. Data is handled under UK GDPR with standard measures (encryption in transit and at rest, role-limited access); no PCI or HMRC integration. External services needed: AWS credentials, an S3 bucket name and a verified SES sender domain.

### US-026: Setup and configuration guide

**Priority:** high

> As a administrator setting up ExpenseTrack, I want a written guide to install, configure and run the app, so that I can deploy it without help from the developers.

| ID | Given | When | Then |
|---|---|---|---|
| AC-098 | I have the documentation and an AWS account | I follow the setup steps | I can run the app with PostgreSQL, a private S3 bucket and a verified SES sender, and I know which settings (AWS credentials, bucket name, sender domain, session lifetime) to supply |
| AC-099 | a fresh install | I follow the guide | it explains how to create the first Finance user and the initial categories |
| AC-100 | the guide is read | I look for scope notes | it states that currency conversion, mileage, card feeds and accounting integrations are not supported |

### US-027: User guide for each role

**Priority:** medium

> As a Employee, Manager or Finance user, I want a short guide to the tasks my role performs, so that I can use the app without training.

| ID | Given | When | Then |
|---|---|---|---|
| AC-101 | I open the user guide | I look for my role | it covers creating and submitting claims, uploading receipts, approving or rejecting (Managers and Finance), and categories, exports and account management (Finance) |
| AC-102 | the guide describes approval | I read it | it explains the routing rules, including no self approval, no assigned manager, and a Finance user's own claim |
<!-- sdlc:auto:end epics -->
