# D1080 — monotone route controller

**Opened:** 2026-08-23
**Authority:** D1078's measured subgoal-erasure exit; disposable research only
**Status:** complete — completion (1/12) and zero-regression (2 forced) gates fail; the candidate is
refused and local shortlist filtering is closed as the route mechanism.

## Question

Is the missing ingredient merely subgoal preservation? Test the narrowest correction to D1078:
when guarded Maia offers no exact route-progress move, prefer candidates whose legal child does not
increase the already-achieved target occupancy distance.

## Frozen population and sources

Reuse D1078 byte-for-byte: its six repository-selected authored opening roots, White/Black
controlled separately, twelve plies, Maia3 5M at band 1800 and temperature .8/top-p .92,
Stockfish 18 at 25k nodes, and the 250-cp guard. Generate matched guarded-Maia and monotone arms.

## Controller

At each incomplete controlled route state:

1. if any guarded Maia candidate lowers distance, restrict to those candidates;
2. otherwise, if any guarded Maia candidate preserves distance, restrict to those candidates;
3. otherwise use guarded Maia unchanged and record `no_nonworsening_candidate`;
4. after completion, use guarded Maia and record `route_complete`.

All choices retain Maia mass and deterministic drawing. No candidate is injected. Progress,
preservation, forced regression and completion are distinct trace states.

## Gates

All must pass:

1. at least 70% of branches complete the three occupancies within six controlled turns;
2. progress adherence is 100%;
3. no selected controlled move regresses distance before completion;
4. mean Stockfish loss differs by at most 35 cp from matched guarded Maia and ≥250-cp frequency
   rises by at most one point;
5. every controller move remains in Maia's window and maximum repetition does not exceed baseline.

The previous D1078 result is the able-to-fail negative control; its unchanged fallthrough completes
1/12 and visibly repeats one subgoal. If monotonicity still fails completion, do not add more local
filters: the missing layer is candidate generation/repertoire coverage.

## Outputs

- extended disposable generator under `tools/d1078-route-controller-harness/`
- `planning/platform-alignment/bot-policy/d1080-monotone-route-results.{json,md}`
- `design/research/monotone-bot-route-controller.md`
