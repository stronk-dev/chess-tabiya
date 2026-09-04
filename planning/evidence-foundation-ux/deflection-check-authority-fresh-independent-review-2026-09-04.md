# Deflection check authority — fresh independent buildability review

- **Date:** 2026-09-04
- **Row:** [[D2536]]
- **RFC:** `rfc/semantic-collectors.md` §3.2.1 / C17
- **Verdict:** **accepted for implementation**
- **Gate:** `make semantic-collectors-deflection-authority-fresh-review` — 5/5 plus strict TypeScript
- **Production changed by this review:** no

## What was independently exercised

The review used the legal `Ra8+ Rg8 Rxe7` check-induced line against the live runtime, not the
disposable author's plain `SealedCheckEventIdentity` model. `deflectionObservedOperands` returns
one event, and `localSemanticEvents` returns one runtime-sealed
`rules.tactic.event.check@1` value for the first edge. Its before-FEN, UCI and after-FEN equal the
first recorded anchor, its declared payload is the exact event operands object, and its triggering
move is the same UCI. `packages/runtime/src/semantic-evidence.ts` supplies the WeakSet-backed seal
and rebuild assertion; copied and crossed values are refused. [V]

The compiled manifest already exercises the exact `derivation.anyOf` shape on attraction, and
`tools/d2120-module-registration-author-contract/generate.ts` selects that union before falling
back to `projection.dependsOn`. The check arm therefore remains visible to module registration;
there is no second generator contract to invent. [V]

Both recorded-path compilers retain the first edge and its check source. The eager cost compiler
already retains a sealed semantic event. The exact-source compiler currently retains declared
check evidence and has the canonical edge beside it, so implementation can construct the required
sealed event without changing occurrence identity or asking a caller for chess truth. [V]

## Falsifiers retained

- bait-capture wins deterministically if both induction facts hold;
- missing, crossed, wrong-projection, copied/unsealed and unnecessary check evidence fails before
  event emission;
- the check input must be the exact first recorded edge, never another edge with equal prose;
- the two arms mint one stable deflection identity, never duplicate events;
- all three call sites—permanent sequence coverage, recorded-path cost and recorded-path source
  closure—must forward the same typed event boundary.

## Review finding

No blocking ambiguity remains. The author model by itself did not prove the runtime seal, but the
RFC never treated it as production authority, and this pass exercised the real seal, union and
anchor machinery directly. The repair changes one existing projection declaration, emitter and
its three call sites under C17; it changes no schema, API, content, learner eligibility or protected
intent byte.
