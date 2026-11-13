# Deployment

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start narrative -->
### DEP-8995e4b14ec6 · draft · source: deployment:8995e4b14ec6

ExpenseTrack version 8995e4b14ec6 is reported as live. The frontend and backend are each served from their own URL. No date, approver or verification results were provided for this deployment.

What the input states:
- Deployment status (as reported): live
- Version: 8995e4b14ec6
- Frontend URL: https://p4953884a2951.d3j61xaup4zgrx.amplifyapp.com
- Backend URL: https://54-212-142-216.sslip.io/apps/4953884a2951/

Notes:
- The input reports status 'live', which is not one of this schema's status values. The entry is marked 'draft' because no approval or sign-off record was provided. It should not be read as a formally approved release.
- The frontend host is an AWS Amplify domain. The backend is served from an sslip.io hostname that resolves to an IP address. The input does not say which AWS service hosts the backend.
- The input does not identify the stories (US-001 to US-027) or tickets included in this version, so no related_ids are linked.

Not provided in the input (left undocumented):
- Deployment date and time
- Who deployed or approved the deployment
- Release notes or changelog
- Post-deployment smoke-test or health-check results
- Database migration details for PostgreSQL
- S3 receipt storage configuration
- Environment name (e.g. staging vs production)
- Rollback plan
<!-- sdlc:auto:end narrative -->
