# Compare current-consumer migration — bounded implementation receipt

**Date:** 2026-09-30 · **RFC:** `rfc/evidence-presentation.md` (implementing, not complete)

The Compare inspector now renders its narrative groups, per-branch engine trajectory,
structure/timing and piece-route strips, and leaf-position structure through registered
`PresentedEvidence` components over admitted evidence. The engine table retains the recorded
ply offset and node id alongside the sealed magnitude component; it does not reconstruct an
evaluation sentence from a score. The comparison narrative no longer carries a parallel raw
`sentences` authority. Story and Compare consequences are deliberately different: Compare's
objective endpoint may have no game result. `compare.consequence@1` renders that exact absence;
the compare voice path uses the admitted sentence, while Story retains its board-result contract.

The no-result finding is [[D3303]]. Its runtime, server and screen regressions include a terminal
objective with `outcome:null`, and the served-pack browser journey opens the real Compare inspector.
The profile smoke failure encountered during verification was a separate browser-test blind spot
([[D3304]]): a drag sent no move request, so the profile correctly counted zero owner decisions.
The journey now proves the move response and committed input state before checking the profile.
The matrix journey had a second prerequisite blind spot ([[D3305]]): it skipped temporary help
while busy, then asserted the theory card. It now waits for the reveal and verifies it opened.

The first real-content run caught a presentation regression the software tier missed: the new
comparison component said “plies” in voice and changed the established learner copy. The
registered `compare.consequence@1` renderer now retains the learner-facing recorded-turn and
objective wording, so visual and voice consume one sentence without leaking that protocol term.

Verification on this tree: `make verify-software` — 296 software files / 2,464 tests,
4 performance files / 7 tests, typecheck with zero errors and seven pre-existing Svelte warnings,
plus the declared software contract checks; `make verify-content` — 22 files / 216 tests and the
graduation corpus check; `make verify-governance` — green; `make test-browser-smoke` — 55 passed,
one optional skipped; `make test-browser-content` — 5 passed; `make test-browser-matrix` — 48
passed; `make test-browser-production` — 1 passed. The sandboxed content and production-browser
launches could not verify pinned pnpm/start the packaged server; rerunning those same Make targets
with registry/network access passed. These are local results, not a claim about a pushed CI
revision. The three clean, unmerged September 25 Claude worktrees remain outside this landing.

**Not discharged:** other guidance voice templates and remaining Inspector-modal sections still
render through legacy paths. Hyphenated raw-id leaks, the design-tier D1 amendment, D9 owner use
and full RFC archival remain open. No protected intent sentence was edited or identified as
falsified by this bounded consumer migration.
