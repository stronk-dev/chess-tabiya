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
