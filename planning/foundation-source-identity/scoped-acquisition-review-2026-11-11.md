# Scoped acquisition implementation review — 2026-11-11

Contract: independently accepted `rfc/subject-safe-semantic-selection.md` §6.4.
This checkpoint implements construction8 source ownership, qualification and the bounded service
API. It does not complete D4224 or the run-facing cooperative adopter.

Both independent reviewers accept the finite source/service implementation. The source reviewer
checked genuine foundation/full joins, narrow/copied refusal, actual operation/census adoption
and shared-stage failure propagation. The lifetime reviewer checked pending/completed capacity,
token retirement, completed-receipt validity and the actual child-process lifetime control.

Three findings were reproduced before repair:

- D4230: two collection tests failed when runtime edge properties or the caller's outer tuple
  could replace retained context. Runtime-private frozen edge data and captured own-data tuples
  now preserve the original binding. Accessor/sparse pairs refuse without getter or producer calls.
- D4231: five one-shot factory failures could be retried through another scope. Actual shared
  source/stage failures are retained and propagated only to scopes requiring them. Valid
  foundation data survives an unrelated event failure.
- D4232: a strongly held retired token retained its evicted construction through the service's
  WeakMap. Retirement now removes that reference. The actual compiled-service GC child failed
  before repair and passes afterward, with active-owner and held-completed-receipt controls.
  This proves the tested reference lifetime, not appliance RSS or portable GC timing.

Type checks pass. The repaired focused run passes102 tests/four files, including both foundation
and full paths through all13 literal positive/quiet family controls. The final construction suite
passes16 tests after adding the accessor/sparse control. Fresh canonical execution passes all1928
cases/89 subjects with24 qualified. All13 migrated outcome families retain their verdicts.

The4341526-byte canonical JSON changes only11 operation implementation digests,63 joined
population predicate implementation digests and4616 target input identities belonging exclusively
to the13 outcome@2 families. Their authority now names the genuine foundation identity and
compiler8. Payload/operand digests, source vectors, all case outcomes, population results,
externals and verdicts are unchanged; the compact TS receipt changes only its matching SHA.
The source reviewer independently recomputed both old and new authority digests for all4616
changed inputs. The direct-call register names the actual standalone closure consumers in
longitudinal projection and post-commit nudges; candidate construction uses the retained class.
The normal gate caught that stale caller and the old wide-only registry label. Both references
are corrected without relaxing the guards; their3544-test pair passes.

The subsequent complete software run executes20549 tests/583 files:20545 pass and four fail in
the candidate census/trimmed-source tests. No production code changes after that run. The
census is extended to the new foundation/acquisition names while keeping the exact permitted
consumer list; the GC helper follows the existing `.test-support.ts` convention. The trimmed
collection control now checks the exact typed failure through both foundation and wide paths,
retains direct raw rejection, and verifies the original twelve-item producer result stays valid.
All43 tests/four affected files pass afterward, including the actual GC child. This records the
failed broad command and successful repairs explicitly; it is not a claim that it exited zero.

Remaining D4224 work: actual run-facing cooperative acquisition with live permission/currentness,
coalesced cancellation and deadlines; current production cost measurements and budget proof.
D4225 memory, D4228 paged Review, D4175 ordinary adoption, D4167 consumer closure and D3928
content/native/release remain open. No whole-product milestone or official pack graduates here.

Normal `make typecheck test-performance build verify-governance` exits0 after the repairs:
Svelte0 errors/warnings, seven performance tests/four files (90.62s), build, R1–R10 and C1–C8.
A clean full software confirmation against the committed checkpoint remains the next check;
no source changes followed its canonical/complete-suite execution.
