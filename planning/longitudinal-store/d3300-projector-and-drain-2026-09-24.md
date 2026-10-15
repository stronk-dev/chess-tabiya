# D3300 — longitudinal projector cost and bounded drain (2026-09-24)

**Scope:** `rfc/longitudinal-store.md` implementation correction under the owner's
direct-build direction for this session. Three defects in one ledger row: the worker projects one
imported game in tens of seconds, `application.close()` waits for that in-flight projection, and
the Review Map server tests intermittently hit `unable to open database file` under full-tier load.
Output is byte-identical, so `OBSERVATION_DERIVATION_REV` stays at 1 and nothing is rebuilt.

## 1. Where the time went

A CPU profile of `projectObservations` over the first game of
`tools/r2-selection-harness/imported-sample.pgn` (78 plies, both sides) attributed essentially all
time to `localSemanticEventClosure`, run once per legal candidate of every decision (~30 edges per
decision). Per edge, the closure seals ~190 evidence values (`declareEvidence`) and compiles ~120
semantic events, each carrying a SHA-256 digest. Measured shares of the 65 s profile:

| Cost | Share | Cause |
|---|---|---|
| `sha256` in `evidence-contract.ts` | 37 % self | a portable SHA-256 that rebuilt its prime tables on every call, spread each input into a JS array and rotated state with `unshift`/`pop`; ~460 MB hashed per two projections |
| FEN parsing (`positionFromFen`) | 16 % | every collector re-parsed the same before/after FEN |
| `canonicalAnchor` | 9 % | re-parsed and re-validated the edge for each compiled event |
| before-position readings | not isolated | square control, piece destinations, structure, material, king zone, loose pieces, discovered latency, duties recomputed for each of the ~30 edges sharing one before position |
| thrown-and-caught errors | ~4 % | `authorityShape` probed every plain authority record with `assertDeclaredEvidence` inside `try/catch` |
| manifest lookups | ~4 % self | linear `find` over the compiled manifest per compiled event |

## 2. Changes (all output-preserving)

- `evidence-contract.ts`: the portable SHA-256 hoists constants and uses typed arrays and one
  `TextEncoder`; on Node the digest comes from `node:crypto` reached through
  `process.getBuiltinModule` at run time (the module stays import-free and browser-buildable), admitted
  only if it reproduces the portable digest on a multi-byte probe. `canonical` builds strings
  directly, quotes each record key once, and reuses the canonical bytes recorded when a sealed
  payload's digest was first taken (the same deep-frozen premise as the existing digest cache). Its
  former accidents are preserved byte-for-byte: an unrenderable value is `undefined` as a record
  member or at top level but empty as an array element or hole. `isDeclaredEvidence` is the
  non-throwing twin of `assertDeclaredEvidence`.
- `evidence-factories.ts`: `authorityShape` uses `isDeclaredEvidence`; the authority digest of a
  frozen plain record of primitives (the canonical edge, shared by ~200 mints) is computed once.
- `position-cache.ts` (new): a `positionFromFen` that keeps a bounded FIFO of parsed templates and
  hands out clones (failures never cached); the thirteen census modules import it instead of
  `chess.ts`. `chess.ts` itself is untouched because it sits in the provider parser's pinned import
  closure, whose digest feeds provider exchange identity — editing it moved
  `PROVIDER_PARSER_IMPLEMENTATION.closureDigest` and with it every pinned `derived.review.*` payload
  digest, which a performance change must not do.
- `semantic-evidence.ts`: canonical anchors are memoised (bounded, string-keyed, failures uncached);
  `compileSemanticEvidenceEvent` indexes a frozen manifest by ref.
- `fen-memo.ts` (new): bounded per-reading FIFO for ten pure one-position readings; values are
  deep-frozen on first computation, so no caller can mutate a shared value.

**Byte identity.** The pinned fixture-output digest (`longitudinal-contract.test.ts` criterion 12)
is unchanged, and a ten-projection golden over the first five ≥40-ply games of the R2 sample, both
sides, produced identical SHA-256 digests of the full `projectObservations` output before and
after (for example game 0 white `aca96fca…e441`, game 4 black `03da3eb5…5305361`). A 20 011-case
randomised check compared the new `evidenceDigest` with the former `canonical` + `unescape(encodeURIComponent())`
encoding over nested records, arrays with holes, `undefined`, functions, symbols, `Date`, `Map`,
non-ASCII and astral strings.

## 3. Timings

Same host, same load (a shared 14-core development machine at load average 8–10 throughout, so
absolute numbers are inflated; the ratios are the finding). Wall time of `projectObservations` on
the main thread, real semantic boundary:

| Arm | Before | After | Ratio |
|---|---:|---:|---:|
| game 0 (78 plies) white / black | 31.9 s / 32.0 s | 5.2 s / 5.0 s | 6.2× |
| game 2 (65 plies) white / black | 21.5 s / 23.3 s | 3.8 s / 3.8 s | 5.9× |
| game 4 (151 plies) white / black | 26.5 s / 22.4 s | 4.8 s / 3.8 s | 5.7× |
| game 5 (55 plies) white / black | 22.0 s / 18.2 s | 4.1 s / 3.2 s | 5.5× |
| game 6 (92 plies) white / black | 24.0 s / 32.8 s | 4.2 s / 5.7 s | 5.7× |
| **all ten projections** | **254.5 s** | **43.8 s** | **5.8×** |

Stepwise on game 0 (white/black): portable SHA-256 rewrite 20.1/20.0 s; plus FEN, anchor and
thrown-error fixes 12.2/12.4 s; plus reading memo and manifest index 7.6/8.5 s; plus native digest
and authority-digest reuse 5.5/6.8 s; plus canonical reuse 5.3/5.4 s.

Worker instrument (`longitudinal-worker-performance.test.ts`, 80-ply arm in the real thread, 20 Hz
`/healthz`): the prior receipt recorded 16 in-loop renewals at a 1 s heartbeat (a projection of at
least 16 s); after, the arm published 3.6 s into the serving window with 3 renewals, p95 loop delay
12.2 ms, max 37.0 ms, slowest probe 10.3 ms.

**Not met: the "well under 1 s per typical game" target.** What remains is inherent to the
contract, not redundancy: ~200 sealed values per legal candidate, each canonicalised and hashed once,
plus the after-position readings, which are unique per edge. Going further means sealing less per
edge (or a narrower adapter than the one closure), which changes the evidence-authority contract and
belongs to an RFC, not to an implementation correction.

## 4. Bounded drain

`LongitudinalProjectionWorker.start` puts a one-cell `SharedArrayBuffer` in `workerData`. `drain()`
stores 1 in it, posts `drain`, and waits at most `LONGITUDINAL_DRAIN_GRACE_MS` (2 s) before
terminating the thread. `runLongitudinalBatch` takes a `drainRequested` probe, read before claiming
and at every decision checkpoint; once true, the in-flight claim and any not-yet-started claims go
through the new `LongitudinalStore#abandon`, a full-tuple CAS that sets `lease_expires_at` to now.
That fences the claim immediately, counts no failure, keeps `updated_at` (oldest-first place), and
leaves the same row shape a crashed worker leaves after expiry, so the next claim re-leases it at
once. The receipt and the closed progress message gain `abandoned`.

Tests: `longitudinal-store.test.ts` shows abandonment at the first checkpoint after the request,
the zero-claim tick once draining, same-instant re-lease and completion, and an able-to-fail control
without the probe. `longitudinal-worker.test.ts` queues the corpus's longest game three times through
`createApplication`, closes while one job is `running`, and requires `close()` < 2 000 ms,
`abandoned: 1`, the in-flight job still `running`, and all three `complete` after restart. With the
thread's probe removed the same test fails at 2 005 ms (the grace backstop, which is the only thing
bounding it then).

## 5. The `unable to open database file` flake

Cause: a teardown ordering race in the tests, made reachable by slow drains. Each afterEach read the
shared `application` and `directory` variables **after** `await application.close()`. Under
full-tier load one projection took longer than the 30 s hook budget, so the hook timed out while
`close()` was still pending; Vitest started the next test, whose `start()` reassigned `directory`
and opened a new database; when the old `close()` finally resolved, the late hook body cleared the
new `application` reference and `rmSync`'d the **new** test's directory under its live worker
connection, which then failed to open its database files. The same pattern existed in
`learner-profile-application.test.ts`, `longitudinal-worker.test.ts` and the performance test.

Fix: each teardown now detaches its application and directories before awaiting `close()` and
removes only what it detached, in a `finally`. Independently, `close()` now always returns within
the grace, and the supervisor terminates the thread before `close()` proceeds, so no worker
connection outlives the application that removes its directory. The 30 s teardown budgets added for
D3300 in `review-map.test.ts` and `learner-profile-application.test.ts` are back to the defaults
(Review Map keeps its pre-existing 30 s per-test timeout).

## 2026-10-15 — current cost and rejected position-value cache (D3839)

Run `make longitudinal-projector-baseline longitudinal-projector-profile` at `0ebd09ff`:
the unchanged real revision-4 80-ply arms take3290.6/3266.0 ms cold and20.1/19.6 ms warm.
Both sides retain40 checkpoints and together2199 legal edges/196589 semantic events.
The compact CPU aggregate places `freezeData` at18.3/19.3% self time and `mint` at30.2/31.7%
inclusive. These sampled shares are not disjoint costs or a portable latency guarantee.

A disposable two-entry LRU inside each pure `fenReading` factory retained the exact raw FEN
and already-sealed value, with no provider/history entries and no failed-result caching.
Three predecessor work-count controls failed;185 collector and67 authority cases/types then
passed. The existing `make longitudinal-projector-compare` checked complete event/value/input
receipts and projected rows/checkpoints, not just a count or source fingerprint.

| Side / counterbalanced pair | Before ms | Candidate ms |
|---|---:|---:|
| White1 | 3390.0 | 3395.6 |
| White2 | 3414.1 | 3307.6 |
| White3 | 3265.8 | 3356.5 |
| White4 | 3264.7 | 3344.8 |
| Black1 | 3245.2 | 3155.8 |
| Black2 | 3283.1 | 3142.8 |
| Black3 | 3199.8 | 3235.7 |
| Black4 | 3155.0 | 3115.7 |

All eight complete-output comparisons pass. Summed time is26217.6 versus26054.6 ms,
0.62% lower locally, with four faster and four slower pairs. **Reject this cache:** the evidence
does not justify extra retained state. Remove the candidate and its cache-only expectations;
retain the general exact-position authority/immutability/refusal regression. No raw profiles or
comparison dumps are committed or required by progress/CI.

The next D3840 experiment targets the actual breadth composition's repeated **edge** population:
direct square-control events and defender exposure both request the complete same source
(`packages/runtime/src/semantic-evidence.ts`, `evidence-factories.ts`). The permanent control
first counts66 mints for22 source values in each color. This is a separate experiment, not a
rescoring or relabeling of D3839; D3300's whole cold-cost objective remains open.

## 2026-10-15 — exact-edge population reuse candidate (D3840)

The existing `edgePopulation` helper retains only its latest successful validated edge and the
complete frozen value array. All route admission and `validEdge` checks still run first; a
different validated edge evicts the array. Empty successes remain complete; failures do not
replace the successful entry. This is not a provider, recorded-window, node-authority or history cache.

The both-color full-composition control changes66 mints for22 source values to22, with every
source receipt retained. Three intended predecessor failures (both colors plus empty-result
reuse) become185 collector and67 authority passes. The initial harness mistakenly compares source
order to composed event-id order; compare the complete receipt population instead, while the
whole-game instrument continues requiring exact event order. Extended negatives retain full FEN
clocks, move identity, invalid/extra operands, immutability and one-entry eviction.

Run the unchanged counterbalanced `make longitudinal-projector-compare` against the captured
`0ebd09ff` baseline (the rejected D3839 cache has been removed):

| Side / counterbalanced pair | Before ms | Candidate ms |
|---|---:|---:|
| White1 | 3455.6 | 3237.2 |
| White2 | 3509.1 | 3216.4 |
| White3 | 3271.1 | 3205.3 |
| White4 | 3250.6 | 3289.7 |
| Black1 | 3266.8 | 3091.1 |
| Black2 | 3209.3 | 3228.7 |
| Black3 | 3178.5 | 3080.8 |
| Black4 | 3233.4 | 3131.4 |

All eight pairs retain complete event/value/input receipts, projected rows and checkpoints.
Summed cold time is26374.3 versus25480.6 ms (3.39% lower locally; six faster/two slower).
This is a small local improvement, not a portable guarantee, sub-second cold target, source
qualification or whole-1.0 completion. Retention removes directly demonstrated repeated work
in the actual composition using one slot, unlike the rejected broader position-cache experiment.
Full normal verification and current declaration/migration checks still precede delivery.

The required semantic implementation receipt refresh then changes exactly nine operation
implementation bindings and53 population implementation bindings, with every case, population
input/result, external source and verdict unchanged. Re-run the same complete-output comparison
against the final metadata, retaining the first cohort rather than replacing its result:

| Side / final-metadata pair | Before ms | Candidate ms |
|---|---:|---:|
| White1 | 3446.2 | 3217.2 |
| White2 | 3461.6 | 3218.5 |
| White3 | 3292.6 | 3417.2 |
| White4 | 3357.1 | 3245.6 |
| Black1 | 3270.1 | 3170.5 |
| Black2 | 3270.2 | 3213.6 |
| Black3 | 3252.3 | 3238.9 |
| Black4 | 3264.9 | 3212.4 |

All eight final-metadata pairs retain the complete outputs. Summed cold time is26614.8 versus
25933.7 ms (2.56% lower locally; seven faster/one slower). These are repetitions on the same
fixed game, not extra positions or a larger chess validation population. The retained change
removes demonstrated duplicate work; neither cohort proves a portable or substantial speedup.

The first full normal verification passes5875 software cases, then two performance files fail
after workstation suspension. The runtime test's80-ply arm has96.0 ms p95 but a949775.9 ms maximum;
Vitest records956834.3 ms for that file and978100.5 ms for the transport latency file. The macOS
power log records08:58:24 CEST clamshell sleep (974 seconds),09:14:40 sleep (953 seconds),
subsequent maintenance wakes/sleeps and10:07:25 full wake on2026-10-15. Those samples are not
valid performance evidence; the complete unchanged normal gates are run again after full wake.
No threshold, timeout, fixture or execution population is relaxed. The earlier D3532 incident
retains its separate unresolved cause; diagnosing this suspension does not close that row.

Final frozen production/tests pass5875 software cases/392 files and all seven performance cases
under unchanged limits. A later governance refusal finds one new review row cited only inside
an endpoint range; naming all three literal IDs corrects routing, not production behavior.
The remaining normal governance/content/build/browser stages then pass257 content cases,
332 smoke/five content-browser/59 matrix/one packaged-production cases (397 browser passes),
with one configured optional Maia skip. The final matrix report has zero unexpected/flaky/
skipped cases, errors or retries; all112 composition cells pass. No raw recording is committed.
D3840 closes only duplicate population work; D3300's full cold target remains unmet.
