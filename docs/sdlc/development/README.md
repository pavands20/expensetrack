# Development

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start narrative -->
### DEV-PLAN-V1 · approved · source: plan:v1

The ExpenseTrack development plan, version 1, is approved. It has 6 sprints of capacity 20 each, 9 epics and 27 stories (US-001 to US-027) totalling 102 story points.

- Plan status: approved, version 1.
- Approver and approval date: not stated in the input.
- Sprints: 6, each with capacity 20 (total 120).
- Story points: 102 across 27 stories. Epics carry no points.
- Tasks: only US-008 is broken down (US-008-T1, T2, T3). Tasks have no points.
- Stories per agent role:
  - backend-agent: US-001, 002, 003, 005, 006, 007, 008, 009, 010, 013, 014, 015, 016, 018, 019, 022, 023, 025
  - security-agent: US-004, US-017
  - integration-agent: US-011, US-012, US-024
  - frontend-agent: US-020, US-021, US-027 (plus task US-008-T3)
  - devops-agent: US-026
- Epics are unassigned.
- Stack (from project description): React, FastAPI, PostgreSQL, S3 for receipts, AWS. English only.
- Out of scope (from project description): currency conversion, mileage, card feeds, accounting integrations.

**Related:** EPIC-001, EPIC-002, EPIC-003, EPIC-004, EPIC-005, EPIC-006, EPIC-007, EPIC-008, EPIC-009, DEV-SPRINT-1, DEV-SPRINT-2, DEV-SPRINT-3, DEV-SPRINT-4, DEV-SPRINT-5, DEV-SPRINT-6

### DEV-STATUS · draft

No development execution data was provided. No story, task or sprint is recorded as started, completed, tested or merged.

- The development input contains only the approved plan.
- None of the following were provided:
  - ticket status or completed items
  - commits or pull requests
  - build results or test results
  - velocity or sprint dates
- Implementation progress, acceptance status and actual dates are therefore left undocumented. Nothing is inferred.
- user_guide is deferred until development results confirm what was built.

**Related:** DEV-PLAN-V1

### DEC-APPROVAL-ROUTING · approved · source: clarification:approval-routing

Claims submitted by a Manager or a Finance user are approved by that person's assigned manager first, then by Finance. This follows the same two-step path as Employee claims.

- Question asked: who approves a claim submitted by a Manager or a Finance user, given that nobody can approve their own claim?
- Answer given: "Assigned manager, then Finance."
- Basis: Finance assigns each user a manager (US-002), so every role has a first-step approver.
- This applies the manager step (US-014) and the Finance step (US-015) to all roles.
- Who approved this answer, and when, is not stated.

**Related:** US-002, US-014, US-015, US-017

### OPEN-APPROVAL-EDGE-CASES · draft · source: clarification:approval-routing

Two edge cases of the approval-routing decision are not addressed by the input. Both need a human answer before US-015 and US-017 are implemented.

1. Finance user's own claim:
   - US-017 forbids self-approval.
   - So the Finance step on a Finance user's claim must be done by a different Finance user.
   - The input does not say what happens if the company has only one Finance user.
2. User with no manager:
   - The input does not say whether every user (e.g. the most senior person) must have an assigned manager.
   - It does not say who does the first step if a user has none.
- These are open questions only. No resolution is implied.

**Related:** DEC-APPROVAL-ROUTING, US-015, US-017, US-002

### DEV-SPRINT-1 · approved · source: plan:SPRINT-1

Sprint 1 covers the authentication foundation and Finance user administration.

- Goal: Authentication foundation and Finance user administration: sign-in, sessions, account creation, manager assignment and deactivation.
- Capacity: 20.
- Stories, inferred from the goal wording (the plan does not list sprint assignments explicitly):
  - US-005 Sign in with email and password (5)
  - US-006 Sessions expire and sign-out ends the session (3)
  - US-001 Finance creates user accounts (5)
  - US-002 Finance assigns and changes a user's manager (3)
  - US-003 Finance deactivates a user while keeping history (3)
- Inferred load: 19 of 20.

**Related:** US-001, US-002, US-003, US-005, US-006, EPIC-001, EPIC-002

### DEV-SPRINT-2 · approved · source: plan:SPRINT-2

Sprint 2 covers password reset, Finance-managed categories, and creating and deleting draft claims.

- Goal: Password reset by email, Finance-managed categories, and creating and deleting draft claims with lines.
- Capacity: 20.
- Stories, inferred from the goal wording:
  - US-007 Reset a forgotten password by email (5)
  - US-019 Finance manages categories and limits (5)
  - US-008 Create a draft claim with lines (8)
  - US-010 Delete a draft claim (2)
- Inferred load: 20 of 20 (at full capacity).
- Categories (US-019) are scheduled in the same sprint as claim lines (US-008), which reference them.

**Related:** US-007, US-019, US-008, US-010, EPIC-002, EPIC-003, EPIC-006

### DEV-SPRINT-3 · approved · source: plan:SPRINT-3

Sprint 3 covers draft editing, receipt uploads to private S3, role-based claim visibility, and claim submission with routing.

- Goal: Editing drafts, receipt uploads to private S3, role-based claim visibility and claim submission with routing.
- Capacity: 20.
- Stories, inferred from the goal wording:
  - US-009 Edit a draft claim (3)
  - US-011 Upload a receipt to a claim line (5)
  - US-004 Role-based visibility of claims (5)
  - US-013 Submit a claim and lock it (5)
- Inferred load: 18 of 20.
- Receipt size limit, from the project description: up to 5 MB, image or PDF, one per line.

**Related:** US-009, US-011, US-004, US-013, EPIC-001, EPIC-003, EPIC-004, EPIC-005

### DEV-SPRINT-4 · approved · source: plan:SPRINT-4

Sprint 4 covers two-step approval: secure receipt viewing, the audit trail, manager and Finance decisions, and the no-self-approval rule.

- Goal: Two-step approval: secure receipt viewing, audit trail, manager and Finance decisions, and the no-self-approval rule.
- Capacity: 20.
- Stories, inferred from the goal wording:
  - US-012 View receipts through short-lived private links (3)
  - US-025 Audit trail of claim status changes (3)
  - US-014 Manager approves or rejects direct reports' claims (5)
  - US-015 Finance approves or rejects manager-approved claims (5)
  - US-017 Nobody approves their own claim (3)
- Inferred load: 19 of 20.
- The routing for Manager and Finance submitters (DEC-APPROVAL-ROUTING) applies here.

**Related:** US-012, US-025, US-014, US-015, US-017, EPIC-004, EPIC-005, EPIC-008, DEC-APPROVAL-ROUTING

### DEV-SPRINT-5 · approved · source: plan:SPRINT-5

Sprint 5 completes the workflow: mark paid, rejection and resubmission, over-limit flags, the employee dashboard, CSV export and email notifications.

- Goal: Completing the workflow: mark paid, rejection and resubmission, over-limit flags, employee dashboard, CSV export and email notifications.
- Capacity: 20.
- Stories, inferred from the goal wording:
  - US-016 Mark an approved claim as paid (2)
  - US-018 Rejected claim returns to the employee to fix and resubmit (3)
  - US-020 Flag over-limit lines for approvers (3)
  - US-021 Employee dashboard of own claims by status (3)
  - US-023 Export approved claims as CSV with a date range (3)
  - US-024 Email notifications on submission and decisions (5)
- Inferred load: 19 of 20.

**Related:** US-016, US-018, US-020, US-021, US-023, US-024, EPIC-005, EPIC-006, EPIC-007, EPIC-008

### DEV-SPRINT-6 · approved · source: plan:SPRINT-6

Sprint 6 covers Finance totals reporting, the setup guide and the role-based user guide.

- Goal: Finance totals reporting, plus setup and role-based user documentation.
- Capacity: 20.
- Stories, inferred from the goal wording:
  - US-022 Finance totals by category and month (3)
  - US-026 Setup and configuration guide (2)
  - US-027 User guide for each role (2)
- Inferred load: 7 of 20. This leaves spare capacity; the plan does not state its intended use.

**Related:** US-022, US-026, US-027, EPIC-007, EPIC-009

### EPIC-001 · approved · source: plan:EPIC-001

Accounts, roles and access: Finance-administered accounts, manager assignment, deactivation and role-based claim visibility.

- US-001 Finance creates user accounts: 5 pts, backend-agent
- US-002 Finance assigns and changes a user's manager: 3 pts, backend-agent
- US-003 Finance deactivates a user while keeping history: 3 pts, backend-agent
- US-004 Role-based visibility of claims: 5 pts, security-agent
- Epic total: 16 pts. Epic owner: unassigned.
- From the project description: no self sign-up. Roles are Employee, Manager and Finance.

**Related:** US-001, US-002, US-003, US-004

### EPIC-002 · approved · source: plan:EPIC-002

Sign-in, sign-out and password reset.

- US-005 Sign in with email and password: 5 pts, backend-agent
- US-006 Sessions expire and sign-out ends the session: 3 pts, backend-agent
- US-007 Reset a forgotten password by email: 5 pts, backend-agent
- Epic total: 13 pts. Epic owner: unassigned.

**Related:** US-005, US-006, US-007

### EPIC-003 · approved · source: plan:EPIC-003

Creating and editing claims: draft claims with lines, editing drafts and deleting drafts.

- US-008 Create a draft claim with lines: 8 pts, backend-agent
- US-009 Edit a draft claim: 3 pts, backend-agent
- US-010 Delete a draft claim: 2 pts, backend-agent
- Epic total: 13 pts. Epic owner: unassigned.
- Line fields, from the project description: date, category, amount in GBP, description.
- Only drafts are editable.

**Related:** US-008, US-008-T1, US-008-T2, US-008-T3, US-009, US-010

### US-008-TASKS · approved · source: plan:US-008

US-008 is the only story broken into tasks: a database migration, the API endpoints and the frontend claim form.

- US-008-T1 Add claims and claim_lines migration: backend-agent
- US-008-T2 Implement claim and line creation endpoints: backend-agent
- US-008-T3 Build the claim form with lines and total: frontend-agent
- Tasks carry no points.
- No task completion status was provided.

**Related:** US-008, US-008-T1, US-008-T2, US-008-T3, EPIC-003

### EPIC-004 · approved · source: plan:EPIC-004

Receipts: uploading per-line receipts to private S3 and viewing them through short-lived private links.

- US-011 Upload a receipt to a claim line: 5 pts, integration-agent
- US-012 View receipts through short-lived private links: 3 pts, integration-agent
- Epic total: 8 pts. Epic owner: unassigned.
- Constraints from the project description: image or PDF, up to 5 MB, stored in S3.

**Related:** US-011, US-012

### EPIC-005 · approved · source: plan:EPIC-005

Submission and two-step approval: submit and lock, manager decision, Finance decision, mark paid, no self-approval, and rejection with resubmission.

- US-013 Submit a claim and lock it: 5 pts, backend-agent
- US-014 Manager approves or rejects direct reports' claims: 5 pts, backend-agent
- US-015 Finance approves or rejects manager-approved claims: 5 pts, backend-agent
- US-016 Mark an approved claim as paid: 2 pts, backend-agent
- US-017 Nobody approves their own claim: 3 pts, security-agent
- US-018 Rejected claim returns to the employee to fix and resubmit: 3 pts, backend-agent
- Epic total: 23 pts. Epic owner: unassigned.
- Approval decisions include a comment (project description).
- Manager and Finance submitters follow DEC-APPROVAL-ROUTING.

**Related:** US-013, US-014, US-015, US-016, US-017, US-018, DEC-APPROVAL-ROUTING

### EPIC-006 · approved · source: plan:EPIC-006

Categories and per-line limits, managed by Finance, with over-limit lines flagged for approvers.

- US-019 Finance manages categories and limits: 5 pts, backend-agent
- US-020 Flag over-limit lines for approvers: 3 pts, frontend-agent
- Epic total: 8 pts. Epic owner: unassigned.
- Categories from the project description: Travel, Meals, Equipment, Other. Each has an optional per-line limit.
- Note: US-020 is assigned only to frontend-agent. The plan does not say where the over-limit check is evaluated.

**Related:** US-019, US-020

### EPIC-007 · approved · source: plan:EPIC-007

Dashboard, reporting and CSV export.

- US-021 Employee dashboard of own claims by status: 3 pts, frontend-agent
- US-022 Finance totals by category and month: 3 pts, backend-agent
- US-023 Export approved claims as CSV with a date range: 3 pts, backend-agent
- Epic total: 9 pts. Epic owner: unassigned.

**Related:** US-021, US-022, US-023

### EPIC-008 · approved · source: plan:EPIC-008

Notifications and audit trail: emails on submission and decisions, and an audit trail of claim status changes.

- US-024 Email notifications on submission and decisions: 5 pts, integration-agent
- US-025 Audit trail of claim status changes: 3 pts, backend-agent
- Epic total: 8 pts. Epic owner: unassigned.

**Related:** US-024, US-025

### EPIC-009 · approved · source: plan:EPIC-009

Setup documentation and deployment assumptions: a setup and configuration guide and a user guide for each role.

- US-026 Setup and configuration guide: 2 pts, devops-agent
- US-027 User guide for each role: 2 pts, frontend-agent
- Epic total: 4 pts. Epic owner: unassigned.
- Deployment assumptions themselves are not described in the input.

**Related:** US-026, US-027
<!-- sdlc:auto:end narrative -->
