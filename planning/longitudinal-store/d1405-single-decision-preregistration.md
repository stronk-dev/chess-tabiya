# D1405b — admitted-adapter single-decision cost preregistration

- **Frozen:** 2026-08-24, before running the adapter prototype
- **Purpose:** answer `rfc/longitudinal-store.md` replacement criterion 12
- **Instrument:** `tools/d1405b-single-decision-harness/` (disposable research)
- **Production code:** none

## Question

Can one exact decision be projected through the amended revision-1 ingest set — 46 one-edge
families plus 13 complete-population avoidance relations — and published transactionally to
SQLite below the existing 500 ms p95 post-move server budget?

This arm can refuse native incremental projection. It cannot accept the final implementation:
the RFC is still in re-review, the registry is a disposable prototype, and the final production
adapters must rerun the same population and database arm.

## Frozen population

Build the candidate set from committed `importedRows()` followed by `authoredRows()`, canonicalize
by `(phase,id,parentFen,uci)`, exclude `unclear`, and select the first **24 opening, 24 middlegame
and 24 endgame** decisions. Duplicate `(parentFen,uci)` decisions are removed before selection.
The instrument fails rather than shrink a phase. Three further rows per phase are warm-up only and
must not enter the 72-row result.

Each measured decision runs twice in alternating pass order, yielding **144 observations**. Report
both per-invocation timing and per-position median timing so one slow position cannot disappear as
two independent samples.

## Frozen adapter prototype

1. Enumerate the played edge plus `legalAlternativeEdges` exactly once.
2. Run `localSemanticEvents` exactly once per edge and retain the full emitted event set. The
   amended registry classifies the 46 locally reachable projection ids as `edge`.
3. For each of the 13 `derived.semantic_avoidance.*` ids, join its literal base projection. It is
   an opportunity only when at least one edge exhibits the base family and at least one edge does
   not; it occurs when the played edge does not exhibit it. No presentation eligibility,
   threshold, budget or ranking participates.
4. Keep the eight path families declared `deferred`; invoking or publishing one fails the test.
5. Publish the resulting rows and one complete job watermark in one transaction to an in-memory
   SQLite schema shaped like the amendment. Typed refs contain the measured decision id and a
   fixed event sequence; reset the fixture tables outside the timed interval.

The registry must be set-equal to all 67 `SEMANTIC_EVENT_PROJECTION_IDS` with the exact 46/13/8
partition before any timing is reported.

## Measures and able-to-fail clauses

Report overall and phase-split p50/p95/max for:

- collector time (legal enumeration + all admitted adapters);
- SQLite transaction time;
- combined time;
- legal/evaluated edges, emitted events, avoidance opportunities and published rows.

The native incremental candidate is **refused** if overall combined p95 exceeds 500 ms, if any
phase p95 exceeds 500 ms, if a transaction fails, or if registry closure is not exact. Passing
means only that the schedule remains a candidate; it does not move work into the request until the
accepted production adapter rerun also passes.

Run from a clean worktree at the committed instrument SHA. Record the commit, corpus/source digest,
Node version and machine architecture. Network, engine, provider and LLM calls are forbidden.
