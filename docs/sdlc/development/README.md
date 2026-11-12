# Development

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start narrative -->
### US-004 · draft · source: dev:US-004

Role-based visibility of claims was delivered. Which claims a user can see depends on their role (Employee, Manager or Finance). This ticket shares its commit with US-011 and US-013.

- Ticket: US-004, Role-based visibility of claims
- Reported status: delivered. The schema has no 'delivered' value, so the entry status is draft. No approval was given in the input.
- Commit: e2328c037827923a581c43fe5c162dfabb047f0f
- Shared commit: the same hash is reported for US-011 and US-013.
- Project context: roles are Employee, Manager and Finance. Managers act on their direct reports' claims. Finance acts on manager-approved claims.
- Not provided: implementation details, delivery date, author, review or approval.

**Related:** US-004

### US-009 · draft · source: dev:US-009

Editing a draft claim was delivered. An employee can change a claim while it is still a draft. This is the only ticket in this run with its own separate commit.

- Ticket: US-009, Edit a draft claim
- Reported status: delivered. The schema has no 'delivered' value, so the entry status is draft. No approval was given in the input.
- Commit: 4148e297e4709acc5e2e3220da2c771164169225
- Project context: a draft claim can be edited, but a submitted claim cannot.
- Linked to US-013, which locks a claim on submission.
- Not provided: implementation details, delivery date, author, review or approval.

**Related:** US-009, US-013

### US-011 · draft · source: dev:US-011

Uploading a receipt to a claim line was delivered. The project specification allows one receipt per line, as an image or PDF of up to 5 MB. This ticket shares its commit with US-004 and US-013.

- Ticket: US-011, Upload a receipt to a claim line
- Reported status: delivered. The schema has no 'delivered' value, so the entry status is draft. No approval was given in the input.
- Commit: e2328c037827923a581c43fe5c162dfabb047f0f
- Shared commit: the same hash is reported for US-004 and US-013.
- Project context:
  - Each claim line has a receipt image or PDF.
  - The maximum file size is 5 MB.
  - Receipts are stored in S3 on AWS.
- Not confirmed in the input: whether the 5 MB limit and file-type restrictions are enforced in the delivered code.
- Not provided: implementation details, delivery date, author, review or approval.

**Related:** US-011

### US-013 · draft · source: dev:US-013

Submitting a claim and locking it was delivered. Once submitted, a claim can no longer be edited. This ticket shares its commit with US-004 and US-011.

- Ticket: US-013, Submit a claim and lock it
- Reported status: delivered. The schema has no 'delivered' value, so the entry status is draft. No approval was given in the input.
- Commit: e2328c037827923a581c43fe5c162dfabb047f0f
- Shared commit: the same hash is reported for US-004 and US-011.
- Project context:
  - A submitted claim cannot be edited. This complements US-009, which allows editing drafts.
  - Submission starts the approval flow: the manager reviews first, then Finance.
  - Per the project clarification, claims from Managers and Finance users go to their assigned manager and then to Finance. Nobody approves their own claim.
- Not confirmed in the input: whether the approval routing is part of this ticket.
- Not provided: implementation details, delivery date, author, review or approval.

**Related:** US-013, US-009
<!-- sdlc:auto:end narrative -->
