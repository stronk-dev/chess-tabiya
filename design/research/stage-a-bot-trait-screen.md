# Stage-A bot-trait fixed-population screen

**Question:** [[D2237]] / [[D2899]], bot roster behavioral breadth
**Date:** 2026-09-06
**Instrument:** `tools/d2237-bot-trait-screen/`
**Status:** measurement complete; 2/8 mechanisms pass the controlled-divergence gate, 0/8 earn a
personality or human-like claim

## Verdict

Two of eight preregistered board-arithmetic transforms clear the existing four-clause Stage-A
controlled-trait gate on the regenerated 804-cell population:

- minor-piece moves ×4: **+11.91 percentage points**, −1.29 cp from the unguarded production
  sampler, zero post-guard severe mass, 99.96% Lichess-reference retention;
- central destinations ×4: **+10.27 points**, −1.26 cp, zero post-guard severe mass, 100.80%
  retention.

`[V]` (`planning/bot-roster/d2237-stage-a-trait-screen-results.json`)

Long-move ×4, piece-repeat ×0.25, rim-destination ×0.25, capture ×4, check ×4 and generic forward
movement ×3 all fail the 10-point behavioral-reach clause. They move their named mass by 7.67,
2.20, 5.89, 4.80, 0.40 and 3.47 points respectively. Every one passes the three safety/retention
clauses. The refusal is scoped to the exact global one-ply transform, not to the primitive. `[V]`
(same result)

No arm is a personality. A one-ply distribution shift establishes controlled divergence only.
The two passing mechanisms must still traverse the exact-digest 13,200-game calibration ladder,
the 24,000-decision human comparator, played-game coherence and owner use before learner-facing
names or human-like copy. `[V]` (`design/research/bot-calibration-verdict-contract.md`); `[M]`
(product interpretation)

## 1. Population and reproduction

The new `make bot-trait-screen` target rebuilds the old documented multi-command process as one
repository workflow. It uses the existing R4 extractor, committed R9 Explorer observations, existing
Maia probe, existing Stockfish probe and the new pure classification screen. The join reproduces:

- 279 exact FENs and three Maia bands: 1400, 1600 and 1800;
- 837 input cells, 33 whole-cell mixed mate/cp abstentions and 804 measured cells;
- zero unmappable candidates;
- byte-identical Maia, Explorer and SAN-map inputs to D1062.

`[V]` (result `population` and `inputs`; `tools/d2237-bot-trait-screen/capture-and-measure.sh`)

The regenerated Stockfish-18 arm64 depth-8 capture is not byte-identical to the prior aggregate:
production expected loss is 20.887248 cp rather than 20.821109, and severe mass is 0.006138 rather
than 0.004316. The signed drift is +0.066139 cp and +0.001822, inside the preregistered 1-cp / 0.005
calibration bounds; Lichess human match is byte-equal at 0.31329. The result records both engine
identity digests and every input digest. `[V]` (result `priorAnchor`, `anchorDrift`, `inputs`)

This is why the prior aggregate is an anchor, not a byte oracle for a regenerated native engine
build. The screen remains comparable because every candidate and both controls use the same fresh
capture, while excessive drift stops the run. `[M]` (instrument interpretation)

## 2. Able-to-fail controls

The screen did not merely produce eight plausible tables:

- pawn ×4 reproduces the known positive direction and passes at +12.25 points;
- forcing ×3 reproduces the known negative direction and fails at +4.00 points;
- synthetic fixtures make every exact classifier both true and false;
- the repeat classifier replays `startFen + historyUci` with chessops normalization rather than
  comparing raw UCI suffixes;
- zero opportunity and a 260-cp unsafe synthetic both fail the gate.

`[V]` (`tools/d2237-bot-trait-screen/trait-screen.test.ts`; result `controls`)

The positive control differs by 0.03 points from D1062 because the fresh Stockfish guard admits a
slightly different mass boundary. It retains the same verdict and comfortably clears 10 points.
`[V]` (D1062 result; D2237 result)

## 3. What predicts reach

The earlier intermediate-mass hypothesis survives. Minor-piece and central-destination classifiers
have 331 and 289 cells with guarded class mass strictly between 0.05 and 0.80; both pass. Check has
14 and moves only 0.40 points. Long move has 219 and reaches 7.67 points, while its diagnostic ×8
arm crosses 10 points; because ×8 was sensitivity-only it cannot replace the preregistered ×4
verdict. `[V]` (result `summary`, `sensitivity`)

Mean base rate alone is insufficient. Central destination begins at 48.00% and passes; generic
forward movement begins at 84.22% and is ceiling-bound at +3.47 points. Repeat suppression begins
at 12.92% but can remove only 2.20 points after the truncated Maia distribution concentrates mass
outside its 102 opportunity cells. `[V]` (same result)

## 4. Consequences for the shared foundation

1. `minor_piece_move` and `central_destination` become full-calibration candidates. They do not
   join the current 4×3 launch floor and acquire no persona copy yet.
2. The other six exact transforms are refused for bot registration at these multipliers. Capture,
   check, movement geometry, repeat identity and direction remain valid shared facts for Support,
   Review, drill conditions and longitudinal counts.
3. The screen does not answer phase-scoped, clock/history, endgame or multi-ply behavior. Those are
   different mechanisms and remain full-1.0 bot work.
4. The next bot implementation still depends on accepted bot-policy/roster contracts and the
   production route. Research success does not bypass the RFC gate.

## Limits

- The fixed corpus is opening-heavy and has no endgame cells. It cannot measure king activity or
  phase-specific endgame play.
- This is a one-ply distribution calculation, not a tournament, game outcome or perception study.
- Lichess move-frequency retention is a population resemblance operand, not proof that a bot feels
  human.
- The two passing classes are broad mechanics. Whether their combination yields recognizable,
  coherent and enjoyable play remains unmeasured.
