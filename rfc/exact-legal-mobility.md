# RFC: Exact legal mobility

- **Status:** draft — amendment 2026-08-23, **returned for cross-review before implementation
  closeout.** The RFC was accepted earlier that day, then owner ruling [[D1029]] reversed its
  castling normalization before implementation: move identity stays Chess960-safe king-to-rook;
  semantic destination is the king's c/g landing square; display stays SAN. The non-castling
  contract remains accepted. The amendment also incorporates the implementation audit at
  `planning/exact-legal-mobility/d1029-consumer-audit.md`: the old review saw the web/server
  disagreement but missed three downstream destination consumers and a semantic canonicalizer
  which would rewrite identity. Acceptance must be re-declared on those able-to-fail seams.
  *(Prior state for history: accepted 2026-08-23 by claude after an independent review failed 8 of
  20 claims, including a false byte-identity assertion.)*
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
in one FEN, retaining origin, **move identity**, **semantic destination**, role and promotion
identity. Castling makes the distinction observable: `uci` is chessops' Chess960-safe king-to-rook
identity, `to` is the king's c/g landing square, and display remains SAN `O-O`/`O-O-O`. The projection is the
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
export interface ExactLegalMove {
  readonly uci: string;
  readonly from: SquareName;
  readonly to: SquareName;
  readonly role: Role;
  readonly promotion?: "queen" | "rook" | "bishop" | "knight";
}

export interface ExactLegalMoveMap {
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

The runtime also exports literal `MOVE_IDENTITY_CONVENTION = "chessops-king-takes-rook@1"` and
`MOVE_DESTINATION_CONVENTION = "king-landing-square@1"` constants. A field named `uci` without a
declared convention is not sufficient at a source/runtime boundary.

The helper parses and canonicalizes the FEN through the shipped runtime parser, enumerates the
actual side to move only, checks every emitted move with `Chess.isLegal`, and sorts by UCI.
`pieces` contains **one row for every piece of the side to move**, sorted by origin square, and a
piece with no legal move keeps its row with an empty `moves` array. (The drafted phrasing —
"retain rows with zero legal moves only when the piece exists on the side-to-move board" — is
tautological, since every side-to-move piece is on the board; the rule it was reaching for is the
one stated here, and criterion 1 now counts the rows.) `ExactLegalMoveMap.fen` is the canonical full
FEN and every move's color equals `turn`.

The authority **does not normalize castling identity to the king's destination**. It emits the
chessops king-to-rook form (`e1h1`, `e1a1` in standard chess), because that same identity survives
Chess960. The move row's separate `to` is `g1`/`c1`; a square overlay and piece route consume `to`,
whereas replay/submission consumes `uci`. SAN display remains `O-O`/`O-O-O`.

Lichess opening-explorer bytes already use king-to-rook identity —
`content/candidates/priority-wave4b-bg4/priority.json` contains
`{"san":"O-O","uci":"e1h1"}` — but source and runtime remain separately declared boundaries.
Explorer claim evaluation matches on SAN (`apps/server/src/sourcing/claim-binding.ts:135`). A
future UCI join must validate both declared conventions rather than inferring equivalence from the
field name.

A pawn destination on the last rank expands to four distinct moves, one for each promotion role.
En-passant retains its ordinary from/to UCI; this projection does not add an inferred
captured-square operand. Duplicate UCI is a hard failure.

An invalid FEN throws the existing `TypeError("Invalid chess FEN: …")` family at the runtime
boundary. A valid checkmate or stalemate returns an exact empty map, not an abstention and not an
error. Legal emptiness is evidence.

### 1.2 One authority, explicit consumers

The actual-turn roots move onto the helper in the same implementation:

1. `apps/web/src/lib/board-input.ts` derives its origin-to-UCI map from
   `exactLegalMoveMap`; pointer/touch, keyboard, text and semantic-grid input therefore share the
   same move identities as evidence sight. Pointer/semantic selection uses each move's `to`, while
   submission uses its `uci`; SAN and either common castling spelling normalize to that identity.
2. `apps/server/src/sourcing/legal-moves.ts` imports/re-exports the runtime enumerator and retains
   its SAN/successor composition locally; claim binding and tablebase walk no longer own a second
   move generator. Its existing king-to-rook castling identity stays byte-compatible.
3. `packages/runtime/src/mobility.ts` uses the helper for the actual-turn exact projection. Its
   existing B/N/R/Q opposite-turn and `local-non-losing@1` calculations remain private to the
   convention projection.
4. The simple actual-turn counts/lists in `tempo.ts`, `pivotal.ts`, `semantic-evidence.ts`,
   `application.ts` and `opponent-selector.ts` consume the same authority rather than retaining
   five more root enumerators.

Four destination consumers are explicitly in scope because the D1029 audit proves that sharing
identity without sharing destination still produces wrong chess: `board-input.ts`,
`board-model.ts` last-move highlighting, `compare-strips.ts` piece routes, and castling operands in
`semantic-evidence.ts`. Each derives the king's c/g square from the exact move row plus the
pre-move FEN. No consumer slices castling `uci` and calls the rook's original square a piece
destination.

The bounded mate/tactic/search functions may need promotion expansion, reply ordering or cloned
positions in a shape that the source projection does not. They are not blindly replaced.

**The census is a counted job, not a gesture.** There are **14** production `allDests()` sites at
drafting HEAD (excluding tests and the one occurrence inside `evidence-catalog.ts:189`'s convention
prose): ten in `packages/runtime` (`pawn-dynamics.ts:473`, `mate-proof.ts:38`, `king-state.ts:100`,
`tempo.ts:118`, `exchange.ts:76`, `square-control.ts:85`, `pivotal.ts:26`,
`semantic-evidence.ts:974`, `tactics.ts:795`, `mobility.ts:82`), one in `apps/web`
(`board-input.ts:200`) and three in `apps/server` (`application.ts:104`,
`opponent-selector.ts:307`, `sourcing/legal-moves.ts:12`). Seven actual-turn roots move onto the
authority. Seven clone/bounded-search sites remain local with a named reason and CI classification.

The census classifies each site into exactly one of two kinds, because they are not testable the
same way:

- **actual-turn root enumerations** — they enumerate the supplied FEN's own side to move. These
  either import the authority or carry a named semantic reason plus a set-equality fixture over
  ordinary, check-evasion, castling, en-passant and promotion positions;
- **clone or bounded-search enumerations** — they enumerate a position that is deliberately *not*
  the supplied FEN's actual turn (a color-flipped, en-passant-cleared clone, a successor node, or a
  depth-bounded reply set). `square-control.ts:85` and `king-state.ts:100` are of this kind, and the
  catalogue already declares the convention and its `invalid_turn_clone` abstention
  (`evidence-catalog.ts:189`). **A set-equality fixture against the actual-turn authority cannot
  pass for these, by construction** — demanding one would be an unsatisfiable criterion, not a
  control. They carry a named semantic reason and an explicit recorded statement that set-equality
  against `exactLegalMoves(fen)` does not apply and why.

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

**D1's owner needs to know what that binding actually costs, because the obvious route is closed.**
`board.selected_square_sight@1` declares `projections: allStructuralReadingIds`
(`packages/runtime/src/evidence-catalog.ts:869`), and `allStructuralReadingIds` is *derived* —
`STRUCTURAL_READING_PROJECTION_IDS.filter((id) => !id.endsWith(".pawn_count"))` at `:857`, over
`STRUCTURAL_READING_PROJECTION_IDS = STRUCTURAL_FEATURE_KINDS.map((kind) => \`rules.structural.reading.${kind}\`)`
at `:112`. `STRUCTURAL_FEATURE_KINDS` is imported from `@chess-tabiya/schema/drill-pack` and is
asserted set-equal to the JSON schema's `$defs.structuralFeature` branch consts
(`packages/schema/src/drill-pack.test.ts:78`). So the list can only be widened by changing the
**pack schema** — which criterion 13 forbids and this RFC's `none` claims block does not cover.
`rules.mobility.reading.legal_moves` is not a structural feature kind and never can be. The binding
must therefore convert that consumer's `projections` from a pure derivation into
`[...allStructuralReadingIds, "rules.mobility.reading.legal_moves"]` — a consumer-spec edit in
`evidence-catalog.ts`, claiming nothing. Two useful consequences follow: nothing auto-binds when the
projection is registered (criterion 9's "no learner binding at the checkpoint" holds for free), and
D1 is a one-line consumer change rather than a vocabulary change.

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
2. Move server sourcing and web input onto it. Preserve king-to-rook identity; split semantic
   destination from submission and pin SAN display.
3. Add the exact mobility reading and strict evidence adapter.
4. Register the projection inspector-only and update manifest counts/digest fixtures.
5. Add the remaining-enumerator census, set-equality controls, and the D1029 destination-consumer
   closure for board highlight, comparison route and semantic castling operands.
6. Update runtime, drill-client, evidence-manifest and sourcing documentation.
7. Complete ledger/log/register closeout; leave the learner binding on D904's named discharge.

## 6. Acceptance criteria

1. **Complete ordinary map:** the initial position emits exactly **20** legal moves across
   **16 piece rows**, of which exactly **10** are non-empty (eight pawns, two knights) and **6** are
   empty (two rooks, two bishops, queen, king). The row count is asserted separately from the move
   count because an implementation that silently drops zero-move rows produces the same 20 moves
   and the same ten movable pieces. `exactLegalMoves(fen)` equals the flattened, UCI-sorted
   concatenation of `exactLegalMoveMap(fen).pieces[*].moves`; every UCI replays legally; the payload
   is deterministic under repeated calls.
2. **Pins and check:** an absolutely pinned piece omits illegal destinations, while a check position
   emits only legal evasions. Pseudo-attacks never enter this projection.
3. **Castling:** legal king- and queen-side castling emit king-to-rook identity exactly once and
   separately retain the king's c/g semantic destination; rights without a clear/legal path emit
   neither move. SAN renders `O-O`/`O-O-O`.
4. **En-passant:** one legal and one king-exposing illegal en-passant fixture separate exact
   legality; the illegal move is absent from input, evidence and successor walk alike.
5. **Promotion:** one promotion position emits exactly q/r/b/n UCI identities on the same
   destination; square sight deduplicates the destination while keyboard/text submission retains
   all four choices.
6. **Terminal emptiness:** checkmate and stalemate each return a typed exact map whose `pieces`
   array is **non-empty** — one row per side-to-move piece — with every `moves` array empty, and
   neither produces an abstention, an error or `unavailable`. (An empty `pieces` array passes a
   test that only checks "zero moves", which is why the row rule is asserted here too.) The two
   terminals are distinguished by the caller from the input FEN's check state; this projection
   deliberately adds no terminal operand.
7. **Cross-layer identity and destination:** for every permanent special-move fixture, runtime
   projection, web submission and server sourcing return set-equal move identity. Standard-castling
   identity is pinned to literal `e1h1`/`e1a1`/`e8h8`/`e8a8`; the same rows' semantic destinations
   are `g1`/`c1`/`g8`/`c8`. Pointer destination, semantic board, last-move highlight, comparison
   route and transition operands agree on c/g while SAN agrees on `O-O`/`O-O-O`. A Chess960
   fixture with king/rooks off e/a/h proves identity remains replayable and destination remains c/g.
   Deleting one promotion or conflating either castling layer fails the fixture.
8. **Adapter integrity:** wrong origin, role, color, destination, promotion suffix, illegal UCI,
   duplicate UCI and missing top-level operand each fail before `DeclaredEvidence` construction.
9. **Manifest closure:** producer count is unchanged, projection count moves by exactly one, and
   the new id is exact/inspector-only with no learner binding at the checkpoint. Relabelling the
   old convention projection exact fails.
10. **Modality ceiling:** a focused board fixture proves pointer/touch, keyboard semantic cells and
    spoken/ARIA output reveal equal destination sets at the same ceiling and equally reveal none
    when requested sight is withheld. For castling, all three expose the king's c/g destination
    while the committed move retains king-to-rook identity. Ordinary legal submission remains
    functional.
11. **No verdict laundering:** production renderers for this projection contain none of `safe`,
    `unsafe`, `good`, `bad`, `best`, `trapped`, `restricted`, `outpost`, `threat`, `blunder` or
    `mistake`; a negative fixture attempts at least `safe` and is refused.
12. **Enumerator closure:** the source census lists all **14** production `allDests()` sites named in
    §1.2 and classifies each as actual-turn root or clone/bounded-search. Root sites either import
    the authority or carry a named reason plus the five special-case set-equality controls;
    clone/bounded-search sites carry a named reason and a recorded statement that set-equality
    against `exactLegalMoves(fen)` does not apply. Demanding the five controls of a color-flipped
    clone would be unsatisfiable by construction, so the two classes are asserted separately. An
    unclassified new loop fails CI.
13. **Scope:** no pack/run/shape/principle schema, migration, content, preset or bot profile changes;
    register/status parity and focused runtime/web/server tests pass.
14. **Closeout:** implementation updates canonical docs, flips D904/D1022/D1027/D1028/D1029,
    appends the RFC log, records the learner binding as still undischarged, and only then may await
    that binding.

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
- 2026-08-23 owner amendment D1029: reversed the accepted king-destination UCI normalization.
  Castling now retains Chess960-safe king-to-rook move identity, a separate king-landing semantic
  destination and SAN display. The implementation audit added board last-move highlight,
  comparison route and semantic-event identity/destination as able-to-fail consumers; a Chess960
  fixture is now mandatory. Status returned for independent cross-review before closeout.
- 2026-08-23 cross-review: eight corrections, one of them a false statement about existing behavior.
  (1) **§1.2's "prove public behavior byte-identical" is false for the server arm.** Verified by
  running chessops at HEAD: `allDests()` + `makeUci` over `r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1`
  returns `e1a1 e1d1 e1d2 e1e2 e1f1 e1f2 e1h1` — `e1g1`/`e1c1` are **never produced**.
  `board-input.ts:205-207` converts a/h to c/g; `sourcing/legal-moves.ts:12-27` does not. So the two
  layers already disagree on every castling move, and moving the server onto a normalizing authority
  is a deliberate behavior change. The blast radius is now measured instead of assumed: a sweep of
  every `content/**/*.evidence.json` binding finds exactly **one** `uci` assertion argument
  (`philidor-third-rank-hold`, `h6h8`, not castling), so **zero committed bindings change validity**,
  and the census/unique-move assertions return SAN rather than UCI.
  (2) Recorded the D982 consequence: **Lichess's explorer uses the rook form and its bytes are
  already committed** — `content/candidates/priority-wave4b-bg4/priority.json` carries
  `{"san": "O-O", "uci": "e1h1"}`. Two `uci` conventions now live under one field name; explorer
  claim evaluation matches on SAN (`claim-binding.ts:135`), so nothing breaks today, and no code may
  start joining the two without an explicit conversion.
  (3) **§3's binding route was closed and the RFC did not know it.**
  `board.selected_square_sight@1` declares `projections: allStructuralReadingIds`
  (`evidence-catalog.ts:869`), derived at `:857`/`:112` from `STRUCTURAL_FEATURE_KINDS`, which is the
  **pack schema's** vocabulary (`packages/schema/src/drill-pack.test.ts:78` pins it to
  `$defs.structuralFeature`). Widening it is a pack-schema change that criterion 13 forbids and the
  `none` claims block does not cover. D1's real cost — a consumer-spec literal — is now stated. The
  same check refutes an auto-binding hazard: registering the projection binds nothing, so criterion
  9 holds for free.
  (4) §1.1's zero-move-row rule was tautological ("only when the piece exists on the side-to-move
  board"); replaced with the decidable rule, and criteria 1 and 6 now count rows — both were passed
  by an implementation that drops empty rows.
  (5) Criterion 1 gains the exact row arithmetic (16 rows / 10 non-empty / 20 moves) and the
  `exactLegalMoves` ↔ `exactLegalMoveMap` consistency assertion.
  (6) **Criterion 12 was unsatisfiable by identity for part of its population** (D984 class): it
  demanded five set-equality controls of "every intentionally local root enumeration", but
  `square-control.ts:85` and `king-state.ts:100` enumerate deliberately color-flipped clones whose
  legal set *cannot* equal the actual-turn authority's — the catalogue already declares that
  convention and its `invalid_turn_clone` abstention (`evidence-catalog.ts:189`). Split into
  actual-turn-root and clone/bounded-search classes with different controls.
  (7) The census is now counted: **14** production `allDests()` sites, each named with file and
  line; three move onto the authority, **11** require classification — a materially larger job than
  "there are other local search enumerators in the tree" conveys.
  (8) `ExactLegalMove` / `ExactLegalMoveMap` were unexported in a block whose functions were
  exported; consumers could not name the types.
  Re-derived and unchanged: `packages/runtime/src/legal-moves.ts` does **not** exist, so §1.1 adds
  rather than edits; `rules.mobility` producer exists at `evidence-catalog.ts:733` with
  implementation `packages/runtime/src/mobility.ts`, so criterion 9's "producer count unchanged,
  projection count +1" is right; the characterization of `rules.mobility.reading.piece_destinations`
  is exact at `:599-605` — `declared_convention` / `convention`, semantics
  `BREADTH_CONVENTION_TEXT.localNonLosing`, "B/N/R/Q … only", `invalid_turn_clone` abstention;
  `local-non-losing@1` is byte-exact at `mobility.ts:8`; `TypeError(\`Invalid chess FEN: ${fen}\`)`
  is byte-exact at `chess.ts:8`; the initial position's 20 moves over ten movable pieces recomputes
  correctly; D904, D1022, D520 and D783 all exist as ledger rows.
