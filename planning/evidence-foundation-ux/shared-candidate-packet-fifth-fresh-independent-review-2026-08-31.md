# Shared candidate packet fifth fresh independent review

- **Date:** 2026-08-31
- **Artifact:** `rfc/shared-candidate-evidence-packet.md` after the [[D2389]] fifth author repair
- **Verdict:** return to author on [[D2428]]
- **Executable review:** `make candidate-packet-fifth-fresh-review` — 3/3
- **Maintained author control:** `make candidate-packet-fifth-author-repair` — 3/3
- **Production authorization:** none

## What survived

The D2389 repair closes the value-identity seam identified by the fourth review. One returned
`ExactLegalMoveMap` object is retained by the declaration, its move objects are flattened by
reference into the packet, and a separately enumerated equal move list is no longer a valid packet
input. The projection-key and dependency-closure repairs also remain intact.

## Return finding

**[[D2428]] — the one-call criterion contradicts the production declaration adapter.** The proposed
compiler executes `exactLegalMoveMap(beforeFen)`, then passes that exact payload to
`declareExactLegalMovesEvidence`. At HEAD, that adapter validates the payload by executing
`exactLegalMoveMap(payload.fen)` again before it seals and returns the original payload. A faithful
implementation therefore performs two authority computations. Criterion 36 explicitly requires
exactly one instrumented `exactLegalMoveMap(beforeFen)` call, while §12 does not include an adapter
change. Both claims cannot be true together.

This is not a return to the old two-value-source design: only the first object enters the packet.
It is a buildability and cost boundary. The second authority computation is real work over the same
position, and the acceptance test as written must fail when instrumented at the production symbol.
The green author harness models a declaration as `{ payload }`, so it omits the exact recomputation
that makes the real adapter trustworthy and cannot detect the contradiction.

## Required next pass

Choose and specify one honest boundary:

1. make the legal authority itself mint a sealed/opaque result that the exact evidence adapter can
   admit without recomputing, with forgery and equal-rebuild negatives; or
2. retain the current validating adapter, state that two computations occur, measure the cost, and
   replace the impossible one-call criterion with exact retained-object identity plus an honest
   call census.

Merely renaming the first invocation “the compiler-owned call” would hide rather than remove the
second computation. After repair, rerun the maintained author and fifth-review targets and request
another fresh independent review. No runtime, cache, selector, server, API or UX implementation is
authorized from this returned draft.
