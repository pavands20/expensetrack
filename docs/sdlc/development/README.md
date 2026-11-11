# Development

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start narrative -->
### DEV-PLAN-V1 · approved · source: plan:v1

Development plan version 1 is approved. It has 6 sprints, each with capacity 20, covering 9 epics and 27 user stories. Who approved it and when are not stated in the input.

Sprint goals:
- Sprint 1: Authentication foundation and Finance user administration (sign-in, sessions, account creation, manager assignment and deactivation).
- Sprint 2: Password reset by email, Finance-managed categories, and creating and deleting draft claims with lines.
- Sprint 3: Editing drafts, receipt uploads to private S3, role-based claim visibility, and claim submission with routing.
- Sprint 4: Two-step approval (secure receipt viewing, audit trail, manager and Finance decisions, and the no-self-approval rule).
- Sprint 5: Completing the workflow (mark paid, rejection and resubmission, over-limit flags, employee dashboard, CSV export, email notifications).
- Sprint 6: Finance totals reporting, plus setup and role-based user documentation.

Plan items (points / assigned agent role):
- EPIC-001 Accounts, roles and access
  - US-001 Finance creates user accounts (5, backend-agent)
  - US-002 Finance assigns and changes a user's manager (3, backend-agent)
  - US-003 Finance deactivates a user while keeping history (3, backend-agent)
  - US-004 Role-based visibility of claims (5, security-agent)
- EPIC-002 Sign-in, sign-out and password reset
  - US-005 Sign in with email and password (5, backend-agent)
  - US-006 Sessions expire and sign-out ends the session (3, backend-agent)
  - US-007 Reset a forgotten password by email (5, backend-agent)
- EPIC-003 Creating and editing claims
  - US-008 Create a draft claim with lines (8, backend-agent)
    - Tasks: US-008-T1 migration (backend-agent), US-008-T2 endpoints (backend-agent), US-008-T3 claim form (frontend-agent)
  - US-009 Edit a draft claim (3, backend-agent)
  - US-010 Delete a draft claim (2, backend-agent)
- EPIC-004 Receipts
  - US-011 Upload a receipt to a claim line (5, integration-agent)
  - US-012 View receipts through short-lived private links (3, integration-agent)
- EPIC-005 Submission and two-step approval
  - US-013 Submit a claim and lock it (5, backend-agent)
  - US-014 Manager approves or rejects direct reports' claims (5, backend-agent)
  - US-015 Finance approves or rejects manager-approved claims (5, backend-agent)
  - US-016 Mark an approved claim as paid (2, backend-agent)
  - US-017 Nobody approves their own claim (3, security-agent)
  - US-018 Rejected claim returns to the employee to fix and resubmit (3, backend-agent)
- EPIC-006 Categories and per-line limits
  - US-019 Finance manages categories and limits (5, backend-agent)
  - US-020 Flag over-limit lines for approvers (3, frontend-agent)
- EPIC-007 Dashboard, reporting and CSV export
  - US-021 Employee dashboard of own claims by status (3, frontend-agent)
  - US-022 Finance totals by category and month (3, backend-agent)
  - US-023 Export approved claims as CSV with a date range (3, backend-agent)
- EPIC-008 Notifications and audit trail
  - US-024 Email notifications on submission and decisions (5, integration-agent)
  - US-025 Audit trail of claim status changes (3, backend-agent)
- EPIC-009 Setup documentation and deployment assumptions
  - US-026 Setup and configuration guide (2, devops-agent)
  - US-027 User guide for each role (2, frontend-agent)

Notes:
- The input does not give an explicit story-to-sprint assignment. The mapping is described only through the sprint goal text.
- Epics are unpointed and unassigned in the plan.

**Related:** EPIC-001, EPIC-002, EPIC-003, EPIC-004, EPIC-005, EPIC-006, EPIC-007, EPIC-008, EPIC-009

### DEV-RUN-1 · draft · source: dev:run

The development run status is 'completed'. Four tickets are recorded as delivered, all in a single commit. No test results, code review or acceptance sign-off is recorded.

- Run status: completed.
- Delivered tickets: US-007, US-008, US-010, US-019.
- Commit for all four: 8af4a24a6cc47b30827f7011cf00649015ec362c.
- The four stories total 5 + 8 + 2 + 5 = 20 points, which equals the per-sprint capacity of 20.
- Their titles match the Sprint 2 goal (password reset, Finance-managed categories, creating and deleting draft claims with lines).
- 'Completed' describes this run only. It should not be read as completion of the full 27-story plan (see DEV-GAP-1).

**Related:** US-007, US-008, US-010, US-019

### US-007 · draft · source: dev:US-007

Password reset by email (US-007) is recorded as delivered. Implementation details and test evidence were not provided.

- Ticket: Reset a forgotten password by email.
- Status: delivered.
- Commit: 8af4a24a6cc47b30827f7011cf00649015ec362c.
- Planned: 5 points, backend-agent, EPIC-002.
- Intended behaviour (project description): password reset by email, as part of email/password sign-in.
- Not stated in the input: token lifetime, email provider, acceptance results.
- Delivery of the related sign-in story US-005 is not recorded in this run.

**Related:** EPIC-002, US-005, DEV-RUN-1

### US-008 · draft · source: dev:US-008

Creating a draft claim with lines (US-008) is recorded as delivered. The plan broke it into a database migration, backend endpoints and a frontend claim form showing lines and a total.

- Ticket: Create a draft claim with lines.
- Status: delivered.
- Commit: 8af4a24a6cc47b30827f7011cf00649015ec362c.
- Planned: 8 points, backend-agent, EPIC-003.
- Planned tasks:
  - US-008-T1: Add claims and claim_lines migration (backend-agent).
  - US-008-T2: Implement claim and line creation endpoints (backend-agent).
  - US-008-T3: Build the claim form with lines and total (frontend-agent).
- Per-task delivery status is not given separately. Only the parent ticket is marked delivered.
- Intended line fields (project description): date, category, amount in GBP, description.
- Receipt attachment per line is a separate story (US-011) with no delivery record in this run.

**Related:** EPIC-003, US-008-T1, US-008-T2, US-008-T3, US-019, DEV-RUN-1

### US-010 · draft · source: dev:US-010

Deleting a draft claim (US-010) is recorded as delivered. No further implementation detail was provided.

- Ticket: Delete a draft claim.
- Status: delivered.
- Commit: 8af4a24a6cc47b30827f7011cf00649015ec362c.
- Planned: 2 points, backend-agent, EPIC-003.
- The input does not state how deletion behaves for non-draft claims or whether it is soft or hard deletion.

**Related:** EPIC-003, US-008, DEV-RUN-1

### US-019 · draft · source: dev:US-019

Finance management of expense categories and per-line limits (US-019) is recorded as delivered. The over-limit flag that depends on these limits (US-020) has no delivery record.

- Ticket: Finance manages categories and limits.
- Status: delivered.
- Commit: 8af4a24a6cc47b30827f7011cf00649015ec362c.
- Planned: 5 points, backend-agent, EPIC-006.
- Intended scope (project description): categories Travel, Meals, Equipment and Other, each with an optional per-line limit, managed by Finance.
- Flagging over-limit lines for approvers is US-020 (frontend-agent), which is not delivered in this run.

**Related:** EPIC-006, US-020, US-008, DEV-RUN-1

### DEV-GAP-1 · draft · source: dev:run

23 of the 27 planned stories have no ticket record in the development input. Their implementation status is unknown and is not assumed here. This includes the Sprint 1 authentication and account-administration foundation.

Stories with no ticket or delivery record:
- Sprint 1 scope (per goal text):
  - US-001 account creation
  - US-002 manager assignment
  - US-003 deactivation
  - US-005 sign-in
  - US-006 sessions and sign-out
- Sprint 3 scope:
  - US-009 edit draft
  - US-011 receipt upload to private S3
  - US-004 role-based visibility
  - US-013 submit and lock
- Sprint 4 scope:
  - US-012 receipt viewing
  - US-025 audit trail
  - US-014 manager decisions
  - US-015 Finance decisions
  - US-017 no self-approval
- Sprint 5 scope:
  - US-016 mark paid
  - US-018 rejection and resubmission
  - US-020 over-limit flags
  - US-021 employee dashboard
  - US-023 CSV export
  - US-024 email notifications
- Sprint 6 scope:
  - US-022 Finance totals
  - US-026 setup guide
  - US-027 role user guides

Related clarification (project input), relevant to US-014, US-015 and US-017 once built:
- Question: who approves a claim submitted by a Manager or a Finance user?
- Answer: their assigned manager, then Finance.
- The no-self-approval rule (US-017) must still hold.

The end-to-end claim workflow (submit, approve, pay) is not confirmed as built. For this reason no user guide content is documented for this phase.

**Related:** US-001, US-002, US-003, US-004, US-005, US-006, US-009, US-011, US-012, US-013, US-014, US-015, US-016, US-017, US-018, US-020, US-021, US-022, US-023, US-024, US-025, US-026, US-027
<!-- sdlc:auto:end narrative -->
