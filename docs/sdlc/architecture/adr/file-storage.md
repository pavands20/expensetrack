<!-- sdlc:auto:start adr -->
# ADR-0005: Use Amazon S3 for File storage

Status: Accepted  
Date: 2026-11-10

## Context and Problem Statement

Which File storage technology does the project use? Decided in architecture v1.

## Considered Options

- Amazon S3
- Storing receipts as bytea in PostgreSQL

## Decision Outcome

Chosen option: Amazon S3, because Approved service. Receipts can be up to 5 MB each and are kept for as long as their claim exists. A private bucket with presigned 5-minute links keeps binary data out of the database and directly meets NFR-006.

## Consequences

Deleting a claim needs a second step to remove its objects. This is done in the same request, and any orphans are logged.
<!-- sdlc:auto:end adr -->