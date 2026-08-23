# Monotone filtering preserves state but still cannot generate the next route step

**Question:** D1080, follow-up to D1078/R11
**Date:** 2026-08-23
**Instrument:** `tools/d1078-route-controller-harness/` in D1080 mode
**Status:** hash-isolated multi-ply experiment complete; candidate controller refused

## Verdict

Subgoal preservation is not enough. The monotone controller makes **9/9** exact progress choices
and **58** distance-preserving choices, all from guarded Maia's returned window. It still completes
only **1/12 branches (8.3%)**, and only one branch exposes two progress opportunities. It is forced
to regress twice because Maia supplies no non-worsening candidate; 3 further fallthroughs occur
after the single completed route. The 70% completion and zero-regression gates both fail. `[V]`
(`d1080-monotone-route-results.json`)

Safety again passes: mean selected loss is **13.21 cp** against matched guarded Maia's **20.31 cp**,
severe-move rate is zero in both, every one of 67 controller selections retains Maia mass, and
maximum repetition remains one. The lower loss is a sample outcome of the restriction, not a claim
that fianchetto routing improves chess.

The shared baseline is now trustworthy. D1078 repeated with explicit `ucinewgame` + Clear Hash and
produced identical normalized artifact digest
`4c0842bcb479fb09c8a3bf322f92afaf54dde1b9587ff68ceca10847bfc6edfa`; D1078 and D1080's twelve
guarded baseline traces byte-match at
`a22c8d335bd16f9119311ca6064700d0803a6984f87c8e39a4a041af3f171fc4`. This corrects D1081's
provisional engine numbers while leaving the route reach/completion verdict unchanged. `[V]`

Three increasingly strong local mechanisms have now failed their declared identity gate:

1. global atom weighting (D1062) — too sparse;
2. phase-scoped target weighting (D1073) — adequate opportunity coverage, insufficient behavioral
   movement;
3. multi-ply progress filtering, then monotone preservation (D1078/D1080) — exact and safe, but the
   next route candidate disappears from Maia's window.

No further multiplier or local shortlist filter is justified. A bot with an opening identity needs
a separately versioned, transposition-aware candidate source. Maia may rank/fill and Stockfish may
guard, but neither can be cited as the source of route moves they did not emit.

## Method correction before result

The first D1080 run exposed D1081: identical baseline line ids changed engine aggregates when the
sibling arm changed. The disposable generator had copied the older R11 Stockfish wrapper without
resetting the hash between independent searches. Candidate membership in the 250-cp guard could
therefore depend on prior experimental order.

Before accepting either result, every `best` and `scores` search gained this barrier:

```text
ucinewgame
setoption name Clear Hash
isready → readyok
```

Both experiments were regenerated. The normalized repeated D1078 digest and cross-experiment
baseline digest above are permanent controls. This is the known D35 family caught by a matched
arm, not rationalized as engine noise.

## Controller

The six roots, two controlled colors, twelve-ply horizon, engine/model identities, deterministic
draws and 250-cp guard are identical to D1078. At each incomplete controlled state:

1. if a guarded Maia candidate lowers exact target distance, restrict to progress;
2. otherwise restrict to candidates preserving distance;
3. only if neither exists, use guarded Maia and record `no_nonworsening_candidate`;
4. after completion, record `route_complete` and fall through.

This is the narrowest response to D1078's repeated `Nf3`: an achieved occupancy cannot be
voluntarily undone while a preserving candidate exists. It still injects no move and carries no
chess prose or inferred intent.

## Result

| arm | branches | branches with ≥2 opportunities | opportunities | progress | preserve | regressions | completed | fallthroughs | mean loss | severe |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| guarded Maia | 12 | 5 | 23 | 0 | 0 | 3 | 0 | 0 | 20.31 cp | 0.0% |
| monotone controller | 12 | 1 | 9 | 9 | 58 | 2 | 1 | 5 | 13.21 cp | 0.0% |

The opportunity collapse is the decisive fact. Preservation prevents many local regressions but
does not cause Maia to offer `g3`, `Bg2` or `Nf3` later. The controller spends most controlled
plies choosing among equal-distance moves, while the chance to progress falls from 23 on baseline
paths to nine on its own paths.

## Required repertoire/generator boundary

The next candidate mechanism must declare:

- repertoire/route id, source, revision, license and transposition key;
- proposed legal candidates with their source path and adherence/deviation state;
- a guard/admission result for each proposed move;
- Maia fill/fallback when the source has no admissible move;
- completion and off-route state across the whole line;
- a selection record that does not relabel route candidates as Maia output.

This is where Chessiverse-like construction belongs: human-policy model, repertoire, curation/guard
and presentation are separate layers. The same opening identity and candidate packet may support
Review/theory/drills, but player history never enters the bot policy.

## Limits

- The twelve product-shaped branches reject this declared controller; they do not estimate every
  possible repertoire's coverage.
- The target remains one exact kingside configuration.
- No human-use result exists, so coherence, personality, fun and human likeness remain unclaimed.
- Stockfish numbers are bounded-search safety operands, not grades or proof of strategy.
