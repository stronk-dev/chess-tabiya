# Semantic-collectors promotion amendment author repair — 2026-08-30

## Verdict

The held promotion pair is author-repaired on D2141–D2143. Projections 13–14 remain held pending a
new independent review; the live/domain outcome arms also remain dependency-blocked on accepted and
implemented provider exchange.

## Repairs

- D2141: `declarePromotionRaceGeometry` must assert the runtime seal plus exact
  `rules.pawn@1/rules.pawn.reading.contacts@1` identity and return an identity-preserving
  input/output derivation receipt. The already-landed shared adapter remains the complete
  `pawnContactsReading(fen)` authority.
- D2142: `PromotionRaceTablebaseSource` is a two-arm union retaining the complete original
  `DeclaredEvidence` item. Recorded values project only from `payload.values`; live values project
  only from a sealed delivery's `payload.position`. No copied source label replaces provenance.
- D2143: the derivation graph has a third literal geometry + tablebase-domain member. The total
  operation result distinguishes source success, sealed local-domain refusal, provider failure and
  input abstention, with a fixed precedence and same-FEN request-digest proof.

## Verification

- `make semantic-collectors-promotion-author-repair`: 3/3 pass.
- `make promotion-race-contract`: 6/6 pass.
- Historical `make semantic-collectors-promotion-fresh-review`: D2142 and D2143 invert; D2141
  continues to reproduce the deliberately unimplemented disposable helper. That harness was not
  weakened. The new contract checks the author-tier constructor obligations; implementation is
  still forbidden until fresh acceptance.

No production collector, projection, adapter, binding, schema, pack, content, archive or protected
design byte changed.
