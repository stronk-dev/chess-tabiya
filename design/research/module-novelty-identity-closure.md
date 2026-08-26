# Module novelty identity closure

**Question.** Can `positionNovelty@1` recognize the same learner-facing fact across two real
ancestor nodes without treating run-location bytes as chess identity, and what is the exact
projection closure? ([[D1164]], [[D1693]], [[D1694]])

**Method.** Derived the three module accept sets literally from `module-registration.md` §1.3
and current catalogue constants, joined every id to the compiled manifest, classified each
possible member as stable compared fields or explicit exemption, then exercised the declarations
over distinct FEN/move/node anchors. Disposable instrument:
`tools/d1164-novelty-identity-harness/`. `[V]`

## Verdict

The identity mechanism is buildable, but the RFC is not yet internally decidable. The literal
post-commit set is **43**, not 38; structure adds six; theory adds four with one overlap. The
possible identity registry therefore has **52 unique projections**, while the active novelty
closure is either **49** or **52** depending on the unresolved contradiction in
`theory_breadcrumb`:

- its declaration says `on_request`, and §1.5 says repeated on-request answers may not be
  suppressed, which implies `noveltyWindow: 0` and a 49-id active closure;
- the next paragraph calls it proactive and assigns window 3, which implies the full 52-id
  closure.

The instrument derives both and chooses neither. Under the RFC's own stated repeat-request rule,
the conservative author correction is window 0 unless the timing/initiative is deliberately
amended and re-reviewed. `[V]` `rfc/module-registration.md:272-274,420-456`.

## 1. Exact closure, not a hand total

| accepted family | exact members | count |
|---|---|---:|
| postcommit structural events | eight of eleven; excludes piece count, direct attack count, line blockers | 8 |
| transition geometry events | occupied attack/defence, slider ray, piece escape, defended duty | 5 |
| transition rule events | all except clock reset | 7 |
| castling | rights lost | 1 |
| tactical events | double attack, check, loose piece | 3 |
| exchange derivations | capture class, trade completed | 2 |
| structural tactical event | pawn islands | 1 |
| semantic avoidance | eight structural plus loose piece and pawn islands | 10 |
| pawn/king/activity events | pawn dynamics/transitions, king zone/captured defender, open-file occupancy | 5 |
| grade | move quality | 1 |
| **postcommit total** | set-equal literal union | **43** |
| structure readings | shape, named structure, space, connectivity, phase, endgame | 6 |
| theory readings | claim, shape, population summary, opening identity | 4 (3 new) |

The executable union is 43 + 6 = 49 without theory suppression, or 43 + 6 + 3 = 52 with it.
`theory.shapes.firing@1` is the overlap. A new or removed accepted projection fails set equality
until the identity registry classifies it. `[V]`

## 2. Stable identity vocabulary

The registry is a closed union:

```ts
type NoveltyIdentityDeclaration =
  | { projection; kind: "stable"; comparedFields }
  | { projection; kind: "exempt"; reason };
```

Every stable field is checked to be a literal operand of its projection. The following grouped
rows are the exact matrix; the harness expands them set-equal over all 52 ids. `[V]`

| projection family | stable compared fields |
|---|---|
| eight structural events | `family, before, after` |
| five geometry events | `subject, targets_before, targets_after` |
| six non-capture rule events | `mover, detail` |
| capture | `mover, captured, enPassant` |
| castling rights lost | `color, wing` |
| double attack | `mover, targets` |
| check | `checkingPieces, checkedKing, attackSquares, rays` |
| loose piece | `mover, before, after` |
| capture class | `capture, exchange, class` |
| trade completed | `landingSquare, first, second` |
| pawn islands | `family, color, before, after` |
| ten avoidance projections | `relation, family` |
| pawn dynamics / transition | `kind, subjects` / `kind, pawn` |
| king zone / captured defender | literal king-state operands / `capture, capturedSquare, kingColor, defender` |
| open-file occupancy | `piece, fileClass, sourceReading` |
| shape firing | `entryId, openEnded` |
| named structure | `provenanceNote` |
| space / connectivity | state payload without FEN |
| phase | `phase` |
| endgame | `type, techniques` |
| authored claim | `id` |
| population summary | typed stats or abstention fields without node id |
| opening identity | `kind, sourceId, values` |

`derived.grade.move_quality@1` is the sole explicit exemption. Its subject is the just-committed
edge: a second inaccuracy on a later edge is a new recorded fact, not a repeated position fact.
Suppressing it because its class string repeats would make a post-commit grade disappear exactly
when the learner repeats the behavior. `[M]` product-contract reasoning over the projection's
declared per-edge semantics; the exemption makes the judgment visible and reviewable rather than
encoding it in an accidental key.

## 3. Volatile bytes are forbidden from identity

The executable checker refuses every run-location operand in `comparedFields`: node/event ids,
all before/after/start/boundary/end FEN spellings, all UCI/move anchors, triggering move,
shape first/last node, and retrieval timestamp. A structural event with different FENs and moves
but the same semantic `family/before/after` matches; changing a geometry subject does not.
Positive `rules.structural.event.isolated_pawn@1` and
`derived.semantic_avoidance.isolated_pawn@1` remain distinct because projection id is part of the
identity, so polarity cannot collapse. `[V]`

Optional union fields are omitted rather than serialized as `undefined`, keeping stats and
abstention variants canonical and distinct. `[V]`

## Author handoff

Before `module-registration` can return to review:

1. replace every `38 + 6 + 4`/derived prose total with a set-equal derivation from declarations;
2. resolve [[D1694]]—recommended: keep `theory_breadcrumb` on request and set window 0;
3. add the closed `NoveltyIdentityDeclaration` vocabulary and the exact grouped rows above;
4. make active closure set-equal to accepts of modules whose final `noveltyWindow > 0`;
5. teach `factIdentity` to use a stable row, preserve exempt facts, and abstain on no missing row;
6. run distinct-node/boundary, changed-subject, polarity and grade-exemption negatives.

This closes the research half of [[D1164]] and [[D1693]]. [[D1694]] remains an author semantic
correction, and no production implementation is authorized until amendment, repeat review and
acceptance.

## Limits

- Identity says whether two declared facts are the same for bounded suppression; it does not say
  whether either fact is useful enough to render.
- The grade exemption is explicit product policy, not chess truth.
- Durable cross-run novelty still belongs to the longitudinal store.
- No protected design, production contract, manifest, RFC or content changed.
