# Learner-rating AC-7 bracket simulation — preregistration

**Recorded:** 2026-08-24, before the first instrument run.
**Owner:** `rfc/learner-rating.md` AC-7.
**Instrument:** `tools/learner-rating-bracket-harness/simulate.ts`.

## Question

Does the shipped Glicko-2 update produce a nominal `rating ± 2·RD` interval with at least 90%
empirical coverage, and how many rating periods elapse before `RD ≤ 60`, across the full proposed
publication bracket under more than the logistic response model used to derive it?

## Frozen population and schedules

- True BCS values: `950, 1050, …, 2150` (13 cells).
- Opponents: the four exact rungs in `RATED_OPPONENT_CALIBRATION`, on a balanced rotating schedule.
- Response families:
  1. `logistic`: the conventional base-10 Elo response curve;
  2. `thurstone`: a normal-ogive curve whose local slope at equality is matched to the logistic;
  3. `draw_floor`: the logistic decisive probability with a fixed 20% draw probability, bounding
     expected score away from zero and one.
- Arrival schedules: 12 games/week (the 12-game count closes the period) and 3 games/week (the
  seven-day clock closes the period).
- Every update calls the shipped `glicko2Update`; no duplicate rating implementation is permitted.
- Initial state is the shipped unseeded `initialRating()` state. Each period has games, so the
  shipped update's pre-rating deviation step applies on every arm.
- 2,000 deterministic Monte Carlo trials per `(true BCS, response family, arrival schedule)` cell,
  at most 104 periods. A trial's random stream and starting opponent offset are paired across the
  three response families.

## Outputs and decision rule

For every cell record:

- empirical coverage of the first interval observed at `RD ≤ 60`;
- the Wilson 95% interval for that coverage;
- median and p90 periods to `RD ≤ 60`;
- the share of trials that never reached `RD ≤ 60` within 104 periods.

A grid point clears only if empirical coverage is at least 90% in **all six** model × arrival
cells and every trial reaches `RD ≤ 60`. The supported bracket is the largest contiguous run of
clearing grid points; its reported endpoints are rounded to the nearest 100 BCS, never presented
as point-precise boundaries. Ties between equal-length runs choose the run containing 1500; a
remaining tie chooses the wider-lower run.

The Wilson bound is diagnostic, not a second unannounced gate. Any cell whose point estimate clears
90% while its lower Wilson bound does not is reported as borderline and may not be used to widen the
existing bracket without a larger preregistered rerun.

If the supported rounded bracket disagrees with the shipped publication bracket's rounded endpoints,
AC-7 requires the constant and learner-facing copy to move; the result may not be rationalized away.
