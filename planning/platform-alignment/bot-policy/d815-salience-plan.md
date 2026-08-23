# D815 threat-salience measurement — predeclared plan

**Opened:** 2026-08-23

**Authority:** D815; disposable research under RFC-0000's exploration gate. This plan may admit or
kill a future salience-shaped bot layer. It does not register a producer, trait or profile.

## Question

Does exact threat recency explain where human severe errors occur after engine-priced choice
breadth, band, phase and ply are already known? Specifically: are threats made by the piece that
just moved easier for humans to notice than newly created threats from a stationary piece (the
discovered/line-opening class)?

## Fixed population and sources

Use the retained R11 population without a new explorer pull:

- 279 explorer-covered decision positions and three bands (1400/1600/1800);
- exact `startFen` + `historyUci` from the R4 extractor;
- the committed SAN→UCI map and explorer totals/move counts;
- the retained full-legal-move Stockfish depth-12 rows, solely for the already-used ≥250 cp severe
  classification and legal severe-choice fraction;
- the shipped `threat@1` implementation and exact chessops replay.

Input digests are emitted with the result. A position is withheld, with a named reason, when it has
no preceding move, replay does not reproduce its FEN, `threat@1` abstains, its Stockfish row contains
any mate score, or no explorer cell has a positive total. Mate is never converted to centipawns.

## Exact features

For the actor who made the immediately preceding move, enumerate `threat@1` both before and after
that move. The before reading uses the same disclosed pass device as `threat@1`: set the previous
position's turn to the current side, clear en-passant through the collector, then let `threat@1`
give the move to the preceding actor. If that clone is invalid, withhold the row rather than record
false.

Threat identity is the ordered tuple:

`threatener color/role/square + threatened UCI + target color/role/square-or-none + mate flag`.

The non-exclusive position flags are:

- `attacker_just_moved`: a current exact threat's threatening square is the preceding move's
  destination;
- `stationary_threat_created`: a current exact threat was absent before the move and its
  threatening square is not that destination;
- `retained_threat`: an exact current threat was already present before the move;
- `no_current_threat`: the current exact threat set is empty.

No intention, visibility, difficulty or move-quality label is emitted. “Discovered” is only a
human-readable gloss for the stationary-created class, never a detector output.

## Outcomes and controls

Per position-band cell, map explorer SAN to UCI and compute:

- `severe_mass_lower_bound`: explorer games choosing a mapped legal move ≥250 cp behind the best
  divided by the explorer's full total (unlisted mass is never redistributed);
- `legal_severe_fraction`: fraction of all legal moves ≥250 cp behind best;
- mapping coverage, reported but not used to inflate the target.

The base model uses `legal_severe_fraction`, band fixed effects, phase fixed effects and scaled ply.
The augmented model adds `attacker_just_moved`, `stationary_threat_created` and `retained_threat`.
Evaluation is deterministic ten-fold cross-validation grouped by pack id, so positions from one
pack never occur in train and test together. Report out-of-fold RMSE/MAE and residual means by flag
and band. Ordinary least squares uses one declared tiny ridge (`1e-9`) only to make a singular fold
an able-to-fail numerical result; the intercept is not penalized.

## Able-to-fail decision rule

The salience family earns a later RFC only if all three clauses hold:

1. both `attacker_just_moved` and `stationary_threat_created` cover at least 20 positions;
2. the augmented grouped-CV RMSE improves on the base by at least **2%**, and its improvement exceeds
   at least 95% of **200** fixed-seed permutations that shuffle the three salience flags together
   among positions inside `(phase, legal_severe_fraction quartile)` strata;
3. after the base controls, stationary-created threats have higher mean severe-error residual than
   attacker-just-moved threats pooled and in at least two of the three bands.

Failing any clause kills salience-shaped error from the 1.0 bot roster. Insufficient coverage is a
1.0 refusal, not permission to ship a weight and promise later calibration. Passing admits only a
typed research result and a future RFC; it does not establish human-likeness, fun, plan coherence,
or an explanation of why any individual chose a move.

## Artifacts and closeout

The disposable harness lives under `tools/d815-salience-harness/`; its aggregate JSON is committed,
not the raw retained inputs. The result updates `design/research/human-like-opponents.md` (or a
bounded successor dossier), the research coverage matrix, D815, this lane plan and the append-only
exploration log.
