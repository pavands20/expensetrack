# Development

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start narrative -->
### DEV-US-022 · draft · source: dev:US-022

Ticket US-022 delivered the Finance view of claim totals by category and month. The development run marks it delivered in commit a497d1005907ab9aa836fb8a80a2debceb410383.

- Ticket: US-022, Finance totals by category and month.
- Input status: delivered. This is recorded here as 'draft' because the input gives no review or approval record.
- Commit: a497d1005907ab9aa836fb8a80a2debceb410383 (shared with US-026 and US-027).
- Requirement context from the project description: Finance sees totals by category and month on the dashboard.
- Related capability not covered by this ticket: Finance's CSV export of approved claims. Its delivery is not stated in this run.
- Not provided in input: delivery date, developer, implementation approach, aggregation rules (e.g. which claim statuses count toward totals), test results.

**Related:** US-022

### DEV-US-026 · draft · source: dev:US-026

Ticket US-026 delivered the setup and configuration guide for ExpenseTrack. The development run marks it delivered in commit a497d1005907ab9aa836fb8a80a2debceb410383.

- Ticket: US-026, Setup and configuration guide.
- Input status: delivered. This is recorded here as 'draft' because the input gives no review or approval record.
- Commit: a497d1005907ab9aa836fb8a80a2debceb410383 (shared with US-022 and US-027).
- Stated stack context: React, FastAPI, PostgreSQL, S3 for receipts, hosted on AWS.
- Credentials in any setup material should appear only as placeholders, e.g. <database-password>, <your-api-key>.
- Not provided in input: guide contents, configuration steps, environment variables, delivery date, author.

**Related:** US-026

### DEV-US-027 · draft · source: dev:US-027

Ticket US-027 delivered a user guide for each role (Employee, Manager, Finance). The development run marks it delivered in commit a497d1005907ab9aa836fb8a80a2debceb410383.

- Ticket: US-027, User guide for each role.
- Input status: delivered. This is recorded here as 'draft' because the input gives no review or approval record.
- Commit: a497d1005907ab9aa836fb8a80a2debceb410383 (shared with US-022 and US-026).
- Roles per the project description: Employee, Manager, Finance.
- Clarified rule that the role guides should reflect: a claim submitted by a Manager or a Finance user is approved first by that user's assigned manager, then by Finance. Nobody approves their own claim.
- Not provided in input: whether the delivered guide covers this clarified rule, guide contents, delivery date, author.

**Related:** US-027
<!-- sdlc:auto:end narrative -->
