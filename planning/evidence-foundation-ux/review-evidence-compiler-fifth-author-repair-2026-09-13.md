# Review evidence compiler — fifth author repair

- **Date:** 2026-09-13
- **Rows:** [[D3184]]–[[D3189]]
- **Gate:** `make review-evidence-fifth-author-repair`
- **Scope:** authoring model and RFC only; no production, API, schema, client or content bytes

## Outcome

The fifth return is repaired as one source-to-Story authority chain:

1. a node/family retains every applicable adapter invocation, including simultaneous available and
   unavailable sibling sources, with exact item and source counts;
2. the source plan derives node slots, non-root incoming-edge slots, exact endpoints and bounded
   scheduling-window indices from executable adapter grain;
3. attempt count increments at provider start, a zero-start cancellation restores prior history,
   and every started cancellation remains until the retry ceiling;
4. callers provide only run and branch ids while a server-local parsed storage authority derives a
   contiguous, complete-path-bound prefix and agrees imported and on-path terminal outcomes;
5. each adapter executes its exact payload parser before any result receives evidence authority;
   and
6. every Story occurrence retains separate decision, evidence and bounded stop nodes, so retry
   returns before the learner's decision rather than after it.

This is a buildability repair, not product completion. The literal production adapter population
still depends on owner acceptance of D921 and the recorded-path, provider-exchange,
candidate-packet and evidence-presentation contracts.

## Verification

`make review-evidence-fifth-author-repair` retains 6 original, 5 second-author, 6 third-author, 6
fourth-author and 6 fifth-fresh counterexample groups, then passes all 6 fifth-author repair groups.
The first run caught a regressed public constructor signature in the RFC; the final contract keeps
the public input at `{runId, branchId}` and closes over server-local storage authority.

A genuinely fresh independent review must still attack the composition before acceptance or any
production implementation.
