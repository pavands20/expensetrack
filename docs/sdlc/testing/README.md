# Testing

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start narrative -->
### TEST-RUN-CHECKS · draft · source: testing:run_checks

An automated check run completed successfully, with 8 of 8 checks passing. It was not tied to a specific ticket.

- Step: run_checks
- Ticket: none
- Status: succeeded
- Result: 8/8 checks passed
- Not stated in the input: the names or scope of the 8 checks, the run date, and which requirements (US-xxx) the checks cover. No requirement links are recorded for this reason.

### TEST-WRITE-a30731c5 · draft · source: testing:write_tests:a30731c5-23aa-4b90-ac02-bda91c466a47

Tests were written for ticket a30731c5-23aa-4b90-ac02-bda91c466a47, producing 5 test files. This step only reports test authoring; the input gives no result for running these tests on their own.

- Step: write_tests
- Ticket: a30731c5-23aa-4b90-ac02-bda91c466a47
- Status: succeeded
- Output: 5 test files
- Not stated in the input: the file names, which features or requirements the tests cover, the date, and whether these tests are among the 8 checks in run_checks.

**Related:** a30731c5-23aa-4b90-ac02-bda91c466a47

### TEST-E2E-SANDBOX · draft · source: testing:e2e:latest

The latest end-to-end run against the sandbox target executed no tests (0/0). This is not a pass, so no end-to-end behaviour is verified yet.

- Run: latest E2E run
- Target: sandbox
- Result: no_tests, 0/0 passed
- Meaning: no end-to-end scenarios ran. None of these user flows have E2E verification:
  - sign-in, sign-out and password reset
  - creating and submitting claims
  - manager and Finance approval
  - marking claims paid
  - category limits
  - dashboards and CSV export
- Gap to close: add E2E scenarios and re-run against sandbox before treating the release as end-to-end tested.
<!-- sdlc:auto:end narrative -->
