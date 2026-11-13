# ExpenseTrack — SDLC Documentation

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start overview -->
ExpenseTrack handles employee expense claims for a 5–50 person company. Roles: Employee, Manager, Finance. No self sign-up — Finance creates accounts and assigns each employee a manager. Sign-in: email and password, sign-out, and password reset by email. Claims: an employee creates a claim with one or more lines (date, category, amount in GBP, description), attaches a receipt image or PDF per line (up to 5 MB), and submits it. A draft can be edited; a submitted claim cannot. Approval: a manager approves or rejects their direct reports' submitted claims with a comment. Finance then approves or rejects manager-approved claims and marks approved ones paid. Nobody can approve their own claim. Categories: Finance manages categories (Travel, Meals, Equipment, Other), each with an optional per-line limit. Lines over the limit are flagged for the approver. Dashboard: employees see their claims by status. Finance sees totals by category and month, and can export approved claims as CSV. Out of scope: currency conversion, mileage, card feeds, accounting integrations. Stack: React, FastAPI, PostgreSQL, S3 for receipts, on AWS. English only,

Managers and Finance staff also incur expenses. Who should approve a claim submitted by a Manager, or by a Finance user, given nobody can approve their own claim?

Assigned manager, then Finance

**Documentation version:** v22
<!-- sdlc:auto:end overview -->

## Contents

<!-- sdlc:auto:start contents -->
| Document | State |
|---|---|
| [Requirements](requirements/README.md) | v1 approved |
| [Architecture](architecture/README.md) | 31 entries |
| [Planning](planning/README.md) | 0 entries |
| [Development](development/README.md) | 6 entries |
| [Testing](testing/README.md) | 3 entries |
| [Deployment](deployment/README.md) | 1 entry |
| [Maintenance](maintenance/README.md) | 0 entries |
| [Data model](architecture/data-model.md) | generated |
| [API (OpenAPI)](architecture/api/openapi.yaml) | generated |
| [Decisions (ADRs)](architecture/adr/README.md) | 6 decisions |
| [Sprint plan](development/sprint-plan.md) | 6 sprints |
| [Developer guide](development/developer-guide.md) | generated |
| [API reference](development/api-reference.md) | 28 routes |
| [Test report](testing/test-report.md) | no_tests |
| [Tests](testing/test-cases.md) | 303 tests |
| [Deployment guide](deployment/deployment-guide.md) | deployed |
| [Runbook](deployment/runbook.md) | deployed |
| [Release notes](deployment/release-notes.md) | 6 releases |
| [Traceability matrix](traceability-matrix.md) | 27 requirements |
| [Changelog](CHANGELOG.md) | 22 versions |
<!-- sdlc:auto:end contents -->
