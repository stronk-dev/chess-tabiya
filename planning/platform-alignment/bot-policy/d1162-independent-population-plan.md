# D1162 — independent-population evidence-to-move screen

**Status:** preregistered 2026-08-23 before any engine probe or fitted-model result was read.
**Class:** disposable research instrument; no production policy and no network call.
**Question:** does the registered candidate-evidence plane retain its first-screen move-choice
signal on different games, different labels, and a broader ply range?

## Independent population

Use the committed R2 fixture `tools/r2-selection-harness/imported-sample.pgn`, SHA-256
`a10a233e8e51f6a0877f65cee417339080d2fd32cd22886f755f576c84fa58ec`. It is a deterministic
108-game CC0 sample from the July 2026 rated-standard Lichess database: twelve games in each cell
of Bullet / Blitz / Rapid crossed with average-game rating 1000–1399 / 1400–1799 / 1800–2199.
Take the position immediately before the played move at plies 8, 16, 24, 32, 40 and 48 whenever
that ply exists.

This population is independent of the first screen's authored R11 positions and explorer-count
labels. Its label is the one move the sampled player actually made. Before probing:

- canonicalize each position with chessops;
- remove every canonical FEN that occurs more than once in this population rather than selecting
  one occurrence;
- remove every FEN present in the first screen's pinned depth-12 capture;
- keep every remaining eligible decision; do not sample based on a detector or result;
- assign all decisions from one game to one of five folds by the first four bytes of
  SHA-256(game identity) modulo five.

The experimental unit and bootstrap cluster are the game, not the candidate or position. Exact
position duplicates are absent, and no decision from a held-out game may enter its training fold.
Report results by speed, rating cell and target ply as secondary slices. Sparse late-ply cells are
reported honestly, not filled or reweighted.

## Fixed engine capture and legal-set identity

Use local Stockfish 18 at depth 12 with `Threads=1`, `Hash=16`, full-root `MultiPV`, `ucinewgame`
and `Clear Hash` before every position. Record engine identity, input digest, bound, elapsed time
and every root entry. The harness makes no network request.

Generate the complete legal set independently with chessops. Normalize engine PV moves through
chessops' castling convention before comparison. The probe hard-fails unless the normalized
engine root identities are set-equal to the generated legal identities. It also hard-fails on
duplicate or unknown moves, missing played moves, an incomplete depth, or a probe error. Mixed
mate/centipawn positions are excluded from every arm; no mate score is coerced to centipawns.

## Candidate plane and leakage boundary

For every included legal move, call the shipped `candidateFeatureVector` with the captured
depth-12 root score and pinned engine identity. Use exactly the first screen's registered
tactical/breadth closure and deterministic flattening:

- projection presence is binary;
- finite numeric leaves are path-named and training-fold standardized;
- booleans are path-named 0/1;
- arrays expose length and recursive members;
- strings become path/value one-hot features only at a 5% training-position floor;
- FENs, moves, SAN, squares and fields ending in `Id` are excluded as identity anchors.

The played move is a label only. Speed, rating, ply, game identity, outcome and player identity
never enter a candidate feature. Every statistic, categorical admission decision, coefficient and
ridge choice is fitted inside the outer training games.

## Models and fixed fitting procedure

All outputs are distributions over the complete legal set:

1. **Uniform** — no fitted parameters.
2. **Engine-only** — root-frame loss from the captured best centipawn score.
3. **Evidence-only** — registered candidate features, excluding engine score.
4. **Evidence + engine** — the union of arms 2 and 3.

Reuse the first screen's deterministic diagonal head, true population variance, clipping to
`[-8, 8]`, and ridge grid `{0.01, 0.1, 1, 10}`. For each outer fold, use `(outer + 1) mod 5` as
the one inner validation fold; fit the ridge candidates on the other three folds, choose by mean
held-out played-move cross entropy, break ties toward the larger penalty, then refit on all four
outer-training folds. There is no outcome-aware feature selection, pruning, alternate flattening,
or post-result tuning.

This is a replication of the representation mechanism, not transfer of the first population's
fitted coefficients. The source, label shape, games and phase mix all change; the feature/fitting
contract does not.

## Measures and able-to-fail controls

Per held-out decision and arm record:

- probability assigned to the played move;
- played-move cross entropy (`-log p`);
- top-choice agreement;
- Stockfish expected loss and mass above 250 cp as adverse safety descriptions.

For each game, average its eligible decisions first. Primary contrasts are the mean game-level
differences, with paired deterministic game bootstrap intervals (10,000 resamples, seed
`0x1162b`). Report evidence-only minus uniform and evidence+engine minus engine-only, pooled and
by rating band; speed and target-ply slices are descriptive.

Synthetic fixtures must fail the old mean-square variance denominator, a position-level split of
one game's decisions, a position-level bootstrap that overweights a longer game, unnormalized
castling identity, an incomplete legal set, and a played move missing from that set. They must
also prove the uniform distribution and game-clustered interval on constant inputs.

## Predeclared verdict

- **Pass this second representation gate** only if evidence-only beats uniform in pooled
  game-level played-move probability with a positive 95% lower bound and no negative mean in any
  of the three rating bands; evidence+engine must also beat engine-only pooled with a positive
  lower bound; legal-set identity must be 100%.
- **Refute population transfer** if either pooled primary mean is zero or negative, or if a rating
  band inverts. Do not tune another feature projection on this held-out result.
- **Inconclusive** if both pooled means are positive but an interval crosses zero, or if the legal
  capture cannot meet its fixed completeness contract.

A pass funds the already-named multi-ply coherence study. It does **not** license production use,
`human-like`, Elo, skill or personality claims. Cross entropy and safety may disagree with the
primary probability contrasts; those adverse readings are reported and constrain the next gate,
not rationalized away.
