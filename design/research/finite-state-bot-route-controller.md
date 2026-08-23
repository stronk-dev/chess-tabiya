# Filtering guarded Maia cannot sustain a multi-ply opening route

**Question:** D1078, follow-up to D1073/R11
**Date:** 2026-08-23
**Instrument:** `tools/d1078-route-controller-harness/`
**Status:** fixed multi-ply experiment complete; candidate controller refused

## Verdict

The first sequence-level controller is safe and exact, but it cannot sustain its route inside
Maia's returned candidate window. Across twelve 12-ply branches from six preregistered authored
opening roots, the controller sees only **10 route opportunities**, falls through on **62/72
controlled plies (86.1%)**, and completes the three-square target in **1/12 branches (8.3%)**.
Only **2/12 branches (16.7%)** expose two route opportunities, against a 70% gate. `[V]`
(`d1078-route-controller-results.json`)

When an opportunity exists, the controller is exact: **10/10** choices reduce the typed target
distance, all ten come from guarded Maia's returned window, none loses 250 cp, and adherence is
100%. Mean selected-move loss rises only **18.17 → 21.99 cp (+3.82)** against matched guarded Maia;
severe-loss rate stays zero and maximum position repetition stays one. Safety is not the blocker.

The blocker is candidate generation and sequence continuity. Matched guarded-Maia trajectories
contain 23 route opportunities and five branches with at least two; steering the first opportunity
changes the subsequent path and leaves only ten/two. One steered branch even plays `Nf3`, later
loses the occupancy during fallthrough, then plays `Nf3` again. A local distance reduction is not a
monotone plan, and “fall back unchanged” can erase the state the controller just built.

This rejects filtering the Maia shortlist as the 1.0 route mechanism. It does not reject the exact
target primitive. A real route identity needs a transposition-aware repertoire/candidate generator
or a declared monotone state machine that can preserve completed subgoals and source safe legal
candidates outside Maia's top window. Either is a stronger source contract than weighting or
filtering Maia and must be disclosed as such.

## Method

The root population is fixed by a repository rule, not result inspection: the first six lexically
sorted authored opening packs at HEAD where both colors retain a pawn, bishop and knight and neither
three-square target is already complete. Each root is run with White controlled and Black
controlled under matched guarded-Maia and route-controller arms for twelve plies.

Exact sources are recorded in the artifact:

- Maia3 5M commit `1e13597c…`, model `maia3-5m@b6559d…`, Elo input 1800,
  temperature .8/top-p .92, raw policy vector rather than its process-global sample;
- Stockfish 18 at 25,000 nodes for candidate loss, Threads 1 / Hash 16;
- canonical legal replay through chessops;
- deterministic draws keyed by line id and ply.

The opponent and baseline use the same 250-cp guarded Maia distribution. The controller restricts
that distribution to moves whose legal child lowers the controlled color's exact occupancy
distance. If none is present, it records `no_progress_candidate` and uses guarded Maia unchanged.
It never injects a missing move, parses prose, reads learner state or asks an LLM.

## Result

| arm | branches | branches with ≥2 opportunities | opportunities | adherence | completed | fallthroughs | mean loss | severe | max repetition |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| guarded Maia | 12 | 5 | 23 | n/a | 0 | 0 | 18.17 cp | 0.0% | 1 |
| route controller | 12 | 2 | 10 | 100% | 1 | 62 | 21.99 cp | 0.0% | 1 |

The one completion is the clean positive control: Black plays `g6`, `Bg7`, `Nf6` on controlled
plies 2/4/6 in `anti-dutch-leningrad-white`, with distance 3→2→1→0. This proves the controller and
completion detector can succeed. The remaining branches are not false negatives hidden by a dead
instrument.

Progress selections by branch show the limitation rather than a universal chess verdict:

- four lines select `Nf3` once and then receive no later progress candidate;
- one selects `Nf6` once, one `Nxf6` once;
- one selects `Nf3` twice because fallthrough undoes the earlier occupancy;
- five lines never receive a guarded Maia progress candidate;
- only the positive-control line completes.

The starting roots are heavily “anti-” opening packs because the lexical rule says so. That limits
population generality but cannot rescue a mechanism that misses its own 70% exercise and completion
gates by more than fifty points.

## Architectural consequence

The bot stack now has a measured boundary among three layers:

1. **Maia base distribution** — human-policy source, history-conditioned, not a persona.
2. **Local transform/filter** — can safely bias a choice, but D1062/D1073/D1078 show it cannot by
   itself guarantee a visible sparse route across a game.
3. **Route/repertoire generator** — must own target identity, candidate generation, adherence,
   deviation, subgoal preservation and fallthrough, then hand candidates to the common guard.

Layer 3 may use the same opening identity, legal-candidate packet and exact configuration events as
Review, drills and habits. It must not pretend Maia emitted a candidate it supplied itself. The bot
selection record needs both sources: repertoire/route proposal and Maia/Stockfish admission or
fallback.

A monotone controller is the narrow next falsifier: while the route is active, prefer progress;
when no progress exists, refuse guarded candidates that increase already-achieved target distance
if at least one preserving candidate remains. That would test whether local continuity is enough.
If it still cannot complete, the exit is a real transposition-aware opening repertoire, not another
weight or filter.

## Limits

- Twelve branches establish mechanism failure on the declared product-shaped sample, not a rate
  over chess generally.
- The engine budget measures relative candidate safety, not game quality or move grades.
- No human review was run; “human-like,” coherent, fun and personality claims remain unavailable.
- The controller uses Maia's returned window, not its full internal legal distribution. That is the
  tested boundary and the reason a separate candidate-generation layer remains meaningful.
