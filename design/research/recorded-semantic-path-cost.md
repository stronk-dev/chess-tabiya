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

## 7. Exact exchange-source reuse rejected — 2026-10-14

[[D3787]] asks whether matching tactical families should share an exact legal-exchange source.
A permanent work-count probe fails on the unchanged compiler: the canonical deflection/overload
sequence requests the same literal FEN/UCI source twice. An invocation-local candidate reduces
that to one while still comparing each complete operand against the sole factory's payload;
separate-call/run controls and result/captured-piece/chosen-line corruption refusals pass.
`[V]` `packages/runtime/src/recorded-semantic-path.test.ts`; initial normal target: 129 pass/one
work-count failure; candidate target: 134 pass plus full imported census/eager parity/timing arms.

Four alternating fresh-process pairs compare the genuine original and candidate compilers over
the accepted 12-path 20/40/80-ply sample plus all current canonical recorded-sequence positives,
hard negatives and castling populations: 89 paths, 1,857 edges, 394 events and 24,141 windows.
Every full input/result, operand, event/value/input/convention receipt and result digest matches.
Run reconstruction is outside the measured interval and can prime position caches; this is
initial compiler work in fresh processes, not wholly cold rules caches or server latency.
Only compact aggregates remain ignored; no raw run/event/CPU dump is stored. `[V]`
`tools/d1931-recorded-path-source-harness/exchange-cost.ts`; `make recorded-exchange-compare`.

| Original compiler ms | Candidate ms | Candidate/original |
|---:|---:|---:|
| 2443.860 | 2420.785 | 0.9906 |
| 2413.247 | 2458.231 | 1.0186 |
| 2440.550 | 2422.167 | 0.9925 |
| 2425.832 | 2477.618 | 1.0213 |

Two pairs are faster and two slower; summed candidate cost is 0.57% higher. **No consistent speed
benefit is established.** Remove the candidate Map/callback changes and candidate-only work-count
tests, retaining the original production compiler. Keep four permanent source guards: both genuine
families have the same exact source payload/receipt, and a conflicting result, captured identity
or chosen line cannot borrow the other family's valid source. These are package-internal controls,
not an HTTP exploit, new chess definition or semantic qualification. `[V]` restored source diff is
empty; final `make recorded-semantic-path-check`: 133 cases pass, all 108 paths/6,991 plies/1,338
events and eager parity retained; 20/40/80-ply p95 is 25.2/51.5/83.3 ms under unchanged 500 ms.

For reproducibility the rejected variant exists **only** in the disposable bundler's guarded
in-memory source transformation. The normal opt-in Make target rebuilds both current-original and
candidate bundles without touching the checkout, refuses identical bundles and repeats the full
comparison. Initial builder attempts correctly fail on the unsupported Unicode regex flag and
unresolved chessops; use a supported filter and the runtime workspace's declared dependency path,
not shell overrides, an externalized library or a new root dependency. `[V]`
`exchange-candidate.mjs`; normal Make target's terminal outcomes.

That reproduction retains every output/receipt but has unstable timings: ratios
1.2537/1.0327/1.1039/0.5898, with a 9,338.424 ms baseline outlier. Do not select the last favourable
pair or aggregate this noisy batch into a speedup claim. Both batches survive in this summary;
the second small ignored aggregate replaces the first local scratch output. The rejection stands.
`[V]` same repeatable target, `.cache/d3787-recorded-exchange.json`.

This settles one cost question. It does not finish D3300 (the local-alternative projector is a
different operation), D3600, semantic validation, useful selection, official content or 1.0.
