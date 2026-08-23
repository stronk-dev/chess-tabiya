# Captured response fixtures

`tablebase-response.json` and `explorer-response.json` are byte-for-byte HTTP
response bodies with one repository newline appended. Their adjacent
`*.provenance.json` records the exact GET request, real retrieval time, transport
digest and byte count, plus the stored-file digest and byte count.

Production fixture readers use `readCapturedHttpFixture`. It removes only the
declared terminal newline, checks both identities, and refuses any request whose
URL differs from the recorded capture. A response captured for one position must
never be relabelled as evidence for another.

When refreshing a fixture, recapture the exact URL, replace the response body,
and update both identities in the same commit. The focused gate is:

```sh
pnpm exec vitest run apps/server/src/sourcing/fixture-provenance.test.ts
```
