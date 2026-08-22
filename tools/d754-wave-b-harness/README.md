# D754 Wave-B breadth probe

**DISPOSABLE RESEARCH INSTRUMENT — not production code.** This continues Phase 2b after
D723 and D730. It measures candidate facts against every distinct legal-result alternative on the
same authored and sealed imported populations. Lift is discrimination, not chess quality,
significance or intent.

Predeclared probes:

| Probe | Exact/disclosed meaning |
|---|---|
| `pawn_contests_minor_destination` | The moved pawn newly controls an empty square an opposing bishop or knight geometrically reaches in the resulting position. This is contested topology, not proof the square was intended or legally prevented. |
| `majority_wing_pawn_advance` | A pawn advances on a/b/c or f/g/h while its color had strictly more pawns than the opponent on that wing before the move. `majority-wing@1`; central files excluded. |
| `blockader_placed` | The moved non-pawn ends directly on an opposing pawn's forward square, making that pawn's single push occupied. This is direct blockade geometry. |
| `connected_rooks_gained` | A same-color rook pair becomes rank/file aligned with no occupied square between them. |
| `targeted_slider_coordination_gained` | A same-color slider pair becomes collinear, rear→front→named enemy rook/queen/king, with both spans clear. It retains a target and is not generic alignment. |
| `material_signature_changed` | The P/N/B/R/Q count vector for either color changes. This is an exact inventory event, not an evaluation. |
| `material_role_imbalance_increased` | The sum of absolute White-vs-Black count differences across P/N/B/R/Q increases. It identifies a less symmetric material configuration, not which side benefits. |
| `king_exposure_composite_gained` | On the opponent king, `king-shelter-probe@1` count decreases and distinct adjacent squares attacked by the mover increase on the same edge. This is a disclosed composite, not “king unsafe.” |
| `defender_loss_exposes_exchange` | An opponent defender→piece edge disappears and, under a disclosed legal pass state (only if constructible; EP cleared), the mover has a positive `legal-exchange@1` capture of that same square/role. It does not name removal, deflection or overload. |

Hard fixtures distinguish occupied harassment from future-square contest, equal from strict wing
majority, generic alignment from target-bearing coordination, shelter loss alone from the composite,
and defence-edge loss alone from exchange exposure.

Each probe has its own eligibility denominator. `undefined` is an abstention, not `false`; the
defender-loss probe uses it whenever the disclosed hypothetical pass state is invalid. The output
therefore prints positive count, eligible count and rate separately for played moves and legal
alternatives.

Run only this instrument:

```sh
pnpm exec vitest run --config tools/d754-wave-b-harness/vitest.config.ts
```

The run writes `output.md`.
