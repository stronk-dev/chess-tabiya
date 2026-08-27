# D1931 recorded semantic path exact-source closure — preregistration

**Frozen:** 2026-08-27 before changing the disposable D1930 candidate.

## Question

Can the recorded sequence compiler replace eager `localSemanticEvents` fan-out with the exact
sealed source closure its eleven outputs declare, without changing any event or receipt identity,
and thereby fit the existing 500 ms synchronous envelope?

## Fixed control and candidate

Reuse D1930's committed population digest, first twelve qualifying imported paths at 20/40/80
plies, one warmup and three measured call-cold repetitions.

- **Control:** the committed D1930 eager mode—one `localSemanticEvents` call per edge.
- **Candidate:** one `transitionSemanticEvents` call per edge for brand-sealed capture authority,
  plus one direct `checkEvent`/`declareCheckEventEvidence` probe per edge for check authority. Move,
  defender-duty and legal-exchange evidence remain as D1930. No other one-edge semantic family is
  computed.

Both modes run the same thirteen window rows, constructors, complete receipts, deduplication and
result digest. This is a disposable mechanism probe, not production implementation and not a
repair for D1921/D1927–D1929.

## Able-to-fail rules

1. For every fixed path, candidate and control must produce byte-equal sorted event IDs, receipt
   bytes and result digest. Any mismatch refuses the candidate regardless of speed.
2. Candidate deterministic work is exactly one transition compile and one check probe per edge,
   thirteen receipts per start, and at most one defender-duty reading per required start FEN.
3. Candidate passes the synchronous shape only if total p95 is at most **500 ms in every
   20/40/80-ply arm**.
4. Report control and candidate validation/preparation/window/total p50/p95/max separately. Do not
   reuse D1930's old wall-clock values as this run's control.
5. Generic software CI may later assert source-call counts and control/candidate identity parity;
   timing remains pinned-performance only.

If identity matches but one arm exceeds 500 ms, the RFC still owes incremental/background/pending
execution. If all arms pass, the RFC may specify the exact-source shape, subject to Node-24 and
release-container reproduction during implementation.
