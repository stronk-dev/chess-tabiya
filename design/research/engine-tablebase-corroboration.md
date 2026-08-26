# Engine ↔ tablebase corroboration on the committed endgame population

**Date:** 2026-08-26

**Question:** D143

**Evidence:** `[V]` repository census + local Stockfish 18 measurement

**Artifacts:** `planning/d143-engine-tablebase-corroboration/plan.md`, `results.json`,
`results-repeat.json`, `tools/d143-engine-tablebase-corroboration-harness/`

## Verdict

The corpus partition was a measurement gap, not evidence that the instruments disagree.
Across **all 288 distinct FENs with committed Syzygy readings**, Stockfish 18 at the exact
authoring profile (depth 22, one thread, 16 MB hash, MultiPV 1) agreed with Syzygy's
side-to-move W/D/L on every position when its typed terminal result is interpreted
correctly `[V]` (`results.json`: `population`, `summary.thresholds`). The 272 non-terminal
positions contain **210/210 directionally agreeing decisive readings** and 62 exact draws;
the remaining 16 terminal positions are eleven Stockfish `cp 0` stalemates and five typed
`mate 0` checkmates `[V]` (`summary.strata.terminal`, `observations`).

This does **not** license one universal score. It establishes a corroboration check at one
engine/version/bound over one endgame population. Syzygy remains the exact authority for
W/D/L, DTZ and DTM; Stockfish cp/mate remains a bounded, versioned reading. Review, grades,
bots and packs must retain those types and use source-local rules `[M]`.

## Method fixed before measurement

The preregistration was written before Stockfish was run. It fixed the whole population,
the production authoring profile, side-to-move comparison frame, six diagnostic cp
deadbands, strata, counterexamples and the 95%/95% follow-up criterion `[V]`
(`plan.md`). The harness:

- reads every `tablebase_result` from `content/drafts/*.evidence.json`, rejects semantic
  disagreement between duplicate FENs and deduplicates to 288 positions;
- resets Stockfish between positions and preserves `cp` versus `mate` as a union;
- compares the raw UCI side-to-move score to Syzygy's side-to-move category, rather than
  mixing it with the stored White-perspective projection;
- asserts an 18-position alternating win/loss mating-line control from
  `mate-k-r-technique`; and
- refuses missing typed scores and populations lacking a win, loss or draw control `[V]`
  (`harness.mjs`, `results.json:controls`).

The committed population is **341 tablebase records / 288 FENs**, deduplicating to 108
wins, 107 losses and 73 draws `[V]` (`results.json:population`). The engine returned 158 cp
and 130 mate readings `[V]` (`summary.overall.typed`).

## Results

| Predeclared cp deadband | Exact draws called draw | Exact wins/losses correct | Follow-up screen |
|---:|---:|---:|---|
| 0 | 56/73 (76.7%) | 215/215 (100%) | fail |
| 25 | 73/73 (100%) | 215/215 (100%) | pass |
| 50 | 73/73 (100%) | 215/215 (100%) | pass |
| 100 | 73/73 (100%) | 215/215 (100%) | pass |
| 200 | 73/73 (100%) | 214/215 (99.5%) | pass |
| 500 | 73/73 (100%) | 205/215 (95.3%) | pass |

The smallest preregistered passing band, ±25 cp, separates this corpus perfectly. Exact
draws have median absolute cp 0, p95 8 and maximum 21. The nearest non-terminal decisive
cp reading is −135, an exact loss in the bishop-and-knight mate family `[V]`
(`summary.overall.exactDrawAbsCp`, `counterexamples.decisiveNearestZero`). There are zero
non-terminal sign contradictions at either side to move and at every observed piece count
from three through seven `[V]` (`counterexamples.signContradictions`,
`summary.strata.sideToMove`, `summary.strata.pieceCount`).

Magnitude is not a portable outcome scale. Exact wins include cp readings above +8,000,
while other exact wins remain in the low hundreds; mate is present on 130/288 positions and
must not be converted to a cp rail `[V]` (`observations`). A cp score also says nothing about
DTZ or DTM: those exact distances remain distinct operands even when the outcome sign
agrees `[M]`.

## Reproducibility

The entire measurement was run twice with fresh engine processes. All **288/288 complete
observation objects were byte-identical**, including score type, value, depth and best move
`[V]` (`results.json`, `results-repeat.json`; comparison over `observations`). Both runs
identify Stockfish 18 and Node 24.19.0 on arm64 Darwin and record the fixed profile in the
artifact `[V]` (`environment`).

This is reproducibility at a fixed bound, not cross-version validity. Existing adjacent
release research already shows engine Review operands are version-sensitive; the candidate
deadband therefore remains **eligible for an independent validation population only** and
`productionNormalizationPermitted` is deliberately false `[V]` (`results.json:decision`).

## Product consequences

1. **Do not stamp engine readings into every Syzygy ledger merely to make the kinds
   overlap.** Exact endgame outcome/distance and bounded evaluation answer different
   questions. The committed research artifact supplies the missing corroboration check
   without weakening the pack's authority `[M]`.
2. **Review and grades:** show exact outcome/DTZ when Syzygy is available; keep cp deltas
   and mate transitions typed and versioned. Never rank one timeline by converting mate or
   DTZ to cp. This supports D916/D917/D928 rather than replacing them `[M]`.
3. **Bots:** perfect-tablebase behavior remains exact; practical resistance may use human
   likelihood over legal exact outcomes. A Stockfish cp magnitude is not a human-likeness
   or difficulty value `[M]`.
4. **Packs and hints:** Syzygy can validate an endgame consequence. Stockfish agreement is
   a diagnostic, not additional learner prose; it creates no strategic explanation under
   law 8 `[M]`.
5. **Regression instrument:** retain the fixed population as an engine-release check. A
   future engine/profile change that introduces a sign contradiction or breaks the
   preregistered screen is evidence to investigate, not a reason to loosen the threshold
   `[M]`.

## Limits

The population is authored endgame material, not a random sample of all seven-piece
positions. No FEN has a halfmove clock of 50 or more, so cursed/blessed 50-move edge cases
are absent `[V]` (`summary.strata.halfmoveClock`). The run measures one Stockfish version
and one depth; it does not validate shallower live budgets, other engines or engine score
calibration outside tablebase material. It measures outcome agreement, not the correctness
of a suggested move or explanation `[M]`.
