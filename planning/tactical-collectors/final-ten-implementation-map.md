# Tactical collectors — final-ten implementation map

**Prepared:** 2026-08-22  
**Authority:** accepted `rfc/tactical-collectors.md`, including the D829–D835/D931
author amendment once its independent buildability review accepts the repaired boundaries.  
**Purpose:** remove implementation rediscovery after review. This is a planning map, not
permission to edit production before the RFC hold clears.

## What is actually missing

Appendix A declares 30 projection identities. Twenty are present in the compiled catalogue;
`rules.transition.event.developed@1` is among them through the generated
`TRANSITION_RULE_EVENT_FAMILIES` declaration. The ten absent identities are:

1. `derived.exchange.trade_completed@1`
2. `rules.tactic.event.loose_piece@1`
3. `derived.semantic_avoidance.loose_piece@1`
4. `rules.structural.reading.pawn_connectivity@1`
5. `rules.structural.event.pawn_islands@1`
6. `derived.semantic_avoidance.pawn_islands@1`
7. `rules.tactic.reading.rook_on_seventh@1`
8. `rules.structural.reading.space@1`
9. `derived.tactic.discovered_executed@1`
10. `derived.tactic.promotion_pressure@1`

This count is over compiled projection identities, not functions or files. The two avoidance
identities reuse one derivation mechanism; that does not make them implicit catalogue entries.

## Build slices

### 1. Literal state readings

| Projection | Production home | Existing authority to reuse | Permanent tests |
|---|---|---|---|
| `pawn_connectivity@1` | `structure.ts` | chessops pawn attack set; no pack-schema kind | adjacent-file/no-support duo; branched two-base chain; doubled-pawn island; color mirror |
| `space@1` | `structure.ts` | literal pawn attacks under `space@1` | three zones; pawn advance that loses counted space; pinned-pawn attacked-square convention; mirror |
| `rook_on_seventh@1` | `tactics.ts` | board occupancy and color-relative ranks | classic state; relevance operands empty without suppressing state; mirror |
| `promotion_pressure@1` | `tactics.ts` | passed-pawn, attack-count and blocker readings plus legal reply enumeration | quiet next-promotion; removable passer; checking-move typed unavailability; terminal child false; mirror |

No function in this slice may emit importance, outcome, recommendation, or inferred intent.
`promotion_pressure@1` keeps the geometry row when either reply-dependent field is unavailable.

### 2. Identity-preserving edge and sequence events

| Projection | Production home | Join key | Permanent tests |
|---|---|---|---|
| `trade_completed@1` | `exchange.ts` + semantic adapter | two adjacent capture/run anchors; identical shared FEN/node; same landing square | immediate recapture; delayed same-square recapture negative; en passant; promotion capture |
| `loose_piece@1` | `tactics.ts` + `semantic-evidence.ts` | mover-owned identity before/after; moved `from`→`to`; explicit promotion role transition | newly en prise; resolved en prise; unchanged piece; invalid turn-clone abstention; promotion |
| `pawn_islands@1` | `structure.ts` + `semantic-evidence.ts` | color plus before/after island magnitude | gained/lost/preserved; doubled-pawn no split; mirror |
| `discovered_executed@1` | `tactics.ts` + semantic adapter | before latency relation + exact gained slider ray; unchanged slider/target identities | executed screen move; enemy blocker negative; identity-change negative; mirror |

`trade_completed@1` is a two-edge recorded sequence. It must not be squeezed into the current
single-edge `localSemanticEvents` signature. The adapter should accept the two exact anchors its
RFC declares rather than introduce hidden history lookup.

### 3. Counterfactual avoidance

Add `loose_piece@1` and `pawn_islands@1` to an explicit avoidance-eligible declaration and compile
their `derived.semantic_avoidance.*` identities. Reuse `legalAlternativeEdges(...)` and the shipped
complete-population denominator. Replace the structural-prefix gate; do not create a second legal
move enumerator or change the selection thresholds.

Permanent no-regression fixture: an existing structural avoidance event remains byte-identical
after the eligibility generalization.

### 4. Manifest, adapters, and public exports

For all ten identities:

- declare the exact Appendix-A role, grounding, exactness, operands, signs, limitations, and
  research/inspector disposition in `evidence-catalog.ts`;
- add brand-sealed declarations in `evidence-source-adapters.ts`;
- export only the public types/functions required by the runtime contract from `index.ts`;
- keep all nine learner modules and all workflow surfaces at zero production bindings in this
  wave;
- make the compiled manifest—not a prose list—the completeness authority.

## Focused landing gates

1. The ten missing IDs become set-equal to the ten IDs above; Appendix A remains 30/30.
2. The D829 contract harness moves into permanent runtime tests and stays green.
3. Every new event compiles through `compileSemanticEvidenceEvent`; a missing operand is rejected.
4. Alternative enumeration is set-equal to `legalAlternativeEdges(...)` and carries complete
   denominators.
5. The permanent two-population measurement records authored and imported results separately,
   including honest zeros.
6. `make evidence-manifest-check semantic-evidence-check`, focused runtime tests,
   `make status-parity`, and `make register-check` pass.
7. No `content/`, schema, settings, module, preset, voice, or learner-copy bytes change.
8. The landing commit performs the RFC ledger-and-log closeout; breadth collectors open only after
   that dependency is complete.

## Next dependency chain

`final Wave-A ten` → `breadth-collectors` → `semantic-collectors`.

The last step is not an optional “deep” tier. Its accepted scope is the ordinary semantic layer:
defender removal, deflection, attraction, interference, line and square clearance, zwischenzug,
overload state/conflict/exploitation, bounded mate proof, and promotion-race evidence. Its proof
objects are bounded because the learner-facing names must not be assigned from suggestive geometry
alone.
