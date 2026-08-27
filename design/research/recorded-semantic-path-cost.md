# Recorded semantic path execution cost

**Question.** Can the proposed thirteen-row recorded semantic path compiler run synchronously over
ordinary complete games, and which part of the workload determines the answer?

**Verdict.** **Not in the RFC's current eager-fan-out shape.** `[V]` On the preregistered fixed
imported population, 20-ply total p95 is 399.7 ms, but 40 plies reaches 826.3 ms and 80 plies
1,434.0 ms against the existing 500 ms synchronous envelope. The result is more specific than
“semantic tactics are slow”: path validation stays below 0.6 ms p95 and all thirteen multi-edge
window rows together reach only 184.9 ms p95 at 80 plies. Recomputing the full
`localSemanticEvents` fan-out for every historical edge consumes about 88% of total p95 in every
arm. Source: preregistration and result bytes in
`planning/recorded-semantic-path/d1930-cost-{preregistration.md,results.json}`; executable candidate
in `tools/d1930-recorded-path-cost-harness/`.

## 1. Frozen method

`[V]` Before running the candidate, D1930 fixed the committed 108-game stratified imported sample,
the first twelve qualifying paths at 20/40/80 plies, one warmup plus three call-cold measured runs,
and the same 500 ms synchronous boundary used by the longitudinal-store cost study. Parsing and
population selection sit outside the timer. Each compile legally replays every move, creates one
anchor and move-evidence value per edge, calls `localSemanticEvents` once per edge, evaluates all
thirteen `(projection,horizon)` rows at every start and invokes the existing event constructors for
every positive operand. See
`planning/recorded-semantic-path/d1930-cost-preregistration.md` and population digest
`sha256:663e2f4d09b2b34089acdcc52016059b0ca8e064921973ba79b39f71a7695d7c`.

`[V]` The first run used Node 26.7.0 on darwin/arm64 and records that environment rather than
presenting it as the pinned Node-24 CI host. The two failed arms exceed the absolute boundary by
62% and 180% respectively. A pinned performance-tier reproduction remains an implementation
discharge; it is not grounds to turn this measured failure into a pass.

## 2. Results

| plies | measured calls | validation p95 | one-edge preparation p95 | 13-row windows p95 | total p50 | total p95 | max | 500 ms |
|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 20 | 36 | 0.2 ms | 351.0 ms | 52.3 ms | 387.2 ms | 399.7 ms | 403.0 ms | pass |
| 40 | 36 | 0.3 ms | 728.0 ms | 101.8 ms | 773.3 ms | 826.3 ms | 829.2 ms | **refuse** |
| 80 | 36 | 0.9 ms | 1,262.3 ms | 184.9 ms | 1,274.5 ms | 1,434.0 ms | 1,442.8 ms | **refuse** |

`[V]` Deterministic work scales exactly as specified: 20/40/80 prepared edges, the same number of
`localSemanticEvents` calls and 260/520/1,040 receipts. The event population remains sparse—p95
unique emitted events is 6/10/21—so output allocation is not the cause. Exact per-call values and
work counts are in `planning/recorded-semantic-path/d1930-cost-results.json`.

## 3. What the split means

`[V]` Preparation accounts for 87.8%/88.1%/88.0% of total p95. That preparation follows the first
draft literally: `localSemanticEvents` computes the whole local one-edge semantic fan-out, although
the eleven recorded-sequence constructors need a much smaller declared source closure—recorded
edges, captures, checks, defender-duty readings and exact legal exchanges. The bounded-window
arithmetic itself remains under the 500 ms envelope even at 80 plies.

This creates [[D1931]]: the RFC must not privately recompute every one-edge semantic family merely
to obtain capture/check authorities. It must either consume one canonical already-compiled
per-edge operation or execute only the exact declared source closure, while preserving one source
identity for Review, modules and longitudinal analysis. Which repair meets the budget is a measured
follow-up, not something this result assumes.

## 4. Product and CI consequence

- Full-path eager compilation is background/pending work at 40+ plies; it may not block a move or
  synchronous Review response.
- If the narrower declared-source candidate passes, the recorded sequence operation may remain
  synchronous while the broader one-edge evidence packet is cached/compiled separately.
- Generic software CI should assert the 13-row set, exact receipt count, one call per required
  source edge, ordering and stable identities. It should not assert elapsed milliseconds.
- A pinned performance tier owns repeated 20/40/80-ply timings and the absolute 500 ms boundary;
  editing a relative baseline never changes that boundary.

These are execution decisions only. The measurement says nothing about which events are useful,
which module may show them or whether an observed sequence deserves a named tactic.

## 5. Limits

`[V]` The disposable candidate intentionally preserves the known D1921/D1928 source-binding defect
so it measures the current constructors rather than inventing the repair. It does not include
storage, transport, rendering or an external provider. The imported population is fixed and
stratified but not a worst-case adversarial chess population. Node-24 and release-container
reproduction remain required. None of those limits can make 826.3/1,434.0 ms a pass under the
preregistered result; they affect the successor mechanism and production envelope.
