# Deployment

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start narrative -->
### DEP-001 · draft · source: deployment:2045c76e01ce

ExpenseTrack version 2045c76e01ce is reported as live. This is the top-level release record for the deployment phase. It links to the frontend and backend endpoint records.

Recorded facts (from deployment input):
- Status: live
- Version: 2045c76e01ce
- Frontend: see DEP-002
- Backend: see DEP-003

Not provided in input (left blank, not inferred):
- Deployment date/time
- Who performed or approved the deployment
- Environment name (e.g. production vs staging)
- Release notes or the list of requirements/stories included
- Pre- or post-deployment verification or smoke-test results
- Rollback procedure
- Database migration details

Traceability note:
- The project defines requirement keys US-001 to US-027.
- The deployment input does not state which of them this version implements, so none are linked here.

Status note:
- Marked 'draft' because no approval or sign-off of this release appears in the input.

**Related:** DEP-002, DEP-003

### DEP-002 · draft · source: deployment:2045c76e01ce

Frontend endpoint for the live ExpenseTrack deployment. This is the URL end users open in a browser.

- Frontend URL: https://p4953884a2951.d3j61xaup4zgrx.amplifyapp.com
- The hostname is an AWS Amplify domain (amplifyapp.com). This is consistent with the stated stack: React frontend on AWS.
- Deployed version: 2045c76e01ce (per DEP-001).
- No custom domain, TLS certificate details, or CDN configuration were provided.

**Related:** DEP-001

### DEP-003 · draft · source: deployment:2045c76e01ce

Backend API endpoint for the live ExpenseTrack deployment. This is the base URL for the FastAPI backend in the stated stack.

- Backend URL: https://54-212-142-216.sslip.io/apps/4953884a2951/
- The path segment '4953884a2951' matches the app identifier in the frontend hostname (DEP-002).
- The host is an sslip.io wildcard-DNS name that resolves to the embedded IP address, not a custom domain.
- Stated project stack: FastAPI, PostgreSQL, S3 for receipts, on AWS.
- The deployment input does not confirm the database instance, S3 bucket, region, or other infrastructure details, so none are recorded here.
- No health-check or API verification results were provided.

**Related:** DEP-001
<!-- sdlc:auto:end narrative -->
