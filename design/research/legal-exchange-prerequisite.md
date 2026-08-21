# Legal local exchange as a tactical prerequisite

**Question.** Can one cheap, inspectable exchange predicate make loose-piece and fork
collectors materially less noisy without pretending to be engine evaluation or chess truth?

**Verdict.** **Yes as a prerequisite; no as a universal significance rule.** `[V]` A legal
recapture-only minimax is fast on both repo populations, excludes pinned recapturers and illegal
king captures by construction, preserves X-rays, and separates geometrical from materially live
double attacks. It makes `moved_piece_en_prise` robustly negative-primary. The imported
population supports a positive `double_attack` prior, while the authored interval crosses 1.0;
therefore the collector may emit an exact local event but may not receive a universal
positive-primary learner disposition.

This dossier answers the D730 prerequisite and amends the tactical-collector draft. It does **not**
close the broader D723 ontology: square denial, pawn levers, coordination, king safety,
multi-edge intent and search-dependent consequences remain separate research.

## 1. Convention tested

`legal-exchange@1` starts with one specified **legal capture**. Thereafter each side may stop or
make any legal recapture on the same landing square; each chooses the continuation maximizing its
own material balance under P=1, N=3, B=3, R=5, Q=9. Promotion adds the promoted-piece-minus-pawn
difference. The returned number is convention units from the initial capturer's perspective.
`[V]` The exact executable definition and fixtures are
`tools/d730-see-harness/see.test.ts`; the plain-language contract is in its `README.md`.

Legal enumeration is the important part. `[V]` The repo already uses chessops, whose documented
feature set includes legal move generation and attack/ray operations; the harness calls
`allDests()` and `isLegal()` for each capture and recapture
([chessops project](https://github.com/niklasf/chessops)). Pinned recapturers and king moves into
check therefore never enter the exchange tree. X-ray recapturers enter after the front piece is
removed and the legal moves are regenerated.

The name deliberately is **not** Stockfish SEE. `[V]` Stockfish's current position source
separately makes attacker generation depend on occupancy and rejects pinned non-king moves that
do not stay on the king ray, as well as king moves to attacked squares. That is useful independent
evidence for treating geometry and legal availability as different facts; the repo instrument is
an independently specified legal minimax and claims neither algorithmic nor numeric equivalence
([Stockfish `position.cpp`](https://github.com/official-stockfish/Stockfish/blob/master/src/position.cpp)).

## 2. Explicit claim ceiling

The convention can establish only:

- a named legal capture has a positive, negative or equal local exchange result;
- the moved piece has two or more named targets that are locally live under that convention;
- the opponent can locally capture the moved piece for a positive result.

It cannot establish that a move is good, best, forced, a blunder, strategically justified, or
winning. It ignores zwischenzugs, replies elsewhere, checks not expressed as the target capture,
positional compensation and the rest of the game tree. `[V]` Those exclusions are executable
scope boundaries in `tools/d730-see-harness/README.md`; no engine score enters the harness.

This is the practical separation the platform needs: **geometry says what relates; legal local
exchange says whether one immediate material relation is live; bounded search or tablebase says
what survives; a module decides whether and how a learner should see it.** None of those layers
may silently stand in for the next.

## 3. Method

### Populations

- **Authored:** 717 eligible authored-spine decisions and 19,619 distinct legal-result
  alternatives, derived from the repo's pack transition corpus. `[V]`
- **External:** 577 eligible decisions and 18,842 alternatives from the sealed CC0 imported
  sample, stratified across bullet/blitz/rapid and 1000–1399/1400–1799/1800–2199. `[V]`

The external population is a robustness check, not “ground truth.” Authored and played human
moves are selected populations; lift measures discrimination from locally available alternatives,
not chess quality.

### Predeclared probes

1. `geometry_fork`: the moved piece attacks at least two enemy king-or-value≥3 targets.
2. `meaningful_fork`: the moved piece checks the king or has a positive legal local capture
   against at least two distinct enemy targets.
3. `moved_piece_en_prise`: the opponent has a positive legal local capture of the moved piece.

For each source position, the played move and every distinct legal-result alternative were
evaluated. Lift is `P(probe on played move) / P(probe on a legal alternative)`. `[V]` Confidence
uses 2,000 deterministic paired source-position bootstrap resamples; every draw keeps the played
result with that position's complete alternative population. This avoids treating dozens of
alternatives from one position as independent played decisions.

### Falsifiers

`[V]` Five required controls pass:

- free piece: +3;
- poisoned pawn: -4;
- an X-ray recapture sequence: +1;
- a geometrically present but legally pinned recapturer is excluded: +1;
- a defended geometry-only knight fork fires geometrically and is rejected by exchange.

The permanent collector also requires promotion-capture and illegal-king-recapture fixtures; the
RFC makes those acceptance tests rather than claiming the disposable probe already ran them.

## 4. Results

| Probe | Authored lift, paired 95% | Imported lift, paired 95% | Reading |
|---|---:|---:|---|
| `meaningful_fork` | 1.72× (0.72–2.94) | 1.96× (1.32–2.71) | promising event; only imported interval excludes 1 |
| `geometry_fork` | 0.72× (0.35–1.14) | 1.00× (0.65–1.40) | geometry alone has no positive prior |
| `moved_piece_en_prise` | 0.36× (0.28–0.45) | 0.57× (0.47–0.69) | robust negative/avoidance-primary fact |

`[V]` Full counts, rates and disagreement examples are committed in
`tools/d730-see-harness/output.md`. The run evaluated 39,038 played/alternative edges in
1.56 seconds total, about 0.038–0.041 ms per edge on this machine. This is an implementation
feasibility measurement, not a production latency guarantee.

The exchange filter changes the answer in both directions. `[V]` The committed output includes
authored and imported examples where a geometric fork disappears after exchange analysis and
examples where lower-valued targets become locally meaningful despite the geometry control's
value≥3 cutoff. That is why “geometry + one more heuristic” is not an adequate substitute.

## 5. Consequences

1. **D730 changes definition.** The audit's pseudo swap that retained pinned attackers is
   rejected. The production primitive is `rules.exchange.predicate.legal_exchange@1`, total on
   legal captures and nowhere else.
2. **Loose-piece evidence points backward.** The strongest supported learner use is post-commit
   avoidance with a complete denominator: the move did not leave the moved piece locally en
   prise while many alternatives did. It is never a pre-commit recommendation.
3. **Fork becomes exact but not globally prominent.** Register `double_attack` with its targets
   and per-target exchange results. It remains research/inspector-only until module-specific
   eligibility decides when it matters; the authored uncertainty forbids a universal rank boost.
4. **Threat and trapped semantics need legal state.** A pass-style threat must abstain while the
   side to move is in check and clear en-passant state. A locally trapped piece must be attacked
   now and have no legal destination escaping a positive opponent exchange.
5. **The collector RFC is smaller.** Runtime opening identity remains important but belongs to
   its gated R8/F7 lane; mixing it into this RFC made “accepted and implementable” contradictory.

## 6. Limits and next evidence

- The authored fork count is only 10 played positives; its wide interval is the result, not a
  nuisance to hide. `[V]`
- P=N/B=3 is a declared convention, not a claim about universal exchange values.
- The harness does not test overload, deflection, interference, zwischenzug, multi-ply tactical
  conversion, square denial, or preserved pressure after a retreat.
- Player-style inference needs opportunity-normalized repeated observations and temporal,
  rating and time-control stability; one event never creates a “type.” See
  `middlegame-evidence-and-style-taxonomy.md`.
- Before Wave B can be called broad enough for 1.0, the remaining exact/convention probes in
  D723–D729 must be run and the search boundary must be explicit. This result licenses the
  prerequisite, not the whole middlegame vocabulary.
