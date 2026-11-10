# Deployment

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start narrative -->
### DEP-ba000c92dab6 · draft · source: deployment:ba000c92dab6

ExpenseTrack version ba000c92dab6 is deployed and its status is live. The frontend and backend each have their own public URL. No deployment date, owner or sign-off is recorded.

- Status: live
- Version: ba000c92dab6. This looks like a commit or build identifier; the input does not say which.
- Frontend URL: https://p4953884a2951.d3j61xaup4zgrx.amplifyapp.com
- Backend URL: https://54-212-142-216.sslip.io/apps/4953884a2951/
- Entry status is 'draft' because no approval or release sign-off was provided.
- Not provided in input:
  - deployment date and time
  - who deployed or approved the release
  - environment name (e.g. production or staging)
  - list of user stories or tickets included
  - smoke-test or post-deploy check results
  - database migration details
  - S3 receipt-storage configuration
  - rollback plan
  - previous version

### DEP-ENDPOINTS-ba000c92dab6 · draft · source: deployment:ba000c92dab6

This entry records the public endpoints for the live ExpenseTrack deployment. The frontend (React, per the project stack) and the backend (FastAPI, per the project stack) are served from separate hosts. Both URLs use HTTPS.

- Frontend: https://p4953884a2951.d3j61xaup4zgrx.amplifyapp.com
  - The amplifyapp.com domain suggests AWS Amplify hosting. This is inferred from the URL only; the input does not state it.
  - This matches the project's stated AWS target.
- Backend API: https://54-212-142-216.sslip.io/apps/4953884a2951/
  - The host is an sslip.io wildcard-DNS name that resolves to the IP 54.212.142.216.
  - The API is served under the path prefix /apps/4953884a2951/.
  - The underlying hosting service, region and instance details are not stated.
- Stated project stack: React, FastAPI, PostgreSQL, S3 for receipts, on AWS. The deployment input does not state where PostgreSQL and S3 are provisioned or how they are configured.
- The input does not record a custom domain or any DNS or TLS certificate details beyond the https scheme of both URLs.

**Related:** DEP-ba000c92dab6
<!-- sdlc:auto:end narrative -->
