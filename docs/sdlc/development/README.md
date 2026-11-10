# Development

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start narrative -->
### DEV-PLAN-V1 · approved · source: plan:v1

Version 1 of the ExpenseTrack development plan is approved. It covers 6 sprints of capacity 20 each. The backlog has 9 epics, 27 stories and 3 tasks, each assigned to an agent role.

Plan status: approved, version 1. The input does not state an approver or approval date.

Backlog (story points, assigned role):

EPIC-001 Accounts, roles and access
- US-001 Finance creates user accounts (5, backend-agent)
- US-002 Finance assigns and changes a user's manager (3, backend-agent)
- US-003 Finance deactivates a user while keeping history (3, backend-agent)
- US-004 Role-based visibility of claims (5, security-agent)

EPIC-002 Sign-in, sign-out and password reset
- US-005 Sign in with email and password (5, backend-agent)
- US-006 Sessions expire and sign-out ends the session (3, backend-agent)
- US-007 Reset a forgotten password by email (5, backend-agent)

EPIC-003 Creating and editing claims
- US-008 Create a draft claim with lines (8, backend-agent)
  - US-008-T1 Add claims and claim_lines migration (backend-agent)
  - US-008-T2 Implement claim and line creation endpoints (backend-agent)
  - US-008-T3 Build the claim form with lines and total (frontend-agent)
- US-009 Edit a draft claim (3, backend-agent)
- US-010 Delete a draft claim (2, backend-agent)

EPIC-004 Receipts
- US-011 Upload a receipt to a claim line (5, integration-agent)
- US-012 View receipts through short-lived private links (3, integration-agent)

EPIC-005 Submission and two-step approval
- US-013 Submit a claim and lock it (5, backend-agent)
- US-014 Manager approves or rejects direct reports' claims (5, backend-agent)
- US-015 Finance approves or rejects manager-approved claims (5, backend-agent)
- US-016 Mark an approved claim as paid (2, backend-agent)
- US-017 Nobody approves their own claim (3, security-agent)
- US-018 Rejected claim returns to the employee to fix and resubmit (3, backend-agent)

EPIC-006 Categories and per-line limits
- US-019 Finance manages categories and limits (5, backend-agent)
- US-020 Flag over-limit lines for approvers (3, frontend-agent)

EPIC-007 Dashboard, reporting and CSV export
- US-021 Employee dashboard of own claims by status (3, frontend-agent)
- US-022 Finance totals by category and month (3, backend-agent)
- US-023 Export approved claims as CSV with a date range (3, backend-agent)

EPIC-008 Notifications and audit trail
- US-024 Email notifications on submission and decisions (5, integration-agent)
- US-025 Audit trail of claim status changes (3, backend-agent)

EPIC-009 Setup documentation and deployment assumptions
- US-026 Setup and configuration guide (2, devops-agent)
- US-027 User guide for each role (2, frontend-agent)

Other notes:
- Epics have no points and no assigned role.
- US-008 tasks have no points.

**Related:** EPIC-001, EPIC-002, EPIC-003, EPIC-004, EPIC-005, EPIC-006, EPIC-007, EPIC-008, EPIC-009, US-001, US-002, US-003, US-004, US-005, US-006, US-007, US-008, US-009, US-010, US-011, US-012, US-013, US-014, US-015, US-016, US-017, US-018, US-019, US-020, US-021, US-022, US-023, US-024, US-025, US-026, US-027

### DEV-SPRINT-1 · approved · source: plan:Sprint 1

Sprint 1 targets the authentication foundation and Finance user administration. Its capacity is 20.

- Goal: Authentication foundation and Finance user administration: sign-in, sessions, account creation, manager assignment and deactivation.
- Capacity: 20.
- The plan input gives no explicit story-to-sprint assignment.
- By goal wording, the matching stories appear to be US-005, US-006, US-001, US-002 and US-003. These total 19 points.
- These are the same 5 tickets that appear in the development run. All 5 failed or were skipped (see DEV-RUN-1).

**Related:** DEV-PLAN-V1, US-001, US-002, US-003, US-005, US-006

### DEV-SPRINT-2 · approved · source: plan:Sprint 2

Sprint 2 targets password reset, Finance-managed categories, and creating and deleting draft claims. Its capacity is 20.

- Goal: Password reset by email, Finance-managed categories, and creating and deleting draft claims with lines.
- Capacity: 20.
- The plan input gives no explicit story-to-sprint assignment.
- By goal wording, the matching stories appear to be US-007, US-019, US-008 (with tasks T1 to T3) and US-010.
- The development run lists no tickets for this sprint's scope.

**Related:** DEV-PLAN-V1, US-007, US-019, US-008, US-010

### DEV-SPRINT-3 · approved · source: plan:Sprint 3

Sprint 3 targets draft editing, receipt uploads to private S3, role-based claim visibility, and claim submission with routing. Its capacity is 20.

- Goal: Editing drafts, receipt uploads to private S3, role-based claim visibility and claim submission with routing.
- Capacity: 20.
- The plan input gives no explicit story-to-sprint assignment.
- By goal wording, the matching stories appear to be US-009, US-011, US-004 and US-013.
- The development run lists no tickets for this sprint's scope.

**Related:** DEV-PLAN-V1, US-009, US-011, US-004, US-013

### DEV-SPRINT-4 · approved · source: plan:Sprint 4

Sprint 4 targets the two-step approval workflow, secure receipt viewing, the audit trail and the no-self-approval rule. Its capacity is 20.

- Goal: Two-step approval: secure receipt viewing, audit trail, manager and Finance decisions, and the no-self-approval rule.
- Capacity: 20.
- The plan input gives no explicit story-to-sprint assignment.
- By goal wording, the matching stories appear to be US-012, US-025, US-014, US-015 and US-017.
- The development run lists no tickets for this sprint's scope.

**Related:** DEV-PLAN-V1, US-012, US-025, US-014, US-015, US-017

### DEV-SPRINT-5 · approved · source: plan:Sprint 5

Sprint 5 completes the claim workflow: mark paid, rejection and resubmission, over-limit flags, employee dashboard, CSV export and email notifications. Its capacity is 20.

- Goal: Completing the workflow: mark paid, rejection and resubmission, over-limit flags, employee dashboard, CSV export and email notifications.
- Capacity: 20.
- The plan input gives no explicit story-to-sprint assignment.
- By goal wording, the matching stories appear to be US-016, US-018, US-020, US-021, US-023 and US-024.
- The development run lists no tickets for this sprint's scope.

**Related:** DEV-PLAN-V1, US-016, US-018, US-020, US-021, US-023, US-024

### DEV-SPRINT-6 · approved · source: plan:Sprint 6

Sprint 6 targets Finance totals reporting plus setup and role-based user documentation. Its capacity is 20.

- Goal: Finance totals reporting, plus setup and role-based user documentation.
- Capacity: 20.
- The plan input gives no explicit story-to-sprint assignment.
- By goal wording, the matching stories appear to be US-022, US-026 and US-027.
- The development run lists no tickets for this sprint's scope.

**Related:** DEV-PLAN-V1, US-022, US-026, US-027

### DEV-RUN-1 · draft · source: dev:run

The development run is reported as 'completed', but none of its tickets delivered code. Of 5 tickets, 2 failed and 3 were skipped, with no commits. The run status and the ticket outcomes conflict.

Conflict, with both versions recorded:
- Run-level status: completed.
- Ticket-level outcomes: 0 of 5 succeeded. No commit was recorded for any ticket.

Ticket outcomes:
- US-001 Finance creates user accounts: failed, no commit.
- US-002 Finance assigns and changes a user's manager: skipped, no commit.
- US-003 Finance deactivates a user while keeping history: skipped, no commit.
- US-005 Sign in with email and password: failed, no commit.
- US-006 Sessions expire and sign-out ends the session: skipped, no commit.

What the input does not provide:
- Failure reasons.
- Skip reasons.
- Logs.
- Dates.

See DEV-NOT-RUN for backlog items with no ticket in this run.

**Related:** US-001, US-002, US-003, US-005, US-006

### DEV-US-001 · draft · source: dev:US-001

The ticket for Finance creating user accounts failed. No commit was produced.

- Story: US-001 Finance creates user accounts (5 points, backend-agent).
- Status: failed.
- Commit: none.
- The input gives no failure reason.
- Account creation is the only way users enter the system, because there is no self sign-up. Downstream stories depend on accounts existing.

**Related:** US-001, EPIC-001, DEV-SPRINT-1

### DEV-US-002 · draft · source: dev:US-002

The ticket for Finance assigning and changing a user's manager was skipped. No commit was produced.

- Story: US-002 Finance assigns and changes a user's manager (3 points, backend-agent).
- Status: skipped.
- Commit: none.
- The input gives no skip reason. It does not state whether the skip was caused by the US-001 failure.

**Related:** US-002, EPIC-001, DEV-SPRINT-1

### DEV-US-003 · draft · source: dev:US-003

The ticket for Finance deactivating a user while keeping history was skipped. No commit was produced.

- Story: US-003 Finance deactivates a user while keeping history (3 points, backend-agent).
- Status: skipped.
- Commit: none.
- The input gives no skip reason.

**Related:** US-003, EPIC-001, DEV-SPRINT-1

### DEV-US-005 · draft · source: dev:US-005

The ticket for signing in with email and password failed. No commit was produced.

- Story: US-005 Sign in with email and password (5 points, backend-agent).
- Status: failed.
- Commit: none.
- The input gives no failure reason.

**Related:** US-005, EPIC-002, DEV-SPRINT-1

### DEV-US-006 · draft · source: dev:US-006

The ticket for session expiry and sign-out was skipped. No commit was produced.

- Story: US-006 Sessions expire and sign-out ends the session (3 points, backend-agent).
- Status: skipped.
- Commit: none.
- The input gives no skip reason. It does not state whether the skip was caused by the US-005 failure.

**Related:** US-006, EPIC-002, DEV-SPRINT-1

### DEV-NOT-RUN · draft · source: dev:run

22 planned stories and the 3 US-008 tasks have no ticket in the development run output. No development outcome is recorded for them.

Items in the plan with no ticket in the run:
- Stories: US-004, US-007, US-008, US-009, US-010, US-011, US-012, US-013, US-014, US-015, US-016, US-017, US-018, US-019, US-020, US-021, US-022, US-023, US-024, US-025, US-026, US-027.
- Tasks: US-008-T1, US-008-T2, US-008-T3.

The input does not say why these items have no ticket or when they will be run. These items cover:
- Claims
- Receipts
- Approvals, including the no-self-approval rule (US-017)
- Categories
- Reporting
- Notifications
- Audit trail
- Documentation

No functionality for these items is confirmed as built.

**Related:** US-004, US-007, US-008, US-009, US-010, US-011, US-012, US-013, US-014, US-015, US-016, US-017, US-018, US-019, US-020, US-021, US-022, US-023, US-024, US-025, US-026, US-027
<!-- sdlc:auto:end narrative -->
