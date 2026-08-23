# R11 bot-policy mechanical evaluation — predeclared plan

**Opened:** 2026-08-20

**Authority:** platform-alignment R11; disposable research only

**Status:** mechanical experiment in progress; instrument correction recorded below; blinded
multi-ply review remains external

**2026-08-23 production-probe follow-up:** D969's disposable Stockfish 18 harness and dossier land
at `tools/d969-stockfish-guard-harness/`,
`design/research/stockfish-candidate-guard-probe.md`, and
`d969-population-results.json`. The cold population arm covers all 50 production draft roots / 958
real Maia candidates. It refuses node 25k/50k for 30–32% all-exact availability, admits fixed depth
8/10 as complete and inside the per-call budget, and refuses depth 12 for latency. Depth 8/10 still
change the depth-12 ≥250 cp mask on 7/6 of 49 cp-only roots. The RFC amendment must choose a literal
depth, rerun this plan's predeclared guard-retention gates at that depth, declare the multi-call
selection budget, and rule the observed mixed mate/cp case before guarded registration.

## Question

Which separable policy layers can change a bot's declared board behaviour without destroying the
human-policy signal or silently moving strength? This pass does not ask whether an avatar, name or
chat voice feels human. It evaluates move distributions; “human-like” remains reserved for a
blinded multi-ply reviewer arm.

## Fixed population

Reuse the already-captured R9/R12 join so no new source convention enters:

- 279 distinct corpus positions, ply 0–20, with start FEN and exact history;
- Lichess explorer move/outcome counts at 1400, 1600 and 1800;
- production-shape Maia-3 MultiPV-20 policy/WDL at the same three bands (837 cells);
- Stockfish depth-12 values for every legal move;
- chessops SAN→UCI mapping for the same FENs.

Every position-band cell has equal weight. Explorer endpoints return a bounded move list, so human
match uses each move's count divided by the full position total; unlisted human mass remains
unassigned rather than being redistributed. The statistical-book arm is explicitly a
**listed-move book** and normalizes only the returned moves.

Inputs are regenerable by `tools/maia-wdl-agreement-harness/README.md`. Their digests, not the raw
megabyte-scale captures, are committed with the result.

## Arms

All profile names state mechanics, not inferred psychology.

1. `current_sample` — the one `bestmove` emitted by the captured production-shape request.
2. `maia_raw_policy` — normalized emitted Maia policy mass; a diagnostic, **not** the production
   sampling distribution.
3. `production_sampler` — reconstruct the pinned engine's production selection distribution:
   raise raw mass to `1 / 0.8`, normalize, sort, retain cumulative mass `<= 0.92` while always
   retaining top-1, then normalize again.
4. `maia_argmax` — deterministic highest-policy move.
5. `guard_250` — remove production-sampler candidates more than 250 cp behind Stockfish's best legal move; if
   none survive, keep the least-losing Maia candidate.
6. `pawn_x4_guarded` — apply `guard_250`, then multiply pawn-move mass by four.
7. `forcing_x3_guarded` — apply `guard_250`, then multiply capture/check mass by three.
8. `quiet_x3_guarded` — apply `guard_250`, then multiply non-capture/non-check mass by three.
9. `listed_human_book` — normalized explorer counts over listed legal moves.
10. `book_to_ply12_then_guard` — listed human book through ply 12, then `guard_250`.
11. `repeat_suppress_0.25` — after a move is sampled from the production sampler in game one, multiply that
    move's game-two weight by 0.25 and renormalize; report the conditional repeat probability.

Sensitivity reports guard thresholds 100/200/300/500 cp and trait multipliers 2/4/8. No threshold
is selected after seeing the output.

## Deterministic measures

Per arm, pooled and by band:

- expected Stockfish loss from the best legal move; probability of ≥250 cp and ≥500 cp loss;
- expected match with a random Maia-policy draw and with a random recorded human move;
- probability mass on explorer-listed moves;
- pawn, capture/check, quiet, early non-castling king, early queen and castling move rates;
- entropy, effective move count and same-policy repeat probability.

The current sampled move is descriptive; distributional arms carry the comparison. Maia match is
not ground truth. Explorer match is population frequency, not quality. Stockfish loss is strength,
not human plausibility.

## Mechanical retention gates

A candidate trait layer earns a **mechanical** carry-forward only if:

- its named trait changes by at least 10 percentage points versus `guard_250`;
- expected Stockfish loss moves by no more than 35 cp versus raw Maia policy;
- ≥250 cp loss probability rises by no more than one percentage point;
- explorer human-match probability falls by no more than 10% relative.

The guard earns carry-forward only if it removes at least half of production-sampler ≥250 cp mass while changing
expected loss by no more than 35 cp in the strengthening direction and human match by no more than
10% relative. These are experiment thresholds, not product calibration or an owner ruling.

## Refusals and residuals

- A one-position distribution cannot establish plan coherence, fun or perceived humanness.
- The listed book is not a coherent persona repertoire and cannot earn that label.
- No style name is inferred from one trait.
- No clock model is manufactured from data without clock observations.
- No hidden Stockfish fact may enter the eventual bot unless the policy contract declares its
  information advantage and calibration effect.
- Blinded reviewers must later compare complete seeded games against raw Maia and competitor bots,
  separately scoring strength, coherence, repetition and declared trait expression.

The mechanical result may narrow an RFC candidate. It cannot complete R11 or authorize production.

## Instrument correction after the first run

The first execution treated emitted `policy` as the selection base. Inspection of the pinned
engine then established that this is false: `policy` is the raw legal-masked softmax, while
`bestmove` is sampled after temperature and top-p. The first aggregates are discarded rather than
interpreted. The arms above now distinguish the raw diagnostic from a reconstruction of the
production sampler, and every wrapper starts from the latter.

The reconstruction is bounded by Maia's returned MultiPV-20 window. Earlier measurement on the
same pinned image found median returned raw mass 0.999625 and minimum 0.979540; temperature 0.8
further suppresses the omitted low-probability tail. This is sufficiently complete for this
mechanical screen, but a production RFC must transform the complete in-engine vector rather than
the server's truncated display window.
