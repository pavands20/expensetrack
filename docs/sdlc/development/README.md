# Development

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start narrative -->
### US-012 · draft · source: dev:US-012

Receipts are viewed through short-lived private links. The ticket was delivered in its own commit.

- Ticket: US-012, View receipts through short-lived private links
- Input status: delivered
- Commit: 3b7a09d814f228f23d5dcd6bd5715e92b0edfd62
- Context from project description: receipts are images or PDFs up to 5 MB, one per claim line, stored in S3.
- Not stated in input: link expiry duration, implementation approach, delivery date, author, reviewer.

**Related:** US-012

### US-014 · draft · source: dev:US-014

Managers can approve or reject submitted claims from their direct reports, with a comment. The ticket was delivered in the same commit as the rest of the approval chain.

- Ticket: US-014, Manager approves or rejects direct reports' claims
- Input status: delivered
- Commit: 9efab7c4cca00d09dc4ca19037e84d27cc6993bb (shared with US-015, US-017, US-025)
- Context from project description: a manager acts on submitted claims from direct reports and adds a comment. A manager-approved claim then goes to Finance.
- Clarification: a claim submitted by a Manager or a Finance user is approved first by that person's assigned manager, then by Finance.
- Not stated in input: delivery date, author, reviewer, implementation specifics.

**Related:** US-014, US-015, US-017, US-025

### US-015 · draft · source: dev:US-015

Finance can approve or reject claims that a manager has already approved. The ticket was delivered in the shared approval-chain commit.

- Ticket: US-015, Finance approves or rejects manager-approved claims
- Input status: delivered
- Commit: 9efab7c4cca00d09dc4ca19037e84d27cc6993bb (shared with US-014, US-017, US-025)
- Context from project description: Finance acts only after manager approval, and Finance marks approved claims as paid.
- Not in this ticket's title: 'mark paid'. The development input does not say whether it was delivered under this ticket or another one.
- Not stated in input: delivery date, author, reviewer, implementation specifics.

**Related:** US-015, US-014, US-017, US-025

### US-017 · draft · source: dev:US-017

The approval chain enforces that nobody can approve their own claim. The ticket was delivered in the shared approval-chain commit.

- Ticket: US-017, Nobody approves their own claim
- Input status: delivered
- Commit: 9efab7c4cca00d09dc4ca19037e84d27cc6993bb (shared with US-014, US-015, US-025)
- Clarification: claims from Managers and Finance users go to the claimant's assigned manager, then to Finance.
- Not stated in input:
  - how the Finance stage is handled when the claimant is a Finance user (for example, whether a different Finance user must act);
  - how the rule is enforced in code;
  - delivery date, author, reviewer.

**Related:** US-017, US-014, US-015

### US-025 · draft · source: dev:US-025

Claim status changes are recorded in an audit trail. The ticket was delivered in the shared approval-chain commit.

- Ticket: US-025, Audit trail of claim status changes
- Input status: delivered
- Commit: 9efab7c4cca00d09dc4ca19037e84d27cc6993bb (shared with US-014, US-015, US-017)
- Not stated in input:
  - which fields are captured (actor, timestamp, comment, previous and new status);
  - retention period;
  - who can view the trail;
  - delivery date, author, reviewer.

**Related:** US-025, US-014, US-015
<!-- sdlc:auto:end narrative -->
