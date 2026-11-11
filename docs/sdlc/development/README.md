# Development

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start narrative -->
### DEV-PLAN-V1 · approved · source: plan:version-1

The development plan is approved at version 1. It has 6 sprints, each with a capacity of 20 points, and covers 9 epics and 27 stories (US-001 to US-027).

- Plan status: approved; version: 1.
- Sprints: 6 (Sprint 1 to Sprint 6), capacity 20 each.
- Epics: EPIC-001 to EPIC-009. Stories: US-001 to US-027. Tasks: only US-008 is broken down (US-008-T1 to T3).
- Agent roles assigned: backend-agent, frontend-agent, security-agent, integration-agent, devops-agent. Epics are unassigned.
- Approver and approval date: not stated in input.

**Related:** SPRINT-1, SPRINT-2, SPRINT-3, SPRINT-4, SPRINT-5, SPRINT-6, EPIC-001, EPIC-002, EPIC-003, EPIC-004, EPIC-005, EPIC-006, EPIC-007, EPIC-008, EPIC-009

### SPRINT-1 · approved · source: plan:Sprint 1

Authentication foundation and Finance user administration. All five stories matching this goal are reported as delivered.

- Goal: Authentication foundation and Finance user administration: sign-in, sessions, account creation, manager assignment and deactivation.
- Capacity: 20.
- Matching stories (inferred from goal wording; the input does not give explicit sprint assignment): US-001 (5), US-002 (3), US-003 (3), US-005 (5), US-006 (3). Total 19 points.
- Outcome: all five tickets delivered in commit d52e08e86f49609607bb80beef9a3acb03e56a92.

**Related:** US-001, US-002, US-003, US-005, US-006, EPIC-001, EPIC-002

### SPRINT-2 · approved · source: plan:Sprint 2

Password reset, Finance-managed categories, and creating and deleting draft claims. No delivery was reported for this sprint's stories.

- Goal: Password reset by email, Finance-managed categories, and creating and deleting draft claims with lines.
- Capacity: 20.
- Matching stories (inferred from goal wording): US-007 (5), US-019 (5), US-008 (8), US-010 (2). Total 20 points.
- Outcome: no tickets reported in the development run.

**Related:** US-007, US-019, US-008, US-010, EPIC-002, EPIC-003, EPIC-006

### SPRINT-3 · approved · source: plan:Sprint 3

Editing drafts, receipt uploads to private S3, role-based claim visibility, and submission with routing. No delivery was reported.

- Goal: Editing drafts, receipt uploads to private S3, role-based claim visibility and claim submission with routing.
- Capacity: 20.
- Matching stories (inferred from goal wording): US-009 (3), US-011 (5), US-004 (5), US-013 (5). Total 18 points.
- Outcome: no tickets reported in the development run.

**Related:** US-009, US-011, US-004, US-013, EPIC-001, EPIC-003, EPIC-004, EPIC-005

### SPRINT-4 · approved · source: plan:Sprint 4

Two-step approval: secure receipt viewing, audit trail, manager and Finance decisions, and the no-self-approval rule. No delivery was reported.

- Goal: Two-step approval: secure receipt viewing, audit trail, manager and Finance decisions, and the no-self-approval rule.
- Capacity: 20.
- Matching stories (inferred from goal wording): US-012 (3), US-025 (3), US-014 (5), US-015 (5), US-017 (3). Total 19 points.
- Outcome: no tickets reported in the development run.

**Related:** US-012, US-025, US-014, US-015, US-017, EPIC-004, EPIC-005, EPIC-008

### SPRINT-5 · approved · source: plan:Sprint 5

Completing the workflow: mark paid, rejection and resubmission, over-limit flags, employee dashboard, CSV export and email notifications. No delivery was reported.

- Goal: Completing the workflow: mark paid, rejection and resubmission, over-limit flags, employee dashboard, CSV export and email notifications.
- Capacity: 20.
- Matching stories (inferred from goal wording): US-016 (2), US-018 (3), US-020 (3), US-021 (3), US-023 (3), US-024 (5). Total 19 points.
- Outcome: no tickets reported in the development run.

**Related:** US-016, US-018, US-020, US-021, US-023, US-024, EPIC-005, EPIC-006, EPIC-007, EPIC-008

### SPRINT-6 · approved · source: plan:Sprint 6

Finance totals reporting, plus setup and role-based user documentation. No delivery was reported.

- Goal: Finance totals reporting, plus setup and role-based user documentation.
- Capacity: 20.
- Matching stories (inferred from goal wording): US-022 (3), US-026 (2), US-027 (2). Total 7 points.
- Outcome: no tickets reported in the development run.

**Related:** US-022, US-026, US-027, EPIC-007, EPIC-009

### EPIC-001 · approved · source: plan:EPIC-001

Accounts, roles and access. Three of its four stories are delivered; US-004 (role-based visibility) has no reported ticket.

- US-001 Finance creates user accounts: 5 pts, backend-agent. Delivered.
- US-002 Finance assigns and changes a user's manager: 3 pts, backend-agent. Delivered.
- US-003 Finance deactivates a user while keeping history: 3 pts, backend-agent. Delivered.
- US-004 Role-based visibility of claims: 5 pts, security-agent. No ticket reported.

**Related:** US-001, US-002, US-003, US-004

### EPIC-002 · approved · source: plan:EPIC-002

Sign-in, sign-out and password reset. Sign-in and sessions are delivered; password reset (US-007) has no reported ticket.

- US-005 Sign in with email and password: 5 pts, backend-agent. Delivered.
- US-006 Sessions expire and sign-out ends the session: 3 pts, backend-agent. Delivered.
- US-007 Reset a forgotten password by email: 5 pts, backend-agent. No ticket reported.

**Related:** US-005, US-006, US-007

### EPIC-003 · approved · source: plan:EPIC-003

Creating and editing claims. US-008 is broken into three tasks. No ticket was reported for any story in this epic.

- US-008 Create a draft claim with lines: 8 pts, backend-agent. No ticket reported. Tasks:
  - US-008-T1 Add claims and claim_lines migration (backend-agent).
  - US-008-T2 Implement claim and line creation endpoints (backend-agent).
  - US-008-T3 Build the claim form with lines and total (frontend-agent).
- US-009 Edit a draft claim: 3 pts, backend-agent. No ticket reported.
- US-010 Delete a draft claim: 2 pts, backend-agent. No ticket reported.

**Related:** US-008, US-008-T1, US-008-T2, US-008-T3, US-009, US-010

### EPIC-004 · approved · source: plan:EPIC-004

Receipts: upload to a claim line and view through short-lived private links. No tickets reported.

- US-011 Upload a receipt to a claim line: 5 pts, integration-agent. No ticket reported.
- US-012 View receipts through short-lived private links: 3 pts, integration-agent. No ticket reported.

**Related:** US-011, US-012

### EPIC-005 · approved · source: plan:EPIC-005

Submission and two-step approval. No ticket was reported for any story in this epic. A clarification applies to how claims from Managers and Finance users are routed.

- US-013 Submit a claim and lock it: 5 pts, backend-agent. No ticket reported.
- US-014 Manager approves or rejects direct reports' claims: 5 pts, backend-agent. No ticket reported.
- US-015 Finance approves or rejects manager-approved claims: 5 pts, backend-agent. No ticket reported.
- US-016 Mark an approved claim as paid: 2 pts, backend-agent. No ticket reported.
- US-017 Nobody approves their own claim: 3 pts, security-agent. No ticket reported.
- US-018 Rejected claim returns to the employee to fix and resubmit: 3 pts, backend-agent. No ticket reported.
- Project clarification (relevant to US-013, US-014, US-015, US-017):
  - Question: who approves a claim submitted by a Manager or a Finance user?
  - Answer: their assigned manager, then Finance.
  - The input does not say how a Finance user's own claim is kept from Finance self-approval at the second step. It also does not say whether this rule is implemented.

**Related:** US-013, US-014, US-015, US-016, US-017, US-018

### EPIC-006 · approved · source: plan:EPIC-006

Categories and per-line limits. No tickets reported.

- US-019 Finance manages categories and limits: 5 pts, backend-agent. No ticket reported.
- US-020 Flag over-limit lines for approvers: 3 pts, frontend-agent. No ticket reported.

**Related:** US-019, US-020

### EPIC-007 · approved · source: plan:EPIC-007

Dashboard, reporting and CSV export. No tickets reported.

- US-021 Employee dashboard of own claims by status: 3 pts, frontend-agent. No ticket reported.
- US-022 Finance totals by category and month: 3 pts, backend-agent. No ticket reported.
- US-023 Export approved claims as CSV with a date range: 3 pts, backend-agent. No ticket reported.

**Related:** US-021, US-022, US-023

### EPIC-008 · approved · source: plan:EPIC-008

Notifications and audit trail. No tickets reported.

- US-024 Email notifications on submission and decisions: 5 pts, integration-agent. No ticket reported.
- US-025 Audit trail of claim status changes: 3 pts, backend-agent. No ticket reported.

**Related:** US-024, US-025

### EPIC-009 · approved · source: plan:EPIC-009

Setup documentation and deployment assumptions. No tickets reported.

- US-026 Setup and configuration guide: 2 pts, devops-agent. No ticket reported.
- US-027 User guide for each role: 2 pts, frontend-agent. No ticket reported.

**Related:** US-026, US-027

### DEV-RUN · draft · source: dev:run

The development run is reported as completed, with 5 tickets delivered in one commit. Those tickets match the Sprint 1 scope.

- Run status: completed.
- Delivered tickets: US-001, US-002, US-003, US-005, US-006.
- Commit for all five: d52e08e86f49609607bb80beef9a3acb03e56a92.
- Not provided: run date, code review, test results, build artifacts.

**Related:** US-001, US-002, US-003, US-005, US-006, SPRINT-1

### DEV-TICKET-US-001 · draft · source: dev:US-001

Finance creates user accounts. Delivered.

- Status: delivered.
- Commit: d52e08e86f49609607bb80beef9a3acb03e56a92.
- Role: backend-agent. Points: 5.
- No implementation details or test evidence provided.

**Related:** US-001, EPIC-001, SPRINT-1

### DEV-TICKET-US-002 · draft · source: dev:US-002

Finance assigns and changes a user's manager. Delivered.

- Status: delivered.
- Commit: d52e08e86f49609607bb80beef9a3acb03e56a92.
- Role: backend-agent. Points: 3.
- No implementation details or test evidence provided.

**Related:** US-002, EPIC-001, SPRINT-1

### DEV-TICKET-US-003 · draft · source: dev:US-003

Finance deactivates a user while keeping history. Delivered.

- Status: delivered.
- Commit: d52e08e86f49609607bb80beef9a3acb03e56a92.
- Role: backend-agent. Points: 3.
- No implementation details or test evidence provided.

**Related:** US-003, EPIC-001, SPRINT-1

### DEV-TICKET-US-005 · draft · source: dev:US-005

Sign in with email and password. Delivered.

- Status: delivered.
- Commit: d52e08e86f49609607bb80beef9a3acb03e56a92.
- Role: backend-agent. Points: 5.
- No implementation details or test evidence provided.

**Related:** US-005, EPIC-002, SPRINT-1

### DEV-TICKET-US-006 · draft · source: dev:US-006

Sessions expire and sign-out ends the session. Delivered.

- Status: delivered.
- Commit: d52e08e86f49609607bb80beef9a3acb03e56a92.
- Role: backend-agent. Points: 3.
- Session expiry duration not stated.
- No implementation details or test evidence provided.

**Related:** US-006, EPIC-002, SPRINT-1

### DEV-GAP-UNREPORTED · draft · source: dev:run

The run says 'completed', but 22 of the 27 planned stories have no ticket, status or commit. Whether they were built cannot be confirmed from the input.

- Conflict between two inputs:
  - Run status: 'completed'.
  - Plan: 6 sprints and 27 stories.
  - Run ticket list: only the 5 Sprint 1 stories.
- Stories with no reported ticket: US-004, and US-007 through US-027. Together these cover Sprints 2 to 6.
- Possible readings, neither confirmed:
  - (a) The run covered Sprint 1 only.
  - (b) Ticket reporting is incomplete.
- Impact: the core claim, receipt, approval, reporting and notification features (including the clarified rule that Manager and Finance claims go to the assigned manager, then Finance) cannot be documented as built.
- Action: the development owner should confirm the delivery status of the remaining stories.

**Related:** US-004, US-007, US-008, US-009, US-010, US-011, US-012, US-013, US-014, US-015, US-016, US-017, US-018, US-019, US-020, US-021, US-022, US-023, US-024, US-025, US-026, US-027
<!-- sdlc:auto:end narrative -->
