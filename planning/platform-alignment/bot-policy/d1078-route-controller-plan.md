# D1078 — finite-state route controller

**Opened:** 2026-08-23
**Authority:** D1073's measured mechanism-class exit; disposable research only
**Status:** complete — adherence/safety pass; exercise and completion fail. Only 2/12 branches
offer two route opportunities and 1/12 completes; candidate controller refused.

## Question

Can a finite-state opening controller create and complete the exact kingside-fianchetto route over
multiple plies while retaining guarded Maia as its candidate/human-policy boundary and honest
fallthrough?

The candidate is mechanically named `kingside_fianchetto_route_controller@1`. It is not a claim of
personality, coherence, fun, strength level or human likeness.

## Fixed roots and continuations

Select the first six lexically sorted authored opening-pack roots at HEAD for which both colors
retain at least one pawn, bishop and knight and neither side begins with the three target squares
already complete. Record the exact pack ids/FENs in the result. This selection rule is fixed before
generation; no root is replaced after seeing a line.

For every root generate matched 12-ply continuations with White controlled and Black controlled
under two arms: guarded Maia baseline and route controller. The other color always uses guarded
Maia. All draws are deterministic from line id + ply + admitted distribution; raw Maia's
process-global sample is not used as the experimental draw.

## Controller

At each controlled opening ply:

1. reconstruct Maia's temperature-.8/top-p-.92 distribution;
2. apply the measured 250-cp guard;
3. find admitted Maia candidates whose legal child reduces the mover's exact target distance
   (own pawn g3/g6, bishop g2/g7, knight f3/f6);
4. if non-empty, restrict to that set and draw deterministically by retained Maia mass;
5. otherwise use the unchanged guarded Maia distribution and record one reason:
   `no_progress_candidate | route_complete | outside_opening | provider_unavailable`.

The controller never injects a move missing from Maia's returned candidate window and never uses
an unguarded route move. Its state is the typed board configuration, not hidden prose or memory.

## Gates

All must pass to retain the candidate:

1. at least 70% of branches have two or more controlled route opportunities;
2. adherence is 100% whenever a guarded Maia route candidate exists;
3. at least 70% of branches that begin mechanically reachable complete all three occupancies within
   six controlled turns; report censored/terminal separately;
4. mean Stockfish loss differs by at most 35 cp from matched guarded Maia and ≥250-cp selected-move
   frequency rises by at most one percentage point;
5. every route move comes from Maia's returned window, every fallthrough is explicit, and no branch
   repeats a position more often than its matched baseline.

If exercise/completion fails, do not increase the multiplier—there is none. The next exit is a
transposition-aware repertoire/candidate-generation mechanism, with its stronger source and
disclosure obligations.

## Outputs

- `tools/d1078-route-controller-harness/`
- `planning/platform-alignment/bot-policy/d1078-route-controller-results.{json,md}`
- `design/research/finite-state-bot-route-controller.md`
