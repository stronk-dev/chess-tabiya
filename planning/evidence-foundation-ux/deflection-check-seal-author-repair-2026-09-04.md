# Deflection exact-source check seal — author repair

- **Date:** 2026-09-04
- **Rows:** [[D2536]], [[D2552]], [[D2553]]
- **RFC:** `rfc/semantic-collectors.md` §3.2.1 / C17
- **Gate:** `make semantic-collectors-deflection-seal-author-repair` — 4/4 plus strict TypeScript
- **Production authorization:** none; another fresh review is required

## Returned boundary

The second fresh review retained the shared induction selector but proved that the exact-source path
could not pass D2536's runtime seal. It stored only declared check evidence created from the raw fact;
the eager path retained the whole event, and invoking the whole tactical collector would have added
reply-breadth and double-attack work to a deliberately narrow source probe.

## Bounded repair

One `checkSemanticEvent(beforeFen, moveUci, afterFen)` operation now owns construction of the existing
`rules.tactic.event.check@1` semantic event. It validates the full edge, calls the existing check fact
detector, honestly returns `undefined`, and otherwise seals the exact fact as both evidence payload
and operands. It introduces no producer, projection, operand or eligibility.

The broad tactical collector delegates to this operation. Exact-source edges retain its full event;
deflection passes that event only when the shared induction selector returns `check_induced`, while
attraction projects the event's declared evidence as its existing API requires. The source path does
not compute reply breadth or double attacks merely to obtain the check event.

## Falsifiers and boundary

An evidence-only cast remains unsealed, a mismatched after-FEN fails before minting, and a non-checking
edge returns `undefined`. The next fresh review must compare the narrow and broad constructors for
event identity, rerun eager/exact-source parity, and exercise both the legal check-only and dual-arm
deflection lines. No production, schema, API, persistence, content or protected-design byte changed.
