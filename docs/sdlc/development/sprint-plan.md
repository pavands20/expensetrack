# Sprint Plan

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start sprints -->
## Sprint 1: Sprint 1

Authentication foundation and Finance user administration: sign-in, sessions, account creation, manager assignment and deactivation

Capacity: 20 points · Committed: 19

| Key | Type | Title | Points | Role | Depends on |
|---|---|---|---|---|---|
| US-001 | Story | Finance creates user accounts | 5 | backend-agent | US-005 |
| US-002 | Story | Finance assigns and changes a user's manager | 3 | backend-agent | US-001 |
| US-003 | Story | Finance deactivates a user while keeping history | 3 | backend-agent | US-001, US-006 |
| US-005 | Story | Sign in with email and password | 5 | backend-agent | — |
| US-006 | Story | Sessions expire and sign-out ends the session | 3 | backend-agent | US-005 |

## Sprint 2: Sprint 2

Password reset by email, Finance-managed categories, and creating and deleting draft claims with lines

Capacity: 20 points · Committed: 20

| Key | Type | Title | Points | Role | Depends on |
|---|---|---|---|---|---|
| US-007 | Story | Reset a forgotten password by email | 5 | backend-agent | US-005, US-006 |
| US-008 | Story | Create a draft claim with lines | 8 | backend-agent | US-005, US-019 |
| ↳ US-008-T1 | Task | Add claims and claim_lines migration | — | backend-agent | — |
| ↳ US-008-T2 | Task | Implement claim and line creation endpoints | — | backend-agent | — |
| ↳ US-008-T3 | Task | Build the claim form with lines and total | — | frontend-agent | — |
| US-010 | Story | Delete a draft claim | 2 | backend-agent | US-008 |
| US-019 | Story | Finance manages categories and limits | 5 | backend-agent | US-001 |

## Sprint 3: Sprint 3

Editing drafts, receipt uploads to private S3, role-based claim visibility and claim submission with routing

Capacity: 20 points · Committed: 18

| Key | Type | Title | Points | Role | Depends on |
|---|---|---|---|---|---|
| US-004 | Story | Role-based visibility of claims | 5 | security-agent | US-002, US-008 |
| US-009 | Story | Edit a draft claim | 3 | backend-agent | US-008 |
| US-011 | Story | Upload a receipt to a claim line | 5 | integration-agent | US-008 |
| US-013 | Story | Submit a claim and lock it | 5 | backend-agent | US-011, US-002 |

## Sprint 4: Sprint 4

Two-step approval: secure receipt viewing, audit trail, manager and Finance decisions, and the no-self-approval rule

Capacity: 20 points · Committed: 19

| Key | Type | Title | Points | Role | Depends on |
|---|---|---|---|---|---|
| US-012 | Story | View receipts through short-lived private links | 3 | integration-agent | US-011, US-004 |
| US-014 | Story | Manager approves or rejects direct reports' claims | 5 | backend-agent | US-013, US-004 |
| US-015 | Story | Finance approves or rejects manager-approved claims | 5 | backend-agent | US-014 |
| US-017 | Story | Nobody approves their own claim | 3 | security-agent | US-014, US-015 |
| US-025 | Story | Audit trail of claim status changes | 3 | backend-agent | US-013, US-004 |

## Sprint 5: Sprint 5

Completing the workflow: mark paid, rejection and resubmission, over-limit flags, employee dashboard, CSV export and email notifications

Capacity: 20 points · Committed: 19

| Key | Type | Title | Points | Role | Depends on |
|---|---|---|---|---|---|
| US-016 | Story | Mark an approved claim as paid | 2 | backend-agent | US-015, US-017 |
| US-018 | Story | Rejected claim returns to the employee to fix and resubmit | 3 | backend-agent | US-014, US-015, US-025 |
| US-020 | Story | Flag over-limit lines for approvers | 3 | frontend-agent | US-019, US-014, US-015 |
| US-021 | Story | Employee dashboard of own claims by status | 3 | frontend-agent | US-013, US-018 |
| US-023 | Story | Export approved claims as CSV with a date range | 3 | backend-agent | US-015, US-025 |
| US-024 | Story | Email notifications on submission and decisions | 5 | integration-agent | US-007, US-013, US-014, US-015, US-016 |

## Sprint 6: Sprint 6

Finance totals reporting, plus setup and role-based user documentation

Capacity: 20 points · Committed: 7

| Key | Type | Title | Points | Role | Depends on |
|---|---|---|---|---|---|
| US-022 | Story | Finance totals by category and month | 3 | backend-agent | US-016 |
| US-026 | Story | Setup and configuration guide | 2 | devops-agent | US-001, US-019, US-011, US-024 |
| US-027 | Story | User guide for each role | 2 | frontend-agent | US-017, US-018, US-023 |

## Unscheduled

_Nothing unscheduled._
<!-- sdlc:auto:end sprints -->
