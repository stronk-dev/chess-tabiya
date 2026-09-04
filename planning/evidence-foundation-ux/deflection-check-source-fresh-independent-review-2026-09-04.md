# Deflection check source selection — fresh independent review

- **Date:** 2026-09-04
- **Rows:** [[D2536]], [[D2552]], [[D2553]]
- **RFC:** `rfc/semantic-collectors.md` §3.2.1 / C17
- **Gate:** `make semantic-collectors-deflection-source-fresh-review` — 4/4 plus strict TypeScript
- **Verdict:** returned; production remains unauthorized

## What survived

The shared bait-before-check selector is the right authority boundary. A legal dual-arm line from
`1B6/r3q3/1kn5/8/8/8/8/4R1K1 w - - 0 1` plays `Bxa7+ Nxa7 Rxe7`: edge one both captures the bait
and checks, edge two captures the bait on its destination, and edge three captures the target whose
knight defender moved. The live detector emits one deflection payload, and the live tactical
collector emits one runtime-sealed, exactly edge-one-anchored check event. The selector can therefore
choose bait-capture and omit that check event without losing the observed tactic.

## Buildability return

The exact-source compiler does not retain that sealed event. Its `Edge.check` field is
`DeclaredEvidence<unknown>`; it calls raw `checkEvent`, converts the payload with
`declareCheckEventEvidence`, and discards the `SemanticEvidenceEvent` identity. Casting those bytes
back to an event fails `assertSemanticEvidenceEvent`, as it must. The eager cost compiler retains the
real event, so the failure is specific to the exact-source boundary rather than the detector or
selector.

`tacticalSemanticEvents` can mint the event, but it also compiles reply breadth and any double attack.
Using that broad collector would silently widen the exact-source probe whose cost/source result the
RFC preserves. The contract therefore needs one narrow constructor that returns the same sealed
check event or `undefined`, and both `tacticalSemanticEvents` and the exact-source compiler must use
it. This is [[D2553]].

## Boundary

No production, schema, API, persistence, content or protected-design byte changed. D2552 is not
rejected: its selector survives. D2536 remains held because its promised third call site cannot yet
supply the required authority. A bounded author repair, followed by another fresh review, is required
before production implementation.
