# Development

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start narrative -->
### DEV-PLAN-V1 · approved · source: plan:v1

The ExpenseTrack delivery plan is approved at version 1. It has 6 sprints with a capacity of 20 each. It covers 9 epics, 27 stories and 3 tasks.

- Plan status: approved, version 1.
- Sprints: 6, capacity 20 each, 120 in total.
- Story points: 102 across US-001 to US-027 (sum of the listed points). Epics and tasks are unpointed.
- Roles assigned: backend-agent, frontend-agent, security-agent, integration-agent, devops-agent. Epics are unassigned.
- Approver and approval date: not stated in the input.

**Related:** EPIC-001, EPIC-002, EPIC-003, EPIC-004, EPIC-005, EPIC-006, EPIC-007, EPIC-008, EPIC-009

### SPRINT-1 · approved · source: plan:Sprint 1

Sprint 1 covers authentication and Finance user administration.

- Goal: Authentication foundation and Finance user administration: sign-in, sessions, account creation, manager assignment and deactivation.
- Capacity: 20.
- related_ids are inferred from the goal wording. The input does not give an explicit sprint-to-story assignment.

**Related:** US-001, US-002, US-003, US-005, US-006

### SPRINT-2 · approved · source: plan:Sprint 2

Sprint 2 covers password reset, category management, and creating and deleting draft claims.

- Goal: Password reset by email, Finance-managed categories, and creating and deleting draft claims with lines.
- Capacity: 20.
- related_ids are inferred from the goal wording.

**Related:** US-007, US-019, US-008, US-010

### SPRINT-3 · approved · source: plan:Sprint 3

Sprint 3 covers draft editing, receipt uploads, role-based visibility, and submission with routing.

- Goal: Editing drafts, receipt uploads to private S3, role-based claim visibility and claim submission with routing.
- Capacity: 20.
- related_ids are inferred from the goal wording.
- All four tickets reported in the run fall under this goal:
  - Delivered: US-004, US-009, US-013.
  - Failed: US-011.

**Related:** US-009, US-011, US-004, US-013

### SPRINT-4 · approved · source: plan:Sprint 4

Sprint 4 covers two-step approval, secure receipt viewing, the audit trail and no-self-approval.

- Goal: Two-step approval: secure receipt viewing, audit trail, manager and Finance decisions, and the no-self-approval rule.
- Capacity: 20.
- related_ids are inferred from the goal wording.
- No ticket outcomes are recorded for this sprint.

**Related:** US-012, US-025, US-014, US-015, US-017

### SPRINT-5 · approved · source: plan:Sprint 5

Sprint 5 completes the workflow: paid status, resubmission, over-limit flags, dashboard, CSV export and email notifications.

- Goal: Completing the workflow: mark paid, rejection and resubmission, over-limit flags, employee dashboard, CSV export and email notifications.
- Capacity: 20.
- related_ids are inferred from the goal wording.
- No ticket outcomes are recorded for this sprint.

**Related:** US-016, US-018, US-020, US-021, US-023, US-024

### SPRINT-6 · approved · source: plan:Sprint 6

Sprint 6 covers Finance totals reporting and the setup and user documentation.

- Goal: Finance totals reporting, plus setup and role-based user documentation.
- Capacity: 20.
- related_ids are inferred from the goal wording.
- No ticket outcomes are recorded for this sprint.

**Related:** US-022, US-026, US-027

### EPIC-001 · approved · source: plan:EPIC-001

Accounts, roles and access: 16 points across 4 stories.

- US-001 Finance creates user accounts: 5 points, backend-agent.
- US-002 Finance assigns and changes a user's manager: 3 points, backend-agent.
- US-003 Finance deactivates a user while keeping history: 3 points, backend-agent.
- US-004 Role-based visibility of claims: 5 points, security-agent. Ticket delivered.

**Related:** US-001, US-002, US-003, US-004

### EPIC-002 · approved · source: plan:EPIC-002

Sign-in, sign-out and password reset: 13 points across 3 stories.

- US-005 Sign in with email and password: 5 points, backend-agent.
- US-006 Sessions expire and sign-out ends the session: 3 points, backend-agent.
- US-007 Reset a forgotten password by email: 5 points, backend-agent.
- No ticket outcomes are recorded for this epic.

**Related:** US-005, US-006, US-007

### EPIC-003 · approved · source: plan:EPIC-003

Creating and editing claims: 13 points across 3 stories. US-008 is broken into 3 tasks.

- US-008 Create a draft claim with lines: 8 points, backend-agent. Its tasks:
  - T1: Add claims and claim_lines migration (backend-agent).
  - T2: Implement claim and line creation endpoints (backend-agent).
  - T3: Build the claim form with lines and total (frontend-agent).
- US-009 Edit a draft claim: 3 points, backend-agent. Ticket delivered.
- US-010 Delete a draft claim: 2 points, backend-agent.

**Related:** US-008, US-008-T1, US-008-T2, US-008-T3, US-009, US-010

### EPIC-004 · approved · source: plan:EPIC-004

Receipts: 8 points across 2 stories. The upload story failed in the run.

- US-011 Upload a receipt to a claim line: 5 points, integration-agent. Ticket failed.
- US-012 View receipts through short-lived private links: 3 points, integration-agent. No outcome recorded.

**Related:** US-011, US-012

### EPIC-005 · approved · source: plan:EPIC-005

Submission and two-step approval: 23 points across 6 stories.

- US-013 Submit a claim and lock it: 5 points, backend-agent. Ticket delivered.
- US-014 Manager approves or rejects direct reports' claims: 5 points, backend-agent.
- US-015 Finance approves or rejects manager-approved claims: 5 points, backend-agent.
- US-016 Mark an approved claim as paid: 2 points, backend-agent.
- US-017 Nobody approves their own claim: 3 points, security-agent.
- US-018 Rejected claim returns to the employee to fix and resubmit: 3 points, backend-agent.
- Approval routing for claims from Managers and Finance users: see DEV-DECISION-APPROVAL-ROUTING.

**Related:** US-013, US-014, US-015, US-016, US-017, US-018

### EPIC-006 · approved · source: plan:EPIC-006

Categories and per-line limits: 8 points across 2 stories.

- US-019 Finance manages categories and limits: 5 points, backend-agent.
- US-020 Flag over-limit lines for approvers: 3 points, frontend-agent.
- No ticket outcomes are recorded for this epic.

**Related:** US-019, US-020

### EPIC-007 · approved · source: plan:EPIC-007

Dashboard, reporting and CSV export: 9 points across 3 stories.

- US-021 Employee dashboard of own claims by status: 3 points, frontend-agent.
- US-022 Finance totals by category and month: 3 points, backend-agent.
- US-023 Export approved claims as CSV with a date range: 3 points, backend-agent.
- No ticket outcomes are recorded for this epic.

**Related:** US-021, US-022, US-023

### EPIC-008 · approved · source: plan:EPIC-008

Notifications and audit trail: 8 points across 2 stories.

- US-024 Email notifications on submission and decisions: 5 points, integration-agent.
- US-025 Audit trail of claim status changes: 3 points, backend-agent.
- No ticket outcomes are recorded for this epic.

**Related:** US-024, US-025

### EPIC-009 · approved · source: plan:EPIC-009

Setup documentation and deployment assumptions: 4 points across 2 stories.

- US-026 Setup and configuration guide: 2 points, devops-agent.
- US-027 User guide for each role: 2 points, frontend-agent.
- No ticket outcomes are recorded for this epic.

**Related:** US-026, US-027

### DEV-RUN · draft · source: dev:run

The development run is marked completed but reports only 4 tickets: 3 delivered and 1 failed. No outcome is recorded for the other 23 planned stories.

- Run status: completed.
- Delivered, all in commit b80aa2eb967831cddd3021835f0daec38f6c1256:
  - US-004.
  - US-009.
  - US-013.
- Failed, with no commit:
  - US-011.
- No ticket result for: US-001 to US-003, US-005 to US-008 (and tasks US-008-T1 to T3), US-010, US-012, US-014 to US-027.
- Observations for human review:
  - US-009 (edit draft) and US-013 (submit) were delivered, but no result is recorded for US-008 (create draft).
  - No result is recorded for the sign-in stories US-005 and US-006.
  - The input does not say whether these were built earlier or not at all.
- Delivery against scope is unconfirmed. Treat 'completed' as the run state, not as full plan delivery.

**Related:** US-004, US-009, US-011, US-013

### DEV-US-004 · draft · source: dev:US-004

Role-based visibility of claims was delivered in commit b80aa2eb.

- Ticket: US-004 Role-based visibility of claims.
- Owner role in plan: security-agent, 5 points.
- Status: delivered.
- Commit: b80aa2eb967831cddd3021835f0daec38f6c1256.
- Test or review results: none provided.

**Related:** US-004, EPIC-001, SPRINT-3

### DEV-US-009 · draft · source: dev:US-009

Editing a draft claim was delivered in commit b80aa2eb.

- Ticket: US-009 Edit a draft claim.
- Owner role in plan: backend-agent, 3 points.
- Status: delivered.
- Commit: b80aa2eb967831cddd3021835f0daec38f6c1256.
- Test or review results: none provided.

**Related:** US-009, EPIC-003, SPRINT-3

### DEV-US-011 · draft · source: dev:US-011

Uploading a receipt to a claim line failed. There is no commit.

- Ticket: US-011 Upload a receipt to a claim line.
- Owner role in plan: integration-agent, 5 points.
- Status: failed. Commit: none.
- Cause of failure: not stated in the input.
- Impact: the project description requires a receipt (image or PDF, up to 5 MB) per line, stored in S3. This capability is not confirmed as built.
- US-012 (receipt viewing) has no recorded outcome.

**Related:** US-011, US-012, EPIC-004, SPRINT-3

### DEV-US-013 · draft · source: dev:US-013

Submitting a claim and locking it was delivered in commit b80aa2eb.

- Ticket: US-013 Submit a claim and lock it.
- Owner role in plan: backend-agent, 5 points.
- Status: delivered.
- Commit: b80aa2eb967831cddd3021835f0daec38f6c1256.
- The Sprint 3 goal includes 'submission with routing'. The input does not say whether routing for claims from Managers and Finance users was implemented.
- Test or review results: none provided.

**Related:** US-013, EPIC-005, SPRINT-3, DEV-DECISION-APPROVAL-ROUTING

### DEV-DECISION-APPROVAL-ROUTING · draft · source: clarification:approval-routing

Claims submitted by a Manager or a Finance user go to that person's assigned manager first, then to Finance.

- Question: who approves a claim submitted by a Manager or a Finance user, given that nobody can approve their own claim?
- Answer recorded: 'Assigned manager, then Finance.'
- This is the same two-step flow as for employees, using the manager that Finance assigns (US-002).
- Not specified:
  - which Finance user approves a Finance user's own claim at the Finance step (US-017 forbids self-approval);
  - who approves when a user has no assigned manager.
- No formal sign-off is recorded.

**Related:** US-013, US-014, US-015, US-017, US-002
<!-- sdlc:auto:end narrative -->
