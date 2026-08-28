# Bounded-policy targets — second repeat author repair

**Date:** 2026-08-28

**Input:** `second-repeat-author-handoff.md`; [[D1962]]–[[D1968]]

**Status:** author checkpoint only; fresh independent buildability review required.

## What changed

1. The RFC assigns the threat-pass chronology to one exported `threatPassAnchor()` in
   `tactics.ts`; both `threats()` and target admission must consume it.
2. Target identity no longer claims an initial promoted flag. Only a promotion observed while
   replaying an exact legal edge changes the tracked role.
3. `target_captured` is absent because candidate and victim share a colour. An unexplained identity
   mismatch abstains instead of becoming chess-state evidence.
4. The bounded result is a three-arm algebra: `not_reintroduced`, `reintroduced`, or
   `survives_every_defence`. Three- and four-move tuples replace nullable arbitrary arrays and
   duplicated booleans.
5. The public operation is one source-position batch. It owns a set-equal exchange population and
   the complete legal-candidate population, so it can enforce 512 pairs before fan-out. There is no
   public per-item bypass.
6. Background work now has a topology: one active job, eight queued, exact-request deduplication,
   an injected portable macrotask yield every 64 visited nodes, signal checks around the yield and
   before publication, and no partial result on cancellation.

## Executable author evidence

`make bounded-target-contract` runs 18 runtime/source controls plus five crossed strict TypeScript
controls.
The new controls prove:

- 512 succeeds and 527 refuses at the set-owning boundary;
- an abort raised from the first in-work yield returns `cancelled` at 64 visited nodes;
- one active plus eight queued is a finite admission model;
- malformed witness lengths/dialects refuse at runtime; and
- universal-without-witness, negative-with-witness, abstention-with-evidence,
  preserved-with-return and removed-without-return fail to typecheck.

`make bounded-target-census` also passed 11/11 in 171.44 seconds. Semantic counts and the 111/333
pair maxima remained unchanged; observed timing stayed inside every background envelope. The
tracked census receipt keeps its baseline timing values because wall-clock-only drift is not a
semantic corpus update.

The old repeat-review target is deliberately retained as the return instrument. Its source-shape
assertions are expected to stop describing the amended RFC; an independent reviewer must rewrite
or replace them from the new contract rather than accepting the author's controls as proof.

## Boundary retained

No production, provider, policy, learner surface, pack, schema, migration or protected intent byte
changes in this author pass. The exact target facts remain inspector-only, and provider-backed
categories remain in the two later RFCs.
