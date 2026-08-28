# Bounded-target execution and contract closure

**Date:** 2026-08-28
**Question:** Can the returned local bounded-target RFC preserve its real evidence authorities,
represent every failure honestly, and execute safely on a request thread?
**Feeds:** [[D1904]]–[[D1909]], `rfc/bounded-policy-targets.md`, Support, Review, bot-policy and drill
evidence foundations.

## Verdict

The three local projections remain implementable, but they are convention-grounded background
work rather than exact request-thread work. `[V]` The literal three-row candidate compiles only
when every row inherits `declared_convention / convention` from `threat@1` and
`legal_exchange@1`; the shipped manifest compiler remains unchanged
(`tools/d1652-bounded-target-repair-harness/contract-repair.test.ts`,
`make bounded-target-contract`, 14/14 on 2026-08-28).

`[V]` The original learner-turn position cannot be recovered from the threat's passed position.
The repaired candidate retains the sealed `rules.mobility.reading.legal_moves@1` item, applies the
registered pass transform, and refuses a mismatched source. This closes the candidate chronology
without adding a caller-supplied FEN authority (same harness).

`[V]` A closed outcome union can distinguish known attacker/victim capture from unexplained
identity loss, and a closed operation union can represent `budget_exhausted` without carrying any
partial boolean, witness or refutation. Projection swaps fail at the operation boundary (same
harness). These are contract controls, not new chess judgements.

## Execution measurement

`[V]` `make bounded-target-census` ran the exhaustive D1023 algorithm over both fixed populations
on 2026-08-28. The committed receipt is
`tools/d1023-bounded-policy-harness/exact-census-output.md`.

| population | target×candidate calls | max pairs / source position | call p95 | call max | whole-position p95 | whole-position max |
|---|---:|---:|---:|---:|---:|---:|
| authored pack spines | 5,017 | 111 | 12.40 ms | 753.88 ms | 367.10 ms | 1,305.12 ms |
| sealed imported fixed-ply sample | 9,182 | 333 | 10.26 ms | 158.68 ms | 343.68 ms | 993.43 ms |

`[V]` The p95 is locally modest, but the authored tail exceeds both predeclared request-thread
limits: one call is above 250 ms and one whole position is above 1,000 ms. Provider-free therefore
does not imply synchronous. The RFC must declare `local/background`, require cancellation and
forbid inline execution from Support gestures, board hover, move commit and HTTP request paths.

`[V]` The observed whole-position maximum is 333 pairs. A 512-pair production ceiling covers both
fixed populations with explicit headroom while remaining able to fail as content or candidate
breadth grows. The census asserts the ceiling rather than treating the current corpus as a
permanent truth.

## Permanent gates

The research target now enforces:

- cold position below 1,000 ms;
- per-call p95 below 100 ms and max below 2,000 ms;
- whole-position p95 below 500 ms and max below 5,000 ms;
- no fixed-population source position above 512 target×candidate pairs; and
- the fixed populations must not silently cross into the stricter request-thread envelope without
  an explicit RFC reclassification.

`[V]` These gates passed 11/11 on the recorded run. The last assertion is deliberately able to
fail in the favourable direction: an execution classification is still stale if performance
improves and nobody revisits it.

## Limits and implementation discharge

The current census executes the D1023 research algorithm, because no production bounded-target
operation exists yet. `[V]` This is enough to refuse `sync` before implementation, but it cannot
clear the RFC's production-cost criterion. Implementation must rewrite the same instrument to
import the production operation and rerun the fixed controls, exhaustive census, 25,000-position
cap, cancellation and 512-pair refusal. The RFC remains draft pending independent review; this
dossier does not accept it.

The wall-clock values are one-machine measurements and are not portable performance promises.
Their role is classification and regression detection. The background envelope is intentionally
wider than the observed p95 and narrower than unbounded execution.
