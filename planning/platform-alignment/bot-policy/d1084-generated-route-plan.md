# D1084 — route-generated candidates with Maia fallback

**Opened:** 2026-08-23
**Authority:** D1080's measured exit; disposable research only
**Status:** complete — all eight gates pass; mechanism boundary earned

## Question

Can the exact route layer complete its target when it is allowed to supply legal candidates absent
from Maia, while keeping source identity, a bounded Stockfish admission guard and guarded-Maia
fallback explicit?

## Frozen population

Reuse D1078/D1080 exactly: six selected authored opening roots, both controlled colors, 12 plies,
Maia3 5M band 1800 at .8/.92, Stockfish 18 at 25k nodes with per-search hash isolation, and matched
guarded-Maia baselines. D1095 corrects the sibling-arm randomization before verdict: the final run
uses one pack/color/ply random quantile across arms, while naturally diverged histories still yield
different distributions. Its guarded-Maia arm is the control; the old D1078/D1080 digest is retained
as historical evidence, not asserted equal after correcting the randomization.

## Source/guard/fallback policy

At each incomplete controlled state:

1. enumerate every exact legal move and derive its typed target distance;
2. if progress moves exist, submit all to Stockfish's 250-cp admission guard;
3. select an admitted progress move: highest retained Maia mass when any candidate has mass,
   otherwise lowest Stockfish loss then canonical UCI;
4. when no legal progress exists, apply the same process to distance-preserving moves;
5. when the source has no admitted progress/preservation candidate, use guarded Maia and record the
   exact refusal/fallback reason;
6. after completion, use guarded Maia under `route_complete`.

Every selected item records `route_source+maia_mass`, `route_source+stockfish_tiebreak`, or
`guarded_maia_fallback`. A generated move is never labelled Maia output. Stockfish supplies
admission/ranking only, not route meaning.

## Gates

All must pass for the interface candidate:

1. at least 70% of branches complete within six controlled turns;
2. zero pre-completion regressions and zero unrecorded source transitions;
3. every route-source selection is legal and ≤250 cp behind the isolated Stockfish best;
4. aggregate mean loss differs by ≤35 cp and severe frequency rises ≤1 point versus matched guarded
   Maia;
5. maximum repetition does not exceed baseline;
6. source mix, rejected route candidates and fallthrough counts are non-vacuously reported.

Passing earns only the layered mechanism boundary. It does not prove the generated route feels
human, coherent or fun, and it does not authorize product implementation before F8's accepted RFC.

## Outputs

- extended `tools/d1078-route-controller-harness/generate.mts`
- `planning/platform-alignment/bot-policy/d1084-generated-route-results.{json,md}`
- `design/research/generated-bot-route-source.md`
