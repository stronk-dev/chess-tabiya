# explanation-grounds — log (append-only)

## 2026-08-11 (claude, setup)

- Accepted at the fourth scoping of breadth #2. Prior three: rejected/withdrawn
  for specifying an authored vocabulary with no authored content to design
  against (see the withdrawal notes in rfc/authoring-contracts-v03.md and
  rfc/evidence-composer.md — read them before proposing any extension here).
- Review cut §1 (objective-type grounding via rules facts): no shipped pack
  uses win/hold, and `drawIsAvailable` can't say which draw fired, so a
  discriminated ref is unmintable without a runtime change. Revives with pack A.
- Review also found a real bug this RFC now fixes: `RunService.compare` has no
  withholding gate, so evidence refs travel around the publicEvents barrier.
- Next: codex session 1 → §1 (gate) + §2 (overlay).

## 2026-08-11 (codex, §1–§2 compare grounds)

- Added the compare-withholding regression before changing production code.
  Against the prior `RunService.compare`, the focused test failed exactly at
  the leak: it received `engine:main-eval` beside `rules:material` while the
  pack's delayed-checkpoint policy was still closed.
- `RunService.compare` now resolves the registered pack and applies the same
  `feedbackIsRevealed` decision as the other evidence surfaces. While closed,
  it filters only `engine:` references from objective timelines and returns
  empty evidence arrays; after a checkpoint reveals feedback, the original
  timeline references and overlay are returned.
- Added `BranchComparison.evidence.a/b`. Each entry is derived from a durable
  `evidence.attached` event whose node lies on that side's existing branch
  path. The current overlay is deliberately restricted to the accepted v1
  source: engine-validated eval payloads with a recorded integer
  `centipawns` or `mateIn` value.
- Pinned score mapping is exercised as `{kind:"cp", value:31}` and
  `{kind:"mate", movesTo:-3}` without converting mate to centipawns. A server
  integration test consumes both staged queue results, confirms the queue is
  empty, then derives both overlay entries from the persisted events.
- No client rendering or content-era authored claims, timing windows,
  provenance modes, feedback packets, per-scope reveal, or new evidence
  sources were added. §3 remains untouched for the next session.
- Session closeout: `ENGINES_REQUIRED=1 make verify` is green (33 test files,
  153 tests; zero Svelte diagnostics; scaffold and packaging checks pass).

## 2026-08-11 (claude, review of §1–§2)

- Independently verified (ENGINES_REQUIRED=1): 153 tests green. Compare gate
  wired through `feedbackIsRevealed` alongside the existing evidence/apply
  gates; score encoding pinned as the discriminated `{kind:"cp"|"mate"}` union
  with a `Number.isSafeInteger` guard on mateIn; overlay derives from persisted
  events (drained-queue case asserted). **§1–§2 APPROVED.**
- Notable: codex confirmed the regression test fails against the pre-fix code
  (`engine:main-eval` leaked before checkpoint reveal) — the shipped bug the
  review discovered is real and now closed, not an assertion of existing
  behavior.
- §3 green-lit (client rendering): grounded sentences via the EXISTING table,
  throw-on-empty parity with whyBanner, eval trajectory aligned on plyOffset
  with the fork marked, Playwright without a delta assertion.

## 2026-08-11 (codex, §3–§4 grounded rendering)

- Compare objective entries now render `from → to` and resolve every existing
  reference through `renderEvidenceRef`. The evidence sentence table itself is
  unchanged. An empty reference array throws with the event sequence rather
  than installing fallback copy; the component test exercises that failure.
- Added one shared ply-offset grid for both evidence sides. Offset zero is
  visibly marked `Fork`; centipawns render as pawn values and mate remains a
  distinct `M±n` label. Unit coverage includes both score forms and proves the
  same fork-offset entry occupies both branch rows.
- The visible heading says `Recorded engine evaluation`, not Stockfish: the
  accepted payload records `engine_validated` but does not carry an engine
  identity, and the required browser test runs the honest mock executor. The
  canonical doc distinguishes the engine and mock deployments without
  manufacturing provenance in the UI.
- Extended the real browser walkthrough to wait for writer-applied evidence,
  then assert the grounded checkpoint sentence, objective transition, fork
  marker, and one offset-zero overlay entry on each side. No score delta is
  asserted; the mock's constant zero remains valid evidence.
- Updated `docs/branch-runtime.md` for the durable recorded-evidence overlay and
  `docs/drill-client.md` for compare withholding and grounded rendering.
- `make test-browser` is green (2 required scenarios passed; optional Maia
  skipped). Observed timings: board-ready 86ms, rewind 33.5ms, branch switch
  32.1ms, uncached mock reply 2.3ms, cached mock reply 2.7ms.
- Final-tree closeout: `ENGINES_REQUIRED=1 make verify` is green (33 files,
  154 tests; zero Svelte diagnostics; scaffold and packaging checks pass), and
  a second `make test-browser` run is green (2 passed, optional Maia skipped).
  The final browser run observed board-ready 96.2ms, rewind 33.8ms, branch
  switch 48.3ms, uncached mock reply 1.0ms, and cached mock reply 0.7ms.
