# D1329 — non-Maia selector data-readiness census

**Authority:** [[D1271]], [[D1320]], [[D1328]]; exploration instrument under RFC-0000.

**Question:** is there a licensed, reproducible and computationally affordable population on which
to learn a set-dependent evidence-originated human-choice policy, or should the programme be
deferred before model work begins?

## Frozen source and leakage boundary

- Source: the first complete games from the **June 2026 Lichess standard rated-games CC0 dump**.
  June is fixed before download and differs from D1162's July 2026 source month.
- Source identity: official URL, advertised byte length, downloaded-prefix SHA-256, decompressed
  complete-game count and first/last UTC timestamps are recorded.
- The D1297 reserved third population is not opened, hashed, enumerated or compared.
- This pass may parse moves to verify legality and produce aggregate phase/cost counts. It may not
  retain game IDs, player names, SAN/UCI labels, FENs or per-position rows in committed output.
- No model is fitted. No feature is selected by association with the played move.

## Source census

For every complete game in the fresh prefix, record aggregate counts only:

- declared variant (missing means orthodox standard under the dump contract), rated event class,
  termination and bot-title exclusions;
- both ratings and a side-to-move rating band;
- time-control/speed stratum and `%clk` coverage;
- exact legal replay success/failure;
- opportunity counts by ply window: opening 8–16, middlegame 17–40, late 41+; these are sampling
  windows, not chess-semantic phase labels;
- distinct game count and decision count per rating × speed × window × ruleset cell.

Missing fields are explicit counters. A missing rating, clock, time control or variant is never
zero-filled or inferred from a neighboring game.

## Projection and cost census

On a deterministic sample selected **without reading the played move** (game digest + ply index):

1. generate the exact legal set;
2. call every candidate-evidence producer declared mandatory by the selector contract;
3. record only producer-level presence, failure, output cardinality, elapsed time and serialized byte
   count—no payload values and no candidate identities;
4. compare generic D1297 flattening cost with a proposed compact registered-projection envelope,
   keeping the latter a cardinality budget rather than an implementation;
5. extrapolate measured single-process wall time and storage to 10k, 100k and 1m decisions, labelled
   as linear projections rather than benchmarks at those sizes.

## Able-to-fail gates

The result recommends **fund a learning-curve generation** only if all clauses pass:

1. source provenance is CC0 and the exact prefix is reproducible by URL + range + digest;
2. ≥99.5% of otherwise eligible games replay legally;
3. ≥95% of decisions have both ratings and time-control identity;
4. clock coverage is reported; clock may be optional for a position/history arm but a clock-aware arm
   is forbidden unless its own coverage is ≥95%;
5. each preregistered standard-chess rating × speed × window training cell has enough decisions to
   populate the **smallest** 10k learning-curve rung after game grouping; no pooling across cells to
   hide an empty one;
6. every mandatory projection succeeds on ≥99% of sampled legal candidates; a producer below that
   threshold is optional/absent, not zero-filled;
7. the linear 1m-decision projection fits an owner-declared compute/storage budget. Until the owner
   declares that budget, this clause reports cost and remains **undecided**, never silently passes.

If clauses 1–6 fail, recommend **defer** and name the exact missing cell/producer. If they pass and
clause 7 is undecided, return a priced owner fork. No result can recommend production or use the
words human-like, Elo-calibrated or personality.

## Learning-curve successor

If admitted, a separate preregistration chooses training sizes from `{10k, 100k, 1m}` that the
census can actually populate. Games, not positions, are assigned to folds. Conditional logit is the
fixed low-capacity control; exactly one compact set-dependent aggregation model is the new arm. The
reserved D1297 population is read once only after architecture, projection, context, optimizer,
guard and stopping rule are frozen.

## Outputs

- `tools/d1329-data-readiness-harness/`
- `planning/platform-alignment/bot-policy/d1329-data-readiness-results.json`
- `planning/platform-alignment/bot-policy/d1329-data-readiness-results.md`
- `design/research/non-maia-selector-data-readiness.md`

The harness is disposable research code. It does not enter production packages.

## V1 source-arm result and V2 criterion repair — recorded before the second range

The 16 MiB source arm exposed a defect in clause 5: “each preregistered ... rating × speed × window
cell” named no rating-band set. The same counts pass if read as D1162's 1000–2199 scope and fail if
read as every band the census emits. No result is assigned to that clause.

The final source-size census is now frozen as:

- compressed byte range `0-268435455` (256 MiB) from the same June URL;
- rating bands `1000-1399`, `1400-1799`, `1800-2199`, `2200-2599`, derived from D970's production
  roster edge; `under-1000` and `2600-plus` are reported but outside this gate;
- speeds `bullet`, `blitz`, `rapid`; `other` is reported but outside this gate;
- windows `opening-8-16`, `middlegame-17-40`, `late-41-plus`;
- 36 required cells, each still needing ≥10,000 decisions after exclusions.

The prefix size may not be enlarged again if a cell fails. This repair changes an undefined
criterion into an able-to-fail one; it does not alter a model, feature or outcome threshold.
