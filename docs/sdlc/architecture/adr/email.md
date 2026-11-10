<!-- sdlc:auto:start adr -->
# ADR-0006: Use SMTP server for Email

Status: Accepted  
Date: 2026-11-10

## Context and Problem Statement

Which Email technology does the project use? Decided in architecture v1.

## Considered Options

- SMTP server
- SES API via boto3

## Decision Outcome

Chosen option: SMTP server, because Approved service. Python's standard-library smtplib sends to SES's eu-west-2 SMTP endpoint, so no extra email SDK is needed.

## Consequences

There is no delivery-status tracking, and failures are only logged (NFR-010). That is acceptable for notifications at this scale.
<!-- sdlc:auto:end adr -->