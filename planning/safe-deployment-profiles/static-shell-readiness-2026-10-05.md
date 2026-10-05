# Application readiness and the served web shell

The application now refuses readiness when its learner entry cannot serve the web shell.
The fix uses the same static response authority as the real root route, not a cached file
existence flag. This implements D3394 under safe-deployment-profiles §12 and criterion 13;
it does not complete the deployment, backup or provider-health RFCs.

## Runtime behavior

The live readiness operation checks the worker, reads the shell through a HEAD request
to the static-serving operation, and checks the worker and storage again after that await.
Missing or unreadable shell bytes return the existing 503 `unready` response with
`Cache-Control: no-store`. Restoration recovers without a restart. A successful response
retains the exact canonical storage proof. Optional-provider behavior, request policy,
liveness output and storage maintenance rules are unchanged.

Two bundled process tests remove the shell before startup or replace it with a directory
after successful readiness. Both first prove that the actual learner route cannot serve,
then require readiness refusal and recovery. The startup fixture also verifies the real
worker remains ready. The actual `STATIC_NOT_BUILT` response now has direct test coverage,
so that one item is removed from the refusal-debt fixture; its historical ceiling is retained.

The existing worker-exit control now waits for an explicit exit request after successful
readiness instead of racing a fixed timer. With the shell still serving successfully,
the real required-worker exit makes readiness fail. The existing worker-dependent health
status is preserved rather than changed while its contract is held.

## Verification

The predecessor gate fails both new controls with HTTP 200 where 503 is required; the
other 30 tests pass. After the fix, an empty-directory cleanup mistake causes one test
failure after its refusal assertions pass. Correcting the fixture cleanup gives 32 passing
tests across three files with `make application-readiness-check`. Workspace types pass
with zero Svelte errors or warnings. Content verification passes 223 tests across 23 files,
all 104 derived requirements and zero clearance errors. Rebuilt browser CI passes 111
journeys, with one optional real-Maia latency skip and zero retries. Final exact-index
software passes 3029 tests across 327 files and seven isolated performance tests across
four files, followed by build, packaging, release-policy, source/value, history, lifecycle
and migration checks. The sealed source tree is `0e41854b161ad8af8b7a3d5512330cf142dd324e`;
the adjacent software JSON retains the exact receipt. Source and test bytes are frozen
through closeout. Complete governance passes; staged-process checks and normal commit
hooks verify the final owned-file list before the commit.

All 942 capability declarations match their retained meanings. The complete canonical
migration plan contains 352 documents and zero writes or ledger restamps. This change
does not require a capability or authored-content metadata migration.

The first content reading distinguishes denied loopback listeners from a coverage change:
four HTTP controls cannot bind in the sandbox, while the refusal census correctly rejects
the now-stale `STATIC_NOT_BUILT` debt item. The final run uses the normal approved Make
target with local listener permission and the corrected debt register, not relaxed tests.

## Probe contract still held

D3393 records an existing disagreement: provider-health-degradation §9 and
safe-deployment-profiles §12 describe `/healthz` as process liveness, but longitudinal-store's
worker projection explicitly requires HTTP 503 when its required worker exits or drains.
The live application and permanent worker-exit test follow the latter requirement.
Public probe privacy also differs from the detailed storage/worker/provider responses.

Release engineering must reconcile the public and internal probes before changing those
wire meanings. This fix changes neither rule, fabricates no deployment attestation and
does not imply that a loaded shell proves the complete learner journey. Full image/privacy,
release/rights, owner-use and official-content obligations remain open.
