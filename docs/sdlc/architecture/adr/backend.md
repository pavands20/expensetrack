<!-- sdlc:auto:start adr -->
# ADR-0002: Use FastAPI 0.115 for Backend

Status: Accepted  
Date: 2026-11-10

## Context and Problem Statement

Which Backend technology does the project use? Decided in architecture v1.

## Considered Options

- FastAPI 0.115
- Django
- NestJS

## Decision Outcome

Chosen option: FastAPI 0.115, because Approved. One service holds all business rules: routing, no self-approval, Finance-for-Finance, manager-stage skip and limits. Pydantic validates GBP amounts and dates, background tasks send email off the request path, and receipts are streamed to S3 with a size cap.

## Consequences

Routing receipt uploads through the API (at most 5 MB) uses some API bandwidth, but it gives reliable magic-byte type checks and simpler ownership checks than direct presigned uploads. That is acceptable at this volume.
<!-- sdlc:auto:end adr -->