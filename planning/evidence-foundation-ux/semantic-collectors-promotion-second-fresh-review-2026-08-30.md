# Semantic collectors promotion pair — second fresh independent buildability review

- **Reviewed:** 2026-08-30
- **Scope:** only held projections 13–14 in `semantic-collectors.md` §3.7
- **Input:** D2141–D2143 author repair
- **Verdict:** **RETURN TO AUTHOR / PROJECTIONS REMAIN HELD**
- **Reproduction:** `make semantic-collectors-promotion-second-fresh-review` — 5/5
- **Preserved checks:** `make semantic-collectors-promotion-author-repair` 3/3 and
  `make promotion-race-contract` 6/6

The repair correctly separates descriptive geometry, exact tablebase outcome, local domain refusal
and provider failure. It also retains full recorded/live source items instead of copying labels.
The fresh pass traced those items through the actual seal, current source adapters and every output
operand. Five remaining seams can turn caller data into exact chess truth or lose the evidence that
would let downstream packs and modules verify it.

## B1 — the seal does not identify the exact adapter ([[D2179]])

`declareEvidence` is an exported runtime function that adds any producer/projection/payload tuple to
one global `WeakSet`. `assertDeclaredEvidence` checks only that set. It does not retain an adapter id
or value-authority route. The repaired geometry constructor checks the seal and literal ids, then
deliberately does not recompute `pawnContactsReading`. An internal caller can therefore seal false
contacts with the correct ids without passing through `declarePawnContactsEvidence`.

**Required repair:** consume the registered value-authority route/receipt that proves the exact
pawn-contact adapter and its recomputation ran. Alternatively give exact adapters an unforgeable
route-specific seal. Cross a generic `declareEvidence` item carrying correct ids and false payload,
not just unsealed and wrong-id objects.

## B2 — recorded tablebase values have no exact value authority ([[D2180]])

The recorded outcome arm trusts `DeclaredEvidence<RecordedTablebaseReading>`. Its current named
adapter is a generic `exactObject` call that checks only five top-level keys. It does not validate
canonical FEN, piece count, category, DTZ or precise DTZ against a sourcing receipt. Any caller can
therefore produce exact-looking recorded outcome bytes for the correct position.

**Required repair:** depend on the repaired evidence-value-authority route for recorded tablebase
results, or publish one receipt-preserving validator that derives the reading from the validated
ledger/source record. Cross same-FEN mutations of category, distances and piece count.

## B3 — legal-move evidence disappears from the result ([[D2181]])

The available output retains the geometry declared item and tablebase source, but not the exact
legal-map item. `immediatePromotion` and `promotionWithCheck` are emitted from that omitted input.
The downstream declared event cannot prove which legal population produced those arrays, even
though the derivation graph names it.

**Required repair:** return/retain a sealed input-output derivation receipt containing geometry,
legal moves and the selected tablebase source, with exact same-FEN joins. Cross substitution of a
different sealed legal map after output construction.

## B4 — no-witness is mislabeled as input failure ([[D2182]])

Geometry distinguishes `no_opposing_passed_clear_paths` from `input_abstained`. The operation prose
then maps every unavailable geometry to outcome `input_abstained`. A valid position with no race is
not missing evidence, and downstream absence rendering would report the wrong reason.

**Required repair:** preserve a typed no-race/no-witness state or emit no outcome item when geometry
honestly has no population. Reserve `input_abstained` for absent/invalid upstream evidence and cross
both arms separately.

## B5 — `promotionWithCheck` has no source ([[D2183]])

The three derivation alternatives contain geometry, exact legal moves and tablebase/domain facts.
`ExactLegalMoveMap` identifies legal moves but contains no “gives check” operand. Geometry and
tablebase category do not contain it either—the RFC says so. Computing check privately would
duplicate `rules.tactic.event.check@1` outside the declared graph.

**Required repair:** add an exact declared check-result input/derivation joined to each promotion
move, or remove `promotionWithCheck` from this projection and let the existing check authority
compose it later. Cross checking and non-checking underpromotions with the same destination.

## Re-review order

1. Land or explicitly depend on the exact value-authority routes for pawn contacts and recorded
   tablebase evidence.
2. Retain all selected derivation inputs in the output receipt.
3. Separate no-witness from input abstention.
4. Ground or remove `promotionWithCheck`.
5. Invert all five arms while preserving the 3 author and 6 research checks, then request another
   fresh review.

The original twelve Wave-C projections remain implemented and unopened. No production, schema,
content, archive or protected-design byte is authorised by this return.
