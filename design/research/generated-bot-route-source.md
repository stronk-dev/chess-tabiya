# A generated route source reaches where Maia filtering cannot

**Question:** D1084, after D1078/D1080
**Date:** 2026-08-23
**Instrument:** `tools/d1078-route-controller-harness/` in D1084 mode
**Status:** source/guard/fallback boundary passes; personality and human likeness remain unmeasured

## Verdict

A separately identified route source is the missing bot-policy layer. On the same six authored
opening roots and two controlled colors, it reaches the exact kingside-fianchetto target in
**9/12 branches (75.0%)**, versus **1/12 (8.3%)** for paired guarded Maia. It makes **31** progress
and **10** distance-preserving selections with zero pre-completion regressions. All eight frozen
gates pass. `[V]` (`planning/platform-alignment/bot-policy/d1084-generated-route-results.json`)

The source is not a second engine and is not Maia with a larger multiplier. It enumerates exact
legal moves, attaches the route's mechanical distance, proposes progress before preservation, and
then submits those candidates to the existing Stockfish safety boundary. Of 41 admitted route
selections, **26 retain Maia mass** and are sampled by that mass; **15 are absent from the retained
Maia window** and use a recorded Stockfish-loss/UCI tiebreak. **55** proposed candidates are
refused by the 250-cp guard. Six controlled turns fall back because every proposed route candidate
is refused; 25 further fallthroughs occur only after the route has already completed. `[V]`
(`d1084-generated-route-results.json`, `tools/d1078-route-controller-harness/generate.mts`)

This passes the mechanism boundary and nothing above it. It establishes that a bot route can be
composed as **source → guard → human-policy preference → explicit fallback**. It does not establish
that this one three-square target is coherent, human-like, enjoyable or a personality. Those are
properties of versioned route/repertoire instances and whole-game behavior, not of the transport.

## Frozen method

The population is six lexically selected authored opening roots, White and Black each controlled,
12 plies per branch, Maia3 5M at target band 1800 with temperature `.8` and top-p `.92`, and
Stockfish 18 at 25,000 nodes with a 250-cp admission ceiling. Each independent Stockfish search
starts a new game, clears hash and crosses a ready barrier. `[V]`
(`planning/platform-alignment/bot-policy/d1084-generated-route-plan.md`, result `parameters` and
`sources`)

At every incomplete controlled turn the source:

1. enumerates every exact legal move, including all promotion roles;
2. derives the child distance to the declared target;
3. proposes every progress move, or every preserving move when progress is unavailable;
4. obtains an isolated score for every proposal omitted by the bounded MultiPV response;
5. admits only proposals no more than 250 cp behind the isolated best;
6. uses retained Maia mass where it exists, otherwise the lowest admitted loss and canonical UCI;
7. records guarded-Maia fallback when the route source cannot supply an admitted move.

Stockfish never supplies route meaning. Maia never receives credit for a candidate it did not
retain. The source identity is present on every one of the 41 route selections. `[V]`
(`generate.mts`, result `route`, `lines[].trace[].selectionSource`)

## Result

| arm | branches | ≥2 opportunities | progress | preserve | regressions | completed | mean loss | severe | repetition |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| guarded Maia | 12 | 4 | 0 | 0 | 3 | 1 | 19.86 cp | 0.0% | 1 |
| generated route | 12 | 11 | 31 | 10 | 0 | 9 | 38.96 cp | 0.0% | 1 |

The route arm's mean loss is **19.10 cp** higher, inside the predeclared 35-cp aggregate bound.
Its worst admitted route selection is **234 cp**, below the per-move 250-cp guard; no selected
controlled move reaches the severe threshold and maximum repetition remains one. `[V]`
(`d1084-generated-route-results.json`)

The three incomplete routes are diagnostic rather than hidden. Two reach distance one and encounter
a guard-refused turn; the third progresses once and finishes at distance one. The experiment proves
that generated candidates repair the reach failure, not that a six-turn horizon can force every
target safely. `[V]` (result `lines` for the three incomplete generated-route branches)

## Instrument corrections before verdict

D1095 caught two comparison faults after the first run and before accepting its favorable numbers.
The generator keyed both the Maia request seed and deterministic draw by arm, so sibling arms did
not share a common random quantile before their histories diverged. It also inherited a Maia-only
opportunity denominator for the generated arm. The final run keys random draws by pack/color/ply,
and generated opportunity means a legal generated progress candidate. The older D1078/D1080
results remain evidence about those fixed traces, but their claimed pairing is bounded by the
unpaired randomization. `[V]` (`generate.mts`, D1095)

The total-scoring pass then exposed the exact castling dialect boundary: chessops enumerated
`e8h8`, while orthodox Stockfish expected `e8g8`. The final instrument converts only at the engine
boundary and normalizes back before playing. It also isolates any route candidate omitted from a
short MultiPV response and scores it directly; omission is no longer mislabeled as safety refusal.
`[V]` (`generate.mts`; the pre-verdict run failed on `missing isolated score e8h8`)

The final run was repeated once. After removing only `measuredAt`, both complete artifacts hash to
`6beda443703ad36db6e2921446e8dff9a23bacf9fb9583401bda17140e0ebb95`. `[V]`

## Architecture earned

The bot-policy RFC may now specify a versioned route-source interface with:

- route/repertoire identity, revision, license and transposition key;
- exact legal proposed candidates plus mechanical route state before and after;
- per-candidate admission/refusal with engine identity and bound;
- retained human-policy mass when present;
- an explicit selection-source union and guarded fallback reason;
- completion, deviation and re-entry state across the line.

The same score-free legal-candidate event packet from D1071 can feed this source and the Support and
Review consumers. Bot-specific score joins and selection policy remain downstream; neither belongs
in the shared factual packet.

## Limits and next evidence

- One exact fianchetto configuration is a mechanism witness, not a route catalogue.
- Six authored opening roots are not a population estimate of all openings.
- Maia reports `seedHonored: false`; repeatability here comes from stable returned distributions and
  deterministic local selection, not a claimed provider seed.
- No human played or blind-ranked these lines. C5 remains unmet, so “human-like” remains forbidden.
- A production route source needs authored/open-licensed repertoire semantics, transposition-aware
  state and multiple route families; arbitrary position heuristics would recreate ungrounded chess
  judgement in code.
- Bot identity still needs composition across opening route, traits, clock/history behavior and
  bounded deviations. This result supplies one layer, not a roster.
