# Recorded semantic path execution cost

**Question.** Can the proposed thirteen-row recorded semantic path compiler run synchronously over
ordinary complete games, and which part of the workload determines the answer?

**Verdict.** **Yes with exact source closure; no with eager local fan-out.** `[V]` On the
preregistered fixed imported population, replacing full `localSemanticEvents` fan-out with exactly
one transition compile and one check probe per recorded edge preserves every sorted event id,
receipt byte and result digest. Total p95 falls from 397.5/803.6/1,391.2 ms to
64.7/129.7/212.7 ms at 20/40/80 plies, passing the existing 500 ms synchronous envelope in every
arm. The sequence foundation is not intrinsically slow: eager unrelated one-edge collection was
the cost. Sources: both preregistrations and result bytes under `planning/recorded-semantic-path/`;
executable candidates in `tools/d1930-recorded-path-cost-harness/` and
`tools/d1931-recorded-path-source-harness/`.

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

This created [[D1931]]: the RFC must not privately recompute every one-edge semantic family merely
to obtain capture/check authorities. The preregistered follow-up resolves that choice in favor of
the exact declared source closure. It preserves one source identity for Review, modules and
longitudinal analysis without depending on a separately cached complete local packet.

## 4. Exact-source follow-up

`[V]` D1931 reran the eager control and exact-source candidate in the same process, alternating
their order across the identical twelve-path, three-repetition population. Before any timing was
admitted, every path had to produce byte-equal sorted event ids, all `plies × 13` receipts and the
same final digest. All identity checks passed.

| mode | plies | total p50 | total p95 | max | 500 ms |
|---|---:|---:|---:|---:|---|
| eager | 20 | 378.9 ms | 397.5 ms | 401.4 ms | pass |
| exact source | 20 | 61.7 ms | 64.7 ms | 64.9 ms | pass |
| eager | 40 | 755.3 ms | 803.6 ms | 814.9 ms | **refuse** |
| exact source | 40 | 120.4 ms | 129.7 ms | 131.2 ms | pass |
| eager | 80 | 1,249.9 ms | 1,391.2 ms | 1,403.9 ms | **refuse** |
| exact source | 80 | 199.5 ms | 212.7 ms | 215.8 ms | pass |

`[V]` Exact-source preparation is 18.1/36.9/56.8 ms p95. Window cost stays effectively unchanged
at 47.9/93.3/156.7 ms, confirming that the speedup did not skip the thirteen evaluators. The
candidate performs exactly one `transitionSemanticEvents` call and one direct checked
`checkEvent` declaration per edge, plus the same move, duty and exchange authorities as the
control. Raw result: `planning/recorded-semantic-path/d1931-source-closure-results.json`.

## 5. Product and CI consequence

- Full-path eager compilation remains refused at 40+ plies and must not be the implementation.
- The exact-source recorded sequence operation may remain synchronous; it does not require a
  background/pending state or the complete one-edge packet as a prerequisite.
- Generic software CI should assert the 13-row set, exact receipt count, one call per required
  source edge, ordering and stable identities. It should not assert elapsed milliseconds.
- A pinned performance tier owns repeated 20/40/80-ply timings and the absolute 500 ms boundary;
  editing a relative baseline never changes that boundary.

These are execution decisions only. The measurement says nothing about which events are useful,
which module may show them or whether an observed sequence deserves a named tactic.

## 6. Limits

`[V]` Both disposable candidates intentionally preserve the known D1921/D1928 source-binding defect
so they measure the current constructors rather than inventing the repair. They do not include
storage, transport, rendering or an external provider. The imported population is fixed and
stratified but not a worst-case adversarial chess population. Node-24 and release-container
reproduction remain required. None of those limits can make 826.3/1,434.0 ms a pass under the
preregistered result; they affect the successor mechanism and production envelope.
