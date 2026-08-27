# D1930 recorded semantic path cost — preregistration

**Frozen:** 2026-08-27 before the disposable compiler candidate is run.

## Question

Can the thirteen-window recorded semantic compiler run over ordinary complete games inside the
existing 500 ms synchronous post-move/Review envelope, and which parts of its work belong in
deterministic software CI versus a pinned performance tier?

## Fixed population

Use `tools/research-chess/populations.ts#importedPopulation`, whose PGN bytes and 108-game
stratification are already committed. In source order, take the first twelve paths with at least
20, 40 and 80 plies respectively, then compile exactly those prefixes. If a cell has fewer than
twelve paths, stop and report rather than substitute another corpus. Parsing/population selection
is outside the timer.

## Candidate operation

The disposable candidate must execute the draft's work, not a proxy count:

1. validate every edge by legal replay and exact after-FEN equality;
2. construct one anchor and one recorded-move evidence item per edge;
3. call `localSemanticEvents` exactly once per edge;
4. evaluate all eleven projections through all thirteen declared horizon rows at every start;
5. invoke the existing sealed constructors for every positive operand result;
6. deduplicate only by the existing event id.

It may cache one defender-duty reading per start FEN inside a compile call. It may not use a
process-global semantic cache. The known source-binding defects [[D1921]]/[[D1928]] remain defects;
the candidate measures current constructor cost and does not call its evidence valid.

## Repetitions and outputs

Warm each fixed path once, then run three measured cold compile calls per path. Record Node/platform,
population digest, path lengths, event counts and p50/p95/max for validation, one-edge preparation,
window evaluation and total. Record deterministic work counts separately: prepared edges,
`localSemanticEvents` calls, evaluator receipts and defender-duty reads.

## Decision rules

- **Synchronous full-path candidate passes** only if total p95 is at most **500 ms in every
  20/40/80-ply arm**, matching the already-preregistered longitudinal post-move envelope
  (`planning/longitudinal-store/d1405-cost-preregistration.md`).
- If any arm exceeds 500 ms, full-path synchronous Review/mutation compilation is refused; the RFC
  must specify background, incremental or cached execution and a typed pending state.
- Deterministic software CI asserts exact work counts, cache calls, ordering and identities—never a
  wall-clock threshold.
- Wall-clock regression runs only in the performance tier under the pinned Node/toolchain and
  reports repetitions and machine identity. A committed baseline cannot be edited to waive the
  absolute 500 ms decision.

The 500 ms gate tests execution shape, not learner value and not event significance.
