# RFC: Exact legal mobility

- **Status:** draft 2026-08-23 — executes D904 from completed D783 research; independent
  buildability review required before acceptance
- **Author:** codex, on the D904 evidence-foundation routing
- **Created:** 2026-08-23
- **Design refs:** `design/05-in-run-experience.md` §3 (rung-0 rules-derived sight and requested
  exact sight pre-commit); §3b (touch, pointer and keyboard equivalence); §4 (forms cannot widen
  content); `design/03-product-breadth.md` board/support surfaces
- **Exploration gate:** complete in `design/research/identity-retaining-mobility.md` and
  `tools/d783-piece-mobility-harness/`; the existing accessible-board-input fixtures establish
  exact castling, en-passant and four-promotion submission behavior
- **Depends on:** implemented F1 evidence manifest
  (`rfc/archive/evidence-contract-manifest.md`) and implemented accessible board input
  (`rfc/accessible-board-input.md`)
- **Parent / amends:** follow-up to implemented `rfc/breadth-collectors.md` §3.2; it adds an exact
  projection and does not redefine either `piece_destinations@1` projection
- **Supersedes / superseded by:** —
- **Planning:** `planning/exact-legal-mobility/` once accepted/implementing

```tabiya-claims
none
```

**Why `none`.** This RFC adds one independently versioned evidence projection and one exported
runtime helper. It changes no closed vocabulary, JSON schema, database migration or registered
shared version. F1 explicitly makes the evidence catalogue an extensible set of per-projection
versions rather than a single shared-resource head.

## Summary

Add `rules.mobility.reading.legal_moves@1`: the complete exact legal-move map for the side to move
in one FEN, retaining origin, destination, role, UCI and promotion identity. The projection is the
rules fact needed by selected-square/touch/hover sight. It says where a piece can legally move; it
does not say which destination is safe, good, likely, theoretical or recommended.

The current `rules.mobility.reading.piece_destinations@1` cannot serve this job honestly. Its exact
legal destination sets are fused with `local-non-losing@1`, so the manifest correctly labels the
whole payload `declared_convention / convention`. It also covers only bishops, knights, rooks and
queens and manufactures opposite-turn clones. Changing its grounding or admitting only selected
operands would make one wrapper mean two evidentiary strengths. This RFC instead creates one exact,
actual-turn projection and leaves the convention projection byte-compatible for mobility events,
research, bots and advanced inspection.

The implementation also makes one runtime move enumerator authoritative for this projection, the
web board-input controller and the server's tablebase/claim successor walk. There are other local
search enumerators in the tree; they may remain only when their bounded-search semantics differ,
and permanent conformance fixtures must prove their emitted root move identities are set-equal to
the authority. No implementation should fix legal mobility by adding another independent
`allDests()` loop.

## 1. Exact move authority

### 1.1 Canonical enumeration

Add a dependency-free runtime helper under `packages/runtime/src/legal-moves.ts`:

```ts
interface ExactLegalMove {
  readonly uci: string;
  readonly from: SquareName;
  readonly to: SquareName;
  readonly role: Role;
  readonly promotion?: "queen" | "rook" | "bishop" | "knight";
}

interface ExactLegalMoveMap {
  readonly fen: string;
  readonly turn: Color;
  readonly pieces: readonly {
    readonly piece: { readonly square: SquareName; readonly role: Role; readonly color: Color };
    readonly moves: readonly ExactLegalMove[];
  }[];
}

export function exactLegalMoves(fen: string): readonly ExactLegalMove[];
export function exactLegalMoveMap(fen: string): ExactLegalMoveMap;
```

The helper parses and canonicalizes the FEN through the shipped runtime parser, enumerates the
actual side to move only, checks every emitted move with `Chess.isLegal`, and sorts by UCI. Piece
rows sort by origin square and retain rows with zero legal moves only when the piece exists on the
side-to-move board. `ExactLegalMoveMap.fen` is the canonical full FEN and every move's color equals
`turn`.

The authority normalizes chessops' castling destination representation to standard UCI king
destinations (`e1g1`, `e1c1`, `e8g8`, `e8c8`). A pawn destination on the last rank expands to four
distinct moves, one for each promotion role. En-passant retains its ordinary from/to UCI; this
projection does not add an inferred captured-square operand. Duplicate UCI is a hard failure.

An invalid FEN throws the existing `TypeError("Invalid chess FEN: …")` family at the runtime
boundary. A valid checkmate or stalemate returns an exact empty map, not an abstention and not an
error. Legal emptiness is evidence.

### 1.2 One authority, explicit consumers

Three existing paths move onto the helper in the same implementation:

1. `apps/web/src/lib/board-input.ts` derives its origin-to-UCI map from
   `exactLegalMoveMap`; pointer/touch, keyboard, text and semantic-grid input therefore share the
   same move identities as evidence sight.
2. `apps/server/src/sourcing/legal-moves.ts` imports/re-exports the runtime enumerator and retains
   its SAN/successor composition locally; claim binding and tablebase walk no longer own a second
   move generator.
3. `packages/runtime/src/mobility.ts` uses the helper for the actual-turn exact projection. Its
   existing B/N/R/Q opposite-turn and `local-non-losing@1` calculations remain private to the
   convention projection.

The bounded mate/tactic/search functions may need promotion expansion, reply ordering or cloned
positions in a shape that the source projection does not. They are not blindly replaced. A source
census names every remaining `allDests()` enumerator and classifies it as either consuming the
authority or intentionally local; every intentionally local root enumeration receives a
set-equality fixture over ordinary, check-evasion, castling, en-passant and promotion positions.

## 2. Evidence projection

Register one output on the existing `rules.mobility@1` producer:

```ts
type LegalMovesReading = ExactLegalMoveMap;
```

Its manifest declaration is:

| field | value |
|---|---|
| role / plane | `reading` / `rules` |
| grounding / exactness / confidence | `position_rules` / `exact` / `exact` |
| operands | `fen`, `turn`, `pieces` |
| signs | `state` |
| answer content | `fact`, `candidate_moves` |
| forms | `list`, `lit_squares`, `piece_halo`, `panel`, `machine_condition` |
| availability / latency | inherited `local` / `sync` from `rules.mobility@1` |
| abstention | impossible for a valid FEN |
| disposition at landing | `inspector_only` pending the learner-module binding |

`candidate_moves` is literal disclosure, not ranking: the payload enumerates all and only legal
moves for the selected origin. It never returns a subset under this projection id. A consumer that
filters the set by evaluation, human frequency, theory or `local-non-losing@1` has created a new
derived proposition and must declare its own projection, answer distance and assistance ceiling.

The exact adapter accepts only the four declared top-level operands and recursively validates each
piece/move row. In particular it refuses a move whose `from` differs from its piece square, whose
role/color differs from the board occupant, whose UCI does not replay legally from `fen`, or whose
promotion member disagrees with the UCI suffix. F1's wrapper then seals that validated payload.

## 3. Delivery and assistance boundary

Landing this RFC does not add an ordinary hint card and does not change a preset. The source lands
inspector-only and becomes eligible for the existing `board.selected_square_sight@1` consumer only
when Learner Modules compiles the D904 row under its accepted ceiling table.

That binding must preserve these rules:

- exact legal sight is permitted pre-commit only when the effective assistance configuration
  admits requested sight; the rules floor may still show the board's ordinary legal destination
  affordance where the existing workflow contract requires it;
- the visible pointer/touch highlight, keyboard semantic projection and spoken/ARIA description
  inherit the same effective ceiling—no accessibility bypass and no modality receives extra
  destinations;
- a selected origin receives its complete destination set, including all promotion identities in
  non-square forms; a square overlay may deduplicate the four promotions onto one destination but
  must retain the four choices in the controller;
- no proactive card is emitted merely because a move exists or a mobility count changed;
- `local-non-losing`, attacked, defended, outpost, trapped, overloaded and engine-ranked squares
  are separate evidence joins. None may borrow this exact id as authority for its conclusion.

The current convention projection remains accepted by advanced inspection and research under its
existing declaration. It is not silently rebound to requested sight.

## 4. Refused alternatives

1. **Relabel `piece_destinations@1` exact.** Refused: one exact operand does not upgrade its
   convention-derived sibling, and the projection's meaning/version would change.
2. **Operand-scoped evidence wrappers.** Refused for this case: F1 binds projections, adapters and
   consumers, not arbitrary paths inside a payload. Introducing path-level grounding to avoid one
   small split would complicate every producer and permit accidental partial disclosures.
3. **Destination squares without move identity.** Refused: promotion produces four legal moves on
   one square, and castling normalization is part of the controller contract. Count/set-only
   output cannot prove byte-equivalence with submission.
4. **Both-color turn clones in the exact projection.** Refused: flipping turn and clearing
   en-passant is a disclosed analysis convention, not the legal move state of the supplied FEN.
   The existing convention reading may keep that research operand.
5. **Safe/good/best hover colors.** Refused here: each is a different source or derived join and a
   different answer-distance decision. Exact legality is the floor those features may later use,
   not permission to build them into this projection.
6. **A new web-only enumerator.** Refused: it recreates the divergence that made D520's promotion
   census impossible and leaves evidence, input and claim validation able to disagree.

## 5. Implementation order

1. Add the runtime exact-move types/helper and exhaustive focused fixtures.
2. Move server sourcing and web input onto it; prove public behavior byte-identical.
3. Add the exact mobility reading and strict evidence adapter.
4. Register the projection inspector-only and update manifest counts/digest fixtures.
5. Add the remaining-enumerator census and set-equality controls.
6. Update runtime, drill-client, evidence-manifest and sourcing documentation.
7. Complete ledger/log/register closeout; leave the learner binding on D904's named discharge.

## 6. Acceptance criteria

1. **Complete ordinary map:** the initial position emits exactly 20 legal moves over ten movable
   pieces; every UCI replays legally and the payload is deterministic under repeated calls.
2. **Pins and check:** an absolutely pinned piece omits illegal destinations, while a check position
   emits only legal evasions. Pseudo-attacks never enter this projection.
3. **Castling:** legal king- and queen-side castling emit standard king-destination UCI exactly
   once; rights without a clear/legal path emit neither move.
4. **En-passant:** one legal and one king-exposing illegal en-passant fixture separate exact
   legality; the illegal move is absent from input, evidence and successor walk alike.
5. **Promotion:** one promotion position emits exactly q/r/b/n UCI identities on the same
   destination; square sight deduplicates the destination while keyboard/text submission retains
   all four choices.
6. **Terminal emptiness:** checkmate and stalemate return typed exact maps with zero moves and are
   distinguishable through the input FEN/position state, never `unavailable`.
7. **Cross-layer equality:** for every permanent special-move fixture, runtime projection, web
   input and server sourcing return set-equal UCI; deleting one promotion or changing one castling
   destination fails all three arms.
8. **Adapter integrity:** wrong origin, role, color, destination, promotion suffix, illegal UCI,
   duplicate UCI and missing top-level operand each fail before `DeclaredEvidence` construction.
9. **Manifest closure:** producer count is unchanged, projection count moves by exactly one, and
   the new id is exact/inspector-only with no learner binding at the checkpoint. Relabelling the
   old convention projection exact fails.
10. **Modality ceiling:** a focused board fixture proves pointer/touch, keyboard semantic cells and
    spoken/ARIA output reveal equal destination sets at the same ceiling and equally reveal none
    when requested sight is withheld. Ordinary legal submission remains functional.
11. **No verdict laundering:** production renderers for this projection contain none of `safe`,
    `unsafe`, `good`, `bad`, `best`, `trapped`, `restricted`, `outpost`, `threat`, `blunder` or
    `mistake`; a negative fixture attempts at least `safe` and is refused.
12. **Enumerator closure:** every production `allDests()` move-enumeration loop is listed by a
    source census. Each either imports the authority or has a named semantic reason plus the five
    special-case set-equality controls. An unclassified new loop fails CI.
13. **Scope:** no pack/run/shape/principle schema, migration, content, preset or bot profile changes;
    register/status parity and focused runtime/web/server tests pass.
14. **Closeout:** implementation updates canonical docs, flips D904 and D1022, appends the RFC log,
    records the learner binding as still undischarged, and only then may await that binding.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Compile `legal_moves@1` into the selected-square/requested-sight module under the accepted per-module ceilings | `learner-modules` | module binding commit | |

## Open questions

1. **None blocks buildability review.** Exact current-turn legality, promotion identity, source
   disposition and assistance boundary are already ruled and mechanically testable.
2. Opponent-turn “where could that piece go,” locally non-losing colors, multi-ply reach and
   recommended squares are explicitly outside this projection. They require disclosed conventions
   or other sources and retain their existing ledger/RFC owners.

## Deviations from design

None. The RFC implements the recorded rung-0 requested-sight rule and deliberately does not choose
a new preset, module prominence policy or move-quality meaning.

## Changelog

- 2026-08-23: initial draft from D904 and the completed D783/accessible-input evidence.
