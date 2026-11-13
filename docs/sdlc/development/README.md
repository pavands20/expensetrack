# Development

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start narrative -->
### US-016 · draft · source: dev:US-016

Ticket US-016, 'Mark an approved claim as paid', is recorded as delivered in commit 76c2fdc. This is the final payment step in the claim workflow.

- Ticket: US-016, 'Mark an approved claim as paid'
- Development status (as given): delivered
- Commit: 76c2fdc2c6f34f1bfcbf507a762e2c94099d87a5. No other ticket in this run references this commit.
- Requirement context (project description, not confirmed as implemented detail): Finance approves or rejects manager-approved claims and marks approved ones paid.
- Not stated in input: date, developer, reviewer, test results.

### US-018 · draft · source: dev:US-018

Ticket US-018, 'Rejected claim returns to the employee to fix and resubmit', is recorded as delivered. It shares commit c25d46e with US-020.

- Ticket: US-018, 'Rejected claim returns to the employee to fix and resubmit'
- Development status (as given): delivered
- Commit: c25d46e099e421c74f348e17f95d1fbc078def7b. The same commit is listed for US-020.
- Requirement context (project description):
  - A manager or Finance user can reject a claim with a comment.
  - A draft claim can be edited; a submitted claim cannot.
  - The input does not say how a rejected claim becomes editable again. That is not documented here.
- Not stated in input: date, developer, reviewer, test results.

**Related:** US-020

### US-020 · draft · source: dev:US-020

Ticket US-020, 'Flag over-limit lines for approvers', is recorded as delivered. It shares commit c25d46e with US-018.

- Ticket: US-020, 'Flag over-limit lines for approvers'
- Development status (as given): delivered
- Commit: c25d46e099e421c74f348e17f95d1fbc078def7b. The same commit is listed for US-018.
- Requirement context (project description):
  - Finance manages categories (Travel, Meals, Equipment, Other), each with an optional per-line limit.
  - Lines over the limit are flagged for the approver.
- Not stated in input: date, developer, reviewer, test results. The input also has no ticket for category management itself.

**Related:** US-018

### US-021 · draft · source: dev:US-021

Ticket US-021, 'Employee dashboard of own claims by status', is recorded as delivered. It shares commit 51da9ee with US-023 and US-024.

- Ticket: US-021, 'Employee dashboard of own claims by status'
- Development status (as given): delivered
- Commit: 51da9ee548605c7e18364e22d769bbe19f05d3c3. The same commit is listed for US-023 and US-024.
- Requirement context (project description): employees see their claims by status on the dashboard.
- Not stated in input: date, developer, reviewer, test results.

**Related:** US-023, US-024

### US-023 · draft · source: dev:US-023

Ticket US-023, 'Export approved claims as CSV with a date range', is recorded as delivered. It shares commit 51da9ee with US-021 and US-024.

- Ticket: US-023, 'Export approved claims as CSV with a date range'
- Development status (as given): delivered
- Commit: 51da9ee548605c7e18364e22d769bbe19f05d3c3. The same commit is listed for US-021 and US-024.
- Requirement context (project description): Finance can export approved claims as CSV.
- The ticket title adds a date-range filter, which the project description does not mention. The ticket title is the source for that detail.
- Not stated in input: CSV columns, date, developer, reviewer, test results.

**Related:** US-021, US-024

### US-024 · draft · source: dev:US-024

Ticket US-024, 'Email notifications on submission and decisions', is recorded as delivered. It shares commit 51da9ee with US-021 and US-023.

- Ticket: US-024, 'Email notifications on submission and decisions'
- Development status (as given): delivered
- Commit: 51da9ee548605c7e18364e22d769bbe19f05d3c3. The same commit is listed for US-021 and US-023.
- Requirement context: the project description only mentions email for password reset. Notifications on claim submission and on approval or rejection come from this ticket's title.
- Approval routing confirmed in project clarification: claims from Managers and Finance users go to their assigned manager first, then to Finance. Nobody approves their own claim.
- Not stated in input: recipients, email content, date, developer, reviewer, test results.

**Related:** US-021, US-023
<!-- sdlc:auto:end narrative -->
