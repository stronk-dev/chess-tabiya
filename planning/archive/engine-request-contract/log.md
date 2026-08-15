# Engine request contract implementation log

## 2026-08-15 — implementation opened

Codex independently reviewed the cross-reviewed RFC against the current tree.
The mechanism survived. One stale sentence contradicted the owner ruling:
acceptance criterion 6 said D60 closed even though the shipped advertised range
accepts Elo 50 and R10 is measuring a defensible narrower range. Corrected to
mechanism-shipped / defect-open before code. The owner-mandated `#strongEngine`
MultiPV-before-restore-removal ordering is part of the implementation plan.

## 2026-08-15 — request state, range, and record implemented

The supervisor now retains the complete UCI option table and binds an optional
reset prologue to the search inside one serialized task. Every Stockfish caller
states MultiPV; evidence also states `UCI_ShowWDL`. The separate position-seed
reset was removed. The mandatory ordering was followed and tested: ordinary
strong-engine selection gained explicit MultiPV before enumeration stopped
restoring it.

Maia calls now state Elo, the advertised SelfElo/OppoElo defaults,
Temperature, TopP, and range-clamped MultiPV. Missing `targetElo` resolves to
and records the advertised default. A single helper publishes and enforces the
advertised/configured intersection at selector and run-construction boundaries.
This deployment deliberately configures no narrower range: it publishes the
engine's `[0, 5000]` option-acceptance range, rejects 9000, and accepts 50.
Therefore D60 remains open for R10; this lifecycle ships only its narrowing and
named-refusal mechanism.

Human-common selection widens to the advertised window, retries one sample
missing from its own candidate lines, and records a twice-missing move as
`offWindow` without inventing mass. Mass arithmetic, pivotal detection, group
seeding, and the browser distribution exclude the marker. Run schema 0.15 and
migration 20 are stamp-only, and the resistance panel distinguishes one engine
under two recorded band configurations from two different engines.

## 2026-08-15 — Maia acceptance arm

The R5 probe set was regenerated from the current 37-pack corpus and the pinned
`chess-tabiya-maia:1e13597` image was run over 35 positions × 20 repeats at a
20-candidate window. Result: 700 successful calls, zero errors, zero sampled
moves outside the recorded window. Latency was median 173.2 ms, p95 230.5 ms,
maximum 481.8 ms; zero calls exceeded the 500 ms per-instrument target. The
regenerable raw JSONL remains in `/tmp`, not the repository.

## 2026-08-15 — lifecycle complete

Canonical behavior was folded into `docs/engine-workers.md` and
`docs/branch-runtime.md`; Maia's expected option advertisement was recorded in
`workers/maia/README.md`. Final implementation gates: 591 tests across 96 files,
real Stockfish required, Svelte 0 errors / 0 warnings, schema and packaging
clean; Playwright 24 passed at zero retries with only the optional Maia browser
measurement skipped. The RFC and planning job are archived. D60 is explicitly
not closed by this lifecycle.
