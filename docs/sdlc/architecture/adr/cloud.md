<!-- sdlc:auto:start adr -->
# ADR-0004: Use AWS for Cloud

Status: Accepted  
Date: 2026-11-10

## Context and Problem Statement

Which Cloud technology does the project use? Decided in architecture v1.

## Considered Options

- AWS
- Azure UK South
- GCP europe-west2

## Decision Outcome

Chosen option: AWS, because Approved. Everything is in eu-west-2 for UK GDPR: ECS Fargate for the API, RDS, the private S3 bucket, the SES SMTP endpoint, CloudWatch and SSM. One account and one bill.

## Consequences

An ALB plus Fargate costs a little more than a single VM, but it gives managed TLS, health checks and container deploys with no server patching.
<!-- sdlc:auto:end adr -->