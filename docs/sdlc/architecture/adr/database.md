<!-- sdlc:auto:start adr -->
# ADR-0003: Use PostgreSQL 16 for Database

Status: Accepted  
Date: 2026-11-10

## Context and Problem Statement

Which Database technology does the project use? Decided in architecture v1.

## Considered Options

- PostgreSQL 16
- MySQL
- Aurora Serverless

## Decision Outcome

Chosen option: PostgreSQL 16, because Approved. Foreign keys enforce the user, manager, claim, line and category links. A trigger plus restricted grants make claim_events append-only. Totals by category and month and the CSV export are plain GROUP BY queries on a db.t4g.micro instance.

## Consequences

A Single-AZ instance means a short outage during maintenance or failure. This is an accepted risk under NFR-012.
<!-- sdlc:auto:end adr -->