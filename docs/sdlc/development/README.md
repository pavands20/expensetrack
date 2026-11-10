# Development

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start narrative -->
### DEV-PLAN-V1 · approved · source: plan:v1

The ExpenseTrack delivery plan, version 1, is approved. It defines 6 sprints, each with capacity 20, covering 9 epics and 27 stories.

- Plan status: approved; version: 1.
- Approver and approval date: not stated in input.
- Epics and stories (points, assigned role):
  - EPIC-001 Accounts, roles and access:
    - US-001 Finance creates user accounts (5, backend-agent)
    - US-002 Finance assigns and changes a user's manager (3, backend-agent)
    - US-003 Finance deactivates a user while keeping history (3, backend-agent)
    - US-004 Role-based visibility of claims (5, security-agent)
  - EPIC-002 Sign-in, sign-out and password reset:
    - US-005 Sign in with email and password (5, backend-agent)
    - US-006 Sessions expire and sign-out ends the session (3, backend-agent)
    - US-007 Reset a forgotten password by email (5, backend-agent)
  - EPIC-003 Creating and editing claims:
    - US-008 Create a draft claim with lines (8, backend-agent), with tasks:
      - US-008-T1 Add claims and claim_lines migration (backend-agent)
      - US-008-T2 Implement claim and line creation endpoints (backend-agent)
      - US-008-T3 Build the claim form with lines and total (frontend-agent)
    - US-009 Edit a draft claim (3, backend-agent)
    - US-010 Delete a draft claim (2, backend-agent)
  - EPIC-004 Receipts:
    - US-011 Upload a receipt to a claim line (5, integration-agent)
    - US-012 View receipts through short-lived private links (3, integration-agent)
  - EPIC-005 Submission and two-step approval:
    - US-013 Submit a claim and lock it (5, backend-agent)
    - US-014 Manager approves or rejects direct reports' claims (5, backend-agent)
    - US-015 Finance approves or rejects manager-approved claims (5, backend-agent)
    - US-016 Mark an approved claim as paid (2, backend-agent)
    - US-017 Nobody approves their own claim (3, security-agent)
    - US-018 Rejected claim returns to the employee to fix and resubmit (3, backend-agent)
  - EPIC-006 Categories and per-line limits:
    - US-019 Finance manages categories and limits (5, backend-agent)
    - US-020 Flag over-limit lines for approvers (3, frontend-agent)
  - EPIC-007 Dashboard, reporting and CSV export:
    - US-021 Employee dashboard of own claims by status (3, frontend-agent)
    - US-022 Finance totals by category and month (3, backend-agent)
    - US-023 Export approved claims as CSV with a date range (3, backend-agent)
  - EPIC-008 Notifications and audit trail:
    - US-024 Email notifications on submission and decisions (5, integration-agent)
    - US-025 Audit trail of claim status changes (3, backend-agent)
  - EPIC-009 Setup documentation and deployment assumptions:
    - US-026 Setup and configuration guide (2, devops-agent)
    - US-027 User guide for each role (2, frontend-agent)
- Epics have no points and no assigned role.

**Related:** EPIC-001, EPIC-002, EPIC-003, EPIC-004, EPIC-005, EPIC-006, EPIC-007, EPIC-008, EPIC-009, US-001, US-002, US-003, US-004, US-005, US-006, US-007, US-008, US-009, US-010, US-011, US-012, US-013, US-014, US-015, US-016, US-017, US-018, US-019, US-020, US-021, US-022, US-023, US-024, US-025, US-026, US-027

### DEV-SPRINT-1 · approved · source: plan:Sprint 1

Sprint 1 covers the authentication foundation and Finance user administration. It is the only sprint with delivery records in the run.

- Goal (verbatim): Authentication foundation and Finance user administration: sign-in, sessions, account creation, manager assignment and deactivation.
- Capacity: 20.
- The input does not give an explicit story-to-sprint assignment.
- Stories implied by the goal text: US-001, US-002, US-003, US-005, US-006.
  - Combined points: 19 of 20 capacity.
- All 5 implied stories are reported delivered on commit 78744180d5f14088361f06cb5de24838c5e76729.

**Related:** DEV-PLAN-V1, US-001, US-002, US-003, US-005, US-006

### DEV-SPRINT-2 · approved · source: plan:Sprint 2

Sprint 2 covers password reset by email, Finance-managed categories, and creating and deleting draft claims. No delivery is recorded for this sprint's scope.

- Goal (verbatim): Password reset by email, Finance-managed categories, and creating and deleting draft claims with lines.
- Capacity: 20.
- Stories implied by the goal text (sprint assignment not given explicitly): US-007, US-019, US-008 (with tasks US-008-T1/T2/T3), US-010.
- Delivery status: not reported in the development run input.

**Related:** DEV-PLAN-V1, US-007, US-019, US-008, US-010

### DEV-SPRINT-3 · approved · source: plan:Sprint 3

Sprint 3 covers editing drafts, private S3 receipt uploads, role-based claim visibility and claim submission with routing. No delivery is recorded for this sprint's scope.

- Goal (verbatim): Editing drafts, receipt uploads to private S3, role-based claim visibility and claim submission with routing.
- Capacity: 20.
- Stories implied by the goal text (sprint assignment not given explicitly): US-009, US-011, US-004, US-013.
- Delivery status: not reported in the development run input.

**Related:** DEV-PLAN-V1, US-009, US-011, US-004, US-013

### DEV-SPRINT-4 · approved · source: plan:Sprint 4

Sprint 4 covers two-step approval: secure receipt viewing, audit trail, manager and Finance decisions, and the no-self-approval rule. No delivery is recorded for this sprint's scope.

- Goal (verbatim): Two-step approval: secure receipt viewing, audit trail, manager and Finance decisions, and the no-self-approval rule.
- Capacity: 20.
- Stories implied by the goal text (sprint assignment not given explicitly): US-012, US-025, US-014, US-015, US-017.
- Delivery status: not reported in the development run input.
- See DEV-DECISION-APPROVAL-ROUTING for the clarified routing of Manager and Finance claims.

**Related:** DEV-PLAN-V1, US-012, US-025, US-014, US-015, US-017

### DEV-SPRINT-5 · approved · source: plan:Sprint 5

Sprint 5 completes the workflow: mark paid, rejection and resubmission, over-limit flags, the employee dashboard, CSV export and email notifications. No delivery is recorded for this sprint's scope.

- Goal (verbatim): Completing the workflow: mark paid, rejection and resubmission, over-limit flags, employee dashboard, CSV export and email notifications.
- Capacity: 20.
- Stories implied by the goal text (sprint assignment not given explicitly): US-016, US-018, US-020, US-021, US-023, US-024.
- Delivery status: not reported in the development run input.

**Related:** DEV-PLAN-V1, US-016, US-018, US-020, US-021, US-023, US-024

### DEV-SPRINT-6 · approved · source: plan:Sprint 6

Sprint 6 covers Finance totals reporting and the setup and role-based user documentation. No delivery is recorded for this sprint's scope.

- Goal (verbatim): Finance totals reporting, plus setup and role-based user documentation.
- Capacity: 20.
- Stories implied by the goal text (sprint assignment not given explicitly): US-022, US-026, US-027.
- Delivery status: not reported in the development run input.

**Related:** DEV-PLAN-V1, US-022, US-026, US-027

### DEV-RUN-STATUS · draft · source: dev:run

The development run is reported as 'completed', but only 5 of 27 planned stories have delivery records. This conflict is recorded for human confirmation.

- Run status as reported: completed.
- Tickets with delivery records (5): US-001, US-002, US-003, US-005, US-006.
  - All are status=delivered.
  - All share the single commit 78744180d5f14088361f06cb5de24838c5e76729.
- CONFLICT, recorded with both versions:
  - Version A: the run status says the development run is 'completed'.
  - Version B: the ticket list covers only the Sprint 1 scope. There is no delivery status for 22 stories (US-004, US-007 to US-027) or for tasks US-008-T1/T2/T3.
- Possible readings, neither of which the input confirms:
  - The run covered Sprint 1 only.
  - Other ticket results were omitted from the input.
- Action for a human: confirm which reading is correct before downstream phases treat stories US-004 and US-007 to US-027 as built.

**Related:** DEV-PLAN-V1, US-001, US-002, US-003, US-005, US-006, DEV-UNREPORTED

### DEV-US-001 · draft · source: dev:US-001

The ticket for Finance creating user accounts is reported as delivered. This supports the 'no self sign-up' requirement: Finance creates all accounts.

- Ticket: US-001 Finance creates user accounts.
- Status: delivered.
- Commit: 78744180d5f14088361f06cb5de24838c5e76729.
- Planned: 5 points, backend-agent.
- Context from the project description: there is no self sign-up; Finance creates accounts.
- Implementation details, test results and reviewer approval: not stated in input.

**Related:** US-001, EPIC-001, DEV-SPRINT-1

### DEV-US-002 · draft · source: dev:US-002

The ticket for Finance assigning and changing a user's manager is reported as delivered. Manager assignment determines who performs the first approval step.

- Ticket: US-002 Finance assigns and changes a user's manager.
- Status: delivered.
- Commit: 78744180d5f14088361f06cb5de24838c5e76729.
- Planned: 3 points, backend-agent.
- Context from the project description:
  - Finance assigns each employee a manager.
  - Managers approve their direct reports' claims (US-014, not yet reported delivered).
- Implementation details, test results and reviewer approval: not stated in input.

**Related:** US-002, EPIC-001, DEV-SPRINT-1, US-014

### DEV-US-003 · draft · source: dev:US-003

The ticket for Finance deactivating a user while keeping their history is reported as delivered.

- Ticket: US-003 Finance deactivates a user while keeping history.
- Status: delivered.
- Commit: 78744180d5f14088361f06cb5de24838c5e76729.
- Planned: 3 points, backend-agent.
- Implementation details, test results and reviewer approval: not stated in input.

**Related:** US-003, EPIC-001, DEV-SPRINT-1

### DEV-US-005 · draft · source: dev:US-005

The ticket for signing in with email and password is reported as delivered.

- Ticket: US-005 Sign in with email and password.
- Status: delivered.
- Commit: 78744180d5f14088361f06cb5de24838c5e76729.
- Planned: 5 points, backend-agent.
- Implementation details, test results and reviewer approval: not stated in input.

**Related:** US-005, EPIC-002, DEV-SPRINT-1

### DEV-US-006 · draft · source: dev:US-006

The ticket for session expiry and sign-out ending the session is reported as delivered.

- Ticket: US-006 Sessions expire and sign-out ends the session.
- Status: delivered.
- Commit: 78744180d5f14088361f06cb5de24838c5e76729.
- Planned: 3 points, backend-agent.
- Session timeout value, implementation details and test results: not stated in input.

**Related:** US-006, EPIC-002, DEV-SPRINT-1

### DEV-UNREPORTED · draft · source: dev:run

22 planned stories, and the 3 tasks under US-008, have no delivery record in the development run input. Their build status is unknown and must not be assumed.

- Stories with no reported ticket status:
  - US-004, US-007, US-008, US-009, US-010, US-011, US-012, US-013, US-014, US-015, US-016, US-017, US-018, US-019, US-020, US-021, US-022, US-023, US-024, US-025, US-026, US-027.
- Tasks with no reported status: US-008-T1, US-008-T2, US-008-T3.
- Unconfirmed functionality includes:
  - password reset;
  - claims and lines;
  - receipts;
  - submission and both approval steps;
  - the no-self-approval rule;
  - categories and limits;
  - dashboard, totals and CSV export;
  - notifications;
  - audit trail;
  - setup and user documentation.
- Because of this gap, no end-user guide content is documented for these features.

**Related:** US-004, US-007, US-008, US-009, US-010, US-011, US-012, US-013, US-014, US-015, US-016, US-017, US-018, US-019, US-020, US-021, US-022, US-023, US-024, US-025, US-026, US-027, DEV-RUN-STATUS

### DEV-DECISION-APPROVAL-ROUTING · draft · source: clarification:approval-routing

Stakeholder clarification: claims submitted by Managers or Finance users go to the submitter's assigned manager, then to Finance. This keeps the 'nobody approves their own claim' rule. Its implementation is not yet reported delivered.

- Question: Managers and Finance staff also incur expenses. Who should approve a claim submitted by a Manager or a Finance user, given nobody can approve their own claim?
- Answer as given: Assigned manager, then Finance.
- Implication for the build:
  - Manager and Finance users follow the same two-step route as employees: assigned manager first, then Finance.
  - This relies on Finance assigning a manager to every user (US-002, delivered).
- Not stated in input:
  - who gave the answer, or when;
  - how a Finance user's own claim is handled at the Finance step (another Finance user is implied by US-017 but not confirmed);
  - whether US-013, US-014, US-015 or US-017 implement this, since none is reported delivered.

**Related:** US-014, US-015, US-017, US-002, US-013
<!-- sdlc:auto:end narrative -->
