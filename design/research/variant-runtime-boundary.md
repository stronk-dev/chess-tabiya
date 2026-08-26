# Rules-aware variant runtime boundary — executable scope pass

**Date:** 2026-08-26
**Question:** What must become rules-aware for Tier-2 play, and what must instead remain
standard-only and be suppressed?
**Instrument:** `tools/d1674-variant-runtime-harness/` (disposable research code)
**Feeds:** [[D1674]], [[D1678]], [[D1679]], `rfc/variants.md`

## Verdict

**The chess library is not the blocker; the product authority is. The migration has two different
halves and treating them as one would manufacture evidence.** `[V]`

Chessops 0.15.1 accepts `P@e4` as a legal Crazyhouse drop from a position with a white pawn in its
pocket, plays it, and serializes the resulting board and empty pocket. The shipped run cannot
create that start through its standard `Chess` authority and separately rejects the same drop as
`malformed-UCI` because `commitMove` requires `isNormal`. `[V]`
`tools/d1674-variant-runtime-harness/variant-runtime.test.ts`; production seam
`packages/runtime/src/runtime.ts:269-292`.

A King-of-the-Hill position with the white king on e4 is a White variant win under the same pinned
library and a standard-chess draw. This is an able-to-fail control for the terminal authority:
replacing only move parsing while retaining `terminalOutcome(Chess)` is not variant support. `[V]`
Harness test `proves a rules-distinct terminal cannot be reduced to standard checkmate`;
`packages/runtime/src/events.ts:343`, `packages/runtime/src/outcome.ts:6-15`.

## Exact production census

The TypeScript-AST arm counts calls, not imports, declarations, comments or tests. At this checkout
there are **159 calls across 32 production files**: **146** `positionFromFen`, **11**
`exactLegalMoves`, and **2** `terminalOutcome`. The prior [[D1674]] figure of 181 was a textual
occurrence count and is superseded for migration sizing. The complete per-file map is literal in
the harness and a new or moved call fails the test. `[V]`

The files divide into two contract populations:

1. **Nine rules-aware authorities:** run creation/commit/projection, canonical setup/FEN, exact
   move identity, PGN export, board input, opponent selection/mock-engine legality, and session
   start. These must receive the durable rules/setup identity and share one position, move,
   notation and outcome interface. `[V]` Literal file set in `rulesAwareFiles`.
2. **Twenty-three standard-only readers:** semantic, tactical, structural, phase, endgame,
   tablebase, objective, comparison and sourcing code. Tier-2's current product promise is
   evidence-dark play, so these need a total capability disposition and must be refused before
   invocation unless a later per-ruleset collector is independently validated. `[V]` The harness
   derives this population as the census complement rather than a hand-count.

This is why a mechanical replacement of `positionFromFen(fen)` with
`positionFromFen(fen, rules)` is wrong. It would make the branch legal while allowing standard
concept names, evaluations or terminal assumptions to run over Atomic, Antichess or Crazyhouse.
The right production seam is one rules-aware play authority plus one exhaustive evidence
capability gate. `[M]`

## Minimum author amendment

The returned RFC should specify:

- a durable `rules + setupOrigin` identity on the run/session event;
- one rules-aware position constructor, move union (normal + drop), canonical serialization,
  notation and outcome operation used by the nine authority files;
- an operation-set-equal capability receipt covering the other 23 files and every server evidence
  enqueue path;
- a Crazyhouse drop that survives create → commit → event projection → rewind/fork → PGN/export →
  resume, and at least one rules-distinct terminal per Tier-2 family;
- refusal fixtures proving every standard-only collector stays dark rather than receiving a
  variant position.

The pass does **not** establish Fairy-Stockfish packaging, correct PGN setup classification,
campaign completion, detector validity for any Tier-2 ruleset, or acceptable variant UX. Those
remain [[D1675]]–[[D1681]]. `[V]`
