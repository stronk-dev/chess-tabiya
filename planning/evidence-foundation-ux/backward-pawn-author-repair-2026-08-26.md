# Backward-pawn identity-rich successor — author handoff (D1723)

**Author action, not implementation authority.** The archived structural-reading convention is
plausible but hidden, and its file-only reading/event cannot power precise guidance. Author this as
one semantic successor alongside D1722 convention provenance and D1718 subject-safe avoidance; do
not patch renderer prose around the missing subject.

## Measured input

`design/research/backward-pawn-semantic-and-payload-boundary.md` and
`tools/d1723-backward-pawn-harness/` establish:

- the exact current convention is no same/not-ahead adjacent pawn support plus enemy pseudo-pawn
  control of the next square;
- 403 file observations represent 404 exact subjects over 754 authored + 579 imported decisions;
- every current reading carries zero squares;
- 251/404 subjects have an empty stop and 153/404 an occupied stop (8 own / 145 enemy);
- 99 subjects are isolated, 305 have an adjacent pawn ahead, 145 sit on a half-open file and seven
  can pseudo-capture an enemy pawn immediately;
- the population spans all four phase bands; and
- five authored leaves live in three exact documents.

## Contract to author

1. Register `backward-pawn@2` through D1722's convention registry. State the exact narrow relation
   and its non-claims; do not call it universal rules truth.
2. Emit one reading per exact pawn subject with pawn/stop/controller/support/ahead/occupancy/capture
   and half-open operands. A file-only summary may be derived for presentation/legacy predicates.
3. Add a versioned authored-predicate discriminator. Preserve v1 behavior/history and classify all
   five leaves before migration.
4. Track subject identity through signed events: before square, after square/removal, and exact
   before/after receipts. Do not match only `{color,file}` when doubled pawns exist.
5. Feed D1718 avoidance with root pawn + requested relation/outcome and distinct supporting moves.
   The current family/file event cannot satisfy v2.
6. Keep the broad static fact separate from a legal-advance consequence. Add the latter only from an
   empty stop plus exact legal-move authority, then enumerate legal opponent pawn captures after the
   hypothetical push. Pseudo attack does not imply legal capture.
7. Let modules decide distance and relevance: theory-only highlight, post-commit changed relation,
   optional candidate, optional legal reply. Weakness, best move, outpost value and inferred intent
   remain outside the collector.

## Able-to-fail criteria

- Canonical/mirrored support-controller positives and support/piece-only-control negatives.
- Empty/own-occupied/enemy-occupied stop states remain distinguishable.
- Isolated overlap and immediate-capture state follow the declared convention, not an implicit
  Stockfish-style exclusion.
- Two qualifying pawns on one file yield two subject identities and one optional derived file
  summary.
- Legal-advance consequence abstains on occupied stop, wrong turn or illegal move; legal reply
  enumerates rather than infers controller legality.
- Fixed 403/404/251/153 census and exact input/result identity are bound into D1711 validation.
- Five authored leaves are explicitly v1 or v2 and their actual predicate traces pass.
- Board renderer lights only declared pawn/stop/controller operands; ordinary wording is bounded by
  the chosen module, while Advanced can disclose the convention id.

## Landing order

Land D1722 convention provenance first; author/review the backward-pawn v2 source/schema contract;
implement reading/predicate/event and content migration; bind D1711 validation; then land D1718
avoidance and module/renderers. Do not expand authored packs until the source contract is stable.
