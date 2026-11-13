# Development

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start narrative -->
### DEV-US-022 · draft · source: dev:US-022

Ticket US-022 delivers the Finance view of claim totals by category and month. It is marked delivered in the completed development run, in commit a497d1005907ab9aa836fb8a80a2debceb410383.

- Ticket: US-022, Finance totals by category and month.
- Reported status: delivered.
- Commit: a497d1005907ab9aa836fb8a80a2debceb410383 (shared with US-026 and US-027).
- Development run status: completed.
- Intended behaviour (project description): Finance sees expense totals broken down by category and by month on their dashboard.
- Lifecycle status is set to 'draft' because 'delivered' does not map to a schema status, and the input records no approval or sign-off.
- Not stated in the input: implementation approach, developer, delivery date, test outcome.
- Related but not in this run: the CSV export of approved claims and the employee claims-by-status dashboard. The input gives no delivery status for these.

**Related:** US-022, US-027

### DEV-US-026 · draft · source: dev:US-026

Ticket US-026 delivers the setup and configuration guide for ExpenseTrack. It is marked delivered in the completed development run, in commit a497d1005907ab9aa836fb8a80a2debceb410383.

- Ticket: US-026, Setup and configuration guide.
- Reported status: delivered.
- Commit: a497d1005907ab9aa836fb8a80a2debceb410383 (shared with US-022 and US-027).
- Development run status: completed.
- Project context: React frontend, FastAPI backend, PostgreSQL database and S3 for receipt storage, all on AWS. English only.
- Lifecycle status is set to 'draft' because 'delivered' does not map to a schema status, and the input records no approval or sign-off.
- Not stated in the input: the guide's contents, sections or configuration values. None are inferred here.
- Any credentials referenced by the guide should appear only as placeholders, e.g. <database-password>, <aws-secret-access-key>.

**Related:** US-026

### DEV-US-027 · draft · source: dev:US-027

Ticket US-027 delivers a user guide for each role: Employee, Manager and Finance. It is marked delivered in the completed development run, in commit a497d1005907ab9aa836fb8a80a2debceb410383.

- Ticket: US-027, User guide for each role.
- Reported status: delivered.
- Commit: a497d1005907ab9aa836fb8a80a2debceb410383 (shared with US-022 and US-026).
- Development run status: completed.
- Roles defined by the project: Employee, Manager, Finance. There is no self sign-up; Finance creates accounts and assigns each employee a manager.
- Clarified rule the guides need to reflect: a claim submitted by a Manager or a Finance user goes first to that person's assigned manager, then to Finance. Nobody can approve their own claim.
- Lifecycle status is set to 'draft' because 'delivered' does not map to a schema status, and the input records no approval or sign-off.
- Not stated in the input: the guide contents, or whether they cover the clarified approval rule. This is not assumed.

**Related:** US-027, US-022
<!-- sdlc:auto:end narrative -->
