# Development

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start narrative -->
### DEV-PLAN-V1 · approved · source: plan:v1

The development plan is approved at version 1. It has six sprints of capacity 20 each, 9 epics, 27 stories and 3 tasks. Total story points are 102.

- Plan status: approved, version 1.
- Sprints: 6, each with capacity 20.
- Epics: EPIC-001 to EPIC-009. None of the epics is pointed or assigned a role.
- Stories: US-001 to US-027, totalling 102 points.
- Tasks: US-008-T1, US-008-T2, US-008-T3. None is pointed.
- Agent roles used: backend-agent, frontend-agent, security-agent, integration-agent, devops-agent.
- The plan does not explicitly assign stories to sprints. The sprint entries below map stories to sprints by matching goal wording to story titles. The resulting point sums (19/20/18/19/19/7 = 102) account for every story exactly once.

**Related:** EPIC-001, EPIC-002, EPIC-003, EPIC-004, EPIC-005, EPIC-006, EPIC-007, EPIC-008, EPIC-009

### DEV-SPRINT-1 · approved · source: plan:Sprint 1

Sprint 1 covers the authentication foundation and Finance user administration. Its scope matches the five tickets reported as delivered.

- Goal: Authentication foundation and Finance user administration: sign-in, sessions, account creation, manager assignment and deactivation.
- Capacity: 20.
- Matched stories (inferred from goal wording):
  - US-005 (5)
  - US-006 (3)
  - US-001 (5)
  - US-002 (3)
  - US-003 (3)
- Matched total: 19 points.
- Ticket outcome: all five stories delivered (see DEV-TICKET entries).

**Related:** US-001, US-002, US-003, US-005, US-006

### DEV-SPRINT-2 · approved · source: plan:Sprint 2

Sprint 2 covers password reset by email, Finance-managed categories, and creating and deleting draft claims. No ticket status is reported for its stories.

- Goal: Password reset by email, Finance-managed categories, and creating and deleting draft claims with lines.
- Capacity: 20.
- Matched stories (inferred from goal wording):
  - US-007 (5)
  - US-019 (5)
  - US-008 (8)
  - US-010 (2)
- Matched total: 20 points.
- Ticket outcome: not reported.

**Related:** US-007, US-019, US-008, US-010

### DEV-SPRINT-3 · approved · source: plan:Sprint 3

Sprint 3 covers editing drafts, receipt uploads to private S3, role-based claim visibility, and claim submission with routing. No ticket status is reported.

- Goal: Editing drafts, receipt uploads to private S3, role-based claim visibility and claim submission with routing.
- Capacity: 20.
- Matched stories (inferred from goal wording):
  - US-009 (3)
  - US-011 (5)
  - US-004 (5)
  - US-013 (5)
- Matched total: 18 points.
- Ticket outcome: not reported.

**Related:** US-009, US-011, US-004, US-013

### DEV-SPRINT-4 · approved · source: plan:Sprint 4

Sprint 4 covers two-step approval: secure receipt viewing, the audit trail, manager and Finance decisions, and the no-self-approval rule. No ticket status is reported.

- Goal: Two-step approval: secure receipt viewing, audit trail, manager and Finance decisions, and the no-self-approval rule.
- Capacity: 20.
- Matched stories (inferred from goal wording):
  - US-012 (3)
  - US-025 (3)
  - US-014 (5)
  - US-015 (5)
  - US-017 (3)
- Matched total: 19 points.
- Ticket outcome: not reported.

**Related:** US-012, US-025, US-014, US-015, US-017

### DEV-SPRINT-5 · approved · source: plan:Sprint 5

Sprint 5 completes the workflow: mark paid, rejection and resubmission, over-limit flags, the employee dashboard, CSV export and email notifications. No ticket status is reported.

- Goal: Completing the workflow: mark paid, rejection and resubmission, over-limit flags, employee dashboard, CSV export and email notifications.
- Capacity: 20.
- Matched stories (inferred from goal wording):
  - US-016 (2)
  - US-018 (3)
  - US-020 (3)
  - US-021 (3)
  - US-023 (3)
  - US-024 (5)
- Matched total: 19 points.
- Ticket outcome: not reported.

**Related:** US-016, US-018, US-020, US-021, US-023, US-024

### DEV-SPRINT-6 · approved · source: plan:Sprint 6

Sprint 6 covers Finance totals reporting plus setup and role-based user documentation. No ticket status is reported.

- Goal: Finance totals reporting, plus setup and role-based user documentation.
- Capacity: 20.
- Matched stories (inferred from goal wording):
  - US-022 (3)
  - US-026 (2)
  - US-027 (2)
- Matched total: 7 points.
- Ticket outcome: not reported.

**Related:** US-022, US-026, US-027

### EPIC-001 · approved · source: plan:EPIC-001

This epic covers accounts, roles and access. Three of its four stories are delivered; US-004 (role-based visibility) has no ticket status.

- US-001 Finance creates user accounts: 5 points, backend-agent. Delivered.
- US-002 Finance assigns and changes a user's manager: 3 points, backend-agent. Delivered.
- US-003 Finance deactivates a user while keeping history: 3 points, backend-agent. Delivered.
- US-004 Role-based visibility of claims: 5 points, security-agent. No ticket reported.

**Related:** US-001, US-002, US-003, US-004

### EPIC-002 · approved · source: plan:EPIC-002

This epic covers sign-in, sign-out and password reset. Sign-in and session handling are delivered; password reset (US-007) has no ticket status.

- US-005 Sign in with email and password: 5 points, backend-agent. Delivered.
- US-006 Sessions expire and sign-out ends the session: 3 points, backend-agent. Delivered.
- US-007 Reset a forgotten password by email: 5 points, backend-agent. No ticket reported.

**Related:** US-005, US-006, US-007

### EPIC-003 · approved · source: plan:EPIC-003

This epic covers creating and editing claims, and includes the only task breakdown in the plan (US-008). No ticket status is reported for any of its stories.

- US-008 Create a draft claim with lines: 8 points, backend-agent. Its tasks:
  - US-008-T1 Add claims and claim_lines migration (backend-agent).
  - US-008-T2 Implement claim and line creation endpoints (backend-agent).
  - US-008-T3 Build the claim form with lines and total (frontend-agent).
- US-009 Edit a draft claim: 3 points, backend-agent.
- US-010 Delete a draft claim: 2 points, backend-agent.
- Ticket outcome: none reported.

**Related:** US-008, US-008-T1, US-008-T2, US-008-T3, US-009, US-010

### EPIC-004 · approved · source: plan:EPIC-004

This epic covers receipt upload and viewing through short-lived private links. No ticket status is reported.

- US-011 Upload a receipt to a claim line: 5 points, integration-agent. The project description specifies an image or PDF of up to 5 MB, stored in S3.
- US-012 View receipts through short-lived private links: 3 points, integration-agent.
- Ticket outcome: none reported.

**Related:** US-011, US-012

### EPIC-005 · approved · source: plan:EPIC-005

This epic covers submission, two-step approval (manager, then Finance), payment, no self-approval, and resubmission after rejection. No ticket status is reported.

- US-013 Submit a claim and lock it: 5 points, backend-agent.
- US-014 Manager approves or rejects direct reports' claims: 5 points, backend-agent.
- US-015 Finance approves or rejects manager-approved claims: 5 points, backend-agent.
- US-016 Mark an approved claim as paid: 2 points, backend-agent.
- US-017 Nobody approves their own claim: 3 points, security-agent.
- US-018 Rejected claim returns to the employee to fix and resubmit: 3 points, backend-agent.
- Approval routing for Manager and Finance claimants: see DEV-CLARIFY-001.
- Ticket outcome: none reported.

**Related:** US-013, US-014, US-015, US-016, US-017, US-018, DEV-CLARIFY-001

### EPIC-006 · approved · source: plan:EPIC-006

This epic covers Finance-managed categories with optional per-line limits and flags on over-limit lines. No ticket status is reported.

- US-019 Finance manages categories and limits: 5 points, backend-agent. The project description lists the categories as Travel, Meals, Equipment and Other.
- US-020 Flag over-limit lines for approvers: 3 points, frontend-agent.
- Ticket outcome: none reported.

**Related:** US-019, US-020

### EPIC-007 · approved · source: plan:EPIC-007

This epic covers the employee dashboard, Finance totals and CSV export. No ticket status is reported.

- US-021 Employee dashboard of own claims by status: 3 points, frontend-agent.
- US-022 Finance totals by category and month: 3 points, backend-agent.
- US-023 Export approved claims as CSV with a date range: 3 points, backend-agent.
- Ticket outcome: none reported.

**Related:** US-021, US-022, US-023

### EPIC-008 · approved · source: plan:EPIC-008

This epic covers email notifications and the audit trail of claim status changes. No ticket status is reported.

- US-024 Email notifications on submission and decisions: 5 points, integration-agent.
- US-025 Audit trail of claim status changes: 3 points, backend-agent.
- Ticket outcome: none reported.

**Related:** US-024, US-025

### EPIC-009 · approved · source: plan:EPIC-009

This epic covers the setup guide and role-based user documentation. No ticket status is reported.

- US-026 Setup and configuration guide: 2 points, devops-agent.
- US-027 User guide for each role: 2 points, frontend-agent.
- Ticket outcome: none reported.

**Related:** US-026, US-027

### DEV-TICKET-US-001 · draft · source: dev:US-001

Finance account creation is delivered.

- Ticket: US-001 Finance creates user accounts.
- Status: delivered.
- Commit: 19aae9fef4aa5b95ffd84c91164bc71b38562b98.
- No review, test result or approval is recorded in the input.

**Related:** US-001, EPIC-001, DEV-SPRINT-1

### DEV-TICKET-US-002 · draft · source: dev:US-002

Finance assigning and changing a user's manager is delivered.

- Ticket: US-002 Finance assigns and changes a user's manager.
- Status: delivered.
- Commit: 19aae9fef4aa5b95ffd84c91164bc71b38562b98.
- No review, test result or approval is recorded in the input.

**Related:** US-002, EPIC-001, DEV-SPRINT-1

### DEV-TICKET-US-003 · draft · source: dev:US-003

User deactivation that keeps history is delivered.

- Ticket: US-003 Finance deactivates a user while keeping history.
- Status: delivered.
- Commit: 19aae9fef4aa5b95ffd84c91164bc71b38562b98.
- No review, test result or approval is recorded in the input.

**Related:** US-003, EPIC-001, DEV-SPRINT-1

### DEV-TICKET-US-005 · draft · source: dev:US-005

Email and password sign-in is delivered.

- Ticket: US-005 Sign in with email and password.
- Status: delivered.
- Commit: 19aae9fef4aa5b95ffd84c91164bc71b38562b98.
- No review, test result or approval is recorded in the input.

**Related:** US-005, EPIC-002, DEV-SPRINT-1

### DEV-TICKET-US-006 · draft · source: dev:US-006

Session expiry and sign-out are delivered.

- Ticket: US-006 Sessions expire and sign-out ends the session.
- Status: delivered.
- Commit: 19aae9fef4aa5b95ffd84c91164bc71b38562b98.
- No review, test result or approval is recorded in the input.

**Related:** US-006, EPIC-002, DEV-SPRINT-1

### DEV-RUN-STATUS · draft · source: dev:run

The run is reported as 'completed', but only 5 of 27 stories (19 of 102 points) have delivered tickets. This conflict is recorded, not resolved.

- Version A: the development run status is 'completed'.
- Version B: ticket records cover only US-001, US-002, US-003, US-005 and US-006.
  - These are exactly the Sprint 1 scope.
  - All five share one commit: 19aae9fef4aa5b95ffd84c91164bc71b38562b98.
- Stories with no ticket status (22):
  - US-004, US-007, US-008, US-009, US-010
  - US-011, US-012, US-013, US-014, US-015
  - US-016, US-017, US-018, US-019, US-020
  - US-021, US-022, US-023, US-024, US-025
  - US-026, US-027
- Tasks US-008-T1 to US-008-T3 also have no ticket status.
- None of these 22 stories or 3 tasks are treated as built in this documentation.
- Consequence: core claim, receipt, approval, reporting and notification features are unconfirmed, so no end-user guide content is produced from this phase.
- Action for a human: confirm whether the run covered only Sprint 1, or whether ticket records for the remaining stories are missing.

**Related:** DEV-PLAN-V1, US-004, US-007, US-008, US-009, US-010, US-011, US-012, US-013, US-014, US-015, US-016, US-017, US-018, US-019, US-020, US-021, US-022, US-023, US-024, US-025, US-026, US-027

### DEV-CLARIFY-001 · draft · source: clarification:approver-for-manager-and-finance-claims

Claims submitted by Managers or Finance users go first to the claimant's assigned manager, then to Finance. This keeps the two-step flow and the no-self-approval rule.

- Question: who approves a claim submitted by a Manager or a Finance user, given that nobody can approve their own claim?
- Recorded answer: assigned manager, then Finance.
- Affects:
  - US-014 (manager step uses the claimant's assigned manager).
  - US-015 (Finance step).
  - US-017 (no self-approval).
  - US-002 (every user, including Managers and Finance, needs an assigned manager).
- No formal sign-off date or approver is recorded for this answer.
- Open points not covered by the input, to be confirmed by a human:
  - Who approves when a Finance user's own claim reaches the Finance step. Presumably a different Finance user, but this is not stated.
  - What happens for a user with no assigned manager, such as the top of the hierarchy.
- Implementation status: the approval stories (US-014, US-015, US-017) have no ticket status, so this routing is not confirmed as built.

**Related:** US-014, US-015, US-017, US-002, EPIC-005
<!-- sdlc:auto:end narrative -->
