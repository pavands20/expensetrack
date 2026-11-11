# Deployment

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start narrative -->
### DEP-e92968354c2c · draft · source: deployment:e92968354c2c

ExpenseTrack version e92968354c2c is reported as live. The frontend and backend are served from separate URLs. No deployment date, owner, or approval record was provided.

What the input states:
- Status: live
- Version: e92968354c2c
- Frontend URL: https://p4953884a2951.d3j61xaup4zgrx.amplifyapp.com
- Backend URL: https://54-212-142-216.sslip.io/apps/4953884a2951/

Notes:
- Entry status is 'draft' because no approval or sign-off was provided. 'Live' is the reported runtime state, not a documented approval.
- related_ids is empty because the input does not say which requirements (US-001 to US-027) are included in this version.

Not provided (needs a human to confirm):
- Deployment date and time
- Who deployed it, and who approved the release
- Environment name (e.g. production or staging)
- Release notes or the list of included stories
- Smoke or post-deploy test results
- Rollback procedure
- Database migration details

### DEP-e92968354c2c-FE · draft · source: deployment:e92968354c2c

Frontend endpoint for ExpenseTrack version e92968354c2c. The project description names React as the frontend stack and AWS as the platform.

- URL: https://p4953884a2951.d3j61xaup4zgrx.amplifyapp.com
- Hosting: the domain is an amplifyapp.com domain. This is consistent with the 'on AWS' stack statement in the project description, but the input does not explicitly name the hosting service.
- Stack (from project description): React.
- Not provided: custom domain, TLS or certificate details, build configuration, environment variables.

**Related:** DEP-e92968354c2c

### DEP-e92968354c2c-BE · draft · source: deployment:e92968354c2c

Backend API endpoint for ExpenseTrack version e92968354c2c. The project description names FastAPI, PostgreSQL, and S3 (for receipts) on AWS.

- URL: https://54-212-142-216.sslip.io/apps/4953884a2951/
- The host is an sslip.io hostname, which resolves to the IP address embedded in it (54.212.142.216). The input does not state the compute service or region behind it.
- The path prefix /apps/4953884a2951/ suggests a shared host serving multiple apps. This is an observation from the URL only and is not confirmed by the input.
- Stack (from project description): FastAPI backend, PostgreSQL database, S3 for receipt storage (images or PDFs, up to 5 MB per line).
- Not provided: database instance details, S3 bucket configuration, backup policy, monitoring or alerting setup, health-check endpoint, or confirmation that the backend is reachable from the frontend.

**Related:** DEP-e92968354c2c
<!-- sdlc:auto:end narrative -->
