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
