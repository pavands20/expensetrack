<!-- sdlc:auto:start adr -->
# ADR-0001: Use React 19 for Frontend

Status: Accepted  
Date: 2026-11-10

## Context and Problem Statement

Which Frontend technology does the project use? Decided in architecture v1.

## Considered Options

- React 19
- Vue
- Angular

## Decision Outcome

Chosen option: React 19, because Approved. Built as a Vite SPA served from S3 and CloudFront. It covers the multi-line claim editor with receipt uploads, the approval queue with over-limit flags and history, the status dashboard and the Finance admin and report screens. English only, with no i18n.

## Consequences

Storing the bearer token in sessionStorage means it ends with the tab but is exposed to XSS. This is mitigated by a strict CSP, no third-party scripts and React's default escaping.
<!-- sdlc:auto:end adr -->